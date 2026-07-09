# api/v1/endpoints/profile.py

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from pydantic import BaseModel, Field, validator
import re

from core.database import get_db
from core.auth import get_current_user
from core.rate_limit import limiter
from core.logger import get_logger, log_security_event
from services.profile_service import ProfileService
from models.user import User

logger = get_logger("profile")
router = APIRouter(prefix="/profile", tags=["profile"])


# ====== СХЕМЫ ======


class ProfileUpdate(BaseModel):
    """Схема обновления профиля"""

    username: Optional[str] = Field(None, min_length=3, max_length=30)
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = Field(None, max_length=200)
    about_me: Optional[str] = Field(None, max_length=2000)
    avatar_url: Optional[str] = Field(None, max_length=500)

    @validator("username")
    def validate_username(cls, v):
        if v is not None:
            if not re.match(r"^[a-zA-Z0-9_.-]+$", v):
                raise ValueError(
                    "Username может содержать только буквы, цифры, _, . и -"
                )
            if v.lower() in ["admin", "root", "system"]:
                raise ValueError("Этот username зарезервирован")
        return v


class ProfileResponse(BaseModel):
    """Схема ответа профиля"""

    id: int
    email: str
    username: str
    avatar_url: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    status: Optional[str] = None
    about_me: Optional[str] = None
    token_balance: int = 0
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


# ====== ПУБЛИЧНЫЕ ЭНДПОИНТЫ ======


@router.get("/public/{user_id}")
@limiter.limit("30/minute")
async def get_public_profile(
    request: Request,
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Получение публичного профиля пользователя"""
    service = ProfileService(db)
    profile = await service.get_public_profile(user_id)

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    logger.info(f"📖 Public profile viewed: user_id={user_id}")
    return profile


@router.get("/public/{user_id}/achievements")
@limiter.limit("30/minute")
async def get_public_achievements(
    request: Request,
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Получение достижений пользователя (публичный эндпоинт)"""
    service = ProfileService(db)
    stats = await service.get_achievement_stats(user_id)
    return stats


@router.get("/public/{user_id}/courses")
@limiter.limit("30/minute")
async def get_public_courses(
    request: Request,
    user_id: int,
    page: int = Query(1, ge=1, description="Номер страницы"),
    limit: int = Query(10, ge=1, le=50, description="Количество на странице"),
    db: AsyncSession = Depends(get_db),
):
    """Получение курсов пользователя с пагинацией"""
    service = ProfileService(db)
    result = await service.get_user_courses(user_id, page, limit)
    return result


# ====== ПРИВАТНЫЕ ЭНДПОИНТЫ (требуют авторизацию) ======


@router.get("/me")
async def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    """
    Получение своего профиля (приватный эндпоинт)
    Используется на странице /profile-settings
    """
    logger.info(f"📖 Getting my profile: user_id={current_user.id}")

    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "avatar_url": current_user.avatar_url,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "status": current_user.status,
        "about_me": current_user.about_me,
        "token_balance": current_user.token_balance,
        "created_at": current_user.created_at.isoformat()
        if current_user.created_at
        else None,
    }


@router.patch("/update")
async def update_profile(
    request: Request,
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Обновление профиля пользователя
    """
    logger.info(f"📝 Updating profile for user_id={current_user.id}")

    # 🔥 Проверяем, что username не занят (если меняется)
    if profile_data.username and profile_data.username != current_user.username:
        from repositories.user_repo import UserRepository

        repo = UserRepository(db)
        existing = await repo.get_by_username(profile_data.username)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken"
            )

    # 🔥 Подготавливаем данные для обновления
    update_data = {}
    fields = ["username", "first_name", "last_name", "status", "about_me", "avatar_url"]

    for field in fields:
        value = getattr(profile_data, field)
        if value is not None:
            update_data[field] = value

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update"
        )

    # 🔥 Обновляем пользователя
    from repositories.user_repo import UserRepository

    repo = UserRepository(db)
    updated_user = await repo.update(current_user.id, update_data)

    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    logger.info(f"✅ Profile updated for user_id={current_user.id}")
    log_security_event(
        "profile_updated", user_id=current_user.id, email=current_user.email
    )

    return {
        "id": updated_user.id,
        "email": updated_user.email,
        "username": updated_user.username,
        "avatar_url": updated_user.avatar_url,
        "first_name": updated_user.first_name,
        "last_name": updated_user.last_name,
        "status": updated_user.status,
        "about_me": updated_user.about_me,
        "token_balance": updated_user.token_balance,
        "created_at": updated_user.created_at.isoformat()
        if updated_user.created_at
        else None,
    }


@router.delete("/delete")
async def delete_account(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Удаление аккаунта пользователя
    """
    logger.warning(f"🗑️ Account deletion requested for user_id={current_user.id}")

    from repositories.user_repo import UserRepository

    repo = UserRepository(db)

    # 🔥 Сохраняем email для лога
    user_email = current_user.email
    user_id = current_user.id

    # 🔥 Удаляем пользователя
    deleted = await repo.delete(user_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    logger.warning(f"🗑️ Account deleted: {user_email} (ID: {user_id})")
    log_security_event(
        "account_deleted", user_id=user_id, email=user_email, status="success"
    )

    return {"message": "Account deleted successfully"}


@router.post("/avatar")
async def update_avatar(
    request: Request,
    avatar_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Обновление аватара пользователя
    """
    avatar_url = avatar_data.get("avatar_url")

    if not avatar_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="avatar_url is required"
        )

    from repositories.user_repo import UserRepository

    repo = UserRepository(db)
    updated_user = await repo.update(current_user.id, {"avatar_url": avatar_url})

    logger.info(f"🖼️ Avatar updated for user_id={current_user.id}")

    return {
        "avatar_url": updated_user.avatar_url if updated_user else avatar_url,
        "message": "Avatar updated successfully",
    }


@router.get("/achievements")
@limiter.limit("30/minute")
async def get_my_achievements(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Получение своих достижений (приватный эндпоинт)"""
    service = ProfileService(db)
    stats = await service.get_achievement_stats(current_user.id)
    return stats


@router.get("/test-stats")
@limiter.limit("30/minute")
async def get_test_stats(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Получение статистики тестов (приватный эндпоинт)"""
    return {"tests_passed_75": 0}


@router.post("/cache/clear")
async def clear_profile_cache(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Очистка кеша профиля"""
    service = ProfileService(db)
    await service.clear_cache(current_user.id)
    return {"message": "Cache cleared successfully"}
