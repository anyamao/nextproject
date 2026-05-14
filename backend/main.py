from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from jose import JWTError, jwt
from fastapi.responses import Response
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Float,
    Boolean,
    DateTime,
    Date,
    ForeignKey,
    func,
    select,
    insert,
    case,
    update,
    update,
    delete,
    or_,
    text,
    inspect,
)
from pydantic import BaseModel, Field
import os
from sqlalchemy.dialects.postgresql import insert
import json

from dotenv import load_dotenv
from datetime import datetime, timezone, date, timedelta
from database import engine, Base, get_db
from typing import Any, Dict, Literal, Optional
import asyncpg
from models import (
    User,
    UserAchievement,
    PublicProfileOut,
    EgeSubject,
    UserArticleFavorite,
    EgeLesson,
    EgeTest,
    ShopItem,
    UserInventory,
    EgeTestQuestion,
    TestResult,
    UserCourseEnrollment,
    UserFavoriteCourse,
    CourseReview,
    LessonView,
    LessonReaction,
    Article,
    ArticleView,
    ArticleReaction,
    Comment,
    CommentReaction,
    UserCompletedLesson,
    LanguageSubject,
    LanguageLevel,
    CourseEnrollment,
    LanguageCategory,
    LanguageLesson,
    LanguageComment,
    LanguageCommentReaction,
    LanguageLessonView,
    CourseUnit,
    Flashcard,
    Teacher,
    CourseTeacher,
    FlashcardDeck,
    FlashcardProgress,
    ReviewReaction,
)
from schemas import (
    TokenReward,
    UserRegister,
    TeacherOut,
    ShopItemOut,
    PromoCourseOut,
    FavoriteCourseItem,
    CourseReviewCreate,
    CourseReviewOut,
    CourseReviewsResponse,
    ReviewOut,
    ReviewStatsOut,
    ReviewCreate,
    ReviewUpdate,
    LanguageLessonOut,
    CourseLessonsResponse,
    LanguageCommentOut,
    UserLogin,
    Token,
    UserOut,
    EgeSubjectCreate,
    EgeSubjectOut,
    EgeLessonCreate,
    EgeLessonOut,
    EgeLessonList,
    TestQuestionCreate,
    EgeTestCreate,
    TestQuestionOut,
    EgeTestOut,
    TestSubmission,
    TestResultCreate,
    TestResultOut,
    TestSubmissionResult,
    LessonViewOut,
    LessonViewCreate,
    ReactionCreate,
    LessonStatsOut,
    ArticleCreate,
    ArticleOut,
    ArticleReactionCreate,
    ArticleStatsOut,
    CommentCreate,
    CommentOut,
    CommentReactionCreate,
    UserOut,
    UserUpdate,
    CourseUnitOut,
    FlashcardDeckOut,
    FlashcardAnswer,
    FlashcardOut,
)
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    get_current_user_optional,
)
from sqlalchemy.orm import selectinload, relationship, backref, declarative_base

from sqlalchemy.exc import IntegrityError

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(title="NextProject Auth API", version="1.0.0", lifespan=lifespan)

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
# backend/main.py — после импортов, перед эндпоинтами


async def try_grant_reward(
    user_id: int,
    reward_type: str,
    context_id: int | None,
    amount: int,
    db: AsyncSession,
) -> bool:
    """
    Выдаёт награду, если ещё не получена.
    Возвращает True если выдана, False если уже была.
    """
    # 1️⃣ Проверяем, не получал ли уже
    check = await db.execute(
        select(UserAchievement).where(
            UserAchievement.user_id == user_id,
            UserAchievement.reward_type == reward_type,
            UserAchievement.context_id == context_id,
        )
    )
    if check.scalar_one_or_none():
        return False

    # 2️⃣ Создаём запись
    db.add(
        UserAchievement(
            user_id=user_id,
            reward_type=reward_type,
            context_id=context_id,
        )
    )

    # 3️⃣ Начисляем токены
    user = await db.get(User, user_id)
    if user:
        user.token_balance += amount

    # 4️⃣ Сохраняем
    await db.commit()
    return True


async def check_progress_milestones(
    user_id: int, course_id: int, percent: float, db: AsyncSession
) -> list[dict]:
    """Проверяет пороги 75% и 90%, выдаёт награды если нужно"""
    rewards = []

    if percent >= 75:
        if await try_grant_reward(user_id, "progress_75", course_id, 200, db):
            rewards.append({"type": "progress_75", "amount": 200})

    if percent >= 90:
        if await try_grant_reward(user_id, "progress_90", course_id, 100, db):
            rewards.append({"type": "progress_90", "amount": 100})

    return rewards


# backend/main.py

from pydantic import BaseModel, Field


class TokenRewardRequest(BaseModel):
    amount: int = Field(..., ge=1, le=1000)
    reason: str = Field(..., max_length=100)


