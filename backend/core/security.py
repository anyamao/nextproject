# backend/core/security.py

from fastapi import Response, Request
from fastapi.responses import JSONResponse


def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    """Устанавливает защищенные cookies"""
    # Access token - живет 15 минут
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,  # Недоступен для JS
        secure=True,  # Только по HTTPS (в dev можно False)
        samesite="lax",  # Защита от CSRF
        max_age=900,  # 15 минут
        path="/",
    )
    # Refresh token - живет 7 дней
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=604800,  # 7 дней
        path="/auth/refresh",  # Только для обновления
    )


def clear_auth_cookies(response: Response):
    """Удаляет cookies при логауте"""
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/auth/refresh")
