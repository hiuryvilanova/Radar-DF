import io
import json
import pandas as pd
import datetime
from sqlalchemy.orm import Session
from app.models.models import City, Theme, Subtheme, Demand, Import, ImportError, User
from app.services.priority_service import calculate_priority_score

REQUIRED_COLUMNS = ["titulo", "descricao", "cidade", "tema"]

def clean_string(val) -> str:
    if pd.isna(val) or val is None:
        return ""
    return str(val).strip()

def parse_date(val) -> datetime.datetime:
    if pd.isna(val) or val is None:
        return datetime.datetime.utcnow()
    try:
        if isinstance(val, datetime.datetime):
            return val
        # Try converting string
        return pd.to_datetime(val).to_pydatetime()
    except Exception:
        return datetime.datetime.utcnow()

def preview_spreadsheet(db: Session, file_bytes: bytes, filename: str):
    """
    Parses spreadsheet and checks for errors without writing to the database.
    """
    file_ext = filename.split(".")[-1].lower()
    try:
        if file_ext in ["xlsx", "xls"]:
            df = pd.read_excel(io.BytesIO(file_bytes))
        else:
            df = pd.read_csv(io.BytesIO(file_bytes))
    except Exception as e:
        return {"success": False, "error": f"Não foi possível ler o arquivo: {str(e)}"}

    # Standardize column names (lowercase, remove spaces)
    df.columns = [str(c).strip().lower() for c in df.columns]
    
    # Check if required columns exist (or are close)
    missing_cols = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing_cols:
        return {
            "success": False,
            "error": f"Colunas obrigatórias ausentes na planilha: {', '.join(missing_cols)}"
        }

    preview_rows = []
    total_rows = len(df)
    error_count = 0
    success_count = 0

    # Cache cities and themes to avoid N+1 queries
    cities = {c.name.lower().strip(): c for c in db.query(City).all()}
    themes = {t.name.lower().strip(): t for t in db.query(Theme).all()}

    for index, row in df.iterrows():
        row_num = index + 1
        row_errors = []
        
        cidade_name = clean_string(row.get("cidade"))
        tema_name = clean_string(row.get("tema"))
        titulo = clean_string(row.get("titulo"))
        descricao = clean_string(row.get("descricao"))
        
        # Validate Title
        if not titulo:
            row_errors.append({"field": "titulo", "error": "Título é obrigatório"})
            
        # Validate Description
        if not descricao:
            row_errors.append({"field": "descricao", "error": "Descrição é obrigatória"})

        # Validate City
        city_exists = False
        if not cidade_name:
            row_errors.append({"field": "cidade", "error": "Cidade é obrigatória"})
        elif cidade_name.lower() in cities:
            city_exists = True
        else:
            row_errors.append({
                "field": "cidade",
                "error": f"Cidade '{cidade_name}' não cadastrada",
                "missing_entity": "city",
                "name": cidade_name
            })

        # Validate Theme
        theme_exists = False
        if not tema_name:
            row_errors.append({"field": "tema", "error": "Tema é obrigatório"})
        elif tema_name.lower() in themes:
            theme_exists = True
        else:
            row_errors.append({
                "field": "tema",
                "error": f"Tema '{tema_name}' não cadastrado",
                "missing_entity": "theme",
                "name": tema_name
            })

        has_error = len(row_errors) > 0
        if has_error:
            error_count += 1
        else:
            success_count += 1

        preview_rows.append({
            "row_number": row_num,
            "data": {
                "date": clean_string(row.get("data")),
                "cidade": cidade_name,
                "bairro": clean_string(row.get("bairro")),
                "tema": tema_name,
                "subtema": clean_string(row.get("subtema")),
                "titulo": titulo,
                "descricao": descricao,
                "origem": clean_string(row.get("origem")),
                "prioridade": clean_string(row.get("prioridade")),
                "status": clean_string(row.get("status")),
                "responsavel": clean_string(row.get("responsavel")),
                "observacao": clean_string(row.get("observacao")),
                "nome_solicitante": clean_string(row.get("nome_solicitante")),
                "contato": clean_string(row.get("contato"))
            },
            "valid": not has_error,
            "errors": row_errors
        })

    return {
        "success": True,
        "filename": filename,
        "total_rows": total_rows,
        "success_rows": success_count,
        "error_rows": error_count,
        "rows": preview_rows
    }

