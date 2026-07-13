# core/middleware.py - ИСПРАВЛЕННАЯ ВЕРСИЯ

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


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware для логирования всех запросов"""

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        logger.debug(f"📥 {request.method} {request.url.path}")
        logger.debug(f"📍 Origin: {request.headers.get('origin', 'unknown')}")
        logger.debug(f"👤 IP: {request.client.host if request.client else 'unknown'}")

        response = await call_next(request)

        process_time = (time.time() - start_time) * 1000

        logger.debug(
            f"📤 {request.method} {request.url.path} "
            f"-> {response.status_code} ({process_time:.2f}ms)"
        )

        response.headers["X-Process-Time"] = f"{process_time:.2f}ms"

        return response


# core/middleware.py - обновленный AuthMiddleware


class AuthMiddleware(BaseHTTPMiddleware):
    """Middleware для проверки авторизации"""

    # 🔥 ПУБЛИЧНЫЕ МАРШРУТЫ (не требуют авторизации)
    PUBLIC_PATHS: List[str] = [
        # Системные
        "/",
        "/health",
        "/docs",
        "/redoc",
        "/openapi.json",
        # Аутентификация
        "/api/v1/auth/register",
        "/api/v1/auth/login",
        "/api/v1/auth/refresh",
        "/api/v1/auth/test",
        "/auth/register",
        "/auth/login",
        "/auth/refresh",
        "/auth/test",
        # 🔥 КУРСЫ (ПУБЛИЧНЫЕ)
        "/api/v1/courses/subjects",
        "/api/v1/courses/",
        "/courses/subjects",
        "/courses/",
        # Профиль (публичный)
        "/api/v1/profile/public",
        "/profile/public",
    ]

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # 🔥 Пропускаем все пути, начинающиеся с /api/v1/courses/
        if path.startswith("/api/v1/courses/"):
            return await call_next(request)

        # 🔥 Пропускаем /courses/ без префикса
        if path.startswith("/courses/"):
            return await call_next(request)

        # Проверяем остальные публичные пути
        is_public = any(path.startswith(p) for p in self.PUBLIC_PATHS)

        if is_public:
            return await call_next(request)

        # 🔥 ЗАЩИЩЕННЫЕ МАРШРУТЫ (требуют авторизацию)
        token = request.cookies.get("access_token")

        if not token:
            return JSONResponse(
                status_code=401, content={"detail": "Authentication required"}
            )

        payload = decode_token(token)
        if not payload:
            return JSONResponse(status_code=401, content={"detail": "Invalid token"})

        request.state.user_id = payload.get("user_id")
        request.state.username = payload.get("username")
        request.state.email = payload.get("sub")

        return await call_next(request)


class PerformanceMiddleware(BaseHTTPMiddleware):
    """Middleware для мониторинга производительности"""

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        response = await call_next(request)

        process_time = time.time() - start_time

        if process_time > 1.0:
            logger.warning(
                f"🐌 Slow request: {request.url.path} took {process_time:.2f}s"
            )

        return response


class RequestBodyMiddleware(BaseHTTPMiddleware):
    """Middleware для сохранения тела запроса для логирования"""

    async def dispatch(self, request: Request, call_next):
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


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware для добавления заголовков безопасности"""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        return response
