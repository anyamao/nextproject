# core/config.py

import os
from typing import List, Optional
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseModel):
    """Настройки приложения"""

    # Основные
    APP_NAME: str = os.getenv("APP_NAME", "NextProject")
    APP_VERSION: str = os.getenv("APP_VERSION", "1.0.0")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # База данных
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@localhost:5432/nextproject",
    )

    # Безопасность
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-prod-please")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15")
    )
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

    # CORS
    @property
    def CORS_ALLOWED_ORIGINS(self) -> List[str]:
        cors_str = os.getenv(
            "CORS_ALLOWED_ORIGINS",
            "http://localhost:3000,http://localhost:3010,http://127.0.0.1:3000,http://127.0.0.1:3010",
        )
        return [origin.strip() for origin in cors_str.split(",") if origin.strip()]

    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_MAX_AGE: int = 600

    # Rate Limiting
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    REDIS_ENABLED: bool = os.getenv("REDIS_ENABLED", "false").lower() == "true"
    RATE_LIMIT_REGISTER: str = os.getenv("RATE_LIMIT_REGISTER", "5/minute")
    RATE_LIMIT_LOGIN: str = os.getenv("RATE_LIMIT_LOGIN", "10/minute")

    # Фронтенд
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3010")

    # Валидация
    MIN_PASSWORD_LENGTH: int = 8
    MAX_PASSWORD_LENGTH: int = 128
    MIN_USERNAME_LENGTH: int = 3
    MAX_USERNAME_LENGTH: int = 30

    # Логи
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "DEBUG")
    LOG_FILE: Optional[str] = os.getenv("LOG_FILE", "app.log")

    # Дополнительно
    PORT: int = int(os.getenv("PORT", "8010"))
    HOST: str = os.getenv("HOST", "0.0.0.0")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()


def get_cors_settings():
    return {
        "allow_origins": settings.CORS_ALLOWED_ORIGINS,
        "allow_credentials": settings.CORS_ALLOW_CREDENTIALS,
        "allow_methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        "allow_headers": ["*"],
        "max_age": settings.CORS_MAX_AGE,
    }


def print_settings():
    print("\n" + "=" * 50)
    print(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION}")
    print(f"📦 Environment: {settings.ENVIRONMENT}")
    print(f"🔧 Debug: {settings.DEBUG}")
    print(f"🌐 Frontend: {settings.FRONTEND_URL}")
    print(f"📡 Port: {settings.PORT}")
    print(f"🔄 CORS: {settings.CORS_ALLOWED_ORIGINS}")
    print(f"⏱️  Rate Limit Register: {settings.RATE_LIMIT_REGISTER}")
    print("=" * 50 + "\n")
