import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.models import Demand, Meeting, Attendance, Theme

def calculate_priority_score(db: Session, demand: Demand) -> int:
    score = 0
    
    # 1. Gravidade do Tema (max 25)
    theme = db.query(Theme).filter(Theme.id == demand.theme_id).first()
    if theme:
        theme_name = theme.name.lower()
        if "saúde" in theme_name or "segurança" in theme_name:
            score += 25
        elif "mobilidade" in theme_name or "infraestrutura" in theme_name or "transporte" in theme_name:
            score += 20
        elif "habitação" in theme_name or "regularização" in theme_name:
            score += 15
        else:
            score += 10
            
    # 2. Recorrência na mesma cidade/tema (max 30)
    # Conta quantas outras demandas ativas existem na mesma cidade com o mesmo tema
    recurrence_count = db.query(func.count(Demand.id)).filter(
        Demand.city_id == demand.city_id,
        Demand.theme_id == demand.theme_id,
        Demand.id != demand.id,
        Demand.deleted_at.is_(None)
    ).scalar() or 0
    
    score += min(recurrence_count * 10, 30)
    
    # 3. Número de Reuniões vinculadas ou citando o problema/tema (max 25)
    # Busca reuniões da mesma cidade onde o tema foi discutido
    if theme:
        meetings_count = db.query(func.count(Meeting.id)).filter(
            Meeting.city_id == demand.city_id,
            Meeting.discussed_themes.like(f"%{theme.name}%")
        ).scalar() or 0
        score += min(meetings_count * 8, 25)
        
    # 4. Atendimentos relacionados (max 20)
    # Atendimentos na mesma cidade e com o mesmo tema principal
    attendances_count = db.query(func.count(Attendance.id)).filter(
        Attendance.city_id == demand.city_id,
        Attendance.main_theme_id == demand.theme_id
    ).scalar() or 0
    score += min(attendances_count * 5, 20)
    
    # 5. Tempo sem resposta (max 20)
    # Se a demanda está sem atualização ou sem retorno por muitos dias
    delta = datetime.datetime.utcnow() - demand.created_at
    if demand.status in ["Nova", "Em análise", "Encaminhada", "Em andamento"]:
        if delta.days > 30:
            score += 20
        elif delta.days > 15:
            score += 10
        elif delta.days > 7:
            score += 5
            
    # Garantir limites
    return max(0, min(score, 100))

def get_priority_string(score: int) -> str:
    if score <= 20:
        return "Baixa"
    elif score <= 50:
        return "Média"
    elif score <= 75:
        return "Alta"
    elif score <= 90:
        return "Urgente"
    else:
        return "Crítica"

def update_suggested_priority(db: Session, demand_id: int) -> int:
    demand = db.query(Demand).filter(Demand.id == demand_id).first()
    if not demand:
        return 0
    
    score = calculate_priority_score(db, demand)
    demand.suggested_priority_score = score
    db.commit()
    return score
