# --- settings.py ---
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Setting
from app.schemas.schemas import SettingSchema, SettingBase
from app.api.deps import allow_admin, get_current_user

router = APIRouter()

@router.get("/", response_model=List[SettingSchema])
def list_settings(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return db.query(Setting).all()

@router.put("/{setting_id}", response_model=SettingSchema)
def update_setting(
    setting_id: int,
    setting_in: SettingBase,
    db: Session = Depends(get_db),
    current_user = Depends(allow_admin)
):
    setting = db.query(Setting).filter(Setting.id == setting_id).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Configuração não encontrada")
    
    setting.value = setting_in.value
    if setting_in.description is not None:
        setting.description = setting_in.description
        
    db.commit()
    db.refresh(setting)
    return setting
