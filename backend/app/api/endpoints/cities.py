from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import City
from app.schemas.schemas import CitySchema, CityCreate, CityUpdate
from app.api.deps import allow_admin, get_current_user

router = APIRouter()

@router.get("/", response_model=List[CitySchema])
def list_cities(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return db.query(City).order_by(City.name).all()

@router.post("/", response_model=CitySchema)
def create_city(
    city_in: CityCreate,
    db: Session = Depends(get_db),
    current_user = Depends(allow_admin)
):
    existing = db.query(City).filter(City.name == city_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Cidade com este nome já cadastrada")
        
    city = City(**city_in.dict())
    db.add(city)
    db.commit()
    db.refresh(city)
    return city

@router.put("/{city_id}", response_model=CitySchema)
def update_city(
    city_id: int,
    city_in: CityUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(allow_admin)
):
    city = db.query(City).filter(City.id == city_id).first()
    if not city:
        raise HTTPException(status_code=404, detail="Cidade não encontrada")
        
    for field, value in city_in.dict(exclude_unset=True).items():
        setattr(city, field, value)
        
    db.commit()
    db.refresh(city)
    return city

@router.delete("/{city_id}")
def delete_city(
    city_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(allow_admin)
):
    city = db.query(City).filter(City.id == city_id).first()
    if not city:
        raise HTTPException(status_code=404, detail="Cidade não encontrada")
        
    db.delete(city)
    db.commit()
    return {"message": "Cidade excluída com sucesso"}
