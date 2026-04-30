# backend/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete, text
import os
from sqlalchemy.dialects.postgresql import insert


from dotenv import load_dotenv
from datetime import datetime, timezone
from database import engine, Base, get_db
from typing import Any, Dict, Literal, Optional
import asyncpg
from models import (
    User,
    EgeSubject,
    EgeLesson,
    EgeTest,
    EgeTestQuestion,
    TestResult,
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
    LanguageCategory,
    LanguageLesson,
    LanguageComment,
    LanguageCommentReaction,
    LanguageLessonView,
    CourseUnit,
)
from schemas import (
    UserRegister,
    LanguageLessonOut,
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
)
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    get_current_user_optional,
)
from sqlalchemy.orm import selectinload, relationship, backref, declarative_base

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ БД подключена. Таблицы проверены/созданы.")
    yield
    await engine.dispose()


app = FastAPI(title="NextProject Auth API", version="1.0.0", lifespan=lifespan)

# 🔐 CORS
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


# ============================================================================
# 🔐 AUTH
# ============================================================================


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


@app.get("/auth/me", response_model=UserOut)
async def read_me(current_user: User = Depends(get_current_user)):
    return UserOut(
        id=current_user.id, email=current_user.email, username=current_user.username
    )


@app.get("/profile", response_model=UserOut)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    return UserOut(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        avatar_url=current_user.avatar_url or "gray_cat.jpg",
        status=current_user.status,
        created_at=current_user.created_at,
    )


