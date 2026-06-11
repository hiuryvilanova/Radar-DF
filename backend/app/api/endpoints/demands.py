import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.models.models import Demand, DemandComment, AuditLog, User
from app.schemas.schemas import DemandSchema, DemandCreate, DemandUpdate, DemandCommentSchema, DemandCommentCreate, AuditLogSchema
from app.api.deps import get_current_user, allow_admin, allow_operator_or_above, allow_coordinator_or_above
from app.services.priority_service import calculate_priority_score
from app.services.audit_service import log_action, log_changes

router = APIRouter()

@router.get("/", response_model=List[DemandSchema])
def list_demands(
    city_id: Optional[int] = None,
    theme_id: Optional[int] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    source: Optional[str] = None,
    responsible_user_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Demand).filter(Demand.deleted_at.is_(None))
    
    if city_id is not None:
        query = query.filter(Demand.city_id == city_id)
    if theme_id is not None:
        query = query.filter(Demand.theme_id == theme_id)
    if priority:
        query = query.filter(Demand.priority == priority)
    if status:
        query = query.filter(Demand.status == status)
    if source:
        query = query.filter(Demand.source == source)
    if responsible_user_id is not None:
        query = query.filter(Demand.responsible_user_id == responsible_user_id)
        
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Demand.title.like(search_filter)) | 
            (Demand.description.like(search_filter)) |
            (Demand.neighborhood.like(search_filter)) |
            (Demand.requester_name.like(search_filter))
        )
        
    # Return latest first
    return query.order_by(desc(Demand.created_at)).all()

@router.get("/{demand_id}", response_model=DemandSchema)
def get_demand(
    demand_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    demand = db.query(Demand).filter(Demand.id == demand_id, Demand.deleted_at.is_(None)).first()
    if not demand:
        raise HTTPException(status_code=404, detail="Demanda não encontrada")
    return demand

@router.post("/", response_model=DemandSchema)
def create_demand(
    demand_in: DemandCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_operator_or_above)
):
    # Mandatory validations
    if not demand_in.city_id:
        raise HTTPException(status_code=400, detail="A cidade é obrigatória")
    if not demand_in.theme_id:
        raise HTTPException(status_code=400, detail="O tema é obrigatório")

    # Auto-routing for Suggested Secretariat
    from app.models.models import Theme
    from app.services.intelligence_service import suggest_secretariat
    theme = db.query(Theme).filter(Theme.id == demand_in.theme_id).first()
    theme_name = theme.name if theme else ""
    suggested_sec = suggest_secretariat(theme_name, demand_in.title, demand_in.description)

    demand = Demand(
        **demand_in.dict(),
        suggested_secretariat=suggested_sec,
        created_by=current_user.id
    )
    db.add(demand)
    db.flush() # Generate ID for priority score and logging
    
    # Run intelligence rule for suggested priority
    demand.suggested_priority_score = calculate_priority_score(db, demand)
    db.commit()
    db.refresh(demand)
    
    # Audit log
    log_action(
        db=db,
        user_id=current_user.id,
        entity_type="demand",
        entity_id=demand.id,
        action="create",
        ip_address=request.client.host if request.client else None
    )
    
    return demand

@router.put("/{demand_id}", response_model=DemandSchema)
def update_demand(
    demand_id: int,
    demand_in: DemandUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_operator_or_above)
):
    demand = db.query(Demand).filter(Demand.id == demand_id, Demand.deleted_at.is_(None)).first()
    if not demand:
        raise HTTPException(status_code=404, detail="Demanda não encontrada")
        
    # If the user is an operator, check if they are authorized (Coordinator/Admin can edit all, Operator edits own/team)
    if current_user.role.name == "Operador" and demand.created_by != current_user.id and demand.responsible_user_id != current_user.id:
         raise HTTPException(status_code=403, detail="Você não tem permissão para editar esta demanda")
         
    # Keep old data dict for audit logs comparison
    old_data = {
        "title": demand.title,
        "description": demand.description,
        "city_id": demand.city_id,
        "neighborhood": demand.neighborhood,
        "theme_id": demand.theme_id,
        "subtheme_id": demand.subtheme_id,
        "source": demand.source,
        "priority": demand.priority,
        "status": demand.status,
        "requester_name": demand.requester_name,
        "requester_contact": demand.requester_contact,
        "entity_name": demand.entity_name,
        "approximate_address": demand.approximate_address,
        "consent_contact": demand.consent_contact,
        "strategic_note": demand.strategic_note,
        "responsible_user_id": demand.responsible_user_id,
        "parent_demand_id": demand.parent_demand_id,
        "suggested_secretariat": demand.suggested_secretariat
    }
    
    # Update fields
    update_data = demand_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(demand, field, value)
        
    # Recalculate secretariat if title, description or theme changed
    if "title" in update_data or "description" in update_data or "theme_id" in update_data:
        from app.models.models import Theme
        from app.services.intelligence_service import suggest_secretariat
        theme = db.query(Theme).filter(Theme.id == demand.theme_id).first()
        theme_name = theme.name if theme else ""
        demand.suggested_secretariat = suggest_secretariat(theme_name, demand.title, demand.description)
        
    # Recalculate priority if factors changed
    demand.suggested_priority_score = calculate_priority_score(db, demand)
    demand.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(demand)
    
    # Audit log comparison
    new_data = {k: getattr(demand, k) for k in old_data.keys()}
    log_changes(
        db=db,
        user_id=current_user.id,
        entity_type="demand",
        entity_id=demand.id,
        old_data=old_data,
        new_data=new_data,
        ip_address=request.client.host if request.client else None
    )
    
    return demand

