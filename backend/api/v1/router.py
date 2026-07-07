# api/v1/router.py

from fastapi import APIRouter

from api.v1.endpoints import auth

router = APIRouter()

# Подключаем роутер auth
router.include_router(auth.router, prefix="/auth", tags=["authentication"])
