import os
from pydantic_settings import BaseSettings
from typing import Optional

def _fix_database_url(url: str) -> str:
    """Render.com provides postgres:// which SQLAlchemy 2.0+ doesn't accept.
    Convert to postgresql:// for compatibility."""
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url

class Settings(BaseSettings):
    PROJECT_NAME: str = "Radar DF"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-radar-df-key-for-jwt-signing-1234567890")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # DATABASE_URL fallback to sqlite for easy local testing
    DATABASE_URL: str = _fix_database_url(
        os.getenv("DATABASE_URL", "sqlite:///./radardf.db")
    )

    class Config:
        case_sensitive = True

settings = Settings()

