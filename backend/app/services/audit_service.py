from sqlalchemy.orm import Session
from app.models.models import AuditLog
from typing import Any, Dict, Optional

def log_action(
    db: Session,
    user_id: Optional[int],
    entity_type: str,
    entity_id: int,
    action: str,
    field_name: Optional[str] = None,
    old_value: Optional[str] = None,
    new_value: Optional[str] = None,
    ip_address: Optional[str] = None
):
    audit_entry = AuditLog(
        user_id=user_id,
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        field_name=field_name,
        old_value=old_value,
        new_value=new_value,
        ip_address=ip_address
    )
    db.add(audit_entry)
    db.commit()

def log_changes(
    db: Session,
    user_id: Optional[int],
    entity_type: str,
    entity_id: int,
    old_data: Dict[str, Any],
    new_data: Dict[str, Any],
    ip_address: Optional[str] = None
):
    # Exclude system columns that change naturally or password hashes
    exclude_fields = {"updated_at", "created_at", "last_login", "password_hash", "deleted_at"}
    
    for key, new_val in new_data.items():
        if key in exclude_fields:
            continue
            
        old_val = old_data.get(key)
        
        # Format values as strings for logging
        old_str = str(old_val) if old_val is not None else None
        new_str = str(new_val) if new_val is not None else None
        
        if old_str != new_str:
            log_action(
                db=db,
                user_id=user_id,
                entity_type=entity_type,
                entity_id=entity_id,
                action="update",
                field_name=key,
                old_value=old_str,
                new_value=new_str,
                ip_address=ip_address
            )
