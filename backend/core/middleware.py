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


class AuthMiddleware(BaseHTTPMiddleware):
    """
    Middleware для проверки авторизации.
    Пропускает все запросы, которые начинаются с /api/v1/auth/
    """

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # 🔥 ПРОПУСКАЕМ ВСЕ АУТЕНТИФИКАЦИОННЫЕ МАРШРУТЫ
        if path.startswith("/api/v1/auth/") or path.startswith("/auth/"):
            return await call_next(request)

        # 🔥 ПРОПУСКАЕМ ПУБЛИЧНЫЕ ПРОФИЛИ
        if "/profile/public" in path:
            return await call_next(request)

        # 🔥 ПРОПУСКАЕМ HEALTH, DOCS, ROOT
        if path in ["/", "/health", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)

        # 🔥 ВСЕ ОСТАЛЬНЫЕ МАРШРУТЫ ТРЕБУЮТ АВТОРИЗАЦИЮ
        token = request.cookies.get("access_token")

        if not token:
            logger.warning(f"🚫 Unauthorized access to {path} - no token")
            return JSONResponse(
                status_code=401, content={"detail": "Authentication required"}
            )

        payload = decode_token(token)
        if not payload:
            logger.warning(f"🚫 Invalid token for {path}")
            return JSONResponse(status_code=401, content={"detail": "Invalid token"})

        request.state.user_id = payload.get("user_id")
        request.state.username = payload.get("username")
        request.state.email = payload.get("sub")

        response = await call_next(request)
        return response


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
