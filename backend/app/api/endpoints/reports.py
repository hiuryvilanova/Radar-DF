import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Demand, City, User
from app.api.deps import get_current_user
from app.services.report_service import generate_dossier_pdf, export_demands_dataframe

router = APIRouter()

@router.get("/dossier")
def get_city_dossier(
    city_id: int = Query(...),
    start_date: Optional[datetime.date] = None,
    end_date: Optional[datetime.date] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Set default dates if not provided (default last 12 months for comprehensive dashboard dossiers)
    if not end_date:
        end_date = datetime.date.today()
    if not start_date:
        start_date = end_date - datetime.timedelta(days=365)
        
    start_datetime = datetime.datetime.combine(start_date, datetime.time.min)
    end_datetime = datetime.datetime.combine(end_date, datetime.time.max)

    try:
        pdf_bytes = generate_dossier_pdf(db, city_id, start_datetime, end_datetime)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar PDF: {str(e)}")

    city = db.query(City).filter(City.id == city_id).first()
    city_name = city.name.replace(" ", "_").lower() if city else "cidade"
    
    response = Response(content=pdf_bytes)
    response.headers["Content-Disposition"] = f"attachment; filename=dossie_{city_name}.pdf"
    response.headers["Content-Type"] = "application/pdf"
    return response


@router.get("/export")
def export_demands(
    format_type: str = Query("xlsx", regex="^(xlsx|csv)$"),
    city_id: Optional[int] = None,
    theme_id: Optional[int] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    source: Optional[str] = None,
    responsible_user_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Retrieve demands based on same filters
    query = db.query(Demand).filter(Demand.deleted_at.is_(None))
    
    if city_id is not None:
        query = query.filter(Demand.city_id == city_id)
    if theme_id is not None:
        query = query.filter(Demand.theme_id == theme_id)
    if priority:
        query = query.filter(Demand.priority == priority)
    if status:
        query = query.filter(Demand.status == status)
    if source:
        query = query.filter(Demand.source == source)
    if responsible_user_id is not None:
        query = query.filter(Demand.responsible_user_id == responsible_user_id)
        
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Demand.title.like(search_filter)) | 
            (Demand.description.like(search_filter)) |
            (Demand.neighborhood.like(search_filter))
        )

    demands = query.all()
    file_bytes = export_demands_dataframe(demands, format_type)
    
    response = Response(content=file_bytes)
    ext = "csv" if format_type == "csv" else "xlsx"
    mime = "text/csv" if format_type == "csv" else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    
    response.headers["Content-Disposition"] = f"attachment; filename=demandas_radar_df.{ext}"
    response.headers["Content-Type"] = mime
    return response
