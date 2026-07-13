# api/v1/router.py

from fastapi import APIRouter
from api.v1.endpoints import auth, profile, courses

router = APIRouter()

# 🔥 Подключаем роутеры
router.include_router(auth.router, prefix="/auth", tags=["authentication"])
router.include_router(profile.router, tags=["profile"])
router.include_router(courses.router, tags=["courses"])


# 🔥 Добавляем тестовый эндпоинт прямо в корневой роутер
@router.get("/test")
async def test_router():
    return {"message": "API v1 router works!"}
