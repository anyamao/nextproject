# core/middleware.py

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import time
import logging
import json
from typing import Optional, List

from core.config import settings
from core.auth import decode_token

logger = logging.getLogger(__name__)


# ====== 1. LOGGING MIDDLEWARE ======


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware для логирования всех запросов"""

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        # Логируем входящий запрос
        logger.debug(f"📥 {request.method} {request.url.path}")
        logger.debug(f"📍 Origin: {request.headers.get('origin', 'unknown')}")
        logger.debug(f"👤 IP: {request.client.host if request.client else 'unknown'}")

        # Обрабатываем запрос
        response = await call_next(request)

        # Вычисляем время выполнения
        process_time = (time.time() - start_time) * 1000

        # Логируем ответ
        logger.debug(
            f"📤 {request.method} {request.url.path} "
            f"-> {response.status_code} ({process_time:.2f}ms)"
        )

        # Добавляем заголовок с временем выполнения
        response.headers["X-Process-Time"] = f"{process_time:.2f}ms"

        return response


# ====== 2. AUTH MIDDLEWARE ======


class AuthMiddleware(BaseHTTPMiddleware):
    """
    Middleware для проверки авторизации.
    Проверяет токен в cookie для всех защищенных маршрутов.
    """

    # 🔥 Публичные маршруты (не требуют авторизации)
    PUBLIC_PATHS: List[str] = [
        "/",
        "/health",
        "/docs",
        "/redoc",
        "/openapi.json",
        "/api/v1/auth/register",
        "/api/v1/auth/login",
        "/api/v1/auth/refresh",
        "/api/v1/auth/test",
        "/api/v1/test/test-sentry",
        "/api/v1/test/test-error",
        "/auth/register",
        "/auth/login",
        "/auth/refresh",
        "/auth/test",
        "/test/test-sentry",
        "/test/test-error",
    ]

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # 🔥 Проверяем, публичный ли путь
        is_public = any(path.startswith(p) for p in self.PUBLIC_PATHS)

        # Если путь публичный - пропускаем без проверки
        if is_public:
            return await call_next(request)

        # 🔥 Проверяем наличие токена в cookie
        token = request.cookies.get("access_token")

        if not token:
            logger.warning(f"🚫 Unauthorized access to {path} - no token")
            return JSONResponse(
                status_code=401, content={"detail": "Authentication required"}
            )

        # 🔥 Проверяем валидность токена
        payload = decode_token(token)
        if not payload:
            logger.warning(f"🚫 Invalid token for {path}")
            return JSONResponse(status_code=401, content={"detail": "Invalid token"})

        # 🔥 Добавляем данные пользователя в request state
        request.state.user_id = payload.get("user_id")
        request.state.username = payload.get("username")
        request.state.email = payload.get("sub")

        # Пропускаем запрос дальше
        response = await call_next(request)
        return response


# ====== 3. PERFORMANCE MIDDLEWARE ======


class PerformanceMiddleware(BaseHTTPMiddleware):
    """Middleware для мониторинга производительности"""

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        response = await call_next(request)

        process_time = time.time() - start_time

        # Логируем медленные запросы (> 1 секунда)
        if process_time > 1.0:
            logger.warning(
                f"🐌 Slow request: {request.url.path} took {process_time:.2f}s"
            )

        return response


# ====== 4. REQUEST BODY MIDDLEWARE ======


class RequestBodyMiddleware(BaseHTTPMiddleware):
    """Middleware для сохранения тела запроса для логирования"""

    async def dispatch(self, request: Request, call_next):
        # Сохраняем тело запроса только для POST/PUT/PATCH
        if request.method in ["POST", "PUT", "PATCH"]:
            try:
                body = await request.body()
                if body:
                    request.state.body = json.loads(body)
                else:
                    request.state.body = {}
            except:
                request.state.body = {}

        response = await call_next(request)
        return response


# ====== 5. SECURITY HEADERS MIDDLEWARE ======


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware для добавления заголовков безопасности"""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # 🔥 Заголовки безопасности
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # 🔥 Для продакшена добавляем CSP
        if settings.ENVIRONMENT == "production":
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' https:; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self' https:; "
            )

        return response


# ====== 6. CORS HEADERS MIDDLEWARE (опционально) ======


class CORSMiddleware(BaseHTTPMiddleware):
    """Middleware для CORS (дополнительный, если нужен)"""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        origin = request.headers.get("origin")
        if origin:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = (
                "GET, POST, PUT, DELETE, PATCH, OPTIONS"
            )
            response.headers["Access-Control-Allow-Headers"] = (
                "Content-Type, Authorization, Accept, Origin, X-Requested-With"
            )

        return response


# ====== 7. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ======


def is_public_path(path: str) -> bool:
    """Проверка, является ли путь публичным"""
    public_paths = [
        "/",
        "/health",
        "/docs",
        "/redoc",
        "/openapi.json",
        "/api/v1/auth/register",
        "/api/v1/auth/login",
        "/api/v1/auth/refresh",
        "/api/v1/auth/test",
        "/auth/register",
        "/auth/login",
        "/auth/refresh",
        "/auth/test",
    ]
    return any(path.startswith(p) for p in public_paths)
