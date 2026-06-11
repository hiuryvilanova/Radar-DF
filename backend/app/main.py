import os
import re

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.core.seeds import seed_db
from app.api.api import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Radar DF — Inteligência Territorial de Demandas Públicas",
    version="1.0.0"
)


# ============================================================
# Tradutor das mensagens de validação do Pydantic para pt-BR
# ============================================================
_FIELD_LABELS = {
    "email": "E-mail",
    "password": "Senha",
    "old_password": "Senha atual",
    "new_password": "Nova senha",
    "name": "Nome",
    "title": "Título",
    "description": "Descrição",
    "city_id": "Cidade",
    "theme_id": "Tema",
    "subtheme_id": "Subtema",
    "role_id": "Perfil",
    "responsible_id": "Responsável",
    "deadline": "Prazo",
    "priority": "Prioridade",
    "status": "Status",
    "date": "Data",
    "meeting_datetime": "Data e hora da reunião",
    "attendance_datetime": "Data e hora do atendimento",
    "phone": "Telefone",
    "contact": "Contato",
    "address": "Endereço",
    "neighborhood": "Bairro",
    "color": "Cor",
    "observation": "Observação",
    "file_name": "Nome do arquivo",
}


def _label(field: str) -> str:
    return _FIELD_LABELS.get(field, field.replace("_", " ").capitalize())


def _translate_pydantic_msg(err: dict) -> str:
    msg = (err.get("msg") or "").strip()
    err_type = err.get("type") or ""
    ctx = err.get("ctx") or {}
    lower = msg.lower()

    if err_type == "missing" or "field required" in lower:
        return "Campo obrigatório."
    if "string should have at least" in lower:
        n = ctx.get("min_length", "")
        return f"Deve ter pelo menos {n} caracteres." if n != "" else "Texto muito curto."
    if "string should have at most" in lower:
        n = ctx.get("max_length", "")
        return f"Deve ter no máximo {n} caracteres." if n != "" else "Texto muito longo."
    if "value is not a valid email" in lower or "value is not a valid email address" in lower or "valid email" in lower:
        return "E-mail inválido."
    if "input should be a valid integer" in lower or "value is not a valid integer" in lower:
        return "Deve ser um número inteiro."
    if "input should be a valid number" in lower or "value is not a valid float" in lower:
        return "Deve ser um número válido."
    if "input should be a valid boolean" in lower:
        return "Deve ser verdadeiro ou falso."
    if "input should be a valid date" in lower or "value is not a valid date" in lower:
        return "Data inválida."
    if "input should be a valid datetime" in lower or "value is not a valid datetime" in lower:
        return "Data/hora inválida."
    if "input should be a valid string" in lower or "str type expected" in lower:
        return "Deve ser um texto."
    if "input should be a valid list" in lower:
        return "Deve ser uma lista."
    if "input should be a valid dictionary" in lower:
        return "Deve ser um objeto válido."
    if "input should be greater than" in lower:
        gt = ctx.get("gt", "")
        return f"Deve ser maior que {gt}." if gt != "" else "Valor muito baixo."
    if "input should be greater than or equal to" in lower:
        ge = ctx.get("ge", "")
        return f"Deve ser maior ou igual a {ge}." if ge != "" else "Valor muito baixo."
    if "input should be less than" in lower:
        lt = ctx.get("lt", "")
        return f"Deve ser menor que {lt}." if lt != "" else "Valor muito alto."
    if "input should be less than or equal to" in lower:
        le = ctx.get("le", "")
        return f"Deve ser menor ou igual a {le}." if le != "" else "Valor muito alto."
    if "input should be" in lower and "or" in lower:
        opcoes = re.findall(r"'([^']+)'", msg)
        if opcoes:
            return "Valor deve ser um dos seguintes: " + ", ".join(opcoes) + "."
    if "input should match pattern" in lower or "string does not match regex" in lower:
        return "Formato inválido."
    if "value error" in lower:
        return msg.split("Value error,", 1)[-1].strip().rstrip(".") + "." if "Value error," in msg else "Valor inválido."

    return "Valor inválido." if msg else "Erro de validação."


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    mensagens = []
    for err in exc.errors():
        loc = [str(p) for p in err.get("loc", []) if p not in ("body", "query", "path")]
        campo_raw = loc[-1] if loc else ""
        campo = _label(campo_raw)
        msg_pt = _translate_pydantic_msg(err)
        errors.append({"campo": campo, "erro": msg_pt})
        mensagens.append(f"{campo}: {msg_pt}" if campo else msg_pt)

    return JSONResponse(
        status_code=422,
        content={
            "detail": " | ".join(mensagens) if mensagens else "Erro de validação.",
            "erros": errors,
        },
    )

# Build CORS origins from env + defaults
_default_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
]
_extra = os.getenv("CORS_ORIGINS", "")
if _extra:
    _default_origins.extend([o.strip() for o in _extra.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=_default_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup Database Auto-Creation and Seeding
@app.on_event("startup")
def on_startup():
    # Create tables automatically
    Base.metadata.create_all(bind=engine)
    
    # SQLite-only migration: add columns if missing (skip for PostgreSQL)
    from sqlalchemy import text
    db = SessionLocal()
    try:
        if settings.DATABASE_URL.startswith("sqlite"):
            cursor = db.execute(text("PRAGMA table_info(demands)"))
            columns = [row[1] for row in cursor.fetchall()]
            if "parent_demand_id" not in columns:
                db.execute(text("ALTER TABLE demands ADD COLUMN parent_demand_id INTEGER REFERENCES demands(id)"))
            if "suggested_secretariat" not in columns:
                db.execute(text("ALTER TABLE demands ADD COLUMN suggested_secretariat VARCHAR(100)"))
            db.commit()
    except Exception as e:
        print(f"Error checking/altering columns: {e}")
        db.rollback()
    
    # Run seed script
    try:
        seed_db(db)
    finally:
        db.close()

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "message": "Bem-vindo ao Radar DF - API de Inteligência Territorial",
        "status": "online",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