@app.post("/profile/balance/reward")
async def reward_balance(
    request: TokenRewardRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Начислить токены пользователю (для фронтенд-триггеров)"""

    # 🔥 Здесь можно добавить дополнительную валидацию, если нужно
    # Например, проверять reason, чтобы нельзя было накрутить

    current_user.token_balance += request.amount
    await db.commit()

    return {
        "token_balance": current_user.token_balance,
        "rewarded": request.amount,
        "reason": request.reason,
    }


@app.post("/auth/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: AsyncSession = Depends(get_db)):
    existing_email = await db.execute(
        select(User).where(User.email == user_data.email.lower())
    )
    if existing_email.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User already registered")
    existing_user = await db.execute(
        select(User).where(User.username == user_data.username.lower())
    )
    if existing_user.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already taken")
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


# backend/main.py
# backend/main.py


@app.get("/profile/test-stats")
async def get_test_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Получить количество тестов, пройденных на 75%+"""
    count = await db.execute(
        select(func.count(func.distinct(TestResult.test_id))).where(
            TestResult.user_id == current_user.id,
            TestResult.score >= 75,
        )
    )
    return {"tests_passed_75": count.scalar() or 0}


@app.get("/profile/achievements")
async def get_user_achievements(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Получить статистику для расчёта достижений"""

    # 🔹 Тесты, пройденные на 75%+
    tests_75 = await db.execute(
        select(func.count(func.distinct(TestResult.test_id))).where(
            TestResult.user_id == current_user.id,
            TestResult.score >= 75,
        )
    )
    tests_passed_75 = tests_75.scalar() or 0

    # 🔹 Курсы, завершённые на 75%+
    # Вариант А: если у тебя есть поле completion_percent в UserCourseEnrollment
    courses_completed_75 = await db.execute(
        select(func.count()).where(
            UserCourseEnrollment.user_id == current_user.id,
        )
    )
    courses_completed_75 = courses_completed_75.scalar() or 0

    # 🔹 Если поля completion_percent нет — считай через уроки:
    # (раскомментируй этот блок если нужно)

    enrollments = await db.execute(
        select(UserCourseEnrollment).where(
            UserCourseEnrollment.user_id == current_user.id
        )
    )
    user_enrollments = enrollments.scalars().all()

    courses_completed_75 = 0

    for enrollment in user_enrollments:
        # 🔥 Получаем все юниты курса
        course_units = await db.execute(
            select(CourseUnit.id).where(CourseUnit.course_id == enrollment.course_id)
        )
        unit_ids = [row[0] for row in course_units.all()]

        if not unit_ids:
            print(f"⚠️ Course {enrollment.course_id} has no units")
            continue

        # 🔥 Получаем все уроки этих юнитов
        course_lessons = await db.execute(
            select(EgeLesson.id).where(EgeLesson.unit_id.in_(unit_ids))
        )
        lesson_ids = [row[0] for row in course_lessons.all()]

        if not lesson_ids:
            print(f"⚠️ Course {enrollment.course_id} has no lessons")
            continue

        total_lessons = len(lesson_ids)

        # 🔥 Считаем уроки, где пользователь прошёл тест на 75%+
        completed = await db.execute(
            select(func.count(func.distinct(TestResult.test_id))).where(
                TestResult.user_id == current_user.id,
                TestResult.test_id.in_(
                    select(EgeLesson.test_id).where(
                        EgeLesson.id.in_(lesson_ids),
                        EgeLesson.test_id.isnot(None),  # Только уроки с тестами
                    )
                ),
                TestResult.score >= 75,
            )
        )
        completed_count = completed.scalar() or 0

        # 🔥 Рассчитываем процент
        if total_lessons > 0:
            progress = (completed_count / total_lessons) * 100
            print(
                f"🔍 [DEBUG] Course {enrollment.course_id}: {completed_count}/{total_lessons} tests passed = {progress:.1f}%"
            )

            if progress >= 75:
                courses_completed_75 += 1
                print(f"✅ Course {enrollment.course_id} COUNTED as completed")
            else:
                print(
                    f"ℹ️ Course {enrollment.course_id} NOT counted (progress {progress:.1f}% < 75%)"
                )
        else:
            print(f"⚠️ Course {enrollment.course_id} has no lessons with tests")

    print(f"🔍 [DEBUG] FINAL: courses_completed_75 = {courses_completed_75}")
    # 🔹 Купленные товары
    purchased = await db.execute(
        select(func.count()).where(UserInventory.user_id == current_user.id)
    )
    items_purchased = purchased.scalar() or 0

    # 🔹 Кастомный аватар
    has_custom_avatar = bool(
        current_user.avatar_url and current_user.avatar_url != "default_cat.jpg"
    )

    # 🔥 Возвращаем в snake_case (стандарт для бэкенда)
    return {
        "tests_passed_75": tests_passed_75,
        "courses_completed_75": courses_completed_75,
        "items_purchased": items_purchased,
        "has_custom_avatar": has_custom_avatar,
    }


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


@app.delete("/profile/delete")
async def delete_account(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """Удаляет аккаунт текущего пользователя со всеми данными"""

    await db.delete(current_user)
    await db.commit()

    return {"message": "Account deleted successfully"}


@app.get("/auth/me", response_model=UserOut)
async def read_me(current_user: User = Depends(get_current_user)):
    return UserOut(
        id=current_user.id, email=current_user.email, username=current_user.username
    )


# backend/main.py


# backend/main.py — в get_my_profile


@app.get("/profile", response_model=UserOut)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Получить данные текущего пользователя"""

    # 🔥 Предзагружаем экипированную вещь, чтобы избежать ленивой загрузки
    if current_user.equipped_item_id:
        await db.refresh(current_user, attribute_names=["equipped_item"])

    print(
        f"🔍 [DEBUG] get_my_profile: user_id={current_user.id}, equipped_item_id={current_user.equipped_item_id}"
    )

    equipped_item = None
    if current_user.equipped_item_id and current_user.equipped_item:
        equipped_item = {
            "id": current_user.equipped_item.id,
            "name": current_user.equipped_item.name,
            "image": current_user.equipped_item.image,
            "price": current_user.equipped_item.price,
            "description": current_user.equipped_item.description,
        }

    return UserOut(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        avatar_url=current_user.avatar_url or "default_cat.jpg",
        status=current_user.status,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        token_balance=current_user.token_balance,
        about_me=current_user.about_me,
        created_at=current_user.created_at,
        equipped_item=equipped_item,  # 🔥 Возвращаем вещь
    )


# backend/main.py

# backend/main.py — добавь после импортов


# 🔹 Получить список товаров
@app.get("/shop/items", response_model=list[ShopItemOut])
async def get_shop_items(
    current_user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """Получить доступные товары в магазине"""

    items = await db.execute(select(ShopItem).where(ShopItem.is_active == True))
    shop_items = items.scalars().all()

    # Если пользователь авторизован — добавляем флаги owned/equipped
    items_out = []
    if current_user:
        # Загружаем инвентарь и экипированное
        inventory = await db.execute(
            select(UserInventory.item_id).where(
                UserInventory.user_id == current_user.id
            )
        )
        owned_ids = {row[0] for row in inventory.all()}

        equipped_id = current_user.equipped_item_id

        for item in shop_items:
            items_out.append(
                {
                    "id": item.id,
                    "name": item.name,
                    "image": item.image,
                    "price": item.price,
                    "description": item.description,
                    "is_owned": item.id in owned_ids,
                    "is_equipped": item.id == equipped_id,
                }
            )
    else:
        # Для неавторизованных — без флагов
        for item in shop_items:
            items_out.append(
                {
                    "id": item.id,
                    "name": item.name,
                    "image": item.image,
                    "price": item.price,
                    "description": item.description,
                    "is_owned": False,
                    "is_equipped": False,
                }
            )

    return items_out


# 🔹 Купить товар
@app.post("/shop/items/{item_id}/buy")
async def buy_shop_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Купить товар за токены"""

    # Находим товар
    item = await db.get(ShopItem, item_id)
    if not item or not item.is_active:
        raise HTTPException(404, "Item not found")

    # Проверяем, не купил ли уже
    existing = await db.execute(
        select(UserInventory).where(
            UserInventory.user_id == current_user.id,
            UserInventory.item_id == item_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, "You already own this item")

    # Проверяем баланс
    if current_user.token_balance < item.price:
        raise HTTPException(
            400,
            f"Not enough tokens. Need {item.price}, have {current_user.token_balance}",
        )

    # Списываем токены и добавляем в инвентарь
    current_user.token_balance -= item.price
    db.add(UserInventory(user_id=current_user.id, item_id=item_id))
    await db.commit()

    return {
        "message": f"Purchased {item.name}!",
        "remaining_balance": current_user.token_balance,
        "item_id": item_id,
    }


# 🔹 Экипировать/снять вещь
@app.post("/shop/items/{item_id}/equip")
async def equip_shop_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Экипировать купленную вещь (или снять, если item_id=0)"""

    # item_id=0 означает "снять всё"
    if item_id == 0:
        current_user.equipped_item_id = None
        await db.commit()
        return {"message": "Item unequipped", "equipped_item_id": None}

    # Проверяем, что вещь куплена
    owned = await db.execute(
        select(UserInventory).where(
            UserInventory.user_id == current_user.id,
            UserInventory.item_id == item_id,
        )
    )
    if not owned.scalar_one_or_none():
        raise HTTPException(403, "You don't own this item")

    # Экипируем
    current_user.equipped_item_id = item_id
    await db.commit()

    return {
        "message": "Item equipped!",
        "equipped_item_id": item_id,
    }


@app.get("/courses/my", response_model=list[PromoCourseOut])
async def get_my_courses(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    search: str | None = None,
):
    """Получить курсы пользователя: записанные + избранные (не записанные)"""

    # 🔥 1. Загружаем IDs записанных курсов
    enrolled_ids_result = await db.execute(
        select(UserCourseEnrollment.course_id).where(
            UserCourseEnrollment.user_id == current_user.id
        )
    )
    enrolled_ids = {row[0] for row in enrolled_ids_result.all()}

    # 🔥 2. Загружаем IDs избранных курсов
    favorite_ids_result = await db.execute(
        select(UserFavoriteCourse.course_id).where(
            UserFavoriteCourse.user_id == current_user.id
        )
    )
    favorite_ids = {row[0] for row in favorite_ids_result.all()}

    # 🔥 3. Объединяем: записанные ИЛИ избранные
    course_ids = enrolled_ids | favorite_ids

    if not course_ids:
        return []

    # 🔥 4. Загружаем данные курсов
    subjects_result = await db.execute(
        select(EgeSubject).where(EgeSubject.id.in_(course_ids))
    )
    subjects = subjects_result.scalars().all()

    # 🔥 5. Поиск по названию (после загрузки)
    if search:
        subjects = [s for s in subjects if search.lower() in s.title.lower()]

    # 🔥 6. Собираем ответ для каждого курса
    courses_out = []
    for s in subjects:
        # Флаги
        is_enrolled = s.id in enrolled_ids
        is_favorite = s.id in favorite_ids

        # Прогресс (только если записан)
        completion_percent = 0.0
        if is_enrolled:
            completion_percent = await get_course_completion_percent(
                current_user.id, s.id, db
            )

        # Юниты
        units_count = await db.execute(
            select(func.count(CourseUnit.id)).where(CourseUnit.subject_id == s.id)
        )
        total_units = units_count.scalar() or 1

        completed_units = 0
        if is_enrolled and current_user:
            course_lessons = await db.execute(
                select(EgeLesson.id, EgeLesson.unit_id).where(
                    EgeLesson.subject_id == s.id
                )
            )
            lessons_by_unit = {}
            for lesson_id, unit_id in course_lessons.all():
                if unit_id not in lessons_by_unit:
                    lessons_by_unit[unit_id] = []
                lessons_by_unit[unit_id].append(lesson_id)

            for unit_id, lesson_ids in lessons_by_unit.items():
                if not lesson_ids:
                    continue
                completed_lessons = await db.execute(
                    select(func.count(UserCompletedLesson.id)).where(
                        UserCompletedLesson.user_id == current_user.id,
                        UserCompletedLesson.lesson_id.in_(lesson_ids),
                    )
                )
                if completed_lessons.scalar() == len(lesson_ids):
                    completed_units += 1

        # Учителя
        teachers_result = await db.execute(
            select(Teacher)
            .join(CourseTeacher, CourseTeacher.teacher_id == Teacher.id)
            .where(CourseTeacher.course_id == s.id)
        )
        teachers = teachers_result.scalars().all()
        teachers_out = [
            {"id": t.id, "full_name": t.full_name, "image": t.image, "about": t.about}
            for t in teachers
        ]

        courses_out.append(
            {
                "id": s.id,
                "title": s.title,
                "slug": s.slug,
                "description": s.description,
                "image": s.image,
                "category": s.category,
                "about": s.about,
                "duration_minutes": s.duration_minutes,
                "certificate_available": s.certificate_available or False,
                "enrolled_count": 0,
                "rating": None,
                "is_favorite": is_favorite,  # 🔥 Сердечко
                "is_enrolled": is_enrolled,  # 🔥 Записан или нет
                "completion_percent": round(completion_percent, 1),
                "total_units": total_units,
                "completed_units": completed_units,
                "teachers": teachers_out,
            }
        )

    # 🔥 Сортировка: сначала записанные, потом избранные
    courses_out.sort(key=lambda c: (not c["is_enrolled"], c["title"].lower()))

    return courses_out


@app.get("/courses/{slug}/meta")
async def get_course_meta(
    slug: str,
    current_user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    course = await db.execute(select(EgeSubject).where(EgeSubject.slug == slug))
    course = course.scalar_one_or_none()
    if not course:
        raise HTTPException(404, "Course not found")

    # 🔥 Считаем реальное количество юнитов
    units_count = await db.execute(
        select(func.count(CourseUnit.id)).where(CourseUnit.subject_id == course.id)
    )
    total_units = units_count.scalar() or 0

    is_enrolled = False
    completion_percent = 0.0

    if current_user:
        enr = await db.execute(
            select(UserCourseEnrollment).where(
                UserCourseEnrollment.user_id == current_user.id,
                UserCourseEnrollment.course_id == course.id,
            )
        )
        is_enrolled = enr.scalar_one_or_none() is not None

        completion_percent = await get_course_completion_percent(
            current_user.id, course.id, db
        )

    return {
        "title": course.title,
        "slug": course.slug,
        "is_enrolled": is_enrolled,
        "completion_percent": round(completion_percent, 1),
        "total_units": total_units,  # 🔥 Новое поле
    }


@app.patch("/profile/settings", response_model=UserOut)
async def update_profile_settings(
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.username and data.username != current_user.username:
        existing = await db.execute(
            select(User).where(User.username == data.username.lower())
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Username already taken")
        current_user.username = data.username.lower()

    ALLOWED_AVATARS = {
        "default_cat.jpg",
        "orange_cat.jpg",
        "black_cat.jpg",
        "gray_cat.jpg",
        "brown_cat.jpg",
        "light_gray_cat.jpg",
        "white_cat.jpg",
    }

    if data.avatar_url is not None:
        if data.avatar_url not in ALLOWED_AVATARS:
            raise HTTPException(status_code=400, detail="Invalid avatar")
        current_user.avatar_url = data.avatar_url
    if data.about_me is not None:
        current_user.about_me = data.about_me.strip() if data.about_me.strip() else None

    if data.status is not None:
        current_user.status = data.status

    current_user.updated_at = datetime.now()
    await db.commit()
    await db.refresh(current_user)
    if data.first_name is not None:
        current_user.first_name = (
            data.first_name.strip() if data.first_name.strip() else None
        )
    if data.last_name is not None:
        current_user.last_name = (
            data.last_name.strip() if data.last_name.strip() else None
        )
    current_user.updated_at = datetime.now()
    await db.commit()
    await db.refresh(current_user)
    return UserOut(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        avatar_url=current_user.avatar_url,
        token_balance=current_user.token_balance,
        about_me=current_user.about_me,
        status=current_user.status,
        created_at=current_user.created_at,
    )


# backend/main.py — ДОБАВЬ ЭТИ ЭНДПОИНТЫ
@app.delete("/courses/{slug}/unenroll")
async def unenroll_from_course(
    slug: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Отменить запись на курс"""

    course = await db.execute(select(EgeSubject).where(EgeSubject.slug == slug))
    course = course.scalar_one_or_none()
    if not course:
        raise HTTPException(404, "Course not found")
    # В начале unenroll_from_course:
    print(f"🔴 [UNENROLL] Called for user {current_user.id}, slug={slug}")
    enrollment = await db.execute(
        select(UserCourseEnrollment).where(
            UserCourseEnrollment.user_id == current_user.id,
            UserCourseEnrollment.course_id == course.id,
        )
    )
    item = enrollment.scalar_one_or_none()

    if not item:
        raise HTTPException(400, "Not enrolled in this course")

    await db.delete(item)
    await db.commit()

    return {"message": "Successfully unenrolled"}


# 🔹 Получить список избранного
@app.get("/courses/favorites", response_model=list[FavoriteCourseItem])
async def get_user_favorites(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(
            UserFavoriteCourse.id,
            UserFavoriteCourse.course_id,
            EgeSubject.title.label("course_title"),
            EgeSubject.slug.label("course_slug"),
            EgeSubject.cover_image.label("course_cover"),
            UserFavoriteCourse.created_at,
        )
        .join(EgeSubject, EgeSubject.id == UserFavoriteCourse.course_id)
        .where(UserFavoriteCourse.user_id == current_user.id)
        .order_by(UserFavoriteCourse.created_at.desc())
    )
    return [
        FavoriteCourseItem(
            id=row[0],
            course_id=row[1],
            course_title=row[2],
            course_slug=row[3],
            course_cover=row[4],
            created_at=row[5],
        )
        for row in result.all()
    ]


# 🔹 Добавить в избранное
@app.post("/courses/{course_id}/favorite")
async def add_to_favorites(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    course = await db.get(EgeSubject, course_id)
    if not course:
        raise HTTPException(404, "Course not found")

    existing = await db.execute(
        select(UserFavoriteCourse).where(
            UserFavoriteCourse.user_id == current_user.id,
            UserFavoriteCourse.course_id == course_id,
        )
    )
    if existing.scalar_one_or_none():
        return {"message": "Already in favorites"}

    db.add(UserFavoriteCourse(user_id=current_user.id, course_id=course_id))
    await db.commit()
    return {"message": "Added to favorites"}


# 🔹 Убрать из избранного
@app.delete("/courses/{course_id}/favorite")
async def remove_from_favorites(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    fav = await db.execute(
        select(UserFavoriteCourse).where(
            UserFavoriteCourse.user_id == current_user.id,
            UserFavoriteCourse.course_id == course_id,
        )
    )
    item = fav.scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Not in favorites")

    await db.delete(item)
    await db.commit()
    return {"message": "Removed from favorites"}


# backend/main.py
# backend/main.py — в начало файла, после импортов


async def get_course_completion_percent(
    user_id: int,
    course_id: int,
    db: AsyncSession,
) -> float:
    """
    Возвращает процент прохождения курса:
    - Если есть юниты: (пройдено юнитов / всего юнитов) * 100
    - Если нет юнитов: (пройдено уроков / всего уроков) * 100
    """
    # Считаем всего юнитов в курсе
    total_units = await db.execute(
        select(func.count(CourseUnit.id)).where(CourseUnit.subject_id == course_id)
    )
    total_units = total_units.scalar() or 0

    if total_units > 0:
        # 🔹 Есть юниты: считаем пройденные юниты
        # Юнит считается пройденным, если ВСЕ уроки в нём завершены
        units = await db.execute(
            select(CourseUnit.id).where(CourseUnit.subject_id == course_id)
        )
        unit_ids = [row[0] for row in units.all()]

        completed_units = 0
        for uid in unit_ids:
            # Считаем уроки в юните
            lessons_in_unit = await db.execute(
                select(func.count(EgeLesson.id)).where(EgeLesson.unit_id == uid)
            )
            total_lessons = lessons_in_unit.scalar() or 0

            if total_lessons == 0:
                continue  # Пустой юнит не считаем

            # Считаем завершённые уроки в юните
            completed = await db.execute(
                select(func.count(UserCompletedLesson.id)).where(
                    UserCompletedLesson.user_id == user_id,
                    UserCompletedLesson.lesson_id.in_(
                        select(EgeLesson.id).where(EgeLesson.unit_id == uid)
                    ),
                )
            )
            completed_count = completed.scalar() or 0

            # Юнит пройден, если все уроки завершены
            if completed_count >= total_lessons:
                completed_units += 1

        return (completed_units / total_units) * 100

    else:
        # 🔹 Нет юнитов: считаем по урокам напрямую
        total_lessons = await db.execute(
            select(func.count(EgeLesson.id)).where(EgeLesson.subject_id == course_id)
        )
        total_lessons = total_lessons.scalar() or 0

        if total_lessons == 0:
            return 0.0

        completed = await db.execute(
            select(func.count(UserCompletedLesson.id)).where(
                UserCompletedLesson.user_id == user_id,
                UserCompletedLesson.lesson_id.in_(
                    select(EgeLesson.id).where(EgeLesson.subject_id == course_id)
                ),
            )
        )
        completed_count = completed.scalar() or 0

        return (completed_count / total_lessons) * 100


@app.get("/courses/promo/{slug}", response_model=PromoCourseOut)
async def get_course_promo(
    slug: str,
    current_user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """Возвращает полную информацию о курсе для промо-страницы"""

    # 1. Находим курс по slug
    course = await db.execute(select(EgeSubject).where(EgeSubject.slug == slug))
    course = course.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # 2. Считаем количество записанных студентов
    enrolled_count = await db.execute(
        select(func.count(UserCourseEnrollment.user_id)).where(
            UserCourseEnrollment.course_id == course.id
        )
    )
    enrolled_count = enrolled_count.scalar() or 0

    # 3. Считаем средний рейтинг
    avg_rating = await db.execute(
        select(func.avg(CourseReview.rating)).where(CourseReview.course_id == course.id)
    )
    rating = avg_rating.scalar()
    rating = round(rating, 1) if rating else None

    # 4. Проверяем, в избранном ли курс (если пользователь авторизован)
    is_favorite = False
    if current_user:
        fav = await db.execute(
            select(UserFavoriteCourse).where(
                UserFavoriteCourse.user_id == current_user.id,
                UserFavoriteCourse.course_id == course.id,
            )
        )
        is_favorite = fav.scalar_one_or_none() is not None
        teachers_result = await db.execute(
            select(Teacher)
            .join(CourseTeacher, CourseTeacher.teacher_id == Teacher.id)
            .where(CourseTeacher.course_id == course.id)
        )
    teachers = teachers_result.scalars().all()

    teachers_out = [
        TeacherOut(
            id=t.id,
            full_name=t.full_name,
            image=t.image,
            about=t.about,
        )
        for t in teachers
    ]

    # 5. Проверяем, записан ли пользователь на курс
    is_enrolled = False
    if current_user:
        enrollment = await db.execute(
            select(UserCourseEnrollment).where(
                UserCourseEnrollment.user_id == current_user.id,
                UserCourseEnrollment.course_id == course.id,
            )
        )
        is_enrolled = enrollment.scalar_one_or_none() is not None
    completion_percent = 0.0
    if current_user:
        completion_percent = await get_course_completion_percent(
            current_user.id, course.id, db
        )

    # 6. Возвращаем данные
    return PromoCourseOut(
        id=course.id,
        title=course.title,
        slug=course.slug,
        description=course.description,
        image=course.image,
        category=course.category,
        duration_minutes=course.duration_minutes,
        certificate_available=course.certificate_available or False,
        enrolled_count=enrolled_count,
        about=course.about,
        rating=rating,
        is_favorite=is_favorite,
        teachers=teachers_out,
        completion_percent=round(completion_percent, 1),
        is_enrolled=is_enrolled,
    )


@app.get("/teachers", response_model=list[TeacherOut])
async def get_teachers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Teacher).order_by(Teacher.full_name))
    teachers = result.scalars().all()
    return [
        TeacherOut(id=t.id, full_name=t.full_name, image=t.image, about=t.about)
        for t in teachers
    ]


# backend/main.py — в create_course_review


# backend/main.py

# ============================================================================
# 🔥 ОТЗЫВЫ: ПОЛНЫЙ НАБОР ЭНДПОИНТОВ
# ============================================================================


# backend/main.py


@app.get("/courses/{course_id}/reviews")
async def get_course_reviews(
    course_id: int,
    current_user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """Получить отзывы курса с реакциями и экипировкой авторов"""

    # 🔥 Загружаем отзывы с предзагрузкой equipped_item
    reviews_result = await db.execute(
        select(
            CourseReview,
            User.username,
            User.avatar_url,
            User.equipped_item_id,  # 🔥 Добавляем для проверки
            func.count(case((ReviewReaction.reaction_type == "like", 1))).label(
                "likes"
            ),
            func.count(case((ReviewReaction.reaction_type == "dislike", 1))).label(
                "dislikes"
            ),
        )
        .join(User, User.id == CourseReview.user_id)
        .outerjoin(ReviewReaction, ReviewReaction.review_id == CourseReview.id)
        .where(CourseReview.course_id == course_id)
        .group_by(CourseReview.id, User.id)
        .order_by(CourseReview.created_at.desc())
        # 🔥 Предзагружаем equipped_item, чтобы избежать ленивой загрузки:
        .options(selectinload(CourseReview.user).selectinload(User.equipped_item))
    )

    reviews_out = []
    for row in reviews_result.all():
        review, username, avatar, equipped_item_id, likes, dislikes = row

        # 🔥 Формируем equipped_item для ответа
        equipped_item = None
        if (
            equipped_item_id
            and hasattr(review, "user")
            and review.user
            and review.user.equipped_item
        ):
            equipped_item = {
                "id": review.user.equipped_item.id,
                "name": review.user.equipped_item.name,
                "image": review.user.equipped_item.image,
                "price": review.user.equipped_item.price,
                "description": review.user.equipped_item.description,
            }

        # Реакция текущего пользователя
        user_reaction = None
        if current_user:
            ur = await db.execute(
                select(ReviewReaction.reaction_type).where(
                    ReviewReaction.review_id == review.id,
                    ReviewReaction.user_id == current_user.id,
                )
            )
            user_reaction = ur.scalar_one_or_none()

        reviews_out.append(
            {
                "id": review.id,
                "user_id": review.user_id,
                "username": username,
                "avatar_url": avatar,
                "rating": review.rating,
                "comment": review.comment,
                "created_at": review.created_at,
                "updated_at": review.updated_at,
                "likes": likes,
                "dislikes": dislikes,
                "user_reaction": user_reaction,
                # 🔥 Добавляем экипировку:
                "equipped_item": equipped_item,
            }
        )

    # Статистика
    avg = await db.execute(
        select(func.avg(CourseReview.rating)).where(CourseReview.course_id == course_id)
    )
    total = await db.execute(
        select(func.count(CourseReview.id)).where(CourseReview.course_id == course_id)
    )

    # Отзыв текущего пользователя
    user_review = None
    if current_user:
        ur = await db.execute(
            select(CourseReview).where(
                CourseReview.course_id == course_id,
                CourseReview.user_id == current_user.id,
            )
        )
        rev = ur.scalar_one_or_none()
        if rev:
            reactions = await db.execute(
                select(
                    func.count(case((ReviewReaction.reaction_type == "like", 1))).label(
                        "likes"
                    ),
                    func.count(
                        case((ReviewReaction.reaction_type == "dislike", 1))
                    ).label("dislikes"),
                ).where(ReviewReaction.review_id == rev.id)
            )
            likes, dislikes = reactions.first() or (0, 0)

            user_reaction = await db.execute(
                select(ReviewReaction.reaction_type).where(
                    ReviewReaction.review_id == rev.id,
                    ReviewReaction.user_id == current_user.id,
                )
            )

            # 🔥 Экипировка для своего отзыва
            my_equipped_item = None
            if current_user.equipped_item_id and current_user.equipped_item:
                my_equipped_item = {
                    "id": current_user.equipped_item.id,
                    "name": current_user.equipped_item.name,
                    "image": current_user.equipped_item.image,
                    "price": current_user.equipped_item.price,
                    "description": current_user.equipped_item.description,
                }

            user_review = {
                "id": rev.id,
                "user_id": rev.user_id,
                "username": current_user.username,
                "avatar_url": current_user.avatar_url,
                "rating": rev.rating,
                "comment": rev.comment,
                "created_at": rev.created_at,
                "updated_at": rev.updated_at,
                "likes": likes or 0,
                "dislikes": dislikes or 0,
                "user_reaction": user_reaction.scalar_one_or_none(),
                "equipped_item": my_equipped_item,  # 🔥 Добавляем
            }

    return {
        "reviews": reviews_out,
        "stats": {
            "average_rating": round(avg.scalar() or 0, 1),
            "total_reviews": total.scalar() or 0,
            "user_review": user_review,
        },
    }


@app.post("/courses/{course_id}/reviews", response_model=ReviewOut, status_code=201)
async def create_course_review(
    course_id: int,
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Оставить отзыв (с проверкой прогресса ≥75%)"""

    course = await db.get(EgeSubject, course_id)
    if not course:
        raise HTTPException(404, "Course not found")

    # 🔥 Проверка: записан ли пользователь
    enrollment = await db.execute(
        select(UserCourseEnrollment).where(
            UserCourseEnrollment.user_id == current_user.id,
            UserCourseEnrollment.course_id == course_id,
        )
    )
    if not enrollment.scalar_one_or_none():
        raise HTTPException(403, "You must be enrolled in the course to leave a review")

    # 🔥 Проверка прогресса ≥75%
    completion = await get_course_completion_percent(current_user.id, course_id, db)
    if completion < 75:
        raise HTTPException(
            403,
            f"Complete at least 75% of the course to leave a review. Your progress: {completion:.1f}%",
        )

    # Проверка: уже есть отзыв
    existing = await db.execute(
        select(CourseReview).where(
            CourseReview.user_id == current_user.id,
            CourseReview.course_id == course_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, "You already reviewed this course")

    # Создаём отзыв
    new_review = CourseReview(
        user_id=current_user.id,
        course_id=course_id,
        rating=review_data.rating,
        comment=review_data.comment.strip(),
    )
    db.add(new_review)
    await db.commit()
    await db.refresh(new_review)
    await try_grant_reward(
        current_user.id,
        "review_written",
        course_id,  # контекст: конкретный курс
        50,
        db,
    )

    return ReviewOut(
        id=new_review.id,
        user_id=new_review.user_id,
        username=current_user.username,
        avatar_url=current_user.avatar_url,
        rating=new_review.rating,
        comment=new_review.comment,
        created_at=new_review.created_at,
        updated_at=new_review.updated_at,
        likes=0,
        dislikes=0,
        user_reaction=None,
    )


# backend/main.py


# backend/main.py


@app.get(
    "/profile/public/{user_id}",
)
async def get_public_profile(
    user_id: int,
    current_user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """Получить публичный профиль пользователя"""

    # Находим пользователя
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")

    # 🔥 Находим пройденные курсы (≥90% completion)
    # Получаем все курсы, на которые записан пользователь
    enrolled_courses = await db.execute(
        select(
            EgeSubject.id,
            EgeSubject.title,
            EgeSubject.slug,
            EgeSubject.image,
            func.count(UserCompletedLesson.id).label("completed_lessons"),
        )
        .join(UserCourseEnrollment, UserCourseEnrollment.course_id == EgeSubject.id)
        .join(EgeLesson, EgeLesson.subject_id == EgeSubject.id)
        .outerjoin(
            UserCompletedLesson,
            (UserCompletedLesson.lesson_id == EgeLesson.id)
            & (UserCompletedLesson.user_id == user_id),
        )
        .where(UserCourseEnrollment.user_id == user_id)
        .group_by(EgeSubject.id, EgeSubject.title, EgeSubject.slug, EgeSubject.image)
    )

    completed_courses = []
    for row in enrolled_courses.all():
        # Считаем всего уроков в курсе
        total_lessons = await db.execute(
            select(func.count(EgeLesson.id)).where(EgeLesson.subject_id == row.id)
        )
        total = total_lessons.scalar() or 0

        if total > 0:
            completion_percent = (row.completed_lessons / total) * 100
            if completion_percent >= 90:
                completed_courses.append(
                    {
                        "id": row.id,
                        "title": row.title,
                        "slug": row.slug,
                        "image": row.image,
                        "completion_percent": round(completion_percent, 1),
                    }
                )
    equipped_item = None
    if user.equipped_item_id:
        equipped = await db.get(ShopItem, user.equipped_item_id)
        if equipped:
            equipped_item = {
                "id": equipped.id,
                "name": equipped.name,
                "image": equipped.image,
                "price": equipped.price,
                "description": equipped.description,
            }
    # 🔥 ОТЛАДКА: смотрим, что реально возвращается
    print(f"🔍 [DEBUG] Returning profile for user {user_id}:")
    print(f"   status={user.status!r}")
    print(f"   about_me={user.about_me!r}")
    print(f"   created_at={user.created_at.isoformat() if user.created_at else None!r}")

    return {
        "id": user.id,
        "username": user.username,
        "avatar_url": user.avatar_url,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "equipped_item": equipped_item,
        "status": user.status,  # 🔥 Прямо из модели
        "about_me": user.about_me,  # 🔥 Прямо из модели
        "created_at": user.created_at.isoformat()
        if user.created_at
        else None,  # 🔥 ISO-строка
        "token_balance": user.token_balance,
        "completed_courses": completed_courses,
    }


@app.put("/reviews/{review_id}", response_model=ReviewOut)
async def update_review(
    review_id: int,
    review_data: ReviewUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Редактировать свой отзыв"""

    review = await db.get(CourseReview, review_id)
    if not review:
        raise HTTPException(404, "Review not found")

    # 🔥 Только автор может редактировать
    if review.user_id != current_user.id:
        raise HTTPException(403, "You can only edit your own review")

    if review_data.rating is not None:
        review.rating = review_data.rating
    if review_data.comment is not None:
        review.comment = review_data.comment.strip()

    review.updated_at = func.now()
    await db.commit()
    await db.refresh(review)

    return ReviewOut(
        id=review.id,
        user_id=review.user_id,
        username=current_user.username,
        avatar_url=current_user.avatar_url,
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at,
        updated_at=review.updated_at,
        likes=0,
        dislikes=0,
        user_reaction=None,
    )


@app.delete("/reviews/{review_id}")
async def delete_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Удалить свой отзыв"""

    review = await db.get(CourseReview, review_id)
    if not review:
        raise HTTPException(404, "Review not found")

    # 🔥 Только автор может удалить
    if review.user_id != current_user.id:
        raise HTTPException(403, "You can only delete your own review")

    await db.delete(review)
    await db.commit()

    return {"message": "Review deleted"}


@app.post("/reviews/{review_id}/reaction")
async def react_to_review(
    review_id: int,
    reaction: Literal["like", "dislike"] = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Лайкнуть или дизлайкнуть отзыв"""

    review = await db.get(CourseReview, review_id)
    if not review:
        raise HTTPException(404, "Review not found")

    # Проверка: уже есть реакция
    existing = await db.execute(
        select(ReviewReaction).where(
            ReviewReaction.user_id == current_user.id,
            ReviewReaction.review_id == review_id,
        )
    )

    if existing.scalar_one_or_none():
        # Обновляем реакцию
        await db.execute(
            update(ReviewReaction)
            .where(
                ReviewReaction.user_id == current_user.id,
                ReviewReaction.review_id == review_id,
            )
            .values(reaction_type=reaction)
        )
    else:
        # Создаём новую
        db.add(
            ReviewReaction(
                user_id=current_user.id, review_id=review_id, reaction_type=reaction
            )
        )

    await db.commit()

    # Возвращаем обновлённые счётчики
    counts = await db.execute(
        select(
            func.count(case((ReviewReaction.reaction_type == "like", 1))),
            func.count(case((ReviewReaction.reaction_type == "dislike", 1))),
        ).where(ReviewReaction.review_id == review_id)
    )
    likes, dislikes = counts.first()

    return {"likes": likes or 0, "dislikes": dislikes or 0}


@app.delete("/reviews/{review_id}/reaction")
async def remove_reaction(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Убрать свою реакцию с отзыва"""

    reaction = await db.execute(
        select(ReviewReaction).where(
            ReviewReaction.user_id == current_user.id,
            ReviewReaction.review_id == review_id,
        )
    )
    item = reaction.scalar_one_or_none()

    if not item:
        raise HTTPException(404, "Reaction not found")

    await db.delete(item)
    await db.commit()

    # Возвращаем обновлённые счётчики
    counts = await db.execute(
        select(
            func.count(case((ReviewReaction.reaction_type == "like", 1))),
            func.count(case((ReviewReaction.reaction_type == "dislike", 1))),
        ).where(ReviewReaction.review_id == review_id)
    )
    likes, dislikes = counts.first()

    return {"likes": likes or 0, "dislikes": dislikes or 0}


@app.post("/flashcards/{card_id}/answer", response_model=dict)
async def answer_flashcard(
    card_id: int,
    answer: FlashcardAnswer,  # { rating: "again" | "hard" | "good" | "easy" }
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    card = await db.get(Flashcard, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    progress = await db.execute(
        select(FlashcardProgress).where(
            FlashcardProgress.user_id == current_user.id,
            FlashcardProgress.card_id == card_id,
        )
    )
    progress = progress.scalar_one_or_none()

    if not progress:
        progress = FlashcardProgress(
            user_id=current_user.id,
            card_id=card_id,
            next_review=date.today(),
            interval_days=0,
            ease_factor=2.5,
            repetitions=0,
            times_seen=0,
            times_correct=0,
        )
        db.add(progress)

    interval_days = progress.interval_days if progress.interval_days is not None else 0
    ease_factor = progress.ease_factor if progress.ease_factor is not None else 2.5
    repetitions = progress.repetitions if progress.repetitions is not None else 0

    rating = answer.rating
    today = date.today()

    if rating == "again":
        new_repetitions = 0
        new_interval = 0
        new_ease = max(1.3, ease_factor - 0.2)
        next_review = today

    elif rating == "hard":
        if repetitions == 0:
            new_interval = 1
        else:
            new_interval = max(1, int(interval_days * 1.2))
        new_ease = max(1.3, ease_factor - 0.15)
        new_repetitions = max(0, repetitions - 1)
        next_review = today + timedelta(days=new_interval)

    elif rating == "good":
        if repetitions == 0:
            new_interval = 1
        elif repetitions == 1:
            new_interval = 3
        else:
            new_interval = int(interval_days * ease_factor)
        new_repetitions = repetitions + 1
        new_ease = ease_factor
        next_review = today + timedelta(days=new_interval)

    elif rating == "easy":
        if repetitions == 0:
            new_interval = 3
        elif repetitions == 1:
            new_interval = 7
        else:
            new_interval = int(interval_days * ease_factor * 1.3)
        new_repetitions = repetitions + 1
        new_ease = min(3.0, ease_factor + 0.1)
        next_review = today + timedelta(days=new_interval)

    else:
        new_interval = 1
        new_repetitions = repetitions
        new_ease = ease_factor
        next_review = today

    progress.interval_days = new_interval
    progress.ease_factor = new_ease
    progress.repetitions = new_repetitions
    progress.next_review = next_review

    progress.times_seen = (progress.times_seen or 0) + 1
    if rating in ("good", "easy"):
        progress.times_correct = (progress.times_correct or 0) + 1
    progress.last_answered = datetime.now(timezone.utc)

    await db.commit()

    return {
        "card_id": card_id,
        "rating": rating,
        "next_review": progress.next_review.isoformat()
        if progress.next_review
        else None,
        "interval_days": progress.interval_days,
        "repetitions": progress.repetitions,
        "message": "Answer saved",
    }


# backend/main.py


# 🔹 Записаться на курс (по slug, а не по id!)
@app.post("/courses/{slug}/enroll")
async def enroll_in_course(
    slug: str,  # ← Принимаем slug!
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Находим курс по slug
    course = await db.execute(select(EgeSubject).where(EgeSubject.slug == slug))
    course = course.scalar_one_or_none()
    if not course:
        raise HTTPException(404, "Course not found")

    # Проверка: не записан ли уже
    existing = await db.execute(
        select(UserCourseEnrollment).where(
            UserCourseEnrollment.user_id == current_user.id,
            UserCourseEnrollment.course_id == course.id,
        )
    )
    if existing.scalar_one_or_none():
        return {"message": "Already enrolled"}

    db.add(UserCourseEnrollment(user_id=current_user.id, course_id=course.id))
    await db.commit()
    rewarded = await try_grant_reward(
        current_user.id,
        "first_enrollment",
        None,  # глобальная награда
        20,
        db,
    )
    return {
        "message": "Enrolled successfully",
        "reward_granted": rewarded,  # 🔥 Флаг для фронтенда
    }


# backend/main.py


@app.get("/lessons/{lesson_id}/flashcards", response_model=FlashcardDeckOut)
async def get_lesson_flashcards(
    lesson_id: int,
    current_user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    deck = await db.execute(
        select(FlashcardDeck)
        .where(FlashcardDeck.lesson_id == lesson_id)
        .options(selectinload(FlashcardDeck.cards))
    )
    deck = deck.scalar_one_or_none()

    if not deck:
        raise HTTPException(status_code=404, detail="No flashcards for this lesson")

    cards_out = []
    due_count = new_count = mastered_count = 0

    if current_user:
        today = date.today()

        for card in deck.cards:
            progress = await db.execute(
                select(FlashcardProgress).where(
                    FlashcardProgress.user_id == current_user.id,
                    FlashcardProgress.card_id == card.id,
                )
            )
            progress = progress.scalar_one_or_none()

            if not progress:
                new_count += 1
                card_data = card
            elif progress.next_review and progress.next_review <= today:
                due_count += 1
                card_data = card
            elif progress.repetitions >= 5:
                mastered_count += 1
                card_data = None
            else:
                card_data = None

            if card_data:
                cards_out.append(
                    {
                        "id": card.id,
                        "front": card.front,
                        "back": card.back,
                        "hint": card.hint,
                        "example": card.example,
                        "user_progress": {
                            "next_review": progress.next_review.isoformat()
                            if progress and progress.next_review
                            else None,
                            "interval_days": progress.interval_days if progress else 0,
                            "ease_factor": progress.ease_factor if progress else 2.5,
                            "repetitions": progress.repetitions if progress else 0,
                        }
                        if progress
                        else None,
                    }
                )
    else:
        cards_out = [
            {
                "id": c.id,
                "front": c.front,
                "back": c.back,
                "hint": c.hint,
                "example": c.example,
                "user_progress": None,
            }
            for c in deck.cards
        ]
        new_count = len(cards_out)

    return {
        "id": deck.id,
        "title": deck.title,
        "description": deck.description,
        "lesson_id": deck.lesson_id,
        "card_count": len(deck.cards),
        "cards": cards_out,
        "due_count": due_count,
        "new_count": new_count,
        "mastered_count": mastered_count,
    }


@app.get("/lessons/{lesson_id}/flashcards/stats", response_model=dict)
async def get_flashcard_stats(
    lesson_id: int,
    current_user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    deck = await db.execute(
        select(FlashcardDeck).where(FlashcardDeck.lesson_id == lesson_id)
    )
    deck = deck.scalar_one_or_none()

    if not deck:
        return {"has_deck": False}

    if not current_user:
        return {
            "has_deck": True,
            "deck_id": deck.id,
            "title": deck.title,
            "total_cards": 0,
            "due_count": 0,
            "message": "Войдите, чтобы видеть прогресс",
        }

    today = date.today()

    all_cards = await db.execute(
        select(Flashcard.id).where(Flashcard.deck_id == deck.id)
    )
    all_card_ids = [r[0] for r in all_cards.all()]

    if not all_card_ids:
        return {
            "has_deck": True,
            "deck_id": deck.id,
            "title": deck.title,
            "total_cards": 0,
            "due_count": 0,
            "new_count": 0,
            "mastered_count": 0,
            "ready_to_study": False,
            "last_reviewed": None,
        }

    progress_data = await db.execute(
        select(
            FlashcardProgress.next_review,
            FlashcardProgress.repetitions,
            FlashcardProgress.last_answered,
        ).where(
            FlashcardProgress.user_id == current_user.id,
            FlashcardProgress.card_id.in_(all_card_ids),
        )
    )

    due_count = new_count = mastered_count = 0
    last_reviewed = None

    for next_review, repetitions, last_answered in progress_data.all():
        if last_answered and (last_reviewed is None or last_answered > last_reviewed):
            last_reviewed = last_answered

        if repetitions is not None and repetitions >= 5:
            mastered_count += 1
        elif next_review is None or next_review <= today:
            due_count += 1

    new_count = len(all_card_ids) - due_count - mastered_count

    return {
        "has_deck": True,
        "deck_id": deck.id,
        "title": deck.title,
        "total_cards": len(all_card_ids),
        "due_count": due_count,
        "new_count": new_count,
        "mastered_count": mastered_count,
        "ready_to_study": due_count + new_count > 0,
        "last_reviewed": last_reviewed.isoformat() if last_reviewed else None,
    }


@app.get("/languages", response_model=list[dict])
async def get_all_languages(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LanguageSubject).order_by(LanguageSubject.title))
    return [
        {"id": s.id, "title": s.title, "slug": s.slug, "description": s.description}
        for s in result.scalars().all()
    ]


@app.get("/languages/{language}", response_model=list[dict])
async def get_language_levels(language: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(LanguageLevel)
        .join(LanguageSubject)
        .where(LanguageSubject.slug == language)
        .order_by(LanguageLevel.order_index)
    )
    return [
        {"id": l.id, "title": l.title, "slug": l.slug, "description": l.description}
        for l in result.scalars().all()
    ]


@app.get("/languages/{language}/{level}", response_model=list[dict])
async def get_level_categories(
    language: str, level: str, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(LanguageCategory)
        .join(LanguageLevel)
        .join(LanguageSubject)
        .where(LanguageSubject.slug == language, LanguageLevel.slug == level)
        .order_by(LanguageCategory.order_index)
    )
    return [
        {"id": c.id, "title": c.title, "slug": c.slug, "description": c.description}
        for c in result.scalars().all()
    ]


@app.get(
    "/languages/{language}/{level}/{category}", response_model=list[LanguageLessonOut]
)
async def get_category_lessons(
    language: str, level: str, category: str, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(LanguageLesson, LanguageCategory, LanguageLevel, LanguageSubject)
        .join(LanguageCategory, LanguageLesson.category_id == LanguageCategory.id)
        .join(LanguageLevel, LanguageCategory.level_id == LanguageLevel.id)
        .join(LanguageSubject, LanguageLevel.subject_id == LanguageSubject.id)
        .where(
            LanguageSubject.slug == language,
            LanguageLevel.slug == level,
            LanguageCategory.slug == category,
        )
        .order_by(LanguageLesson.order_index)
    )

    lessons_out = []
    for lesson, cat, lvl, subj in result.all():
        lessons_out.append(
            LanguageLessonOut(
                id=lesson.id,
                title=lesson.title,
                slug=lesson.slug,
                description=lesson.description,
                content=lesson.content,
                time_minutes=lesson.time_minutes,
                category_slug=cat.slug,
                level_slug=lvl.slug,
                subject_slug=subj.slug,
            )
        )
    return lessons_out


@app.get(
    "/languages/{language}/{level}/{category}/{lesson}",
    response_model=LanguageLessonOut,
)
async def get_language_lesson(
    language: str,
    level: str,
    category: str,
    lesson: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LanguageLesson, LanguageCategory, LanguageLevel, LanguageSubject)
        .join(LanguageCategory, LanguageLesson.category_id == LanguageCategory.id)
        .join(LanguageLevel, LanguageCategory.level_id == LanguageLevel.id)
        .join(LanguageSubject, LanguageLevel.subject_id == LanguageSubject.id)
        .where(
            LanguageSubject.slug == language,
            LanguageLevel.slug == level,
            LanguageCategory.slug == category,
            LanguageLesson.slug == lesson,
        )
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Lesson not found")

    lesson_obj, cat, lvl, subj = row
    return LanguageLessonOut(
        id=lesson_obj.id,
        title=lesson_obj.title,
        slug=lesson_obj.slug,
        description=lesson_obj.description,
        content=lesson_obj.content,
        time_minutes=lesson_obj.time_minutes,
        category_slug=cat.slug,
        level_slug=lvl.slug,
        subject_slug=subj.slug,
    )


from sqlalchemy.dialects.postgresql import insert as pg_insert


@app.post("/languages/lessons/{lesson_id}/view")
async def record_language_lesson_view(
    lesson_id: int,
    request: Request,
    current_user: User | None = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        lesson = await db.get(LanguageLesson, lesson_id)
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")

        stmt = pg_insert(LanguageLessonView).values(
            lesson_id=lesson_id,
            user_id=current_user.id if current_user else None,
            ip_address=request.client.host if request.client else None,
        )

        if current_user:
            stmt = stmt.on_conflict_do_nothing(index_elements=["lesson_id", "user_id"])
        else:
            stmt = stmt.on_conflict_do_nothing(
                index_elements=["lesson_id", "ip_address"]
            )

        await db.execute(stmt)
        await db.commit()

        return {"message": "View recorded", "lesson_id": lesson_id}

    except Exception as e:
        import traceback

        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


@app.get("/languages/lessons/{lesson_id}/views")
async def get_language_lesson_views(lesson_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(func.count(func.distinct(LanguageLessonView.user_id))).where(
            LanguageLessonView.lesson_id == lesson_id,
            LanguageLessonView.user_id.isnot(None),
        )
    )
    user_views = result.scalar_one_or_none() or 0

    return {"view_count": user_views}


@app.post("/languages/lessons/{lesson_id}/comments", response_model=LanguageCommentOut)
async def create_language_comment(
    lesson_id: int,
    comment_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        lesson = await db.get(LanguageLesson, lesson_id)
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")

        new_comment = LanguageComment(
            lesson_id=lesson_id,
            user_id=current_user.id,
            content=comment_data["content"].strip(),
            parent_id=comment_data.get("parent_id"),
        )
        db.add(new_comment)

        await db.commit()
        await db.refresh(new_comment)

        check_stmt = select(LanguageComment).where(LanguageComment.id == new_comment.id)
        check_result = await db.execute(check_stmt)
        saved = check_result.scalar_one_or_none()

        count_stmt = select(func.count(LanguageComment.id)).where(
            LanguageComment.lesson_id == lesson_id
        )
        count_result = await db.execute(count_stmt)
        total = count_result.scalar()

        root_stmt = select(func.count(LanguageComment.id)).where(
            LanguageComment.lesson_id == lesson_id, LanguageComment.parent_id.is_(None)
        )
        root_result = await db.execute(root_stmt)
        root_count = root_result.scalar()

        if new_comment.user is None and current_user:
            new_comment.user = current_user

        return {
            "id": new_comment.id,
            "user_id": current_user.id,
            "username": current_user.username,
            "avatar_url": current_user.avatar_url,
            "content": new_comment.content,
            "parent_id": new_comment.parent_id,
            "created_at": new_comment.created_at,
            "updated_at": new_comment.updated_at,
            "likes": 0,
            "dislikes": 0,
            "user_reaction": None,
            "replies": [],
        }

    except Exception as e:
        import traceback

        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


@app.get("/languages/lessons/{lesson_id}/comments")
async def get_language_lesson_comments(
    lesson_id: int,
    current_user: User | None = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):

    conn = await asyncpg.connect(
        host="localhost",
        port=5432,
        user="postgres",
        password="password",
        database="nextproject",
    )

    try:
        rows = await conn.fetch(
            """
            SELECT 
                lc.id,
                lc.user_id,
                lc.content,
                lc.parent_id,
                lc.created_at,
                u.username,
                u.avatar_url
            FROM language_comments lc
            LEFT JOIN users u ON lc.user_id = u.id
            WHERE lc.lesson_id = $1
              AND lc.parent_id IS NULL
            ORDER BY lc.created_at ASC
        """,
            lesson_id,
        )

        result = []
        for row in rows:
            result.append(
                {
                    "id": int(row["id"]),
                    "user_id": int(row["user_id"]),
                    "username": str(row["username"]) if row["username"] else "Unknown",
                    "avatar_url": str(row["avatar_url"]) if row["avatar_url"] else None,
                    "content": str(row["content"]),
                    "parent_id": int(row["parent_id"])
                    if row["parent_id"] is not None
                    else None,
                    "created_at": str(row["created_at"]),
                    "updated_at": None,
                    "likes": 0,
                    "dislikes": 0,
                    "user_reaction": None,
                    "replies": [],
                }
            )

        return result

    except Exception as e:
        import traceback

        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await conn.close()


@app.delete("/languages/comments/{comment_id}")
async def delete_language_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    comment = await db.get(LanguageComment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.delete(comment)
    await db.commit()
    return {"message": "Comment deleted"}


@app.post("/languages/comments/{comment_id}/reaction")
async def react_to_language_comment(
    comment_id: int,
    reaction_data: dict,  # {"reaction_type": "like" | "dislike" | "none"}
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        reaction_type = reaction_data.get("reaction_type")

        if reaction_type == "none":
            stmt = delete(LanguageCommentReaction).where(
                LanguageCommentReaction.comment_id == comment_id,
                LanguageCommentReaction.user_id == current_user.id,
            )
            await db.execute(stmt)
        else:
            is_like = reaction_type == "like"
            stmt = (
                insert(LanguageCommentReaction)
                .values(comment_id=comment_id, user_id=current_user.id, is_like=is_like)
                .on_conflict_do_update(
                    index_elements=["comment_id", "user_id"], set_={"is_like": is_like}
                )
            )
            await db.execute(stmt)

        await db.commit()

        likes = (
            await db.scalar(
                select(func.count(LanguageCommentReaction.id)).where(
                    LanguageCommentReaction.comment_id == comment_id,
                    LanguageCommentReaction.is_like == True,
                )
            )
            or 0
        )
        dislikes = (
            await db.scalar(
                select(func.count(LanguageCommentReaction.id)).where(
                    LanguageCommentReaction.comment_id == comment_id,
                    LanguageCommentReaction.is_like == False,
                )
            )
            or 0
        )

        return {
            "comment_id": comment_id,
            "likes": likes,
            "dislikes": dislikes,
            "user_reaction": reaction_type if reaction_type != "none" else None,
        }

    except Exception as e:
        import traceback

        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


EGE_SLUGS = ["math-profile", "physics-ege", "russian-ege", "informatics-ege"]


@app.get("/ege/subjects", response_model=list[EgeSubjectOut])
async def get_subjects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EgeSubject).order_by(EgeSubject.title))
    return result.scalars().all()


@app.get("/ege", response_model=list[EgeSubjectOut])
async def get_all_subjects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(EgeSubject)
        .where(EgeSubject.slug.in_(EGE_SLUGS))
        .order_by(EgeSubject.title)
    )
    return result.scalars().all()


@app.post("/ege/{subject}/{lesson}/view", status_code=status.HTTP_201_CREATED)
async def record_lesson_view(
    subject: str,
    lesson: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(EgeLesson).where(EgeLesson.slug == lesson)
    lesson_obj = await db.scalar(stmt)
    if not lesson_obj:
        raise HTTPException(status_code=404, detail="Lesson not found")
    stmt = insert(LessonView).values(user_id=current_user.id, lesson_id=lesson_obj.id)
    stmt = stmt.on_conflict_do_nothing(index_elements=["user_id", "lesson_id"])
    await db.execute(stmt)
    await db.commit()
    return {"message": "View recorded"}


@app.get("/ege/{subject}/{lesson}/views")
async def get_lesson_views(
    subject: str, lesson: str, db: AsyncSession = Depends(get_db)
):
    stmt = select(EgeLesson).where(EgeLesson.slug == lesson)
    lesson_obj = await db.scalar(stmt)
    if not lesson_obj:
        raise HTTPException(status_code=404, detail="Lesson not found")
    count_stmt = select(func.count(LessonView.id)).where(
        LessonView.lesson_id == lesson_obj.id
    )
    count = await db.scalar(count_stmt)
    return {"view_count": count or 0}


# backend/main.py
# backend/main.py

# ============================================================================
# 🔥 ТОКЕНЫ: ЭНДПОИНТЫ
# ============================================================================


@app.get("/profile/balance", response_model=dict)
async def get_balance(
    current_user: User = Depends(get_current_user),
):
    """Получить текущий баланс токенов"""
    return {"token_balance": current_user.token_balance}


@app.post("/profile/balance/reward", response_model=dict)
async def add_token_reward(
    reward: TokenReward,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Начислить токены пользователю (внутренний эндпоинт)"""

    # 🔥 Защита: только сервер может начислять токены
    # (в реальном проекте добавь проверку API-ключа или роли)

    current_user.token_balance += reward.amount
    await db.commit()

    return {
        "token_balance": current_user.token_balance,
        "rewarded": reward.amount,
        "reason": reward.reason,
    }


# 🔹 Хелпер для начисления токенов
async def reward_user(
    user_id: int,
    amount: int,
    reason: str,
    db: AsyncSession,
):
    """Внутренняя функция для начисления токенов"""
    user = await db.get(User, user_id)
    if user:
        user.token_balance += amount
        await db.commit()
        return user.token_balance
    return None


# backend/main.py


@app.get("/courses/subjects", response_model=list[EgeSubjectOut])
async def get_course_subjects(
    category: str | None = None,
    search: str | None = None,
    current_user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    # 1. Базовый запрос
    query = select(EgeSubject)
    if category:
        query = query.where(EgeSubject.category == category)
    if search:
        query = query.where(EgeSubject.title.ilike(f"%{search}%"))
    query = query.order_by(EgeSubject.title)

    result = await db.execute(query)
    subjects = result.scalars().all()

    # 2. 🔥 Собери счётчики записей
    enrolled_counts = await db.execute(
        select(
            UserCourseEnrollment.course_id,
            func.count(UserCourseEnrollment.user_id).label("count"),
        ).group_by(UserCourseEnrollment.course_id)
    )
    enrolled_dict = {row.course_id: row.count for row in enrolled_counts.all()}

    # 3. 🔥 Собери средние рейтинги
    avg_ratings = await db.execute(
        select(
            CourseReview.course_id, func.avg(CourseReview.rating).label("avg_rating")
        ).group_by(CourseReview.course_id)
    )
    ratings_dict = {row.course_id: row.avg_rating for row in avg_ratings.all()}

    # 4. 🔥 Если пользователь авторизован — загрузи избранное
    fav_ids = set()
    if current_user:
        favs = await db.execute(
            select(UserFavoriteCourse.course_id).where(
                UserFavoriteCourse.user_id == current_user.id
            )
        )
        fav_ids = {row[0] for row in favs.all()}
    enrolled_course_ids = set()
    if current_user:
        enrolled = await db.execute(
            select(UserCourseEnrollment.course_id).where(
                UserCourseEnrollment.user_id == current_user.id
            )
        )
        enrolled_course_ids = {row[0] for row in enrolled.all()}
    completion_dict: dict[int, float] = {}

    if current_user:
        # Получаем все завершённые уроки пользователя
        completed_lessons_result = await db.execute(
            select(
                EgeLesson.subject_id,
                func.count(UserCompletedLesson.id).label("completed_count"),
            )
            .join(UserCompletedLesson, UserCompletedLesson.lesson_id == EgeLesson.id)
            .where(UserCompletedLesson.user_id == current_user.id)
            .group_by(EgeLesson.subject_id)
        )
        completed_lessons = completed_lessons_result.all()  # 🔥 Сохраняем результат

        # Считаем всего уроков по каждому курсу
        total_lessons_result = await db.execute(
            select(
                EgeLesson.subject_id, func.count(EgeLesson.id).label("total_count")
            ).group_by(EgeLesson.subject_id)
        )
        total_lessons = total_lessons_result.all()  # 🔥 Сохраняем результат

        # Создаём словари
        completed_dict_temp = {
            row.subject_id: row.completed_count for row in completed_lessons
        }
        total_dict = {row.subject_id: row.total_count for row in total_lessons}

        # Вычисляем проценты
        for course_id, total in total_dict.items():
            completed = completed_dict_temp.get(course_id, 0)
            completion_dict[course_id] = (
                round((completed / total) * 100, 1) if total > 0 else 0.0
            )

    # 5. 🔥 Верни курсы с новыми полями
    # 5. 🔥 Верни курсы с новыми полями
    return [
        EgeSubjectOut(
            id=s.id,
            title=s.title,
            slug=s.slug,
            description=s.description,
            image=s.image,
            category=s.category,
            created_at=s.created_at,
            certificate_available=s.certificate_available or False,
            duration_minutes=s.duration_minutes,
            is_enrolled=(s.id in enrolled_course_ids) if current_user else False,
            enrolled_count=enrolled_dict.get(s.id, 0),
            completion_percent=completion_dict.get(s.id) if current_user else None,
            rating=round(ratings_dict.get(s.id, 0), 1)
            if ratings_dict.get(s.id)
            else None,
            is_favorite=(s.id in fav_ids) if current_user else None,
        )
        for s in subjects
    ]


@app.get("/courses/{slug}")  # ← УБЕРИ response_model=..., если есть
async def get_course_lessons(
    slug: str,
    current_user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    # 1. Ищем курс
    subject_result = await db.execute(select(EgeSubject).where(EgeSubject.slug == slug))
    subject = subject_result.scalar_one_or_none()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    # 2. Проверяем запись
    is_enrolled = False
    if current_user:
        enrollment = await db.execute(
            select(UserCourseEnrollment).where(
                UserCourseEnrollment.user_id == current_user.id,
                UserCourseEnrollment.course_id == subject.id,
            )
        )
        is_enrolled = enrollment.scalar_one_or_none() is not None

    # 3. Загружаем юниты
    units_result = await db.execute(
        select(CourseUnit, func.count(EgeLesson.id).label("lesson_count"))
        .outerjoin(EgeLesson, EgeLesson.unit_id == CourseUnit.id)
        .where(CourseUnit.subject_id == subject.id)
        .group_by(CourseUnit.id)
        .order_by(CourseUnit.unit_number)
    )
    units_with_counts = [
        {
            "id": u.id,
            "title": u.title,
            "unit_number": u.unit_number,
            "description": u.description,
            "lesson_count": c,
        }
        for u, c in units_result.all()
    ]

    # 4. Загружаем уроки
    lessons_result = await db.execute(
        select(EgeLesson)
        .outerjoin(CourseUnit, EgeLesson.unit_id == CourseUnit.id)
        .options(
            selectinload(EgeLesson.unit),
            selectinload(EgeLesson.flashcard_deck),
        )
        .where(EgeLesson.subject_id == subject.id)
        .order_by(
            EgeLesson.unit_id.nulls_last(),
            CourseUnit.unit_number.nulls_last(),
            EgeLesson.created_at.asc(),
        )
    )
    all_lessons = lessons_result.scalars().all()
    completion_percent = 0.0
    if current_user:
        completion_percent = await get_course_completion_percent(
            current_user.id, subject.id, db
        )

    # 5. 🔥 ВРУЧНУЮ ДОБАВЛЯЕМ is_locked 🔥
    lessons_out = []
    for i, lesson in enumerate(all_lessons):
        # 🔥 Сериализуем unit вручную
        unit_data = None
        if lesson.unit:
            unit_data = {
                "id": lesson.unit.id,
                "title": lesson.unit.title,
                "unit_number": lesson.unit.unit_number,
                "description": lesson.unit.description,
            }
        has_flashcards = lesson.flashcard_deck is not None  # или используй свою логику

        lessons_out.append(
            {
                "id": lesson.id,
                "subject_id": lesson.subject_id,
                "title": lesson.title,
                "slug": lesson.slug,
                "description": lesson.description,
                "content": lesson.content,
                "time_minutes": lesson.time_minutes,
                "is_completed": False,
                "test_id": lesson.test_id,
                "unit": unit_data,  # 🔥 Теперь это dict, а не модель!
                "created_at": lesson.created_at,
                "updated_at": lesson.updated_at,
                "is_locked": not is_enrolled and i > 0,
                "has_flashcards": getattr(lesson, "flashcard_deck", None) is not None,
            }
        )
    print(
        f"🟢 [DEBUG] Returning {len(lessons_out)} lessons, {len(units_with_counts)} units"
    )

    milestone_rewards = []
    if current_user:
        if completion_percent >= 75:
            if await try_grant_reward(
                current_user.id, "progress_75", subject.id, 200, db
            ):
                milestone_rewards.append({"type": "progress_75", "amount": 200})
        if completion_percent >= 90:
            if await try_grant_reward(
                current_user.id, "progress_90", subject.id, 100, db
            ):
                milestone_rewards.append({"type": "progress_90", "amount": 100})
    return {
        "lessons": lessons_out,
        "units": units_with_counts,
        "is_enrolled": is_enrolled,
        "completion_percent": round(completion_percent, 1),
        "rewards_granted": milestone_rewards,
    }


# backend/main.py


# backend/main.py


# backend/main.py


@app.get("/courses/{slug}/{lesson_slug}")  # ← БЕЗ response_model!
async def get_course_lesson_detail(
    slug: str,
    lesson_slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    # 1. Находим курс
    subject = await db.execute(select(EgeSubject).where(EgeSubject.slug == slug))
    subject = subject.scalar_one_or_none()
    if not subject:
        raise HTTPException(404, "Course not found")

    # 2. Находим урок
    lesson = await db.execute(
        select(EgeLesson).where(
            EgeLesson.subject_id == subject.id, EgeLesson.slug == lesson_slug
        )
    )
    lesson = lesson.scalar_one_or_none()
    if not lesson:
        raise HTTPException(404, "Lesson not found")

    # 3. Проверяем запись
    is_enrolled = False
    if current_user:
        check = await db.execute(
            select(UserCourseEnrollment).where(
                UserCourseEnrollment.user_id == current_user.id,
                UserCourseEnrollment.course_id == subject.id,
            )
        )
        is_enrolled = check.scalar_one_or_none() is not None

    # 4. Индекс урока для блокировки
    all_ids = await db.execute(
        select(EgeLesson.id)
        .where(EgeLesson.subject_id == subject.id)
        .order_by(EgeLesson.created_at)
    )
    ids = [r[0] for r in all_ids.all()]
    idx = ids.index(lesson.id) if lesson.id in ids else 0
    is_locked = not is_enrolled and idx > 0

    # 5. 🔥 ВОЗВРАЩАЕМ ТОЛЬКО ПРИМИТИВЫ — БЕЗ unit, БЕЗ моделей!
    return {
        "id": lesson.id,
        "title": lesson.title,
        "slug": lesson.slug,
        "description": lesson.description,
        "content": lesson.content,
        "time_minutes": lesson.time_minutes,
        "test_id": lesson.test_id,
        # "unit": ...,  # ← УБРАЛИ! Не возвращаем nested-объекты
        "created_at": lesson.created_at.isoformat() if lesson.created_at else None,
        "is_locked": is_locked,  # 🔥 Главное поле для блокировки
    }


ARTICLE_TOPICS_LIST = [
    "Забота о себе",
    "Продуктивность",
    "Программирование",
    "Наука",
]


# backend/main.py


@app.get("/articles", response_model=list[ArticleOut])
async def get_articles(
    topic: str | None = None,
    search: str | None = None,
    with_stats: bool = False,  # 🔥 Новый параметр
    db: AsyncSession = Depends(get_db),
):
    """Получить список статей с опциональной статистикой"""

    # 🔹 Базовый запрос
    query = select(Article)

    if topic and topic != "Все":
        query = query.where(Article.topic == topic)

    if search:
        query = query.where(Article.title.ilike(f"%{search}%"))

    # Сортировка по умолчанию: новые сверху
    query = query.order_by(Article.created_at.desc())

    result = await db.execute(query)
    articles = result.scalars().all()

    # 🔥 Если запрошена статистика — считаем для каждой статьи
    if with_stats:
        articles_with_stats = []

        for article in articles:
            # 👁 Просмотры: уникальные юзеры в день
            views = await db.execute(
                select(func.count(func.distinct(ArticleView.user_id))).where(
                    ArticleView.article_id == article.id
                )
            )
            view_count = views.scalar() or 0

            # 👍 Лайки
            likes = await db.execute(
                select(func.count()).where(
                    ArticleReaction.article_id == article.id,
                    ArticleReaction.reaction_type == "like",
                )
            )

            # 👎 Дизлайки
            dislikes = await db.execute(
                select(func.count()).where(
                    ArticleReaction.article_id == article.id,
                    ArticleReaction.reaction_type == "dislike",
                )
            )

            # 🔥 Создаём объект с доп. полями
            article_data = {
                "id": article.id,
                "title": article.title,
                "slug": article.slug,
                "topic": article.topic,
                "content": article.content,
                "time_minutes": article.time_minutes,
                "image": article.image,
                "created_at": article.created_at,
                # 🔥 Статистика:
                "view_count": view_count,
                "likes": likes.scalar() or 0,
                "dislikes": dislikes.scalar() or 0,
            }
            articles_with_stats.append(article_data)

        return articles_with_stats

    # 🔹 Без статистики — возвращаем как есть
    return articles


# backend/main.py


# backend/main.py
# 🔹 Переключить избранное
@app.post("/articles/{article_id}/favorite")
async def toggle_article_favorite(
    article_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(UserArticleFavorite).where(
            UserArticleFavorite.user_id == current_user.id,
            UserArticleFavorite.article_id == article_id,
        )
    )
    fav = existing.scalar_one_or_none()

    if fav:
        await db.delete(fav)
        await db.commit()
        return {"is_favorite": False, "message": "Removed from favorites"}
    else:
        db.add(UserArticleFavorite(user_id=current_user.id, article_id=article_id))
        await db.commit()
        return {"is_favorite": True, "message": "Added to favorites"}


# 🔹 Получить список ID избранных статей
@app.get("/articles/favorites")
async def get_user_article_favorites(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserArticleFavorite.article_id).where(
            UserArticleFavorite.user_id == current_user.id
        )
    )
    return {"favorite_ids": [row[0] for row in result.all()]}


@app.post("/lessons/{lesson_id}/complete")
async def mark_lesson_complete(
    lesson_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Отметить урок как завершённый (вызывается при прохождении теста или просмотре)"""

    # Проверка: существует ли урок
    lesson = await db.get(EgeLesson, lesson_id)
    if not lesson:
        raise HTTPException(404, "Lesson not found")

    # Проверка: не отмечен ли уже
    existing = await db.execute(
        select(UserCompletedLesson).where(
            UserCompletedLesson.user_id == current_user.id,
            UserCompletedLesson.lesson_id == lesson_id,
        )
    )
    if existing.scalar_one_or_none():
        return {"message": "Already completed", "completed": True}

    # Создаём запись
    db.add(UserCompletedLesson(user_id=current_user.id, lesson_id=lesson_id))
    await db.commit()

    return {"message": "Lesson marked as completed", "completed": True}


@app.get("/lessons/{lesson_id}")  # ← Убрали response_model!
async def get_lesson_by_id(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
):
    lesson = await db.get(EgeLesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # 🔥 Вручную собираем ответ — только примитивы, БЕЗ unit!
    return {
        "id": lesson.id,
        "title": lesson.title,
        "slug": lesson.slug,
        "description": lesson.description,
        "content": lesson.content,
        "time_minutes": lesson.time_minutes,
        "test_id": lesson.test_id,
        # "unit": ...,  # ← НЕ возвращаем nested-объекты!
        "created_at": lesson.created_at.isoformat() if lesson.created_at else None,
    }


@app.post("/lessons/{lesson_id}/view", status_code=status.HTTP_201_CREATED)
async def record_lesson_view_by_id(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lesson = await db.get(EgeLesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    stmt = insert(LessonView).values(user_id=current_user.id, lesson_id=lesson_id)
    stmt = stmt.on_conflict_do_nothing(index_elements=["user_id", "lesson_id"])
    await db.execute(stmt)
    await db.commit()
    return {"message": "View recorded"}


@app.get("/lessons/{lesson_id}/views")
async def get_lesson_views_by_id(lesson_id: int, db: AsyncSession = Depends(get_db)):
    lesson = await db.get(EgeLesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    count = await db.scalar(
        select(func.count(LessonView.id)).where(LessonView.lesson_id == lesson_id)
    )
    return {"view_count": count or 0}


@app.post("/lessons/{lesson_id}/reaction", status_code=status.HTTP_200_OK)
async def set_lesson_reaction_by_id(
    lesson_id: int,
    data: ReactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lesson = await db.get(EgeLesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    if data.reaction_type == "none":
        new_is_like = None
    else:
        new_is_like = data.reaction_type == "like"
    existing_stmt = select(LessonReaction).where(
        LessonReaction.user_id == current_user.id, LessonReaction.lesson_id == lesson_id
    )
    res = await db.execute(existing_stmt)
    existing_reaction = res.scalar_one_or_none()
    if new_is_like is None:
        if existing_reaction:
            await db.delete(existing_reaction)
            await db.commit()
        return {"message": "Reaction removed"}
    else:
        if existing_reaction:
            existing_reaction.is_like = new_is_like
        else:
            db.add(
                LessonReaction(
                    user_id=current_user.id, lesson_id=lesson_id, is_like=new_is_like
                )
            )
        await db.commit()
        return {"message": f"Reaction set to {data.reaction_type}"}


@app.get("/lessons/{lesson_id}/stats", response_model=LessonStatsOut)
async def get_lesson_stats_by_id(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    lesson = await db.get(EgeLesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    likes = (
        await db.scalar(
            select(func.count(LessonReaction.id)).where(
                LessonReaction.lesson_id == lesson_id, LessonReaction.is_like == True
            )
        )
        or 0
    )
    dislikes = (
        await db.scalar(
            select(func.count(LessonReaction.id)).where(
                LessonReaction.lesson_id == lesson_id, LessonReaction.is_like == False
            )
        )
        or 0
    )
    views = (
        await db.scalar(
            select(func.count(LessonView.id)).where(LessonView.lesson_id == lesson_id)
        )
        or 0
    )
    user_reaction = None
    if current_user:
        stmt = select(LessonReaction.is_like).where(
            LessonReaction.user_id == current_user.id,
            LessonReaction.lesson_id == lesson_id,
        )
        res = await db.execute(stmt)
        val = res.scalar_one_or_none()
        if val is True:
            user_reaction = "like"
        elif val is False:
            user_reaction = "dislike"
    return LessonStatsOut(
        likes=likes, dislikes=dislikes, views=views, user_reaction=user_reaction
    )


@app.get("/tests/{test_id}", response_model=EgeTestOut)
async def get_test(test_id: int, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(EgeTest)
        .options(
            selectinload(EgeTest.questions).load_only(
                EgeTestQuestion.id,
                EgeTestQuestion.question_text,
                EgeTestQuestion.order_index,
            )
        )
        .where(EgeTest.id == test_id)
    )
    res = await db.execute(stmt)
    test = res.scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    questions_out = [
        TestQuestionOut(
            id=q.id, question_text=q.question_text, order_index=q.order_index
        )
        for q in test.questions
    ]
    return EgeTestOut(
        id=test.id,
        lesson_id=test.lesson_id,
        title=test.title,
        passing_score=test.passing_score,
        questions=questions_out,
    )


@app.post("/tests/{test_id}/question/{question_id}/check")
async def check_single_answer(
    test_id: int, question_id: int, answer: str, db: AsyncSession = Depends(get_db)
):
    stmt = select(EgeTestQuestion).where(
        EgeTestQuestion.id == question_id, EgeTestQuestion.test_id == test_id
    )
    res = await db.execute(stmt)
    question = res.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    user_ans = answer.strip().lower().replace(",", ".")
    correct_ans = question.correct_answer.strip().lower().replace(",", ".")
    is_correct = user_ans == correct_ans
    return {
        "correct": is_correct,
        "expected": correct_ans if not is_correct else None,
        "question_id": question_id,
        "solution": question.solution,
    }


@app.post("/tests/{test_id}/submit", response_model=TestSubmissionResult)
async def submit_test(
    test_id: int,
    submission: TestSubmission,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(EgeTest)
        .options(selectinload(EgeTest.questions))
        .where(EgeTest.id == test_id)
    )
    res = await db.execute(stmt)
    test = res.scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    total = len(test.questions)
    correct = 0
    for q in test.questions:
        user_ans = (
            submission.answers.get(str(q.id), "").strip().lower().replace(",", ".")
        )
        correct_ans = q.correct_answer.strip().lower().replace(",", ".")
        if user_ans == correct_ans:
            correct += 1
    score = (correct / total) * 100 if total > 0 else 0
    passed = score >= test.passing_score
    if test.lesson_id:
        await mark_lesson_completed_if_needed(
            user_id=current_user.id, lesson_id=test.lesson_id, score=score, db=db
        )
    test_result = TestResult(
        user_id=current_user.id,
        test_id=test_id,
        lesson_id=test.lesson_id,
        score=score,
        passed=passed,
    )
    db.add(test_result)
    await db.commit()
    print(
        f"🔍 [DEBUG] Test {test_id}: score={score}, passed={passed}, passing_score={test.passing_score}"
    )

    reward_granted = False
    if passed:
        reward_granted = await try_grant_reward(
            current_user.id,
            "test_passed",
            test_id,  # контекст: конкретный тест
            30,
            db,
        )

    return TestSubmissionResult(
        score=round(score, 1),
        passed=passed,
        total_questions=total,
        correct_count=correct,
        reward_granted=reward_granted,
    )


@app.post(
    "/tests/{test_id}/complete",
    response_model=TestResultOut,
    status_code=status.HTTP_201_CREATED,
)
async def complete_test(
    test_id: int,
    result_: TestResultCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    test = await db.get(EgeTest, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    stmt = insert(TestResult).values(
        user_id=current_user.id,
        test_id=test_id,
        score=result_.score,
        passed=result_.passed,
    )
    stmt = stmt.on_conflict_do_update(
        index_elements=["user_id", "test_id"],
        set_={
            "score": result_.score,
            "passed": result_.passed,
            "completed_at": func.now(),
        },
    )
    await db.execute(stmt)
    await db.commit()

    # 🔥 ДОБАВЬ ЭТО: Награда за прохождение теста (первый раз для этого теста)
    reward_granted = False
    if result_.passed:  # только если тест пройден
        reward_granted = await try_grant_reward(
            current_user.id,
            "test_passed",
            test_id,  # контекст: конкретный тест
            30,  # сумма
            db,
        )
        print(
            f"🎁 [DEBUG] Test {test_id} reward: granted={reward_granted}, user={current_user.id}"
        )

    return TestResultOut(
        score=result_.score,
        passed=result_.passed,
        completed_at=datetime.now(timezone.utc),
        reward_granted=reward_granted,  # 🔥 Новый флаг для фронтенда
    )


@app.get("/tests/{test_id}/result", response_model=TestResultOut | None)
async def get_user_test_result(
    test_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(TestResult).where(
            TestResult.test_id == test_id, TestResult.user_id == current_user.id
        )
    )
    return result.scalar_one_or_none()


@app.post("/lessons/{lesson_id}/reaction", status_code=status.HTTP_200_OK)
async def set_lesson_reaction(
    lesson_id: int,
    data: ReactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.reaction_type == "none":
        new_is_like = None
    else:
        new_is_like = data.reaction_type == "like"
    existing_stmt = select(LessonReaction).where(
        LessonReaction.user_id == current_user.id, LessonReaction.lesson_id == lesson_id
    )
    res = await db.execute(existing_stmt)
    existing_reaction = res.scalar_one_or_none()
    if new_is_like is None:
        if existing_reaction:
            await db.delete(existing_reaction)
            await db.commit()
        return {"message": "Reaction removed"}
    else:
        if existing_reaction:
            existing_reaction.is_like = new_is_like
        else:
            db.add(
                LessonReaction(
                    user_id=current_user.id, lesson_id=lesson_id, is_like=new_is_like
                )
            )
        await db.commit()
        return {"message": f"Reaction set to {data.reaction_type}"}


@app.delete("/comments/{comment_id}", status_code=status.HTTP_200_OK)
async def delete_comment(
    comment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = await db.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Not allowed to delete this comment"
        )

    await db.delete(comment)
    await db.commit()

    return {"message": "Comment deleted", "id": comment_id}


@app.post("/comments/{comment_id}/reaction", status_code=status.HTTP_200_OK)
async def set_comment_reaction(
    comment_id: int,
    data: CommentReactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = await db.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if data.reaction_type == "none":
        new_is_like = None
    else:
        new_is_like = data.reaction_type == "like"

    existing_stmt = select(CommentReaction).where(
        CommentReaction.user_id == current_user.id,
        CommentReaction.comment_id == comment_id,
    )
    res = await db.execute(existing_stmt)
    existing_reaction = res.scalar_one_or_none()

    if new_is_like is None:
        if existing_reaction:
            await db.delete(existing_reaction)
            await db.commit()
        return {"message": "Reaction removed"}
    else:
        if existing_reaction:
            existing_reaction.is_like = new_is_like
        else:
            db.add(
                CommentReaction(
                    user_id=current_user.id, comment_id=comment_id, is_like=new_is_like
                )
            )
        await db.commit()
        return {"message": f"Reaction set to {data.reaction_type}"}


@app.get("/comments/{comment_id}/stats")
async def get_comment_stats(
    comment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    comment = await db.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    likes = (
        await db.scalar(
            select(func.count(CommentReaction.id)).where(
                CommentReaction.comment_id == comment_id,
                CommentReaction.is_like == True,
            )
        )
        or 0
    )

    dislikes = (
        await db.scalar(
            select(func.count(CommentReaction.id)).where(
                CommentReaction.comment_id == comment_id,
                CommentReaction.is_like == False,
            )
        )
        or 0
    )

    user_reaction = None
    if current_user:
        stmt = select(CommentReaction.is_like).where(
            CommentReaction.user_id == current_user.id,
            CommentReaction.comment_id == comment_id,
        )
        res = await db.execute(stmt)
        val = res.scalar_one_or_none()
        if val is True:
            user_reaction = "like"
        elif val is False:
            user_reaction = "dislike"

    return {"likes": likes, "dislikes": dislikes, "user_reaction": user_reaction}


async def format_comment_with_stats(
    comment: Comment, db: AsyncSession, current_user: User | None
) -> Dict[str, Any]:
    likes = (
        await db.scalar(
            select(func.count(CommentReaction.id)).where(
                CommentReaction.comment_id == comment.id,
                CommentReaction.is_like == True,
            )
        )
        or 0
    )
    dislikes = (
        await db.scalar(
            select(func.count(CommentReaction.id)).where(
                CommentReaction.comment_id == comment.id,
                CommentReaction.is_like == False,
            )
        )
        or 0
    )

    user_reaction = None
    if current_user:
        stmt = select(CommentReaction.is_like).where(
            CommentReaction.user_id == current_user.id,
            CommentReaction.comment_id == comment.id,
        )
        res = await db.execute(stmt)
        val = res.scalar_one_or_none()
        if val is True:
            user_reaction = "like"
        elif val is False:
            user_reaction = "dislike"
    equipped_item = None
    if (
        comment.user
        and hasattr(comment.user, "equipped_item")
        and comment.user.equipped_item
    ):
        equipped_item = {
            "id": comment.user.equipped_item.id,
            "name": comment.user.equipped_item.name,
            "image": comment.user.equipped_item.image,
            "price": comment.user.equipped_item.price,
            "description": comment.user.equipped_item.description,
        }

    return {
        "id": comment.id,
        "user_id": comment.user_id,
        "username": comment.user.username if comment.user else "Unknown",
        "content": comment.content,
        "parent_id": comment.parent_id,
        "created_at": comment.created_at,
        "updated_at": comment.updated_at,
        "avatar_url": comment.user.avatar_url if comment.user else None,
        "likes": likes,
        "dislikes": dislikes,
        "equipped_item": equipped_item,
        "user_reaction": user_reaction,
        "replies": [],
    }


@app.get("/lessons/{lesson_id}/comments")
async def get_lesson_comments(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    lesson = await db.get(EgeLesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    result = await db.execute(
        select(Comment)
        .where(Comment.lesson_id == lesson_id, Comment.parent_id.is_(None))
        .options(
            # 🔥 Предзагружаем user И его equipped_item:
            selectinload(Comment.user).selectinload(User.equipped_item),
            # 🔥 То же самое для ответов:
            selectinload(Comment.replies)
            .selectinload(Comment.user)
            .selectinload(User.equipped_item),
        )
        .order_by(Comment.created_at.asc())
    )
    comments = result.scalars().all()
    formatted = []
    for c in comments:
        c_data = await format_comment_with_stats(c, db, current_user)
        for r in c.replies:
            r_data = await format_comment_with_stats(r, db, current_user)
            c_data["replies"].append(r_data)
        formatted.append(c_data)

    return formatted


@app.get("/articles/{article_id}/comments")
async def get_article_comments(
    article_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    article = await db.get(Article, article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    # backend/main.py — в get_article_comments

    result = await db.execute(
        select(Comment)
        .where(Comment.article_id == article_id, Comment.parent_id.is_(None))
        .options(
            # 🔥 КЛЮЧЕВОЕ: цепочка предзагрузки equipped_item
            selectinload(Comment.user).selectinload(
                User.equipped_item
            ),  # ← Добавь это!
            # 🔥 То же самое для ответов:
            selectinload(Comment.replies)
            .selectinload(Comment.user)
            .selectinload(User.equipped_item),  # ← И это!
        )
        .order_by(Comment.created_at.asc())
    )
    comments = result.scalars().all()
    formatted = []
    for c in comments:
        c_data = await format_comment_with_stats(c, db, current_user)
        for r in c.replies:
            r_data = await format_comment_with_stats(r, db, current_user)
            c_data["replies"].append(r_data)
        formatted.append(c_data)

    return formatted


# backend/main.py
@app.get("/articles/{slug}", response_model=ArticleOut)
async def get_article_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """Получить статью по слагам"""

    # 🔍 Ищем статью
    article = await db.execute(select(Article).where(Article.slug == slug))
    article = article.scalar_one_or_none()

    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    # В @app.get("/articles/{slug}") замени try/except на:

    if current_user:
        try:
            today = datetime.now().date()  # 🔥 naive date, совместимо с БД

            # Проверяем, не записывали ли уже сегодня
            existing = await db.execute(
                select(ArticleView).where(
                    ArticleView.article_id == article.id,
                    ArticleView.user_id == current_user.id,
                    func.date(ArticleView.viewed_at) == today,
                )
            )

            if not existing.scalar_one_or_none():
                db.add(
                    ArticleView(
                        article_id=article.id,
                        user_id=current_user.id,
                        viewed_at=datetime.now(),
                    )
                )
                await db.commit()
                print(
                    f"✅ View recorded for user {current_user.id}, article {article.id}"
                )
        except Exception as e:
            print(f"⚠️ View record failed: {e}")
            await db.rollback()  # 🔥 Обязательно откатываем при ошибке!

    # 🔥 Возвращаем статью
    return ArticleOut(
        id=article.id,
        title=article.title,
        slug=article.slug,
        topic=article.topic,
        content=article.content,
        time_minutes=article.time_minutes,
        image=article.image,
        created_at=article.created_at,
    )


# backend/main.py


# 🔹 1. Лайк/дизлайк статьи
@app.post("/articles/{slug}/reaction")
async def react_to_article(
    slug: str,
    reaction_data: dict,  # {"reaction_type": "like" | "dislike" | null}
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Поставить или убрать реакцию на статью"""

    article = await db.execute(select(Article).where(Article.slug == slug))
    article = article.scalar_one_or_none()
    if not article:
        raise HTTPException(404, "Article not found")

    reaction_type = reaction_data.get("reaction_type")

    # Ищем существующую реакцию
    existing = await db.execute(
        select(ArticleReaction).where(
            ArticleReaction.user_id == current_user.id,
            ArticleReaction.article_id == article.id,
        )
    )
    existing_reaction = existing.scalar_one_or_none()

    # Если reaction_type = null → удаляем реакцию
    if not reaction_type:
        if existing_reaction:
            await db.delete(existing_reaction)
            await db.commit()
        return {"message": "Reaction removed"}

    # Если реакция уже есть
    if existing_reaction:
        if existing_reaction.reaction_type == reaction_type:
            # Тот же тип → убираем (toggle)
            await db.delete(existing_reaction)
            await db.commit()
            return {"message": "Reaction removed"}
        else:
            # Другой тип → меняем
            existing_reaction.reaction_type = reaction_type
            await db.commit()
            return {"message": f"Reaction changed to {reaction_type}"}
    else:
        # Новая реакция
        db.add(
            ArticleReaction(
                user_id=current_user.id,
                article_id=article.id,
                reaction_type=reaction_type,
            )
        )
        await db.commit()
        return {"message": f"Reaction set to {reaction_type}"}


# backend/main.py


@app.get("/articles/{slug}/stats")
async def get_article_stats(
    slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """Получить полную статистику статьи: просмотры + лайки + реакция пользователя"""

    article = await db.execute(select(Article).where(Article.slug == slug))
    article = article.scalar_one_or_none()

    if not article:
        raise HTTPException(404, "Article not found")

    # 🔥 Считаем просмотры (уникальные юзеры в день)
    view_count = (
        await db.execute(
            select(func.count(func.distinct(ArticleView.user_id))).where(
                ArticleView.article_id == article.id
            )
        )
    ).scalar() or 0

    # 🔥 Считаем лайки/дизлайки
    likes = (
        await db.execute(
            select(func.count()).where(
                ArticleReaction.article_id == article.id,
                ArticleReaction.reaction_type == "like",
            )
        )
    ).scalar() or 0

    dislikes = (
        await db.execute(
            select(func.count()).where(
                ArticleReaction.article_id == article.id,
                ArticleReaction.reaction_type == "dislike",
            )
        )
    ).scalar() or 0

    # 🔥 Реакция текущего пользователя
    user_reaction = None
    if current_user:
        ur = await db.execute(
            select(ArticleReaction.reaction_type).where(
                ArticleReaction.user_id == current_user.id,
                ArticleReaction.article_id == article.id,
            )
        )
        user_reaction = ur.scalar_one_or_none()

    print(
        f"🔍 [DEBUG] Stats for article {article.id}: views={view_count}, likes={likes}, dislikes={dislikes}, user_reaction={user_reaction}"
    )

    return {
        "view_count": view_count,
        "likes": likes,
        "dislikes": dislikes,
        "user_reaction": user_reaction,
    }


@app.post("/articles/{slug}/view")
async def record_article_view(
    slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """Записать просмотр статьи"""

    article = await db.execute(select(Article).where(Article.slug == slug))
    article = article.scalar_one_or_none()

    if not article:
        raise HTTPException(404, "Article not found")

    # Если пользователь авторизован — записываем персональный просмотр
    if current_user:
        today = datetime.now(timezone.utc).date()
        existing = await db.execute(
            select(ArticleView).where(
                ArticleView.article_id == article.id,
                ArticleView.user_id == current_user.id,
                func.date(ArticleView.viewed_at) == today,
            )
        )
        if not existing.scalar_one_or_none():
            db.add(
                ArticleView(
                    article_id=article.id,
                    user_id=current_user.id,
                    viewed_at=datetime.now(),
                )
            )
    else:
        # Для анонимов — просто увеличиваем счётчик
        article.view_count = (article.view_count or 0) + 1

    await db.commit()

    return {"message": "View recorded"}


# backend/main.py
# backend/main.py — в @app.get("/articles/{slug}/views")


# backend/main.py


@app.get("/articles/{slug}/views")
async def get_article_views(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    """Получить количество просмотров статьи"""

    article = await db.execute(select(Article).where(Article.slug == slug))
    article = article.scalar_one_or_none()

    if not article:
        raise HTTPException(404, "Article not found")

    # 🔥 Вычисляем счётчик ОДИН РАЗ и сохраняем в переменную
    unique_views_count = (
        await db.execute(
            select(func.count(func.distinct(ArticleView.user_id))).where(
                ArticleView.article_id == article.id
            )
        )
    ).scalar() or 0

    print(
        f"🔍 [DEBUG] Article {article.id} views: {unique_views_count}"
    )  # ← Для отладки

    return {
        "view_count": unique_views_count,  # ← Используем переменную
        "unique_views": unique_views_count,  # ← И здесь ту же переменную
    }


@app.post("/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
async def create_comment(
    data: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lesson_id = data.lesson_id if hasattr(data, "lesson_id") else None
    article_id = data.article_id if hasattr(data, "article_id") else None

    if (lesson_id is None) == (article_id is None):
        raise HTTPException(
            status_code=400, detail="Specify either lesson_id or article_id"
        )

    if lesson_id:
        obj = await db.get(EgeLesson, lesson_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Lesson not found")
    else:
        obj = await db.get(Article, article_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Article not found")

    if data.parent_id:
        parent = await db.get(Comment, data.parent_id)
        if not parent or (
            parent.lesson_id != lesson_id and parent.article_id != article_id
        ):
            raise HTTPException(status_code=400, detail="Invalid parent comment")

    comment = Comment(
        user_id=current_user.id,
        lesson_id=lesson_id,
        article_id=article_id,
        content=data.content,
        parent_id=data.parent_id,
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)

    return CommentOut(
        id=comment.id,
        user_id=comment.user_id,
        username=current_user.username,
        content=comment.content,
        parent_id=comment.parent_id,
        created_at=comment.created_at,
        avatar_url=current_user.avatar_url,
        replies=[],
    )


@app.patch("/comments/{comment_id}", response_model=CommentOut)
async def update_comment(
    comment_id: int,
    data: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Comment)
        .where(Comment.id == comment_id)
        .options(selectinload(Comment.user))
    )
    comment = result.scalar_one_or_none()

    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    comment.content = data.content
    comment.updated_at = datetime.now()
    await db.commit()
    await db.refresh(comment)

    return CommentOut(
        id=comment.id,
        user_id=comment.user_id,
        username=comment.user.username if comment.user else current_user.username,
        content=comment.content,
        parent_id=comment.parent_id,
        created_at=comment.created_at,
        replies=[],
    )


@app.get("/health")
async def health():
    return {"status": "ok", "db": "postgresql_asyncpg"}
