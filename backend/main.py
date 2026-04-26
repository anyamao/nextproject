from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import timedelta
from passlib.context import CryptContext
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field, field_validator
from passlib.context import CryptContext
from datetime import datetime, timezone
from typing import Optional
import os
import secrets
from database import engine, Base, get_db
from models import User
from schemas import UserRegister, UserResponse, TokenResponse
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from jose import JWTError, jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-me")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
# Создаём таблицы при старте (только для SQLite!)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Maoschool API")

# 🔐 CORS — для localhost и домена
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3010",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3010",
        "https://maoschool.ru",
        "https://www.maoschool.ru",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


# === РЕГИСТРАЦИЯ =
#
#


class UserResponse(BaseModel):
    message: str
    username: str
    email: str
    # 🔐 Никогда не возвращаем пароль или хеш!


# 🗄️ Временное хранилище (замените на PostgreSQL в продакшене)
users_db: list[dict] = []


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)  # ✅ Argon2: нет лимита 72 байта!


@app.get("/health")
async def health():
    return {"status": "ok", "service": "fastapi-argon2-auth"}


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict  # ✅ Возвращаем данные пользователя (без пароля!)


# 🆕 Эндпоинт входа


class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict


class TokenData(BaseModel):
    email: Optional[str] = None


@app.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user = next(
        (u for u in users_db if u["email"].lower() == credentials.email.lower()), None
    )

    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid login credentials")

    access_token = create_access_token(data={"sub": user["email"]})

    return Token(
        access_token=access_token,
        token_type="bearer",
        user={"email": user["email"], "username": user["username"], "id": user["id"]},
    )


# 🔐 Создание токена
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# 🔐 Верификация токена
def verify_token(token: str, credentials_exception):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        return TokenData(email=email)
    except JWTError:
        raise credentials_exception


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token_data = verify_token(token, credentials_exception)

    # Поиск пользователя в БД
    user = next(
        (u for u in users_db if u["email"].lower() == token_data.email.lower()), None
    )
    if user is None:
        raise credentials_exception

    return user


# 🆕 Обновлённый login с реальным JWT
@app.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user = next(
        (u for u in users_db if u["email"].lower() == credentials.email.lower()), None
    )

    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid login credentials")

    access_token = create_access_token(data={"sub": user["email"]})

    return Token(
        access_token=access_token,
        token_type="bearer",
        user={"email": user["email"], "username": user["username"], "id": user["id"]},
    )


# 🆕 Обновлённый register — тоже возвращает токен
@app.post("/auth/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user: UserRegister):
    for u in users_db:
        if u["email"].lower() == user.email.lower():
            raise HTTPException(status_code=400, detail="User already registered")
        if u["username"].lower() == user.username.lower():
            raise HTTPException(status_code=400, detail="Username already taken")

    hashed_password = get_password_hash(user.password)
    new_user = {
        "id": len(users_db) + 1,
        "email": user.email.lower(),
        "username": user.username.lower(),
        "hashed_password": hashed_password,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    users_db.append(new_user)

    access_token = create_access_token(data={"sub": new_user["email"]})

    return Token(
        access_token=access_token,
        token_type="bearer",
        user={
            "email": new_user["email"],
            "username": new_user["username"],
            "id": new_user["id"],
        },
    )


@app.options("/auth/register")
async def options_register():
    return JSONResponse(content={}, status_code=200)
