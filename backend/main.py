# main.py

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging

from core.config import settings, get_cors_settings, print_settings
from core.logger import setup_logging
from core.middleware import (
    LoggingMiddleware,
    AuthMiddleware,
    PerformanceMiddleware,
    RequestBodyMiddleware,
    SecurityHeadersMiddleware,
)

# Настройка логирования
setup_logging()

logger = logging.getLogger(__name__)

# ====== СОЗДАНИЕ ПРИЛОЖЕНИЯ ======
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# ====== MIDDLEWARE (порядок ВАЖЕН!) ======

# 1. RequestBody - должен быть первым, чтобы сохранить тело
app.add_middleware(RequestBodyMiddleware)

# 2. Logging - логирует все запросы
app.add_middleware(LoggingMiddleware)

# 3. Performance - мониторинг производительности
app.add_middleware(PerformanceMiddleware)

# 4. Auth - проверка авторизации (защищает все маршруты, кроме PUBLIC_PATHS)
app.add_middleware(AuthMiddleware)

# 5. SecurityHeaders - добавляет заголовки безопасности
app.add_middleware(SecurityHeadersMiddleware)

# 6. CORS - стандартный middleware FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=600,
)

# ====== ПОДКЛЮЧЕНИЕ РОУТЕРОВ ======

try:
    from api.v1.router import router as v1_router

    # 🔥 Проверяем, что роутер не пустой
    print(f"🔍 Router has {len(v1_router.routes)} routes")
    for route in v1_router.routes:
        if hasattr(route, "path"):
            print(f"  - {route.path}")

    app.include_router(v1_router, prefix="/api/v1")
    logger.info("✅ API v1 подключен на /api/v1")

    # Для обратной совместимости
    app.include_router(v1_router, prefix="")
    logger.info("✅ API v1 также доступен без префикса")

except ImportError as e:
    logger.warning(f"⚠️  Не удалось подключить API роутер: {e}")


# ====== ROOT ENDPOINT ======
@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "frontend": settings.FRONTEND_URL,
        "docs": "/docs" if settings.DEBUG else None,
    }


# ====== HEALTH CHECK ======
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "cors_origins": settings.CORS_ALLOWED_ORIGINS,
        "api_versions": ["v1"],
    }


# ====== EXCEPTION HANDLERS ======
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError

from core.exceptions import (
    validation_exception_handler,
    sqlalchemy_exception_handler,
    app_exception_handler,
    generic_exception_handler,
    AppException,
)

app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# ====== ЗАПУСК ======
if __name__ == "__main__":
    print_settings()
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
