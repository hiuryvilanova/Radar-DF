import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.models.models import Action
from app.schemas.schemas import ActionSchema, ActionCreate, ActionUpdate
from app.api.deps import get_current_user, allow_operator_or_above

router = APIRouter()

@router.get("/", response_model=List[ActionSchema])
def list_actions(
    city_id: Optional[int] = None,
    status: Optional[str] = None,
    responsible_user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(Action)
    if city_id is not None:
        query = query.filter(Action.city_id == city_id)
    if status:
        if status == "Atrasada":
            # Overdue actions are Pending or In Progress with deadline in the past
            now = datetime.datetime.utcnow()
            query = query.filter(
                Action.status.in_(["Pendente", "Em andamento"]),
                Action.deadline < now
            )
        else:
            query = query.filter(Action.status == status)
            
    if responsible_user_id is not None:
        query = query.filter(Action.responsible_user_id == responsible_user_id)
        
    return query.order_by(desc(Action.deadline)).all()

@router.get("/{action_id}", response_model=ActionSchema)
def get_action(
    action_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    action = db.query(Action).filter(Action.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Ação não encontrada")
    return action

@router.post("/", response_model=ActionSchema)
def create_action(
    action_in: ActionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(allow_operator_or_above)
):
    # Enforce responsible user
    if not action_in.responsible_user_id:
        raise HTTPException(status_code=400, detail="O responsável pela ação é obrigatório")

    action = Action(**action_in.dict())
    db.add(action)
    db.commit()
    db.refresh(action)
    return action

@router.put("/{action_id}", response_model=ActionSchema)
def update_action(
    action_id: int,
    action_in: ActionUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(allow_operator_or_above)
):
    action = db.query(Action).filter(Action.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Ação não encontrada")

    update_data = action_in.dict(exclude_unset=True)
    
    # If status changes to Concluída, set completed_at
    if "status" in update_data and update_data["status"] == "Concluída" and action.status != "Concluída":
        action.completed_at = datetime.datetime.utcnow()
    elif "status" in update_data and update_data["status"] != "Concluída":
        action.completed_at = None

    for field, value in update_data.items():
        setattr(action, field, value)

    db.commit()
    db.refresh(action)
    return action

@router.delete("/{action_id}")
def delete_action(
    action_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(allow_operator_or_above)
):
    action = db.query(Action).filter(Action.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Ação não encontrada")
        
    db.delete(action)
    db.commit()
    return {"message": "Ação excluída com sucesso"}
