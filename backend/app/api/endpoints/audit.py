from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.models.models import AuditLog
from app.schemas.schemas import AuditLogSchema
from app.api.deps import allow_admin

router = APIRouter()

@router.get("/", response_model=List[AuditLogSchema])
def list_audit_logs(
    limit: int = 100,
    offset: int = 0,
    entity_type: Optional[str] = None,
    action: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(allow_admin)
):
    query = db.query(AuditLog)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if action:
        query = query.filter(AuditLog.action == action)
        
    return query.order_by(desc(AuditLog.created_at)).limit(limit).offset(offset).all()