@app.patch("/profile/settings", response_model=UserOut)
async def update_profile_settings(
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Проверка юзернейма
    if data.username and data.username != current_user.username:
        existing = await db.execute(
            select(User).where(User.username == data.username.lower())
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Username already taken")
        current_user.username = data.username.lower()

    # ✅ Обновление аватара (только из разрешённого списка)
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

    if data.status is not None:
        current_user.status = data.status

    current_user.updated_at = datetime.now()
    await db.commit()
    await db.refresh(current_user)

    return UserOut(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        avatar_url=current_user.avatar_url,
        status=current_user.status,
        created_at=current_user.created_at,
    )


# ============================================================================
# 🌍 LANGUAGES SECTION (полностью изолирована от ЕГЭ!)
# ============================================================================

# --- Схемы Pydantic ---


# --- Эндпоинты ---


# 🔁 Получить все языки
@app.get("/languages", response_model=list[dict])
async def get_all_languages(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LanguageSubject).order_by(LanguageSubject.title))
    return [
        {"id": s.id, "title": s.title, "slug": s.slug, "description": s.description}
        for s in result.scalars().all()
    ]


# 🔁 Получить уровни языка
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


# 🔁 Получить категории уровня
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


# 🔁 Получить уроки категории
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


# 🔁 Получить один урок
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


# 👁️ Записать просмотр
# backend/main.py


# backend/main.py

from sqlalchemy.dialects.postgresql import insert as pg_insert  # ✅ Добавь этот импорт

# ...


@app.post("/languages/lessons/{lesson_id}/view")
async def record_language_lesson_view(
    lesson_id: int,
    request: Request,
    current_user: User | None = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        print(f"🔍 [DEBUG] POST /languages/lessons/{lesson_id}/view")

        # Проверка урока
        lesson = await db.get(LanguageLesson, lesson_id)
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")

        # ✅ Используем PostgreSQL-specific INSERT ... ON CONFLICT
        stmt = pg_insert(LanguageLessonView).values(
            lesson_id=lesson_id,
            user_id=current_user.id if current_user else None,
            ip_address=request.client.host if request.client else None,
        )

        if current_user:
            # ✅ Если пользователь авторизован — игнорируем дубликаты (один просмотр на пользователя)
            stmt = stmt.on_conflict_do_nothing(index_elements=["lesson_id", "user_id"])
        else:
            # ✅ Для анонимов можно разрешать множественные просмотры (или тоже уникализировать по IP)
            stmt = stmt.on_conflict_do_nothing(
                index_elements=["lesson_id", "ip_address"]
            )

        await db.execute(stmt)
        await db.commit()

        print(f"✅ [DEBUG] View recorded/ignored for lesson {lesson_id}")
        return {"message": "View recorded", "lesson_id": lesson_id}

    except Exception as e:
        import traceback

        print(f"❌ [DEBUG] EXCEPTION: {type(e).__name__}: {str(e)}")
        print(f"❌ [DEBUG] Traceback:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


# 👁️ Получить счётчик просмотров
@app.get("/languages/lessons/{lesson_id}/views")
async def get_language_lesson_views(lesson_id: int, db: AsyncSession = Depends(get_db)):
    # Уникальные пользователи + анонимные просмотры
    result = await db.execute(
        select(func.count(func.distinct(LanguageLessonView.user_id))).where(
            LanguageLessonView.lesson_id == lesson_id,
            LanguageLessonView.user_id.isnot(None),
        )
    )
    user_views = result.scalar_one_or_none() or 0

    # Можно добавить анонимные просмотры, если нужно:
    # anon_result = await db.execute(select(func.count(...)))

    return {"view_count": user_views}


# 💬 Получить комментарии урока (ИЗОЛИРОВАННЫЕ!)
# backend/main.py


# backend/main.py


# backend/main.py — ВРЕМЕННАЯ ВЕРСИЯ ДЛЯ ОТЛАДКИ
# backend/main.py


# backend/main.py


# backend/main.py


# backend/main.py


# backend/main.py


# backend/main.py


@app.post("/languages/lessons/{lesson_id}/comments", response_model=LanguageCommentOut)
async def create_language_comment(
    lesson_id: int,
    comment_data: dict,  # ✅ Проверь имя параметра!
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        print(f"🔍 [DEBUG] POST /languages/lessons/{lesson_id}/comments")
        print(f"🔍 [DEBUG] comment_ {comment_data}")
        print(
            f"🔍 [DEBUG] current_user: {current_user.username} (id={current_user.id})"
        )

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

        # 🔥 ПРОВЕРКА 1: Сразу читаем тем же сеансом
        check_stmt = select(LanguageComment).where(LanguageComment.id == new_comment.id)
        check_result = await db.execute(check_stmt)
        saved = check_result.scalar_one_or_none()
        print(
            f"✅ [DEBUG] Comment saved: id={saved.id if saved else 'None'}, parent_id={saved.parent_id if saved else 'None'}"
        )

        # 🔥 ПРОВЕРКА 2: Считаем все комментарии для этого урока
        count_stmt = select(func.count(LanguageComment.id)).where(
            LanguageComment.lesson_id == lesson_id
        )
        count_result = await db.execute(count_stmt)
        total = count_result.scalar()
        print(f"📊 [DEBUG] Total comments in DB for lesson {lesson_id}: {total}")

        # 🔥 ПРОВЕРКА 3: Считаем только корневые (parent_id IS NULL)
        root_stmt = select(func.count(LanguageComment.id)).where(
            LanguageComment.lesson_id == lesson_id, LanguageComment.parent_id.is_(None)
        )
        root_result = await db.execute(root_stmt)
        root_count = root_result.scalar()
        print(
            f"📊 [DEBUG] Root comments (parent_id IS NULL) for lesson {lesson_id}: {root_count}"
        )

        # Загружаем пользователя для ответа
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

        print(f"❌ [DEBUG] EXCEPTION: {e}")
        print(f"❌ [DEBUG] Traceback:\n{traceback.format_exc()}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


# backend/main.py


# ..
# backend/main.py


# backend/main.py


# backend/main.py

# ✅ Добавь импорт в начало файла, если нет:
# ...


# backend/main.py


# ...


# backend/main.py


@app.get("/languages/lessons/{lesson_id}/comments")
async def get_language_lesson_comments(
    lesson_id: int,
    current_user: User | None = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # 🔥 МАЯЧОК — должен появиться в логах
    print(f"🚨 [MAYAK] GET /languages/lessons/{lesson_id}/comments CALLED")

    # 🔥 Прямое подключение БЕЗ пробелов в параметрах
    conn = await asyncpg.connect(
        host="localhost",  # ✅ БЕЗ пробела
        port=5432,
        user="postgres",  # ✅ БЕЗ пробела
        password="password",  # ✅ Замени на свой реальный пароль!
        database="nextproject",  # ✅ БЕЗ пробела
    )

    try:
        print(
            f"🔥 [ASYNC] Connected to DB, fetching comments for lesson_id={lesson_id}"
        )

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

        print(f"🔥 [ASYNC] Fetched {len(rows)} rows from DB")

        # Простое форматирование
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

        print(f"🔥 [ASYNC] Returning {len(result)} comments")
        if result:
            print(
                f"🔥 [ASYNC] First: id={result[0]['id']}, content='{result[0]['content']}'"
            )

        return result

    except Exception as e:
        import traceback

        print(f"❌ [ASYNC] ERROR: {e}")
        print(f"❌ [ASYNC] Traceback:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await conn.close()
        print(f"🔥 [ASYNC] Connection closed")


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


# 👍 Реакция на комментарий
# backend/main.py


@app.post("/languages/comments/{comment_id}/reaction")
async def react_to_language_comment(
    comment_id: int,
    reaction_data: dict,  # {"reaction_type": "like" | "dislike" | "none"}
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        print(f"🔍 [DEBUG] POST /languages/comments/{comment_id}/reaction")
        print(f"🔍 [DEBUG] reaction_data: {reaction_data}")

        reaction_type = reaction_data.get("reaction_type")

        if reaction_type == "none":
            # Удаляем реакцию
            stmt = delete(LanguageCommentReaction).where(
                LanguageCommentReaction.comment_id == comment_id,
                LanguageCommentReaction.user_id == current_user.id,
            )
            await db.execute(stmt)
            print(f"✅ [DEBUG] Reaction removed")
        else:
            is_like = reaction_type == "like"
            # UPSERT: обновить или создать
            stmt = (
                insert(LanguageCommentReaction)
                .values(comment_id=comment_id, user_id=current_user.id, is_like=is_like)
                .on_conflict_do_update(
                    index_elements=["comment_id", "user_id"], set_={"is_like": is_like}
                )
            )
            await db.execute(stmt)
            print(f"✅ [DEBUG] Reaction {'liked' if is_like else 'disliked'}")

        await db.commit()

        # ✅ Возвращаем обновлённые статистики
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

        print(f"❌ [DEBUG] EXCEPTION in react_to_language_comment: {e}")
        print(f"❌ [DEBUG] Traceback:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


# ============================================================================
# 📚 ЕГЭ: СТАТИЧЕСКИЕ МАРШРУТЫ (ПЕРВЫМИ!)
# ============================================================================

EGE_SLUGS = ["math-profile", "physics-ege", "russian-ege", "informatics-ege"]


# ✅ Список предметов ЕГЭ (статический — должен быть ДО /ege/{slug})
@app.get("/ege/subjects", response_model=list[EgeSubjectOut])
async def get_subjects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EgeSubject).order_by(EgeSubject.title))
    return result.scalars().all()


# ✅ Все предметы ЕГЭ (фильтр по списку)
@app.get("/ege", response_model=list[EgeSubjectOut])
async def get_all_subjects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(EgeSubject)
        .where(EgeSubject.slug.in_(EGE_SLUGS))
        .order_by(EgeSubject.title)
    )
    return result.scalars().all()


# ============================================================================
# 📚 ЕГЭ: ДИНАМИЧЕСКИЕ МАРШРУТЫ (ПОСЛЕ СТАТИЧЕСКИХ!)
# ============================================================================


@app.get("/ege/{slug}")
async def get_subject_lessons(
    slug: str,
    current_user: User | None = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    subject_result = await db.execute(select(EgeSubject).where(EgeSubject.slug == slug))
    subject = subject_result.scalar_one_or_none()
    if not subject:
        raise HTTPException(status_code=404, detail=f"Subject '{slug}' not found")

    result = await db.execute(
        select(EgeLesson)
        .where(EgeLesson.subject_id == subject.id)
        .order_by(EgeLesson.created_at)
    )
    lessons = result.scalars().all()

    completed_lesson_ids = set()

    # 🔍 ОТЛАДКА: проверяем авторизацию и результаты
    if current_user:
        print(
            f"👤 [DEBUG] User authenticated: ID={current_user.id}, Email={current_user.email}"
        )

        for lesson in lessons:
            if lesson.test_id:
                try:
                    # Ищем лучший результат для этого теста
                    best = await db.execute(
                        select(func.max(TestResult.score)).where(
                            TestResult.user_id == current_user.id,
                            TestResult.test_id == lesson.test_id,
                        )
                    )
                    best_score = best.scalar_one_or_none()
                    print(
                        f"📊 [DEBUG] Lesson '{lesson.title}' (test_id={lesson.test_id}) -> best_score={best_score}"
                    )

                    if best_score is not None and best_score >= 75.0:
                        completed_lesson_ids.add(lesson.id)
                        print(f"✅ [DEBUG] Lesson {lesson.id} MARKED AS COMPLETED!")
                except Exception as e:
                    print(f"❌ [DEBUG] Error querying TestResult: {e}")
    else:
        print("⚠️ [DEBUG] NO USER (guest mode) -> is_completed will be False")

    # Формируем ответ
    lessons_out = []
    for lesson in lessons:
        lessons_out.append(
            EgeLessonOut(
                id=lesson.id,
                title=lesson.title,
                slug=lesson.slug,
                description=lesson.description,
                time_minutes=lesson.time_minutes,
                test_id=lesson.test_id,
                is_completed=lesson.id in completed_lesson_ids,
                subject_id=getattr(lesson, "subject_id", None),
                content=getattr(lesson, "content", None),
                created_at=getattr(lesson, "created_at", None),
                updated_at=getattr(lesson, "updated_at", None),
            )
        )

    return lessons_out


@app.get("/ege/{subject}/{lesson}", response_model=EgeLessonOut)
async def get_single_lesson(
    subject: str, lesson: str, db: AsyncSession = Depends(get_db)
):
    subject_result = await db.execute(
        select(EgeSubject).where(EgeSubject.slug == subject)
    )
    subject_obj = subject_result.scalar_one_or_none()
    if not subject_obj:
        raise HTTPException(status_code=404, detail="Subject not found")
    result = await db.execute(
        select(EgeLesson).where(
            EgeLesson.slug == lesson, EgeLesson.subject_id == subject_obj.id
        )
    )
    lesson_obj = result.scalar_one_or_none()
    if not lesson_obj:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson_obj


# 👁️ Записать просмотр урока (по slug, только авторизованные)
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


# 📥 Получить просмотры урока (по slug, публичный)
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


# ============================================================================
# 💻 КУРСЫ: СТАТИЧЕСКИЕ МАРШРУТЫ (ПЕРВЫМИ!)
# ============================================================================


# ✅ Список курсов (исключая ЕГЭ) — статический, должен быть ДО /courses/{slug}
# backend/main.py


@app.get("/courses/subjects", response_model=list[EgeSubjectOut])
async def get_course_subjects(
    category: str | None = None,  # ✅ Фильтр по категории
    search: str | None = None,  # ✅ Поиск по title
    db: AsyncSession = Depends(get_db),
):
    # Базовый запрос: исключаем ЕГЭ-предметы
    query = select(EgeSubject).where(~EgeSubject.slug.in_(EGE_SLUGS))

    # 🔍 Фильтр по категории
    if category:
        query = query.where(EgeSubject.category == category)

    # 🔍 Поиск по названию (регистронезависимый)
    if search:
        query = query.where(EgeSubject.title.ilike(f"%{search}%"))

    # Сортировка
    query = query.order_by(EgeSubject.title)

    result = await db.execute(query)
    return result.scalars().all()


# ============================================================================
# 💻 КУРСЫ: ДИНАМИЧЕСКИЕ МАРШРУТЫ (ПОСЛЕ СТАТИЧЕСКИХ!)
# ============================================================================


# backend/main.py


# backend/main.py


# backend/main.py


@app.get("/courses/{slug}")
async def get_course_lessons(slug: str, db: AsyncSession = Depends(get_db)):
    if slug in EGE_SLUGS:
        raise HTTPException(
            status_code=404, detail="This subject belongs to /ege/ section"
        )

    subject_result = await db.execute(select(EgeSubject).where(EgeSubject.slug == slug))
    subject = subject_result.scalar_one_or_none()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    # 🔍 Загружаем юниты курса
    units_result = await db.execute(
        select(CourseUnit, func.count(EgeLesson.id).label("lesson_count"))
        .outerjoin(EgeLesson, EgeLesson.unit_id == CourseUnit.id)
        .where(CourseUnit.subject_id == subject.id)
        .group_by(CourseUnit.id)
        .order_by(CourseUnit.unit_number)
    )

    units_with_counts = [
        {
            "id": unit.id,
            "title": unit.title,
            "unit_number": unit.unit_number,
            "description": unit.description,
            "lesson_count": count,
        }
        for unit, count in units_result.all()
    ]

    # 🔍 Загружаем уроки с явным JOIN для сортировки
    lessons_result = await db.execute(
        select(EgeLesson)
        .outerjoin(CourseUnit, EgeLesson.unit_id == CourseUnit.id)  # ✅ FIX: явный JOIN
        .options(selectinload(EgeLesson.unit))
        .where(EgeLesson.subject_id == subject.id)
        .order_by(
            EgeLesson.unit_id.nulls_last(),
            CourseUnit.unit_number.nulls_last(),  # ✅ Теперь работает
            EgeLesson.created_at.asc(),
        )
    )
    lessons = lessons_result.scalars().all()

    return {"lessons": lessons, "units": units_with_counts}


@app.get("/courses/{slug}/{lesson_slug}", response_model=EgeLessonOut)
async def get_course_lesson_detail(
    slug: str, lesson_slug: str, db: AsyncSession = Depends(get_db)
):
    # Исключаем ЕГЭ
    if slug in EGE_SLUGS:
        raise HTTPException(
            status_code=404, detail="This subject belongs to /ege/ section"
        )

    # Находим предмет
    subject_result = await db.execute(select(EgeSubject).where(EgeSubject.slug == slug))
    subject = subject_result.scalar_one_or_none()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    # 🔥 Загружаем урок с ЯВНЫМ loading отношения unit
    result = await db.execute(
        select(EgeLesson)
        .where(EgeLesson.subject_id == subject.id, EgeLesson.slug == lesson_slug)
        .options(
            selectinload(EgeLesson.unit)  # ✅ FIX: загружаем unit заранее!
        )
    )

    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    return lesson  # ✅ Теперь Pydantic сможет безопасно прочитать lesson.unit


# ============================================================================
# 📰 СТАТЬИ: СТАТИЧЕСКИЕ МАРШРУТЫ (ПЕРВЫМИ!)
# ============================================================================

ARTICLE_TOPICS_LIST = [
    "Забота о себе",
    "Продуктивность",
    "Программирование",
    "Наука",
]


# ✅ Список статей (статический — ДО /articles/{slug})
# backend/main.py


@app.get("/articles", response_model=list[ArticleOut])
async def get_articles(
    topic: str | None = None,
    search: str | None = None,  # ✅ Новый параметр для поиска
    db: AsyncSession = Depends(get_db),
):
    # Базовый запрос
    query = select(Article)

    # 🔍 Фильтр по теме
    if topic and topic != "Все":
        query = query.where(Article.topic == topic)

    # 🔍 Поиск по названию (регистронезависимый)
    if search:
        query = query.where(Article.title.ilike(f"%{search}%"))

    # Сортировка по дате (новые сначала)
    query = query.order_by(Article.created_at.desc())

    result = await db.execute(query)
    return result.scalars().all()


# backend/main.py — добавь эту функцию


async def mark_lesson_completed_if_needed(
    user_id: int,
    lesson_id: int,
    score: float,
    db: AsyncSession,
    threshold: float = 75.0,
) -> bool:
    """
    Если score >= threshold — помечаем урок как пройденный (если ещё не помечен).
    Возвращает True, если урок был отмечен как пройденный в этом вызове.
    """
    if score < threshold:
        return False

    # Проверяем, не отмечен ли уже
    existing = await db.execute(
        select(UserCompletedLesson).where(
            UserCompletedLesson.user_id == user_id,
            UserCompletedLesson.lesson_id == lesson_id,
        )
    )
    if existing.scalar_one_or_none():
        return True  # Уже был пройден раньше

    # Отмечаем как пройденный
    completed = UserCompletedLesson(user_id=user_id, lesson_id=lesson_id)
    db.add(completed)
    await db.commit()
    return True


# ============================================================================
# 📰 СТАТЬИ: ДИНАМИЧЕСКИЕ МАРШРУТЫ
# ============================================================================


@app.get("/articles/{slug}", response_model=ArticleOut)
async def get_article(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Article).where(Article.slug == slug))
    article = result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article


# 👁️ Просмотр статьи
@app.post("/articles/{slug}/view", status_code=status.HTTP_201_CREATED)
async def record_article_view(
    slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    article_result = await db.execute(select(Article).where(Article.slug == slug))
    article = article_result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    stmt = insert(ArticleView).values(user_id=current_user.id, article_id=article.id)
    stmt = stmt.on_conflict_do_nothing(index_elements=["user_id", "article_id"])
    await db.execute(stmt)
    await db.commit()
    return {"message": "View recorded"}


# 👍 Реакция на статью
@app.post("/articles/{slug}/reaction", status_code=status.HTTP_200_OK)
async def set_article_reaction(
    slug: str,
    data: ArticleReactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    article_result = await db.execute(select(Article).where(Article.slug == slug))
    article = article_result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    if data.reaction_type == "none":
        new_is_like = None
    else:
        new_is_like = data.reaction_type == "like"
    existing_stmt = select(ArticleReaction).where(
        ArticleReaction.user_id == current_user.id,
        ArticleReaction.article_id == article.id,
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
                ArticleReaction(
                    user_id=current_user.id, article_id=article.id, is_like=new_is_like
                )
            )
        await db.commit()
        return {"message": f"Reaction set to {data.reaction_type}"}


# 📊 Статистика статьи
@app.get("/articles/{slug}/stats", response_model=ArticleStatsOut)
async def get_article_stats(
    slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    article_result = await db.execute(select(Article).where(Article.slug == slug))
    article = article_result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    likes = (
        await db.scalar(
            select(func.count(ArticleReaction.id)).where(
                ArticleReaction.article_id == article.id,
                ArticleReaction.is_like == True,
            )
        )
        or 0
    )
    dislikes = (
        await db.scalar(
            select(func.count(ArticleReaction.id)).where(
                ArticleReaction.article_id == article.id,
                ArticleReaction.is_like == False,
            )
        )
        or 0
    )
    views = (
        await db.scalar(
            select(func.count(ArticleView.id)).where(
                ArticleView.article_id == article.id
            )
        )
        or 0
    )
    user_reaction = None
    if current_user:
        stmt = select(ArticleReaction.is_like).where(
            ArticleReaction.user_id == current_user.id,
            ArticleReaction.article_id == article.id,
        )
        res = await db.execute(stmt)
        val = res.scalar_one_or_none()
        if val is True:
            user_reaction = "like"
        elif val is False:
            user_reaction = "dislike"
    return ArticleStatsOut(
        likes=likes, dislikes=dislikes, views=views, user_reaction=user_reaction
    )


# ============================================================================
# 🔁 УНИВЕРСАЛЬНЫЕ ЭНДПОИНТЫ ДЛЯ УРОКОВ (ПО ID) — РАБОТАЮТ ДЛЯ /ege/ И /courses/
# ============================================================================


@app.get("/lessons/{lesson_id}", response_model=EgeLessonOut)
async def get_lesson_by_id(lesson_id: int, db: AsyncSession = Depends(get_db)):
    lesson = await db.get(EgeLesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson


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


# ============================================================================
# 🧪 ТЕСТЫ
# ============================================================================


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
    }


@app.post("/tests/{test_id}/submit", response_model=TestSubmissionResult)
async def submit_test(
    test_id: int,
    submission: TestSubmission,
    current_user: User = Depends(
        get_current_user
    ),  # ✅ ДОБАВЛЕНО: теперь current_user определён
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
        lesson_id=test.lesson_id,  # ✅ Берём из объекта теста
        score=score,
        passed=passed,
    )
    db.add(test_result)
    await db.commit()
    return TestSubmissionResult(
        score=round(score, 1),
        passed=passed,
        total_questions=total,
        correct_count=correct,
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
    return TestResultOut(
        score=result_.score,
        passed=result_.passed,
        completed_at=datetime.now(timezone.utc),
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


# ============================================================================
# 👍👎 РЕАКЦИИ НА УРОКИ (СТАРОЕ — ОСТАВЛЕНО ДЛЯ СОВМЕСТИМОСТИ)
# ============================================================================


# 📤 Поставить реакцию (только авторизованным)
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


##########ВСЕ ЧТО СВЯЗАННО С КОММЕНТАРИЯМИ К УРОКАМ СНИЗУ
@app.delete("/comments/{comment_id}", status_code=status.HTTP_200_OK)
async def delete_comment(
    comment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Находим комментарий
    comment = await db.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Проверяем права: только автор может удалить
    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Not allowed to delete this comment"
        )

    # Удаляем
    await db.delete(comment)
    await db.commit()

    # ✅ 204 No Content — тело ответа не нужно
    return {"message": "Comment deleted", "id": comment_id}


@app.post("/comments/{comment_id}/reaction", status_code=status.HTTP_200_OK)
async def set_comment_reaction(
    comment_id: int,
    data: CommentReactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Проверяем, что комментарий существует
    comment = await db.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Определяем новое значение
    if data.reaction_type == "none":
        new_is_like = None
    else:
        new_is_like = data.reaction_type == "like"

    # Ищем существующую реакцию
    existing_stmt = select(CommentReaction).where(
        CommentReaction.user_id == current_user.id,
        CommentReaction.comment_id == comment_id,
    )
    res = await db.execute(existing_stmt)
    existing_reaction = res.scalar_one_or_none()

    if new_is_like is None:
        # Удаление реакции
        if existing_reaction:
            await db.delete(existing_reaction)
            await db.commit()
        return {"message": "Reaction removed"}
    else:
        # Обновление или создание
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

    # Считаем лайки
    likes = (
        await db.scalar(
            select(func.count(CommentReaction.id)).where(
                CommentReaction.comment_id == comment_id,
                CommentReaction.is_like == True,
            )
        )
        or 0
    )

    # Считаем дизлайки
    dislikes = (
        await db.scalar(
            select(func.count(CommentReaction.id)).where(
                CommentReaction.comment_id == comment_id,
                CommentReaction.is_like == False,
            )
        )
        or 0
    )

    # Реакция текущего пользователя
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
    # Считаем реакции
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

    return {
        "id": comment.id,
        "user_id": comment.user_id,
        "username": comment.user.username if comment.user else "Unknown",
        "content": comment.content,
        "parent_id": comment.parent_id,
        "created_at": comment.created_at,
        "updated_at": comment.updated_at,
        "likes": likes,
        "dislikes": dislikes,
        "user_reaction": user_reaction,
        "replies": [],  # Заполним ниже если нужно
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

    # Загружаем корневые комментарии + пользователи + ответы + пользователи ответов
    result = await db.execute(
        select(Comment)
        .where(Comment.lesson_id == lesson_id, Comment.parent_id.is_(None))
        .options(
            selectinload(Comment.user),
            selectinload(Comment.replies).selectinload(Comment.user),
        )
        .order_by(Comment.created_at.asc())
    )
    comments = result.scalars().all()

    # Форматируем с реакциями
    formatted = []
    for c in comments:
        c_data = await format_comment_with_stats(c, db, current_user)
        # Обрабатываем ответы
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

    result = await db.execute(
        select(Comment)
        .where(Comment.article_id == article_id, Comment.parent_id.is_(None))
        .options(
            selectinload(Comment.user),
            selectinload(Comment.replies).selectinload(Comment.user),
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


# 📤 Добавить комментарий (исправленная версия)
@app.post("/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
async def create_comment(
    data: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Получаем lesson_id или article_id из тела запроса
    lesson_id = data.lesson_id if hasattr(data, "lesson_id") else None
    article_id = data.article_id if hasattr(data, "article_id") else None

    if (lesson_id is None) == (article_id is None):
        raise HTTPException(
            status_code=400, detail="Specify either lesson_id or article_id"
        )

    # Проверяем существование объекта
    if lesson_id:
        obj = await db.get(EgeLesson, lesson_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Lesson not found")
    else:
        obj = await db.get(Article, article_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Article not found")

    # Если это ответ — проверяем родительский комментарий
    if data.parent_id:
        parent = await db.get(Comment, data.parent_id)
        if not parent or (
            parent.lesson_id != lesson_id and parent.article_id != article_id
        ):
            raise HTTPException(status_code=400, detail="Invalid parent comment")

    # Создаём комментарий
    comment = Comment(
        user_id=current_user.id,
        lesson_id=lesson_id,
        article_id=article_id,
        content=data.content,
        parent_id=data.parent_id,
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)  # ✅ refresh подгружает id и created_at

    # ✅ Возвращаем без nested replies (они пустые при создании)
    return CommentOut(
        id=comment.id,
        user_id=comment.user_id,
        username=current_user.username,  # ✅ Берём из current_user, не из comment.user
        content=comment.content,
        parent_id=comment.parent_id,
        created_at=comment.created_at,
        replies=[],  # ✅ Пустой список, чтобы не триггерить lazy load
    )


# ✏️ Обновить комментарий


# ✏️ Обновить комментарий (только автор)
@app.patch("/comments/{comment_id}", response_model=CommentOut)
async def update_comment(
    comment_id: int,
    data: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # ✅ Загружаем комментарий с пользователем
    result = await db.execute(
        select(Comment)
        .where(Comment.id == comment_id)
        .options(selectinload(Comment.user))  # ✅ Явно загружаем user
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

    # ✅ Берём username из загруженного user или из current_user
    return CommentOut(
        id=comment.id,
        user_id=comment.user_id,
        username=comment.user.username if comment.user else current_user.username,
        content=comment.content,
        parent_id=comment.parent_id,
        created_at=comment.created_at,
        replies=[],
    )


# 🏥 HEALTH CHECK
# ============================================================================


@app.get("/health")
async def health():
    return {"status": "ok", "db": "postgresql_asyncpg"}
