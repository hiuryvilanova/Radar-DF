from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Theme, Subtheme
from app.schemas.schemas import ThemeSchema, ThemeCreate, SubthemeSchema, SubthemeCreate
from app.api.deps import allow_admin, get_current_user

router = APIRouter()

@router.get("/", response_model=List[ThemeSchema])
def list_themes(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return db.query(Theme).order_by(Theme.name).all()

@router.post("/", response_model=ThemeSchema)
def create_theme(
    theme_in: ThemeCreate,
    db: Session = Depends(get_db),
    current_user = Depends(allow_admin)
):
    existing = db.query(Theme).filter(Theme.name == theme_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tema com este nome já cadastrado")
        
    theme = Theme(**theme_in.dict())
    db.add(theme)
    db.commit()
    db.refresh(theme)
    return theme

@router.delete("/{theme_id}")
def delete_theme(
    theme_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(allow_admin)
):
    theme = db.query(Theme).filter(Theme.id == theme_id).first()
    if not theme:
        raise HTTPException(status_code=404, detail="Tema não encontrado")
        
    db.delete(theme)
    db.commit()
    return {"message": "Tema excluído com sucesso"}

# --- Subtheme Endpoints ---

@router.get("/subthemes", response_model=List[SubthemeSchema])
def list_subthemes(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return db.query(Subtheme).order_by(Subtheme.name).all()

@router.post("/subthemes", response_model=SubthemeSchema)
def create_subtheme(
    sub_in: SubthemeCreate,
    db: Session = Depends(get_db),
    current_user = Depends(allow_admin)
):
    existing = db.query(Subtheme).filter(
        Subtheme.theme_id == sub_in.theme_id,
        Subtheme.name == sub_in.name
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Subtema já cadastrado para este tema")
        
    sub = Subtheme(**sub_in.dict())
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub

@router.delete("/subthemes/{subtheme_id}")
def delete_subtheme(
    subtheme_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(allow_admin)
):
    sub = db.query(Subtheme).filter(Subtheme.id == subtheme_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subtema não encontrado")
        
    db.delete(sub)
    db.commit()
    return {"message": "Subtema excluído com sucesso"}