@router.delete("/{demand_id}")
def delete_demand(
    demand_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_admin) # Only admin can delete
):
    demand = db.query(Demand).filter(Demand.id == demand_id, Demand.deleted_at.is_(None)).first()
    if not demand:
        raise HTTPException(status_code=404, detail="Demanda não encontrada")
        
    demand.deleted_at = datetime.datetime.utcnow()
    db.commit()
    
    # Audit log
    log_action(
        db=db,
        user_id=current_user.id,
        entity_type="demand",
        entity_id=demand_id,
        action="delete",
        ip_address=request.client.host if request.client else None
    )
    
    return {"message": "Demanda excluída com sucesso"}

# --- Comments ---

@router.get("/{demand_id}/comments", response_model=List[DemandCommentSchema])
def list_comments(
    demand_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(DemandComment).filter(DemandComment.demand_id == demand_id).order_by(DemandComment.created_at).all()

@router.post("/{demand_id}/comments", response_model=DemandCommentSchema)
def create_comment(
    demand_id: int,
    comment_in: DemandCommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    demand = db.query(Demand).filter(Demand.id == demand_id, Demand.deleted_at.is_(None)).first()
    if not demand:
        raise HTTPException(status_code=404, detail="Demanda não encontrada")
        
    comment = DemandComment(
        demand_id=demand_id,
        user_id=current_user.id,
        comment=comment_in.comment
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment

# --- Demand Audit/History logs ---

@router.get("/{demand_id}/history", response_model=List[AuditLogSchema])
def get_demand_history(
    demand_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(AuditLog).filter(
        AuditLog.entity_type == "demand",
        AuditLog.entity_id == demand_id
    ).order_by(desc(AuditLog.created_at)).all()

@router.get("/{demand_id}/duplicates")
def get_demand_duplicates(
    demand_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    demand = db.query(Demand).filter(Demand.id == demand_id, Demand.deleted_at.is_(None)).first()
    if not demand:
        raise HTTPException(status_code=404, detail="Demanda não encontrada")
        
    from app.services.intelligence_service import find_potential_duplicates
    
    potential = find_potential_duplicates(db, demand)
    
    # Format potential matches for serialization
    formatted_potential = []
    for p in potential:
        formatted_potential.append({
            "id": p["demand"].id,
            "title": p["demand"].title,
            "status": p["demand"].status,
            "priority": p["demand"].priority,
            "created_at": p["demand"].created_at,
            "score": p["score"]
        })
        
    # Format children
    children = db.query(Demand).filter(Demand.parent_demand_id == demand.id, Demand.deleted_at.is_(None)).all()
    formatted_children = [{
        "id": c.id,
        "title": c.title,
        "status": c.status,
        "priority": c.priority,
        "created_at": c.created_at
    } for c in children]
    
    # Format parent
    parent = None
    if demand.parent_demand_id:
        p_demand = db.query(Demand).filter(Demand.id == demand.parent_demand_id).first()
        if p_demand:
            parent = {
                "id": p_demand.id,
                "title": p_demand.title,
                "status": p_demand.status,
                "priority": p_demand.priority,
                "created_at": p_demand.created_at
            }
            
    return {
        "parent": parent,
        "children": formatted_children,
        "potential_duplicates": formatted_potential
    }
