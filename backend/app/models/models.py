import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Float, Table
from sqlalchemy.orm import relationship
from app.core.database import Base

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    users = relationship("User", back_populates="role")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(200), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    status = Column(String(50), default="active") # active, inactive, pending_password_change
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    role = relationship("Role", back_populates="users")


class City(Base):
    __tablename__ = "cities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    region = Column(String(50), nullable=False) # Norte, Sul, Leste, Oeste, Central, Sudoeste
    description = Column(Text, nullable=True)
    responsible_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    strategic_priority = Column(String(50), default="Média") # Baixa, Média, Alta
    status = Column(Boolean, default=True) # True = ativo, False = inativo
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    responsible_user = relationship("User", foreign_keys=[responsible_user_id])


class Theme(Base):
    __tablename__ = "themes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    color = Column(String(20), nullable=True) # Hex code or Tailwind color class
    icon = Column(String(50), nullable=True)  # Lucide icon name
    status = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    subthemes = relationship("Subtheme", back_populates="theme", cascade="all, delete-orphan")


class Subtheme(Base):
    __tablename__ = "subthemes"

    id = Column(Integer, primary_key=True, index=True)
    theme_id = Column(Integer, ForeignKey("themes.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    theme = relationship("Theme", back_populates="subthemes")


class Demand(Base):
    __tablename__ = "demands"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    city_id = Column(Integer, ForeignKey("cities.id"), nullable=False)
    neighborhood = Column(String(100), nullable=True)
    theme_id = Column(Integer, ForeignKey("themes.id"), nullable=False)
    subtheme_id = Column(Integer, ForeignKey("subthemes.id"), nullable=True)
    source = Column(String(50), nullable=False) # Reunião, Atendimento, Visita de campo, etc.
    priority = Column(String(50), nullable=False) # Baixa, Média, Alta, Urgente, Crítica
    suggested_priority_score = Column(Integer, default=0) # 0 a 100
    status = Column(String(50), default="Nova") # Nova, Em análise, Encaminhada, etc.
    
    # LGPD / Contact data
    requester_name = Column(String(100), nullable=True)
    requester_contact = Column(String(100), nullable=True)
    entity_name = Column(String(100), nullable=True)
    approximate_address = Column(String(200), nullable=True)
    consent_contact = Column(Boolean, default=False)
    
    # Strategic context
    strategic_note = Column(Text, nullable=True)
    responsible_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    suggested_secretariat = Column(String(100), nullable=True)
    parent_demand_id = Column(Integer, ForeignKey("demands.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True) # For soft delete

    city = relationship("City")
    theme = relationship("Theme")
    subtheme = relationship("Subtheme")
    responsible_user = relationship("User", foreign_keys=[responsible_user_id])
    creator = relationship("User", foreign_keys=[created_by])
    parent_demand = relationship("Demand", remote_side=[id], backref="child_demands")
    comments = relationship("DemandComment", back_populates="demand", cascade="all, delete-orphan")
    actions = relationship("Action", back_populates="demand")


class DemandComment(Base):
    __tablename__ = "demand_comments"

    id = Column(Integer, primary_key=True, index=True)
    demand_id = Column(Integer, ForeignKey("demands.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    demand = relationship("Demand", back_populates="comments")
    user = relationship("User")


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    city_id = Column(Integer, ForeignKey("cities.id"), nullable=False)
    neighborhood = Column(String(100), nullable=True)
    meeting_datetime = Column(DateTime, nullable=False)
    location = Column(String(200), nullable=True)
    meeting_type = Column(String(50), nullable=False) # Comunidade, Lideranças, etc.
    summary = Column(Text, nullable=True)
    discussed_themes = Column(Text, nullable=True)  # Comma separated or JSON string
    identified_demands = Column(Text, nullable=True) # Comma separated or JSON string
    forwardings = Column(Text, nullable=True)
    responsible_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    return_date = Column(DateTime, nullable=True)
    status = Column(String(50), default="Realizada") # Realizada, Pendente de encaminhamento, etc.
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    city = relationship("City")
    responsible_user = relationship("User", foreign_keys=[responsible_user_id])
    creator = relationship("User", foreign_keys=[created_by])
    participants = relationship("MeetingParticipant", back_populates="meeting", cascade="all, delete-orphan")
    actions = relationship("Action", back_populates="meeting")


class MeetingParticipant(Base):
    __tablename__ = "meeting_participants"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False)
    name = Column(String(100), nullable=False)
    contact = Column(String(100), nullable=True)
    entity_role = Column(String(100), nullable=True) # Cargo / Entidade
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    meeting = relationship("Meeting", back_populates="participants")


class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(Integer, primary_key=True, index=True)
    attendance_type = Column(String(50), nullable=False) # Cidadão, Liderança comunitária, etc.
    attendance_datetime = Column(DateTime, default=datetime.datetime.utcnow)
    city_id = Column(Integer, ForeignKey("cities.id"), nullable=False)
    neighborhood = Column(String(100), nullable=True)
    person_or_entity_name = Column(String(100), nullable=False)
    contact = Column(String(100), nullable=True)
    main_theme_id = Column(Integer, ForeignKey("themes.id"), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(50), default="Pendente")
    next_return_date = Column(DateTime, nullable=True)
    internal_notes = Column(Text, nullable=True)
    responsible_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    city = relationship("City")
    theme = relationship("Theme")
    responsible_user = relationship("User", foreign_keys=[responsible_user_id])
    creator = relationship("User", foreign_keys=[created_by])


class Action(Base):
    __tablename__ = "actions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    city_id = Column(Integer, ForeignKey("cities.id"), nullable=False)
    theme_id = Column(Integer, ForeignKey("themes.id"), nullable=False)
    demand_id = Column(Integer, ForeignKey("demands.id"), nullable=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=True)
    responsible_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    deadline = Column(DateTime, nullable=False)
    priority = Column(String(50), default="Média")
    status = Column(String(50), default="Pendente") # Pendente, Em andamento, Aguardando terceiro, Concluída, Cancelada, Atrasada
    expected_result = Column(Text, nullable=True)
    obtained_result = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    city = relationship("City")
    theme = relationship("Theme")
    demand = relationship("Demand", back_populates="actions")
    meeting = relationship("Meeting", back_populates="actions")
    responsible_user = relationship("User", foreign_keys=[responsible_user_id])


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    related_type = Column(String(50), nullable=False) # demand, meeting, etc.
    related_id = Column(Integer, nullable=False)
    file_name = Column(String(200), nullable=False)
    file_path = Column(String(500), nullable=False)
    mime_type = Column(String(100), nullable=True)
    file_size = Column(Integer, nullable=True)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Import(Base):
    __tablename__ = "imports"

    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String(200), nullable=False)
    file_type = Column(String(50), nullable=False) # CSV, XLSX
    total_rows = Column(Integer, default=0)
    successful_rows = Column(Integer, default=0)
    error_rows = Column(Integer, default=0)
    status = Column(String(50), default="Pendente") # Pendente, Sucesso, Com Erros, Falhou
    imported_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    errors = relationship("ImportError", back_populates="import_record", cascade="all, delete-orphan")


class ImportError(Base):
    __tablename__ = "import_errors"

    id = Column(Integer, primary_key=True, index=True)
    import_id = Column(Integer, ForeignKey("imports.id"), nullable=False)
    row_number = Column(Integer, nullable=False)
    field_name = Column(String(100), nullable=True)
    error_message = Column(Text, nullable=False)
    raw_row_data = Column(Text, nullable=True) # JSON representation of row
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    import_record = relationship("Import", back_populates="errors")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    entity_type = Column(String(50), nullable=False) # demand, city, etc.
    entity_id = Column(Integer, nullable=False)
    action = Column(String(50), nullable=False)      # create, update, delete
    field_name = Column(String(100), nullable=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User")


class Setting(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
