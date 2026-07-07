import re
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, validator


class UserCreateSchema(BaseModel):
    """Схема для регистрации с валидацией"""

    email: EmailStr = Field(..., description="Email пользователя")
    username: str = Field(
        ..., min_length=3, max_length=30, description="Уникальное имя пользователя"
    )
    password: str = Field(
        ..., min_length=8, max_length=128, description="Пароль (мин 8 символов)"
    )
    confirm_password: str = Field(..., description="Подтверждение пароля")

    @validator("username")
    def validate_username(cls, v: str) -> str:
        """Проверка username на допустимые символы"""
        if not re.match(r"^[a-zA-Z0-9_.-]+$", v):
            raise ValueError("Username может содержать только буквы, цифры, _, . и -")
        if v.lower() in ["admin", "root", "system", "moderator"]:
            raise ValueError("Этот username зарезервирован")
        return v.lower()

    @validator("password")
    def validate_password(cls, v: str) -> str:
        """Проверка сложности пароля"""
        if len(v) < 8:
            raise ValueError("Пароль должен быть минимум 8 символов")

        if not re.search(r"[A-Z]", v):
            raise ValueError("Пароль должен содержать хотя бы одну заглавную букву")

        if not re.search(r"[a-z]", v):
            raise ValueError("Пароль должен содержать хотя бы одну строчную букву")

        if not re.search(r"\d", v):
            raise ValueError("Пароль должен содержать хотя бы одну цифру")

        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError("Пароль должен содержать хотя бы один спецсимвол")

        return v

    @validator("confirm_password")
    def passwords_match(cls, v: str, values: dict) -> str:
        """Проверка совпадения паролей"""
        if "password" in values and v != values["password"]:
            raise ValueError("Пароли не совпадают")
        return v


class UserResponseSchema(BaseModel):
    """Схема ответа (без пароля)"""

    id: int
    email: EmailStr
    username: str
    avatar_url: Optional[str] = None
    is_active: bool = True
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


class TokenResponseSchema(BaseModel):
    """Схема токенов"""

    user: UserResponseSchema
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 900  # 15 минут
