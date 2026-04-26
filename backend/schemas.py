from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=72)
    username: str = Field(..., min_length=3)


class UserResponse(BaseModel):
    message: str
    email: str
    username: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    username: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ЕГЭ СХЕМЫ СНИЗУ ege_native ###############"""


class EgeSubjectCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=100)
    slug: str = Field(
        ..., pattern=r"^[a-z0-9\-]+$", description="Только латиница, цифры, дефис"
    )
    description: str | None = Field(None, max_length=500)
    image: str | None = None


class EgeSubjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    slug: str
    description: str | None
    image: str | None
    created_at: datetime


class EgeSubjectList(BaseModel):
    subjects: list[EgeSubjectOut]
    total: int


# конец #######################################################


# экспорт не трогать!!!
__all__ = ["UserRegister", "UserLogin", "UserOut", "Token"]
