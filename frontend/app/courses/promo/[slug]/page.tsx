// frontend/app/courses/promo/[slug]/page.tsx
"use client";
import Toast from "@/components/Toast";
import { useTokens } from "@/hooks/useTokens";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  Clock,
  Award,
  CheckCircle,
  Edit2,
  Trash2,
  X,
  Star,
  Users,
  MessageSquare,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

type PromoCourse = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  image: string | null;
  category: string | null;
  is_favorite: boolean;
  about: string | null; // 🔥 Новое поле
  duration_minutes: number | null;
  certificate_available: boolean;
  enrolled_count?: number;
  is_enrolled?: boolean; // 🔥 Добавь это поле
  rating?: number | null;
  completion_percent?: number | null;
  teachers?: Teacher[]; // 🔥 Список учителей
};

type Teacher = {
  id: number;
  full_name: string;
  image: string | null;
  about: string | null;
};
type Review = {
  id: number;
  user_id: number;
  username: string;
  avatar_url: string | null;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string | null;
  likes: number;
  dislikes: number;
  user_reaction: "like" | "dislike" | null;
};

type ReviewStats = {
  average_rating: number;
  total_reviews: number;
  user_review: Review | null;
};

export default function CoursePromoPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [course, setCourse] = useState<PromoCourse | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [reactingReviewId, setReactingReviewId] = useState<number | null>(null);
  const { rewardTokens } = useTokens();
  const [toast, setToast] = useState<string | null>(null);

  // frontend/app/courses/promo/[slug]/page.tsx
  const showToast = (message: string) => {
    setToast(message);
  };

  // frontend/app/courses/promo/[slug]/page.tsx

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("🔍 [Promo] Fetching data for slug:", slug);

        // 1️⃣ Загружаем базовую инфо о курсе
        const courses = await apiFetch("/courses/subjects");
        const found = courses.find((c: any) => c.slug === slug);

        if (!found) {
          console.error("❌ Course not found in /courses/subjects");
          setLoading(false);
          return;
        }

        console.log("✅ Found course:", { id: found.id, title: found.title });

        // 2️⃣ Загружаем ДЕТАЛИ курса (about, teachers, is_enrolled, completion_percent)
        const token = localStorage.getItem("token");
        let courseDetails: any = {};
        let isEnrolledValue = false;

        if (token) {
          try {
            courseDetails = await apiFetch(`/courses/promo/${slug}`);
            console.log("✅ Course details:", {
              is_enrolled: courseDetails.is_enrolled,
              completion_percent: courseDetails.completion_percent,
              has_about: !!courseDetails.about,
              teachers_count: courseDetails.teachers?.length || 0,
            });
            isEnrolledValue = courseDetails.is_enrolled || false;
          } catch (err) {
            console.warn("⚠️ Could not load course details:", err);
          }
        }

        // 3️⃣ Объединяем базовые данные с деталями
        const mergedCourse: PromoCourse = {
          ...found,
          about: courseDetails.about || null,
          teachers: courseDetails.teachers || [],
          completion_percent: courseDetails.completion_percent ?? null, // 🔥 Добавь это!
          is_enrolled: courseDetails.is_enrolled ?? false, // 🔥 И это!
        };

        setCourse(mergedCourse);
        setIsEnrolled(isEnrolledValue);

        console.log("✅ Merged course:", {
          id: mergedCourse.id,
          has_about: !!mergedCourse.about,
          teachers_count: mergedCourse.teachers?.length || 0,
        });

        // 4️⃣ Загружаем отзывы
        try {
          const reviewsData = await apiFetch(`/courses/${found.id}/reviews`);
          console.log("✅ Reviews loaded:", {
            total: reviewsData.stats?.total_reviews,
            user_review: reviewsData.stats?.user_review ? "exists" : "null",
          });
          setReviews(reviewsData.reviews || []);
          setReviewStats(reviewsData.stats || null);
        } catch (err) {
          console.error("❌ Could not load reviews:", err);
        }
      } catch (err) {
        console.error("❌ Failed to load promo:", err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchData();
  }, [slug]);
  const handleEnroll = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    if (!course?.slug) return;

    setEnrolling(true);
    try {
      await apiFetch(`/courses/${course.slug}/enroll`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsEnrolled(true);

      // 🔥 Начисляем токены за первую запись на курс
      // (в реальном проекте проверяй, первый ли это курс)
      await rewardTokens(20, "first_course_enrolled");
      setToast("+20 токенов!"); // Показываем уведомление
      setTimeout(() => router.push(`/courses/${slug}`), 1000);
    } catch (err: any) {
      console.error("❌ Failed to enroll:", err);
      alert(err.message || "Ошибка при записи");
    } finally {
      setEnrolling(false);
    }
  };
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token || !course?.id) return;

    // Валидация: минимум 50 слов
    const words = newReview.comment
      .trim()
      .split(/\s+/)
      .filter((w) => w);
    if (words.length < 50) {
      setCommentError(`Минимум 50 слов. Сейчас: ${words.length}`);
      return;
    }
    setCommentError(null);
    setSubmittingReview(true);

    try {
      if (isEditing && reviewStats?.user_review?.id) {
        // 🔥 Редактирование
        await apiFetch(`/reviews/${reviewStats.user_review.id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rating: newReview.rating,
            comment: newReview.comment.trim(),
          }),
        });
      } else {
        // 🔥 Создание нового
        await apiFetch(`/courses/${course.id}/reviews`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rating: newReview.rating,
            comment: newReview.comment.trim(),
          }),
        });
      }
      // Перезагружаем отзывы
      const data = await apiFetch(`/courses/${course.id}/reviews`);
      setReviews(data.reviews || []);
      setReviewStats(data.stats || null);
      setNewReview({ rating: 5, comment: "" });
      setIsEditing(false);
    } catch (err: any) {
      alert(err.message || "Ошибка");
    } finally {
      setSubmittingReview(false);
    }
  };
  const handleDeleteReview = async () => {
    if (!confirm("Удалить отзыв?")) return;
    const token = localStorage.getItem("token");
    if (!token || !reviewStats?.user_review?.id) return;

    try {
      await apiFetch(`/reviews/${reviewStats.user_review.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await apiFetch(`/courses/${course?.id}/reviews`);
      setReviews(data.reviews || []);
      setReviewStats(data.stats || null);
    } catch (err: any) {
      alert(err.message || "Ошибка при удалении");
    }
  };
  const handleReaction = async (
    reviewId: number,
    type: "like" | "dislike" | null,
  ) => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    if (reactingReviewId) return; // Защита от двойных кликов

    setReactingReviewId(reviewId);
    try {
      if (type === null) {
        // Убрать реакцию
        await apiFetch(`/reviews/${reviewId}/reaction`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reaction: type }),
        });
      } else {
        // Поставить реакцию
        await apiFetch(`/reviews/${reviewId}/reaction?reaction=${type}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
      // Обновляем локально счётчики
      setReviews((prev) =>
        prev.map((r) => {
          if (r.id !== reviewId) return r;
          // Пересчитываем (упрощённо)
          return { ...r, user_reaction: type };
        }),
      );
    } catch (err) {
      console.error("❌ Reaction failed:", err);
    } finally {
      setReactingReviewId(null);
      // Перезагружаем отзывы для точных счётчиков
      if (course?.id) {
        const data = await apiFetch(`/courses/${course.id}/reviews`);
        setReviews(data.reviews || []);
        setReviewStats(data.stats || null);
      }
    }
  };

  // 🔹 Подготовка формы к редактированию
  const startEditing = () => {
    if (reviewStats?.user_review) {
      setNewReview({
        rating: reviewStats.user_review.rating,
        comment: reviewStats.user_review.comment,
      });
      setIsEditing(true);
    }
  };
  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    if (!course?.id) return;

    try {
      const isFav = course.is_favorite;
      await apiFetch(`/courses/${course.id}/favorite`, {
        method: isFav ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourse((prev) => (prev ? { ...prev, is_favorite: !isFav } : prev));
    } catch (err) {
      console.error("❌ Failed to toggle favorite:", err);
    }
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "—";
    if (minutes < 60) return `${minutes} мин`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}ч ${m}мин` : `${h}ч`;
  };

  const renderStars = (
    rating: number,
    interactive = false,
    onChange?: (r: number) => void,
  ) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type={interactive ? "button" : undefined}
          onClick={interactive && onChange ? () => onChange(star) : undefined}
          disabled={!interactive}
          className={interactive ? "p-0.5 hover:scale-110 transition" : ""}
        >
          <Star
            className={`w-5 h-5 ${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} ${interactive ? "cursor-pointer" : ""}`}
          />
        </button>
      ))}
    </div>
  );

  // 🔥 Отладка: показываем состояние
  useEffect(() => {
    console.log(
      "🔍 [Render] course:",
      course ? { id: course.id, slug: course.slug } : null,
    );
    console.log("🔍 [Render] isEnrolled:", isEnrolled);
    console.log("🔍 [Render] reviewStats:", reviewStats);
  }, [course, isEnrolled, reviewStats]);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600" />
      </main>
    );
  }

  if (!course) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center py-20 px-4">
        <p className="text-red-600 text-lg mb-4">Курс не найден</p>
        <Link
          href="/courses"
          className="text-purple-600 hover:underline flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Вернуться к курсам
        </Link>
      </main>
    );
  }
  const canWriteReview = isEnrolled && (course?.completion_percent ?? 0) >= 75;
  // Подсчёт слов для отображения
  const wordCount = newReview.comment
    .trim()
    .split(/\s+/)
    .filter((w) => w).length;

  return (
    <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 w-full max-w-[1200px] mx-auto">
      <div className="w-full mb-6">
        <Link
          href="/courses"
          className="text-gray-600 hover:text-purple-600 transition flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" /> Все курсы
        </Link>
      </div>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <div className="bg-white rounded-lg  shadow-xs overflow-hidden w-full">
        {/* 🔹 Обложка + избранное */}
        <div className="relative flex flex-row p-[20px]">
          {course.image && (
            <div className="h-64 w-[370px] bg-gray-100 overflow-hidden">
              <img
                src={`/${course.image}`}
                alt={course.title}
                className="w-full h-full rounded-lg object-cover"
                onError={(e) =>
                  (e.target as HTMLImageElement).parentElement?.classList.add(
                    "hidden",
                  )
                }
              />
            </div>
          )}

          <div className=" ml-[30px]">
            <div className="flex items-start justify-between mb-4">
              {course.category && (
                <span className="inline-block px-3 py-1 text-xs font-medium rounded-lg bg-purple-100 text-purple-700">
                  {course.category}
                </span>
              )}
              {course.certificate_available && (
                <span className="inline-flex items-center gap-1 mr-[60px] px-3 py-1 text-xs font-medium rounded-lg bg-yellow-100 text-yellow-800">
                  <Award className="w-3 h-3" /> Сертификат
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {course.title}
            </h1>
            {course.description && (
              <p className="text-gray-600 leading-relaxed mb-6 whitespace-pre-wrap">
                {course.description}
              </p>
            )}

            {/* 🔹 Мета-информация */}
            <div className="flex flex-wrap items-center gap-4 py-4 border-y border-gray-100 mb-6">
              {course.duration_minutes && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(course.duration_minutes)}</span>
                </div>
              )}
              {course.enrolled_count !== undefined && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{course.enrolled_count}+ студентов</span>
                </div>
              )}
              {reviewStats?.average_rating != null && (
                <div className="flex items-center gap-2">
                  {renderStars(Number(reviewStats.average_rating))}
                  <span className="text-sm text-gray-600">
                    {/* 🔥 Преобразуем в число и проверяем */}
                    {Number(reviewStats.average_rating).toFixed(1)} (
                    {reviewStats.total_reviews || 0})
                  </span>
                </div>
              )}
              <p className="text-sm text-gray-500">
                {isEnrolled ? "Вы уже записаны" : "Запишитесь"}
              </p>
            </div>

            {/* 🔹 Кнопка записи — используем slug */}
            <div className="flex flex-row ">
              {isEnrolled ? (
                <Link
                  href={`/courses/${slug}`}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition "
                >
                  Продолжить обучение
                </Link>
              ) : (
                <div className="flex flew-row w-full">
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling || !course?.slug}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4  bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-50"
                  >
                    {enrolling ? "Записываем..." : "Записаться на курс"}
                  </button>

                  <Link
                    href={`/courses/${slug}`}
                    className="w-full sm:w-auto ml-[20px] flex items-center justify-center gap-2 px-8 py-4  bg-white border-[1px] border-purple-700 text-purple-700 hover:bg-purple-100 cursor-pointer  rounded-lg font-semibold transition disabled:opacity-50"
                  >
                    {enrolling ? "Направляем..." : "Посмотреть"}
                  </Link>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={toggleFavorite}
            className={`absolute top-4 right-4 z-10 p-2 rounded-full transition  ${course.is_favorite ? "bg-red-500 text-white hover:bg-red-600" : "bg-white/90 text-gray-400 hover:text-red-500 hover:bg-white"}`}
            title={
              course.is_favorite
                ? "Убрать из избранного"
                : "Добавить в избранное"
            }
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill={course.is_favorite ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        </div>

        {/* 🔹 Бейдж: можно оставить отзыв */}
        {canWriteReview && !reviewStats?.user_review && (
          <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-100 border border-purple-300 rounded-full">
            <MessageSquare className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">
              ✅ У вас {course.completion_percent}% — можно оставить или
              редактировать отзыв
            </span>
          </div>
        )}
      </div>

      <div className="bg-white w-full my-[30px] p-[20px]  rounded-lg shadow-xs">
        {course.completion_percent != null &&
          course.completion_percent >= 90 && (
            <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-900" />
              <span className="text-sm font-semibold text-green-950">
                Курс завершён! {course.completion_percent}%
              </span>
            </div>
          )}

        {course.is_enrolled && course.completion_percent >= 90 && (
          <div className="mt-6 bg-amber-200 p-[30px] py-[40px] my-[20px] mx-[30px] rounded-lg rotate-3 ">
            <div className="flex rounded-lg items-center bg-amber-500 justify-between p-[10px] -rotate-3">
              <div>
                <p className="text-lg font-bold text-yellow-950">
                  🎓 Поздравляем! Вы прошли курс на {course.completion_percent}%
                </p>
                <p className="text-sm text-yellow-900">
                  Получите сертификат об окончании и отправьте его друзьям!
                </p>
                <p className="text-yellow-950 text-sm">
                  {" "}
                  Это бесплатно, за отправку сертификата +40px
                </p>
              </div>
              <Link
                href={`/courses/${slug}/certificate`}
                className="px-4 py-2 bg-amber-400 text-white rounded-lg font-semibold hover:bg-amber-600 transition whitespace-nowrap"
              >
                Получить сертификат
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="mb-[20px] w-full bg-white p-[20px] rounded-lg shadow-xs">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">О курсе</h2>
        {course.about ? (
          <div
            className="prose prose-purple max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: course.about }}
          />
        ) : (
          <p className="text-gray-500 italic">
            Пока ничего не написано о курсе
          </p>
        )}
      </div>

      {/* 🔹 Преподаватели */}
      {course.teachers && course.teachers.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Преподаватели курса
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {course.teachers.map((teacher) => (
              <div
                key={teacher.id}
                className="p-4 bg-white  rounded-lg shadow-xs transition"
              >
                <div className="flex items-start gap-4">
                  {teacher.image ? (
                    <img
                      src={`/${teacher.image}`}
                      alt={teacher.full_name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-purple-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-lg border-2 border-purple-200">
                      {teacher.full_name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {teacher.full_name}
                    </h3>
                    {teacher.about && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {teacher.about}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🔹 Отзывы */}

      <div className="w-full mt-8 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" /> Отзывы (
          {reviewStats?.total_reviews || 0})
        </h2>
        {/* 🔹 Форма отзыва / просмотр / редактирование — ПРАВИЛЬНЫЙ ПОРЯДОК */}
        <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
          {!isEnrolled ? (
            // ❌ Не записан на курс
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 mb-2">
                🔐 Чтобы оставить отзыв, сначала{" "}
                <Link
                  href={`/courses/${slug}`}
                  className="text-purple-600 font-medium hover:underline"
                >
                  запишитесь на курс
                </Link>
              </p>
            </div>
          ) : !canWriteReview ? (
            // ❌ Прогресс <75%
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 mb-2">
                📚 Чтобы оставить отзыв, завершите минимум 75% курса
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all"
                  style={{ width: `${course.completion_percent}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">
                Ваш прогресс: {course.completion_percent}%
              </p>
            </div>
          ) : isEditing ? (
            // ✏️ РЕДАКТИРОВАНИЕ — ПРОВЕРЯЕМ ЭТО ПЕРВЫМ!
            <form onSubmit={handleSubmitReview}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-purple-800">
                  Редактировать отзыв:
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setNewReview({ rating: 5, comment: "" });
                  }}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mb-3">
                {renderStars(newReview.rating, true, (r) =>
                  setNewReview((prev) => ({ ...prev, rating: r })),
                )}
              </div>
              <textarea
                value={newReview.comment}
                onChange={(e) =>
                  setNewReview((prev) => ({ ...prev, comment: e.target.value }))
                }
                placeholder="Ваш отзыв (мин. 50 слов)..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                rows={4}
              />
              <div className="flex justify-between items-center mt-2">
                <p
                  className={`text-xs ${commentError ? "text-red-600" : "text-gray-500"}`}
                >
                  {commentError || `${wordCount}/50 слов`}
                </p>
                <button
                  type="submit"
                  disabled={submittingReview || wordCount < 50}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {submittingReview ? "Сохранение..." : "Сохранить изменения"}
                </button>
              </div>
            </form>
          ) : reviewStats?.user_review ? (
            // ✅ Просмотр своего отзыва с кнопками
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm font-medium text-green-800">Ваш отзыв:</p>
                <div className="flex gap-2">
                  <button
                    onClick={startEditing}
                    className="p-1.5 text-gray-600 hover:text-purple-600 hover:bg-purple-100 rounded transition"
                    title="Редактировать"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDeleteReview}
                    className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-100 rounded transition"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-start gap-3">
                {renderStars(reviewStats.user_review.rating)}
                <p className="text-gray-700 text-sm whitespace-pre-wrap">
                  {reviewStats.user_review.comment}
                </p>
              </div>
            </div>
          ) : (
            // ➕ Новая форма отзыва
            <form onSubmit={handleSubmitReview}>
              <p className="text-sm text-purple-800 mb-3 font-medium">
                Оцените курс:
              </p>
              <div className="mb-3">
                {renderStars(newReview.rating, true, (r) =>
                  setNewReview((prev) => ({ ...prev, rating: r })),
                )}
              </div>
              <textarea
                value={newReview.comment}
                onChange={(e) =>
                  setNewReview((prev) => ({ ...prev, comment: e.target.value }))
                }
                placeholder="Напишите ваш отзыв (минимум 50 слов)..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                rows={4}
              />
              <div className="flex justify-between items-center mt-2">
                <p
                  className={`text-xs ${commentError ? "text-red-600" : "text-gray-500"}`}
                >
                  {commentError || `${wordCount}/50 слов`}
                </p>
                <button
                  type="submit"
                  disabled={submittingReview || wordCount < 50}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {submittingReview ? "Отправка..." : "Оставить отзыв"}
                </button>
              </div>
            </form>
          )}
        </div>
        {/* 🔹 Форма отзыва / сообщение о доступе */}

        {/* 🔹 Список отзывов */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Пока нет отзывов. Будьте первым! ✨
            </p>
          ) : (
            reviews.map((review) => (
              <div
                key={review.id}
                className="p-4 border border-gray-200 rounded-xl"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold">
                      {review.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {review.username}
                      </p>
                      {renderStars(review.rating)}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(review.created_at).toLocaleDateString("ru-RU")}
                  </p>
                </div>
                <p className="text-gray-700 mt-3 text-sm whitespace-pre-wrap">
                  {review.comment}
                </p>

                {/* 🔹 Реакции */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() =>
                      handleReaction(
                        review.id,
                        review.user_reaction === "like" ? null : "like",
                      )
                    }
                    disabled={reactingReviewId === review.id}
                    className={`flex items-center gap-1.5 text-sm transition ${
                      review.user_reaction === "like"
                        ? "text-green-600 font-medium"
                        : "text-gray-500 hover:text-green-600"
                    }`}
                  >
                    <ThumbsUp
                      className={`w-4 h-4 ${review.user_reaction === "like" ? "fill-current" : ""}`}
                    />
                    <span>{review.likes}</span>
                  </button>
                  <button
                    onClick={() =>
                      handleReaction(
                        review.id,
                        review.user_reaction === "dislike" ? null : "dislike",
                      )
                    }
                    disabled={reactingReviewId === review.id}
                    className={`flex items-center gap-1.5 text-sm transition ${
                      review.user_reaction === "dislike"
                        ? "text-red-600 font-medium"
                        : "text-gray-500 hover:text-red-600"
                    }`}
                  >
                    <ThumbsDown
                      className={`w-4 h-4 ${review.user_reaction === "dislike" ? "fill-current" : ""}`}
                    />
                    <span>{review.dislikes}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