def execute_import(db: Session, file_bytes: bytes, filename: str, user_id: int):
    """
    Actually performs the import, inserts valid rows, and logs errors for the rest.
    """
    preview = preview_spreadsheet(db, file_bytes, filename)
    if not preview.get("success"):
        return preview

    # Create Import record
    import_rec = Import(
        file_name=filename,
        file_type=filename.split(".")[-1].upper(),
        total_rows=preview["total_rows"],
        successful_rows=0,
        error_rows=0,
        status="Processando",
        imported_by=user_id
    )
    db.add(import_rec)
    db.commit()
    db.refresh(import_rec)

    # Cache entities
    cities = {c.name.lower().strip(): c for c in db.query(City).all()}
    themes = {t.name.lower().strip(): t for t in db.query(Theme).all()}
    
    # We can fetch subthemes and map them as well (theme_id -> subtheme_name_lower -> Subtheme)
    subthemes = {}
    for st in db.query(Subtheme).all():
        if st.theme_id not in subthemes:
            subthemes[st.theme_id] = {}
        subthemes[st.theme_id][st.name.lower().strip()] = st

    # Fetch users to map responsible email or name
    users = {u.name.lower().strip(): u for u in db.query(User).all()}
    users_by_email = {u.email.lower().strip(): u for u in db.query(User).all()}

    success_imported = 0
    error_imported = 0

    for r in preview["rows"]:
        if not r["valid"]:
            error_imported += 1
            # Add to ImportError table
            imp_err = ImportError(
                import_id=import_rec.id,
                row_number=r["row_number"],
                field_name=r["errors"][0]["field"] if r["errors"] else None,
                error_message="; ".join([e["error"] for e in r["errors"]]),
                raw_row_data=json.dumps(r["data"])
            )
            db.add(imp_err)
            continue

        # Valid row, let's insert the demand
        data = r["data"]
        city = cities[data["cidade"].lower().strip()]
        theme = themes[data["tema"].lower().strip()]
        
        # Subtheme
        subtheme_id = None
        sub_name = data["subtema"].lower().strip()
        if sub_name and theme.id in subthemes and sub_name in subthemes[theme.id]:
            subtheme_id = subthemes[theme.id][sub_name].id
        elif sub_name:
            # Optionally auto-create subtheme
            new_sub = Subtheme(
                theme_id=theme.id,
                name=data["subtema"],
                description=f"Criado automaticamente via importação.",
                status=True
            )
            db.add(new_sub)
            db.flush()
            subtheme_id = new_sub.id
            # update cache
            if theme.id not in subthemes:
                subthemes[theme.id] = {}
            subthemes[theme.id][sub_name] = new_sub

        # Responsible User
        resp_user_id = None
        resp_name = data["responsavel"].lower().strip()
        if resp_name:
            if resp_name in users:
                resp_user_id = users[resp_name].id
            elif resp_name in users_by_email:
                resp_user_id = users_by_email[resp_name].id

        # Defaults
        priority = data["prioridade"] if data["prioridade"] in ["Baixa", "Média", "Alta", "Urgente", "Crítica"] else "Média"
        status = data["status"] if data["status"] in ["Nova", "Em análise", "Encaminhada", "Em andamento", "Aguardando retorno", "Respondida", "Concluída", "Arquivada"] else "Nova"
        origem = data["origem"] if data["origem"] else "Planilha importada"
        created_date = parse_date(data["date"])

        demand = Demand(
            title=data["titulo"],
            description=data["descricao"],
            city_id=city.id,
            neighborhood=data["bairro"] if data["bairro"] else None,
            theme_id=theme.id,
            subtheme_id=subtheme_id,
            source=origem,
            priority=priority,
            status=status,
            requester_name=data["nome_solicitante"] if data["nome_solicitante"] else None,
            requester_contact=data["contato"] if data["contato"] else None,
            consent_contact=True if data["contato"] or data["nome_solicitante"] else False,
            strategic_note=data["observacao"] if data["observacao"] else None,
            responsible_user_id=resp_user_id,
            created_by=user_id,
            created_at=created_date,
            updated_at=datetime.datetime.utcnow()
        )
        db.add(demand)
        db.flush() # get demand id
        
        # Calculate priority score
        demand.suggested_priority_score = calculate_priority_score(db, demand)
        success_imported += 1

    # Update import record
    import_rec.successful_rows = success_imported
    import_rec.error_rows = error_imported
    import_rec.status = "Sucesso" if error_imported == 0 else "Com Erros"
    db.commit()

    return {
        "success": True,
        "import_id": import_rec.id,
        "status": import_rec.status,
        "successful_rows": success_imported,
        "error_rows": error_imported
    }
