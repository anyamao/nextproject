from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import os
from dotenv import load_dotenv
from datetime import datetime
from database import engine, Base, get_db
from models import User, EgeSubject
from schemas import (
    UserRegister,
    UserLogin,
    Token,
    UserOut,
    EgeSubjectCreate,
    EgeSubjectOut,
)
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
)

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ✅ При старте создаём таблицы (если их нет)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ БД подключена. Таблицы проверены/созданы.")
    yield
    # При остановке
    await engine.dispose()


app = FastAPI(title="NextProject Auth API", version="1.0.0", lifespan=lifespan)

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


# === РЕГИСТРАЦИЯ =
#
#


# 🆕 Регистрация
@app.post("/auth/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: AsyncSession = Depends(get_db)):
    # Проверка email
    existing_email = await db.execute(
        select(User).where(User.email == user_data.email.lower())
    )
    if existing_email.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User already registered")

    # Проверка username
    existing_user = await db.execute(
        select(User).where(User.username == user_data.username.lower())
    )
    if existing_user.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already taken")

    # Создание
    new_user = User(
        email=user_data.email.lower(),
        username=user_data.username.lower(),
        hashed_password=get_password_hash(user_data.password),
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    token = create_access_token({"sub": new_user.email})
    return Token(
        access_token=token,
        user=UserOut(id=new_user.id, email=new_user.email, username=new_user.username),
    )


# 🆕 Вход
@app.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(User.email == credentials.email.lower())
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid login credentials")

    token = create_access_token({"sub": user.email})
    return Token(
        access_token=token,
        user=UserOut(id=user.id, email=user.email, username=user.username),
    )


# 🔐 Защищённый маршрут (тест токена)
@app.get("/auth/me", response_model=UserOut)
async def read_me(current_user: User = Depends(get_current_user)):
    return UserOut(
        id=current_user.id, email=current_user.email, username=current_user.username
    )


# ЕГЭ ЭНДПОИНТЫ ТУТ!! ege_native


# 📚 ЕГЭ: Получить все предметы (публичный, без авторизации)
@app.get("/ege/subjects", response_model=list[EgeSubjectOut])
async def get_ege_subjects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EgeSubject).order_by(EgeSubject.title))
    return result.scalars().all()


# 📚 ЕГЭ: Получить один предмет по slug
@app.get("/ege/subjects/{slug}", response_model=EgeSubjectOut)
async def get_ege_subject(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EgeSubject).where(EgeSubject.slug == slug))
    subject = result.scalar_one_or_none()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject


@app.post(
    "/ege/subjects", response_model=EgeSubjectOut, status_code=status.HTTP_201_CREATED
)
async def create_ege_subject(
    subject_data: EgeSubjectCreate,  # ✅ ИСПРАВЛЕНО: было subject_ EgeSubjectCreate
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Проверка на дубликат slug
    existing = await db.execute(
        select(EgeSubject).where(EgeSubject.slug == subject_data.slug)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Slug already exists")

    new_subject = EgeSubject(**subject_data.model_dump())
    db.add(new_subject)
    await db.commit()
    await db.refresh(new_subject)
    return new_subject


##снизу конец!!!!!!!1###############


@app.get("/health")
async def health():
    return {"status": "ok", "db": "postgresql_asyncpg"}
