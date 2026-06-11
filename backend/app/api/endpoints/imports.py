import csv
import io
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.models.models import Import, ImportError, User
from app.schemas.schemas import ImportSchema
from app.api.deps import allow_coordinator_or_above, get_current_user
from app.services.import_service import preview_spreadsheet, execute_import

router = APIRouter()

@router.get("/history", response_model=List[ImportSchema])
def list_imports_history(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return db.query(Import).order_by(desc(Import.created_at)).all()

@router.post("/preview")
async def preview_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(allow_coordinator_or_above)
):
    contents = await file.read()
    filename = file.filename or "import.csv"
    res = preview_spreadsheet(db, contents, filename)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error"))
    return res

@router.post("/execute")
async def execute_file_import(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(allow_coordinator_or_above)
):
    contents = await file.read()
    filename = file.filename or "import.csv"
    res = execute_import(db, contents, filename, current_user.id)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error"))
    return res

@router.get("/{import_id}/errors")
def download_errors(
    import_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    import_rec = db.query(Import).filter(Import.id == import_id).first()
    if not import_rec:
        raise HTTPException(status_code=404, detail="Registro de importação não encontrado")
        
    errors = db.query(ImportError).filter(ImportError.import_id == import_id).order_by(ImportError.row_number).all()
    
    # Generate CSV response
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Linha", "Campo com Erro", "Mensagem de Erro", "Dados Originais da Linha"])
    
    for err in errors:
        writer.writerow([err.row_number, err.field_name or "", err.error_message, err.raw_row_data or ""])
        
    response = Response(content=output.getvalue())
    response.headers["Content-Disposition"] = f"attachment; filename=erros_importacao_{import_id}.csv"
    response.headers["Content-Type"] = "text/csv; charset=utf-8-sig"
    return response

@router.get("/template")
def download_template(
    current_user = Depends(get_current_user)
):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "data", "cidade", "bairro", "tema", "subtema", "titulo", 
        "descricao", "origem", "prioridade", "status", "responsavel", 
        "observacao", "nome_solicitante", "contato"
    ])
    # Add sample row
    writer.writerow([
        "2026-06-11", "Ceilândia", "Centro", "Saúde", "Falta de Médicos", "Falta de Médicos na UPA",
        "A comunidade reclama da falta de médicos plantonistas na UPA de Ceilândia.", "WhatsApp", "Urgente", "Nova", "admin@radardf.local",
        "Observação estratégica", "Maria Silva", "61999999999"
    ])
    
    response = Response(content=output.getvalue())
    response.headers["Content-Disposition"] = "attachment; filename=modelo_importacao_radar.csv"
    response.headers["Content-Type"] = "text/csv; charset=utf-8-sig"
    return response
