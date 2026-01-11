from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://halo_user:halo_password@localhost:5432/halo_db"

    # Security
    SECRET_KEY: str = "halo-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # OpenAI
    OPENAI_API_KEY: str

    # Voximplant
    VOXIMPLANT_ACCOUNT_ID: str
    VOXIMPLANT_API_KEY: str
    VOXIMPLANT_APPLICATION_ID: str
    VOXIMPLANT_RULE_ID: str
    VOXIMPLANT_SCENARIO_ID: str
    VOXIMPLANT_CALLER_ID: str

    # Webhook
    WEBHOOK_URL: str

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["*", "http://localhost:3000", "http://localhost:8000"]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
