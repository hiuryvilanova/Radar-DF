from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.models.models import Attendance
from app.schemas.schemas import AttendanceSchema, AttendanceCreate, AttendanceUpdate
from app.api.deps import get_current_user, allow_operator_or_above

router = APIRouter()

@router.get("/", response_model=List[AttendanceSchema])
def list_attendances(
    city_id: Optional[int] = None,
    main_theme_id: Optional[int] = None,
    attendance_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(Attendance)
    if city_id is not None:
        query = query.filter(Attendance.city_id == city_id)
    if main_theme_id is not None:
        query = query.filter(Attendance.main_theme_id == main_theme_id)
    if attendance_type:
        query = query.filter(Attendance.attendance_type == attendance_type)
        
    return query.order_by(desc(Attendance.attendance_datetime)).all()

@router.get("/{attendance_id}", response_model=AttendanceSchema)
def get_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="Atendimento não encontrado")
    return attendance

@router.post("/", response_model=AttendanceSchema)
def create_attendance(
    att_in: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user = Depends(allow_operator_or_above)
):
    attendance = Attendance(
        **att_in.dict(),
        created_by=current_user.id
    )
    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    return attendance

@router.put("/{attendance_id}", response_model=AttendanceSchema)
def update_attendance(
    attendance_id: int,
    att_in: AttendanceUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(allow_operator_or_above)
):
    attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="Atendimento não encontrado")

    update_data = att_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(attendance, field, value)

    db.commit()
    db.refresh(attendance)
    return attendance

@router.delete("/{attendance_id}")
def delete_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(allow_operator_or_above)
):
    attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="Atendimento não encontrado")
        
    db.delete(attendance)
    db.commit()
    return {"message": "Atendimento excluído com sucesso"}
