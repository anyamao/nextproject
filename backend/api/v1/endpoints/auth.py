# api/v1/endpoints/auth.py

from fastapi import APIRouter, Depends, Request, Response, status
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime, timedelta
import bcrypt
import re
import logging
import jwt

from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.rate_limit import limiter, REGISTER_LIMIT, LOGIN_LIMIT, rate_checker
from core.config import settings
from core.logger import get_logger, log_security_event
from core.exceptions import AppException, AuthException, RateLimitException
from repositories.user_repo import UserRepository
from models.user import User

logger = get_logger("auth")
router = APIRouter()

# ====== СХЕМЫ ======


class UserCreate(BaseModel):
    email: EmailStr = Field(..., description="Email пользователя")
    username: str = Field(
        ..., min_length=3, max_length=30, description="Имя пользователя"
    )
    password: str = Field(..., min_length=8, max_length=128, description="Пароль")

    @validator("username")
    def validate_username(cls, v):
        if not re.match(r"^[a-zA-Z0-9_.-]+$", v):
            raise ValueError("Username может содержать только буквы, цифры, _, . и -")
        if v.lower() in ["admin", "root", "system"]:
            raise ValueError("Этот username зарезервирован")
        return v.lower()

    @validator("password")
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Пароль должен быть минимум 8 символов")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Пароль должен содержать заглавную букву")
        if not re.search(r"[a-z]", v):
            raise ValueError("Пароль должен содержать строчную букву")
        if not re.search(r"\d", v):
            raise ValueError("Пароль должен содержать цифру")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError("Пароль должен содержать спецсимвол")
        return v


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    avatar_url: Optional[str] = None
    is_active: bool = True
    token_balance: int = 0

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 900
    user: UserResponse


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


async def get_current_user_optional(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """
    Получение текущего пользователя (опционально).
    Если токен не передан - возвращает None.
    """
    try:
        return await get_current_user(request, db)
    except HTTPException:
        return None


# ====== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ======


def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"), hashed_password.encode("utf-8")
    )


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except jwt.PyJWTError:
        return None


# ====== АУТЕНТИФИКАЦИЯ (DEPENDENCY) ======


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Получение текущего пользователя из токена"""
    access_token = request.cookies.get("access_token")

    if not access_token:
        raise AuthException(detail="Not authenticated")

    payload = decode_token(access_token)
    if not payload:
        raise AuthException(detail="Invalid token")

    user_id = payload.get("user_id")
    if not user_id:
        raise AuthException(detail="Invalid token payload")

    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)

    if not user:
        raise AuthException(detail="User not found")

    return user


# ====== ЭНДПОИНТЫ ======


@router.post(
    "/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED
)
@limiter.limit(REGISTER_LIMIT)
async def register(
    request: Request,
    user_data: UserCreate,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    client_ip = request.client.host or "unknown"
    logger.info(f"📝 Registration attempt: {user_data.email} from {client_ip}")

    # Rate limiting
    if not await rate_checker.check_ip_rate_limit(client_ip, limit=10, window=3600):
        raise RateLimitException(detail="Слишком много попыток. Попробуйте позже")

    if not await rate_checker.check_email_rate_limit(
        user_data.email, limit=3, window=3600
    ):
        raise RateLimitException(detail="Слишком много попыток для этого email")

    repo = UserRepository(db)

    # Проверка существования
    if await repo.get_by_email(user_data.email):
        raise AppException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Registration failed"
        )

    if await repo.get_by_username(user_data.username):
        raise AppException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Registration failed"
        )

    # Создание пользователя
    hashed_password = get_password_hash(user_data.password)
    new_user = await repo.create(
        {
            "email": user_data.email,
            "username": user_data.username,
            "hashed_password": hashed_password,
            "avatar_url": f"https://ui-avatars.com/api/?name={user_data.username}&background=random&size=128",
            "is_active": True,
            "registration_ip": client_ip,
        }
    )

    logger.info(f"✅ User registered: {user_data.email} (ID: {new_user.id})")
    log_security_event(
        "registration_success", user_id=new_user.id, email=new_user.email
    )

    # Создание токенов
    access_token = create_access_token(
        {
            "sub": new_user.email,
            "user_id": new_user.id,
            "username": new_user.username,
        }
    )

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": UserResponse.model_validate(new_user),
    }


@router.post("/login")
@limiter.limit(LOGIN_LIMIT)
async def login(
    request: Request,
    login_data: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    client_ip = request.client.host or "unknown"
    logger.info(f"🔑 Login attempt: {login_data.email} from {client_ip}")

    repo = UserRepository(db)
    user = await repo.get_by_email(login_data.email)

    if not user or not verify_password(login_data.password, user.hashed_password):
        log_security_event("login_failed", email=login_data.email, ip=client_ip)
        raise AuthException(detail="Invalid credentials")

    # Обновляем last_login
    await repo.update(user.id, {"last_login": datetime.utcnow()})

    logger.info(f"✅ User logged in: {login_data.email} (ID: {user.id})")
    log_security_event("login_success", user_id=user.id, email=user.email)

    access_token = create_access_token(
        {
            "sub": user.email,
            "user_id": user.id,
            "username": user.username,
        }
    )

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": UserResponse.model_validate(user),
    }


@router.post("/logout")
async def logout(request: Request, response: Response):
    """Выход из системы"""
    response.delete_cookie("access_token", path="/")
    logger.info(f"User logged out from {request.client.host or 'unknown'}")
    return {"message": "Logged out"}


@router.get("/me")
async def get_me(user: User = Depends(get_current_user)):
    """Получение текущего пользователя"""
    return {
        "user": UserResponse.model_validate(user),
    }


@router.post("/refresh")
async def refresh_token(
    request: Request, response: Response, db: AsyncSession = Depends(get_db)
):
    """Обновление access токена"""
    access_token = request.cookies.get("access_token")
    if not access_token:
        raise AuthException(detail="Not authenticated")

    payload = decode_token(access_token)
    if not payload:
        raise AuthException(detail="Invalid token")

    user_id = payload.get("user_id")
    if not user_id:
        raise AuthException(detail="Invalid token")

    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user:
        raise AuthException(detail="User not found")

    new_token = create_access_token(
        {
            "sub": user.email,
            "user_id": user.id,
            "username": user.username,
        }
    )

    response.set_cookie(
        key="access_token",
        value=new_token,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )

    return {"access_token": new_token, "token_type": "bearer"}


# core/auth.py - добавить в конец


async def get_current_user_optional(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """
    Получение текущего пользователя (опционально).
    Если токен не передан или невалидный - возвращает None.
    """
    try:
        return await get_current_user(request, db)
    except HTTPException:
        return None
