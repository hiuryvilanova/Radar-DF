import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.core.seeds import seed_db
from app.api.api import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Radar DF — Inteligência Territorial de Demandas Públicas",
    version="1.0.0"
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
