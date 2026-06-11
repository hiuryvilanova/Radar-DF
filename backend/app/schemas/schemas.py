from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime

# --- Auth & Token ---
class Token(BaseModel):
    access_token: str
    token_type: str
    user_status: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserChangePassword(BaseModel):
    old_password: str
    new_password: str

# --- Role ---
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleSchema(RoleBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- User ---
class UserBase(BaseModel):
    name: str
    email: str
    role_id: int
    status: str = "active"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role_id: Optional[int] = None
    status: Optional[str] = None
    password: Optional[str] = None

class UserSchema(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
    role: Optional[RoleBase] = None

    class Config:
        from_attributes = True

# --- City ---
class CityBase(BaseModel):
    name: str
    region: str
    description: Optional[str] = None
    responsible_user_id: Optional[int] = None
    strategic_priority: str = "Média"
    status: bool = True

class CityCreate(CityBase):
    pass

class CityUpdate(BaseModel):
    name: Optional[str] = None
    region: Optional[str] = None
    description: Optional[str] = None
    responsible_user_id: Optional[int] = None
    strategic_priority: Optional[str] = None
    status: Optional[bool] = None

class CitySchema(CityBase):
    id: int
    created_at: datetime
    updated_at: datetime
    responsible_user: Optional[UserSchema] = None

    class Config:
        from_attributes = True

# --- Subtheme ---
class SubthemeBase(BaseModel):
    theme_id: int
    name: str
    description: Optional[str] = None
    status: bool = True

class SubthemeCreate(SubthemeBase):
    pass

class SubthemeSchema(SubthemeBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Theme ---
class ThemeBase(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    status: bool = True

class ThemeCreate(ThemeBase):
    pass

class ThemeSchema(ThemeBase):
    id: int
    created_at: datetime
    updated_at: datetime
    subthemes: List[SubthemeSchema] = []

    class Config:
        from_attributes = True

# --- Demand Comment ---
class DemandCommentBase(BaseModel):
    comment: str

class DemandCommentCreate(DemandCommentBase):
    pass

class DemandCommentSchema(DemandCommentBase):
    id: int
    demand_id: int
    user_id: int
    created_at: datetime
    user: Optional[UserSchema] = None

    class Config:
        from_attributes = True

# --- Demand ---
class DemandBase(BaseModel):
    title: str
    description: str
    city_id: int
    neighborhood: Optional[str] = None
    theme_id: int
    subtheme_id: Optional[int] = None
    source: str
    priority: str
    status: str = "Nova"
    
    # LGPD & Requestor
    requester_name: Optional[str] = None
    requester_contact: Optional[str] = None
    entity_name: Optional[str] = None
    approximate_address: Optional[str] = None
    consent_contact: bool = False
    
    # Strategic
    strategic_note: Optional[str] = None
    responsible_user_id: Optional[int] = None
    suggested_secretariat: Optional[str] = None
    parent_demand_id: Optional[int] = None

class DemandCreate(DemandBase):
    pass

class DemandUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    city_id: Optional[int] = None
    neighborhood: Optional[str] = None
    theme_id: Optional[int] = None
    subtheme_id: Optional[int] = None
    source: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    requester_name: Optional[str] = None
    requester_contact: Optional[str] = None
    entity_name: Optional[str] = None
    approximate_address: Optional[str] = None
    consent_contact: Optional[bool] = None
    strategic_note: Optional[str] = None
    responsible_user_id: Optional[int] = None
    suggested_secretariat: Optional[str] = None
    parent_demand_id: Optional[int] = None

class DemandSchema(DemandBase):
    id: int
    suggested_priority_score: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    
    city: Optional[CityBase] = None
    theme: Optional[ThemeBase] = None
    subtheme: Optional[SubthemeBase] = None
    responsible_user: Optional[UserSchema] = None
    creator: Optional[UserSchema] = None

    class Config:
        from_attributes = True

# --- Meeting Participant ---
class MeetingParticipantBase(BaseModel):
    name: str
    contact: Optional[str] = None
    entity_role: Optional[str] = None

class MeetingParticipantSchema(MeetingParticipantBase):
    id: int
    meeting_id: int

    class Config:
        from_attributes = True

# --- Meeting ---
class MeetingBase(BaseModel):
    title: str
    city_id: int
    neighborhood: Optional[str] = None
    meeting_datetime: datetime
    location: Optional[str] = None
    meeting_type: str
    summary: Optional[str] = None
    discussed_themes: Optional[str] = None
    identified_demands: Optional[str] = None
    forwardings: Optional[str] = None
    responsible_user_id: Optional[int] = None
    return_date: Optional[datetime] = None
    status: str = "Realizada"

class MeetingCreate(MeetingBase):
    participants: List[MeetingParticipantBase] = []

class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    city_id: Optional[int] = None
    neighborhood: Optional[str] = None
    meeting_datetime: Optional[datetime] = None
    location: Optional[str] = None
    meeting_type: Optional[str] = None
    summary: Optional[str] = None
    discussed_themes: Optional[str] = None
    identified_demands: Optional[str] = None
    forwardings: Optional[str] = None
    responsible_user_id: Optional[int] = None
    return_date: Optional[datetime] = None
    status: Optional[str] = None
    participants: Optional[List[MeetingParticipantBase]] = None

class MeetingSchema(MeetingBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    city: Optional[CityBase] = None
    responsible_user: Optional[UserSchema] = None
    creator: Optional[UserSchema] = None
    participants: List[MeetingParticipantSchema] = []

    class Config:
        from_attributes = True

# --- Attendance ---
class AttendanceBase(BaseModel):
    attendance_type: str
    attendance_datetime: datetime
    city_id: int
    neighborhood: Optional[str] = None
    person_or_entity_name: str
    contact: Optional[str] = None
    main_theme_id: int
    description: str
    status: str = "Pendente"
    next_return_date: Optional[datetime] = None
    internal_notes: Optional[str] = None
    responsible_user_id: Optional[int] = None

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceUpdate(BaseModel):
    attendance_type: Optional[str] = None
    attendance_datetime: Optional[datetime] = None
    city_id: Optional[int] = None
    neighborhood: Optional[str] = None
    person_or_entity_name: Optional[str] = None
    contact: Optional[str] = None
    main_theme_id: Optional[int] = None
    description: Optional[str] = None
    status: Optional[str] = None
    next_return_date: Optional[datetime] = None
    internal_notes: Optional[str] = None
    responsible_user_id: Optional[int] = None

class AttendanceSchema(AttendanceBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    city: Optional[CityBase] = None
    theme: Optional[ThemeBase] = None
    responsible_user: Optional[UserSchema] = None
    creator: Optional[UserSchema] = None

    class Config:
        from_attributes = True

# --- Action ---
class ActionBase(BaseModel):
    title: str
    description: str
    city_id: int
    theme_id: int
    demand_id: Optional[int] = None
    meeting_id: Optional[int] = None
    responsible_user_id: int
    deadline: datetime
    priority: str = "Média"
    status: str = "Pendente"
    expected_result: Optional[str] = None
    obtained_result: Optional[str] = None
    notes: Optional[str] = None

class ActionCreate(ActionBase):
    pass

class ActionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    city_id: Optional[int] = None
    theme_id: Optional[int] = None
    demand_id: Optional[int] = None
    meeting_id: Optional[int] = None
    responsible_user_id: Optional[int] = None
    deadline: Optional[datetime] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    expected_result: Optional[str] = None
    obtained_result: Optional[str] = None
    notes: Optional[str] = None
    completed_at: Optional[datetime] = None

class ActionSchema(ActionBase):
    id: int
    created_at: datetime
    completed_at: Optional[datetime] = None
    updated_at: datetime
    
    city: Optional[CityBase] = None
    theme: Optional[ThemeBase] = None
    responsible_user: Optional[UserSchema] = None

    class Config:
        from_attributes = True

# --- Attachment ---
class AttachmentSchema(BaseModel):
    id: int
    related_type: str
    related_id: int
    file_name: str
    file_path: str
    mime_type: Optional[str] = None
    file_size: Optional[int] = None
    uploaded_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Import & Error ---
class ImportErrorSchema(BaseModel):
    id: int
    import_id: int
    row_number: int
    field_name: Optional[str] = None
    error_message: str
    raw_row_data: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ImportSchema(BaseModel):
    id: int
    file_name: str
    file_type: str
    total_rows: int
    successful_rows: int
    error_rows: int
    status: str
    imported_by: Optional[int] = None
    created_at: datetime
    errors: List[ImportErrorSchema] = []

    class Config:
        from_attributes = True

# --- Audit Log ---
class AuditLogSchema(BaseModel):
    id: int
    user_id: Optional[int] = None
    entity_type: str
    entity_id: int
    action: str
    field_name: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime
    user: Optional[UserSchema] = None

    class Config:
        from_attributes = True

# --- Setting ---
class SettingBase(BaseModel):
    key: str
    value: Optional[str] = None
    description: Optional[str] = None

class SettingSchema(SettingBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
