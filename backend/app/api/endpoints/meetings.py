from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.models.models import Meeting, MeetingParticipant
from app.schemas.schemas import MeetingSchema, MeetingCreate, MeetingUpdate
from app.api.deps import get_current_user, allow_operator_or_above

router = APIRouter()

@router.get("/", response_model=List[MeetingSchema])
def list_meetings(
    city_id: Optional[int] = None,
    meeting_type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(Meeting)
    if city_id is not None:
        query = query.filter(Meeting.city_id == city_id)
    if meeting_type:
        query = query.filter(Meeting.meeting_type == meeting_type)
    if status:
        query = query.filter(Meeting.status == status)
        
    return query.order_by(desc(Meeting.meeting_datetime)).all()

@router.get("/{meeting_id}", response_model=MeetingSchema)
def get_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Reunião não encontrada")
    return meeting

@router.post("/", response_model=MeetingSchema)
def create_meeting(
    meeting_in: MeetingCreate,
    db: Session = Depends(get_db),
    current_user = Depends(allow_operator_or_above)
):
    # Enforce date
    if not meeting_in.meeting_datetime:
        raise HTTPException(status_code=400, detail="Data e hora da reunião são obrigatórias")

    meeting = Meeting(
        title=meeting_in.title,
        city_id=meeting_in.city_id,
        neighborhood=meeting_in.neighborhood,
        meeting_datetime=meeting_in.meeting_datetime,
        location=meeting_in.location,
        meeting_type=meeting_in.meeting_type,
        summary=meeting_in.summary,
        discussed_themes=meeting_in.discussed_themes,
        identified_demands=meeting_in.identified_demands,
        forwardings=meeting_in.forwardings,
        responsible_user_id=meeting_in.responsible_user_id,
        return_date=meeting_in.return_date,
        status=meeting_in.status,
        created_by=current_user.id
    )
    db.add(meeting)
    db.flush()

    # Add participants
    for part in meeting_in.participants:
        db_part = MeetingParticipant(
            meeting_id=meeting.id,
            name=part.name,
            contact=part.contact,
            entity_role=part.entity_role
        )
        db.add(db_part)

    db.commit()
    db.refresh(meeting)
    return meeting

@router.put("/{meeting_id}", response_model=MeetingSchema)
def update_meeting(
    meeting_id: int,
    meeting_in: MeetingUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(allow_operator_or_above)
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Reunião não encontrada")

    update_data = meeting_in.dict(exclude_unset=True)
    
    # Handle participants separately if provided
    if "participants" in update_data and update_data["participants"] is not None:
        # Delete existing participants
        db.query(MeetingParticipant).filter(MeetingParticipant.meeting_id == meeting_id).delete()
        # Add new participants
        for part in update_data["participants"]:
            db_part = MeetingParticipant(
                meeting_id=meeting_id,
                name=part["name"],
                contact=part.get("contact"),
                entity_role=part.get("entity_role")
            )
            db.add(db_part)
        del update_data["participants"]

    for field, value in update_data.items():
        setattr(meeting, field, value)

    db.commit()
    db.refresh(meeting)
    return meeting

@router.delete("/{meeting_id}")
def delete_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(allow_operator_or_above)
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Reunião não encontrada")
        
    db.delete(meeting)
    db.commit()
    return {"message": "Reunião excluída com sucesso"}
