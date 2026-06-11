import datetime
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_

from app.core.database import get_db
from app.models.models import Demand, City, Theme, Meeting, Attendance, Action, User
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/")
def get_dashboard_metrics(
    start_date: Optional[datetime.date] = None,
    end_date: Optional[datetime.date] = None,
    city_id: Optional[int] = None,
    theme_id: Optional[int] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    source: Optional[str] = None,
    responsible_user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Base Filters for Demands
    demand_filters = [Demand.deleted_at.is_(None)]
    
    if start_date:
        start_datetime = datetime.datetime.combine(start_date, datetime.time.min)
        demand_filters.append(Demand.created_at >= start_datetime)
    if end_date:
        end_datetime = datetime.datetime.combine(end_date, datetime.time.max)
        demand_filters.append(Demand.created_at <= end_datetime)
    if city_id is not None:
        demand_filters.append(Demand.city_id == city_id)
    if theme_id is not None:
        demand_filters.append(Demand.theme_id == theme_id)
    if priority:
        demand_filters.append(Demand.priority == priority)
    if status:
        demand_filters.append(Demand.status == status)
    if source:
        demand_filters.append(Demand.source == source)
    if responsible_user_id is not None:
        demand_filters.append(Demand.responsible_user_id == responsible_user_id)

    # 1. Total Counts & KPIs
    total_demands = db.query(func.count(Demand.id)).filter(*demand_filters).scalar() or 0
    
    urgent_filters = demand_filters.copy()
    urgent_filters.append(Demand.priority.in_(["Urgente", "Crítica"]))
    urgent_demands = db.query(func.count(Demand.id)).filter(*urgent_filters).scalar() or 0
    
    pending_filters = demand_filters.copy()
    pending_filters.append(Demand.status.in_(["Nova", "Em análise", "Encaminhada", "Em andamento", "Aguardando retorno"]))
    pending_demands = db.query(func.count(Demand.id)).filter(*pending_filters).scalar() or 0
    
    completed_filters = demand_filters.copy()
    completed_filters.append(Demand.status.in_(["Concluída", "Respondida"]))
    completed_demands = db.query(func.count(Demand.id)).filter(*completed_filters).scalar() or 0

    # Core entities monitored
    cities_count = db.query(func.count(City.id)).filter(City.status == True).scalar() or 0
    
    # Meeting counts (filtered if city or date filters are active)
    meeting_filters = []
    if city_id is not None:
        meeting_filters.append(Meeting.city_id == city_id)
    if start_date:
        meeting_filters.append(Meeting.meeting_datetime >= datetime.datetime.combine(start_date, datetime.time.min))
    if end_date:
        meeting_filters.append(Meeting.meeting_datetime <= datetime.datetime.combine(end_date, datetime.time.max))
    meetings_count = db.query(func.count(Meeting.id)).filter(*meeting_filters).scalar() or 0

    # Attendance counts
    attendance_filters = []
    if city_id is not None:
        attendance_filters.append(Attendance.city_id == city_id)
    if theme_id is not None:
        attendance_filters.append(Attendance.main_theme_id == theme_id)
    if start_date:
        attendance_filters.append(Attendance.attendance_datetime >= datetime.datetime.combine(start_date, datetime.time.min))
    if end_date:
        attendance_filters.append(Attendance.attendance_datetime <= datetime.datetime.combine(end_date, datetime.time.max))
    attendances_count = db.query(func.count(Attendance.id)).filter(*attendance_filters).scalar() or 0

    # Actions counts
    action_filters = []
    if city_id is not None:
        action_filters.append(Action.city_id == city_id)
    if theme_id is not None:
        action_filters.append(Action.theme_id == theme_id)
    if start_date:
        action_filters.append(Action.created_at >= datetime.datetime.combine(start_date, datetime.time.min))
    if end_date:
        action_filters.append(Action.created_at <= datetime.datetime.combine(end_date, datetime.time.max))
        
    actions_total = db.query(Action).filter(*action_filters).all()
    actions_pending = sum(1 for a in actions_total if a.status in ["Pendente", "Em andamento"])
    actions_completed = sum(1 for a in actions_total if a.status == "Concluída")
    
    # Overdue check
    now = datetime.datetime.utcnow()
    actions_overdue = sum(1 for a in actions_total if a.status in ["Pendente", "Em andamento"] and a.deadline < now)

    # 2. Charts Data
    # Demands by City
    demands_by_city_q = db.query(City.name, func.count(Demand.id)).\
        join(Demand, Demand.city_id == City.id).\
        filter(*demand_filters).\
        group_by(City.name).\
        order_by(desc(func.count(Demand.id))).\
        limit(10).all()
    demands_by_city = [{"city": name, "count": count} for name, count in demands_by_city_q]

    # Demands by Theme
    demands_by_theme_q = db.query(Theme.name, Theme.color, func.count(Demand.id)).\
        join(Demand, Demand.theme_id == Theme.id).\
        filter(*demand_filters).\
        group_by(Theme.name, Theme.color).\
        order_by(desc(func.count(Demand.id))).all()
    demands_by_theme = [{"theme": name, "color": color, "count": count} for name, color, count in demands_by_theme_q]

    # Demands by Priority
    demands_by_priority_q = db.query(Demand.priority, func.count(Demand.id)).\
        filter(*demand_filters).\
        group_by(Demand.priority).all()
    demands_by_priority = [{"priority": p, "count": c} for p, c in demands_by_priority_q]

    # Demands by Status
    demands_by_status_q = db.query(Demand.status, func.count(Demand.id)).\
        filter(*demand_filters).\
        group_by(Demand.status).all()
    demands_by_status = [{"status": s, "count": c} for s, c in demands_by_status_q]

    # Meetings by City (limited to top 10)
    meetings_by_city_q = db.query(City.name, func.count(Meeting.id)).\
        join(Meeting, Meeting.city_id == City.id).\
        filter(*meeting_filters).\
        group_by(City.name).\
        order_by(desc(func.count(Meeting.id))).\
        limit(10).all()
    meetings_by_city = [{"city": name, "count": count} for name, count in meetings_by_city_q]

    # Attendances by City
    attendances_by_city_q = db.query(City.name, func.count(Attendance.id)).\
        join(Attendance, Attendance.city_id == City.id).\
        filter(*attendance_filters).\
        group_by(City.name).\
        order_by(desc(func.count(Attendance.id))).\
        limit(10).all()
    attendances_by_city = [{"city": name, "count": count} for name, count in attendances_by_city_q]

    # Actions by Status
    actions_by_status = [
        {"status": "Concluídas", "count": actions_completed},
        {"status": "Pendentes", "count": actions_pending - actions_overdue},
        {"status": "Atrasadas", "count": actions_overdue}
    ]

    # Weekly Evolution (grouped by week in the last 8 weeks)
    weekly_evolution = []
    # If SQLite, use strftime, else use standard Postgres date truncation
    db_type_sqlite = db.bind.dialect.name == "sqlite"
    
    # Let's generate the last 8 weeks labels and query them
    today = datetime.datetime.utcnow().date()
    for i in range(7, -1, -1):
        start_w = today - datetime.timedelta(weeks=i+1)
        end_w = today - datetime.timedelta(weeks=i)
        
        # Build date filters
        w_filters = demand_filters.copy()
        w_filters.append(Demand.created_at >= datetime.datetime.combine(start_w, datetime.time.min))
        w_filters.append(Demand.created_at <= datetime.datetime.combine(end_w, datetime.time.max))
        
        w_count = db.query(func.count(Demand.id)).filter(*w_filters).scalar() or 0
        week_label = f"W-{i}" if i > 0 else "Esta Semana"
        weekly_evolution.append({
            "week": week_label,
            "period": f"{start_w.strftime('%d/%m')} - {end_w.strftime('%d/%m')}",
            "count": w_count
        })

    return {
        "kpis": {
            "total_demands": total_demands,
            "urgent_demands": urgent_demands,
            "pending_demands": pending_demands,
            "completed_demands": completed_demands,
            "cities_monitored": cities_count,
            "meetings_held": meetings_count,
            "attendances_registered": attendances_count,
            "actions_pending": actions_pending,
            "actions_completed": actions_completed,
            "actions_overdue": actions_overdue
        },
        "charts": {
            "demands_by_city": demands_by_city,
            "demands_by_theme": demands_by_theme,
            "demands_by_priority": demands_by_priority,
            "demands_by_status": demands_by_status,
            "meetings_by_city": meetings_by_city,
            "attendances_by_city": attendances_by_city,
            "actions_by_status": actions_by_status,
            "weekly_evolution": weekly_evolution
        }
    }

@router.get("/activities")
def get_dashboard_activities(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    from app.models.models import AuditLog
    logs = db.query(AuditLog).order_by(desc(AuditLog.created_at)).limit(15).all()
    result = []
    for log in logs:
        # Resolve username
        user_name = log.user.name if log.user else "Sistema"
        
        # Human readable text
        action_map = {
            "create": "Criou",
            "update": "Atualizou",
            "delete": "Excluiu",
            "login": "Efetuou login"
        }
        action_text = action_map.get(log.action.lower(), log.action)
        
        entity_map = {
            "demand": "Demanda",
            "city": "RA/Cidade",
            "theme": "Tema",
            "subtheme": "Subtema",
            "meeting": "Reunião",
            "attendance": "Atendimento",
            "action": "Ação",
            "user": "Usuário"
        }
        entity_text = entity_map.get(log.entity_type.lower(), log.entity_type)
        
        details = ""
        if log.action.lower() == "update" and log.field_name:
            details = f"campo '{log.field_name}'"
            if log.new_value:
                details += f" para '{log.new_value}'"
            
        result.append({
            "id": log.id,
            "user": user_name,
            "action": log.action,
            "action_text": action_text,
            "entity": log.entity_type,
            "entity_text": entity_text,
            "entity_id": log.entity_id,
            "details": details,
            "created_at": log.created_at
        })
    return result

@router.get("/territorial")
def get_territorial_metrics(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    cities = db.query(City).filter(City.status == True).all()
    result = []
    now = datetime.datetime.utcnow()
    
    for city in cities:
        # Demands count
        total_demands = db.query(func.count(Demand.id)).filter(
            Demand.city_id == city.id,
            Demand.deleted_at.is_(None)
        ).scalar() or 0
        
        # Pending demands (Nova, Em análise, Encaminhada, Em andamento, Aguardando retorno)
        pending_demands = db.query(Demand).filter(
            Demand.city_id == city.id,
            Demand.deleted_at.is_(None),
            Demand.status.in_(["Nova", "Em análise", "Encaminhada", "Em andamento", "Aguardando retorno"])
        ).all()
        
        # Completed demands
        completed_count = db.query(func.count(Demand.id)).filter(
            Demand.city_id == city.id,
            Demand.deleted_at.is_(None),
            Demand.status.in_(["Concluída", "Respondida"])
        ).scalar() or 0
        
        # Average SLA/Age of pending demands in days
        avg_sla_days = 0.0
        if pending_demands:
            total_age = sum((now - d.created_at).total_seconds() / 86400.0 for d in pending_demands)
            avg_sla_days = round(total_age / len(pending_demands), 1)
            
        # Resolution Rate
        resolution_rate = 0.0
        if total_demands > 0:
            resolution_rate = round((completed_count / total_demands) * 100.0, 1)
            
        # Average priority score
        avg_priority_score = db.query(func.avg(Demand.suggested_priority_score)).filter(
            Demand.city_id == city.id,
            Demand.deleted_at.is_(None)
        ).scalar() or 0.0
        avg_priority_score = round(float(avg_priority_score), 1)
        
        result.append({
            "city_id": city.id,
            "city_name": city.name,
            "demand_count": total_demands,
            "avg_sla_days": avg_sla_days,
            "resolution_rate": resolution_rate,
            "avg_priority_score": avg_priority_score
        })
        
    return result
