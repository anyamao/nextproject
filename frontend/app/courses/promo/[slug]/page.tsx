// frontend/app/courses/promo/[slug]/page.tsx
"use client";
import AvatarWithOverlay from "@/components/AvatarWithOverlay";
import Toast from "@/components/Toast"; // 🔥 Импорт с большой буквы
import { useTokens } from "@/hooks/useTokens";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Layers,
  StickyNote,
  BookCheck,
  WalletCards,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  Clock,
  Award,
  CheckCircle,
  Edit2,
  ChevronUp,
  ChevronDown,
  Trash2,
  X,
  Star,
  Users,
  MessageSquare,
  Filter,
  Calendar,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import useContactStore from "@/store/states";
import ConfirmDialog from "@/components/ConfirmDialog";

type PromoCourse = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  image: string | null;
  category: string | null;
  is_favorite: boolean;
  about: string | null;
  duration_minutes: number | null;
  certificate_available: boolean;
  enrolled_count?: number;
  is_enrolled?: boolean;
  rating?: number | null;
  completion_percent?: number | null;
  teachers?: Teacher[];
};

type Teacher = {
  id: number;
  full_name: string;
  image: string | null;
  about: string | null;
};

// 🔹 В типе Review добавь:

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

  // 🔥 Добавь это поле:
  equipped_item?: {
    id: number;
    name: string;
    image: string;
    price: number;
    description: string | null;
  } | null;
};
type ReviewStats = {
  average_rating: number;
  total_reviews: number;
  user_review: Review | null;
};

type RatingDistribution = {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
};

type CourseUnit = {
  id: number;
  title: string;
  unit_number: number;
  description: string | null;
  lesson_count: number;
  progress?: { completed: number; total: number; percent: number } | null;
};

type Lesson = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  time_minutes: number | null;
  test_id?: number | null;
  unit: CourseUnit | null;
  has_flashcards?: boolean;
  is_completed?: boolean;
  is_locked?: boolean;
};

export default function CoursePromoPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    onConfirm: () => void;
    message?: string;
  }>({
    isOpen: false,
    onConfirm: () => {},
    message: "",
  });

  const { isAuthenticated, openLogin } = useContactStore();

  const [course, setCourse] = useState<PromoCourse | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [ratingDistribution, setRatingDistribution] =
    useState<RatingDistribution>({
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    });
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "rating">("date");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [reactingReviewId, setReactingReviewId] = useState<number | null>(null);

  // 🔥 Убрали rewardTokens, если не используем на фронтенде
  // const { rewardTokens } = useTokens();

  const [totalUnits, setTotalUnits] = useState(0);
  const [totalLessons, setTotalLessons] = useState(0);
  const [totalTests, setTotalTests] = useState(0);
  const [totalFlashcards, setTotalFlashcards] = useState(0);
  const [courseUnits, setCourseUnits] = useState<CourseUnit[]>([]);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [expandedCourseUnits, setExpandedCourseUnits] = useState<Set<number>>(
    new Set(),
  );

  // 🔹 Toast стейт с типом
  const [toast, setToast] = useState<{
    message: string;
    type?: "success" | "error" | "info";
  } | null>(null);

  const toggleCourseUnit = (unitId: number) => {
    setExpandedCourseUnits((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) {
        next.delete(unitId);
      } else {
        next.add(unitId);
      }
      return next;
    });
  };

  // 🔹 Функция showToast с типом
  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "success",
  ) => {
    setToast({ message, type });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("🔍 [Promo] Fetching data for slug:", slug);

        const courses = await apiFetch("/courses/subjects");
        const found = courses.find((c: any) => c.slug === slug);

        if (!found) {
          console.error("❌ Course not found in /courses/subjects");
          setLoading(false);
          return;
        }

        console.log("✅ Found course:", { id: found.id, title: found.title });

        try {
          const courseStructure = await apiFetch(`/courses/${slug}`);

          // 🔥 Показываем тост за прогресс, если есть награды
          if (courseStructure.rewards_granted?.length > 0) {
            const total = courseStructure.rewards_granted.reduce(
              (sum: number, r: { amount: number }) => sum + r.amount,
              0,
            );
            showToast(`+${total} XP за прогресс! 🎉`, "success");
          }

          console.log("✅ Course structure:", {
            units_count: courseStructure.units?.length || 0,
            lessons_count: courseStructure.lessons?.length || 0,
          });

          if (courseStructure.lessons) {
            setTotalLessons(courseStructure.lessons.length);
            setTotalTests(
              courseStructure.lessons.filter((l: any) => l.test_id).length,
            );
            const flashcardsCount = courseStructure.lessons.filter(
              (l: any) => l.has_flashcards === true,
            ).length;
            setTotalFlashcards(flashcardsCount);
            setTotalUnits(courseStructure.units?.length || 0);
            setCourseUnits(courseStructure.units || []);
            setCourseLessons(courseStructure.lessons || []);
          }
        } catch (err) {
          console.warn("⚠️ Could not load course structure:", err);
        }

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

        const mergedCourse: PromoCourse = {
          ...found,
          about: courseDetails.about || null,
          teachers: courseDetails.teachers || [],
          completion_percent: courseDetails.completion_percent ?? null,
          is_enrolled: courseDetails.is_enrolled ?? false,
        };

        setCourse(mergedCourse);
        setIsEnrolled(isEnrolledValue);

        console.log("✅ Merged course:", {
          id: mergedCourse.id,
          has_about: !!mergedCourse.about,
          teachers_count: mergedCourse.teachers?.length || 0,
        });

        try {
          console.log("🔍 [Reviews] Fetching:", `/courses/${found.id}/reviews`);
          const reviewsData = await apiFetch(`/courses/${found.id}/reviews`);
          console.log("✅ [Reviews] Response:", {
            status: 200,
            reviews_count: reviewsData.reviews?.length,
            stats: reviewsData.stats,
          });
          setReviews(reviewsData.reviews || []);
          setReviewStats(reviewsData.stats || null);
          calculateRatingDistribution(reviewsData.reviews || []);
        } catch (err: any) {
          console.error("❌ [Reviews] Error:", {
            status: err?.status,
            message: err?.message,
            data: err?.data,
          });
        }
      } catch (err) {
        console.error("❌ [Promo] Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchData();
  }, [slug]);

  const calculateRatingDistribution = (reviewsList: Review[]) => {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviewsList.forEach((review) => {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[review.rating as 1 | 2 | 3 | 4 | 5]++;
      }
    });
    setRatingDistribution(distribution);
  };

  const getFilteredAndSortedReviews = () => {
    let filtered = [...reviews];

    if (filterRating !== null) {
      filtered = filtered.filter((review) => review.rating === filterRating);
    }

    filtered.sort((a, b) => {
      if (sortBy === "date") {
        return sortOrder === "desc"
          ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          : new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === "rating") {
        return sortOrder === "desc" ? b.rating - a.rating : a.rating - b.rating;
      }
      return 0;
    });

    return filtered;
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }

    if (!course?.slug) return;

    setEnrolling(true);
    try {
      // 🔥 Сохраняем ответ, чтобы проверить reward_granted
      const response = await apiFetch(`/courses/${course.slug}/enroll`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      setIsEnrolled(true);

      // 🔥 Показываем тост только если бэкенд выдал награду
      if (response.reward_granted) {
        showToast("+20 XP за первую запись! 🎉", "success");
      }

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

    if (!isAuthenticated) {
      openLogin();
      return;
    }

    const token = localStorage.getItem("token");
    if (!token || !course?.id) return;

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
      const data = await apiFetch(`/courses/${course.id}/reviews`);
      setReviews(data.reviews || []);
      setReviewStats(data.stats || null);
      calculateRatingDistribution(data.reviews || []);
      setNewReview({ rating: 5, comment: "" });
      setIsEditing(false);

      // 🔥 Показываем тост за успешный отзыв
      showToast("+50 XP за отзыв! 💬", "success");
    } catch (err: any) {
      alert(err.message || "Ошибка");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = () => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }

    const token = localStorage.getItem("token");
    if (!token || !reviewStats?.user_review?.id) return;

    setConfirmDialog({
      isOpen: true,
      message:
        "Вы действительно хотите удалить свой отзыв? Это действие нельзя отменить.",
      onConfirm: async () => {
        try {
          await apiFetch(`/reviews/${reviewStats.user_review.id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await apiFetch(`/courses/${course?.id}/reviews`);
          setReviews(data.reviews || []);
          setReviewStats(data.stats || null);
          calculateRatingDistribution(data.reviews || []);
          showToast("Отзыв удалён", "info");
        } catch (err: any) {
          alert(err.message || "Ошибка при удалении");
        }
      },
    });
  };

  const handleReaction = async (
    reviewId: number,
    type: "like" | "dislike" | null,
  ) => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;
    if (reactingReviewId) return;

    setReactingReviewId(reviewId);
    try {
      if (type === null) {
        await apiFetch(`/reviews/${reviewId}/reaction`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reaction: type }),
        });
      } else {
        await apiFetch(`/reviews/${reviewId}/reaction?reaction=${type}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
      setReviews((prev) =>
        prev.map((r) => {
          if (r.id !== reviewId) return r;
          return { ...r, user_reaction: type };
        }),
      );
    } catch (err) {
      console.error("❌ Reaction failed:", err);
    } finally {
      setReactingReviewId(null);
      if (course?.id) {
        const data = await apiFetch(`/courses/${course.id}/reviews`);
        setReviews(data.reviews || []);
        setReviewStats(data.stats || null);
        calculateRatingDistribution(data.reviews || []);
      }
    }
  };

  const startEditing = () => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }

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

    if (!isAuthenticated) {
      openLogin();
      return;
    }

    if (!course?.id) return;

    try {
      const isFav = course.is_favorite;
      await apiFetch(`/courses/${course.id}/favorite`, {
        method: isFav ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
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
  const wordCount = newReview.comment
    .trim()
    .split(/\s+/)
    .filter((w) => w).length;

  const filteredSortedReviews = getFilteredAndSortedReviews();

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

      {/* 🔹 Toast с типом */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="bg-white rounded-lg shadow-xs overflow-hidden w-full">
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

          <ConfirmDialog
            isOpen={confirmDialog.isOpen}
            onClose={() =>
              setConfirmDialog({
                isOpen: false,
                onConfirm: () => {},
                message: "",
              })
            }
            onConfirm={confirmDialog.onConfirm}
            title="Удаление отзыва"
            message={
              confirmDialog.message ||
              "Вы уверены, что хотите удалить этот отзыв?"
            }
            confirmText="Удалить"
            cancelText="Отмена"
            type="danger"
          />

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
                  <span>
                    {course.enrolled_count}+{" "}
                    {course.enrolled_count === 1
                      ? "студент"
                      : course.enrolled_count >= 2 && course.enrolled_count <= 4
                        ? "студента"
                        : "студентов"}
                  </span>
                </div>
              )}

              {reviewStats?.average_rating != null && (
                <div className="flex items-center gap-2">
                  {renderStars(Number(reviewStats.average_rating))}
                  <span className="text-sm text-gray-600">
                    {Number(reviewStats.average_rating).toFixed(1)} (
                    {reviewStats.total_reviews || 0})
                  </span>
                </div>
              )}
              <p className="text-sm text-gray-500">
                {isEnrolled ? "Вы уже записаны" : "Запишитесь"}
              </p>
            </div>

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
            className={`absolute top-4 right-4 z-10 p-2 rounded-full transition  ${course.is_favorite ? "bg-red-600 text-white hover:bg-red-600" : "bg-white/90 text-gray-400 hover:text-red-500 hover:bg-white"}`}
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
      </div>

      {course.completion_percent != null && course.completion_percent >= 90 && (
        <div className="bg-white w-full my-[30px] p-[20px] rounded-lg shadow-xs">
          <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-900" />
            <span className="text-sm font-semibold text-green-950">
              Курс завершён! {course.completion_percent}%
            </span>
          </div>

          {course.is_enrolled && course.completion_percent >= 90 && (
            <div className="mt-6 bg-amber-200 p-[30px] py-[40px] my-[20px] mx-[30px] rounded-lg rotate-3 ">
              <div className="flex rounded-lg items-center bg-amber-500 justify-between p-[10px] -rotate-3">
                <div>
                  <p className="text-lg font-bold text-yellow-950">
                    🎓 Поздравляем! Вы прошли курс на{" "}
                    {course.completion_percent}%
                  </p>
                  <p className="text-sm text-yellow-900">
                    Получите сертификат об окончании и отправьте его друзьям!
                  </p>
                  <p className="text-yellow-950 text-sm">
                    Это бесплатно, за отправку сертификата +40 баллов
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
      )}

      <div className="my-[20px] w-full bg-white p-[20px] rounded-lg shadow-xs">
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

      <div className="flex flex-row gap-4 w-full mb-8">
        <div className="flex-1 bg-purple-200 rounded-lg p-5 text-center">
          <p className="font-black text-3xl text-violet-900">
            {totalUnits || 0}
          </p>
          <p className="font-semibold text-purple-800">
            {totalUnits === 1
              ? "Юнит"
              : totalUnits >= 2 && totalUnits <= 4
                ? "Юнита"
                : "Юнитов"}
          </p>
          <p className="text-xs text-purple-800 mt-2 pt-2 border-t border-purple-300">
            Уроки структурированы по юнитам, четкий учебный план
          </p>
        </div>

        <div className="flex-1 bg-purple-300 rounded-lg p-5 text-center">
          <p className="font-black text-3xl text-violet-950">
            {totalLessons || 0}
          </p>
          <p className="font-semibold text-purple-900">
            {totalLessons === 1
              ? "Урок"
              : totalLessons >= 2 && totalLessons <= 4
                ? "Урока"
                : "Уроков"}
          </p>
          <p className="text-xs text-purple-800 mt-2 pt-2 border-t border-purple-400">
            Закроем темы полностью, можно писать обратную связь
          </p>
        </div>

        <div className="flex-1 bg-purple-200 rounded-lg p-5 text-center">
          <p className="font-black text-3xl text-violet-900">
            {totalTests || 0}
          </p>
          <p className="font-semibold text-purple-800">
            {totalTests === 1
              ? "Тест"
              : totalTests >= 2 && totalTests <= 4
                ? "Теста"
                : "Тестов"}
          </p>
          <p className="text-xs text-purple-700 mt-2 pt-2 border-t border-purple-300">
            Чтобы точно знать свои пробелы, сохраняется лучший результат
          </p>
        </div>

        <div className="flex-1 bg-purple-300 rounded-lg p-5 text-center">
          <p className="font-black text-3xl text-violet-950">
            {totalFlashcards || 0}
          </p>
          <p className="font-semibold text-purple-900">
            {totalFlashcards === 1
              ? "Комплект карточек"
              : totalFlashcards >= 2 && totalFlashcards <= 4
                ? "Комплекта карточек"
                : "Комплектов карточек"}
          </p>
          <p className="text-xs text-purple-800 mt-2 pt-2 border-t border-purple-400">
            Повторяй в любое время в любом месте!
          </p>
        </div>
      </div>

      <div className="w-full bg-white p-5 rounded-lg shadow-xs mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Программа курса
        </h2>

        {courseUnits.length === 0 ? (
          <p className="text-gray-500 italic">Загрузка программы курса...</p>
        ) : (
          <div className="space-y-4">
            {courseUnits.map((unit) => {
              const unitLessons = courseLessons.filter(
                (l) => l.unit?.id === unit.id,
              );
              const isExpanded = expandedCourseUnits.has(unit.id);

              return (
                <div key={unit.id} className="overflow-hidden rounded-lg">
                  <button
                    onClick={() => toggleCourseUnit(unit.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
                  >
                    <div className="text-left">
                      <div className="flex flex-row items-baseline gap-1">
                        {unit.unit_number > 0 && (
                          <span className="text-base font-semibold text-gray-900">
                            Unit {unit.unit_number} —
                          </span>
                        )}
                        <h3 className="text-base font-semibold text-gray-900">
                          {unit.title}
                        </h3>
                      </div>
                      {unit.description && (
                        <p className="text-sm text-gray-500 mt-0.5">
                          {unit.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {unitLessons.length} уроков
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-2 border-t border-gray-100 pt-3">
                      {unitLessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between p-3 bg-gray-100 rounded-lg "
                        >
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">
                              {lesson.title}
                            </h4>
                            {lesson.description && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                {lesson.description}
                              </p>
                            )}
                          </div>
                          {lesson.time_minutes && (
                            <div className="flex items-center gap-1 text-gray-400 text-xs whitespace-nowrap">
                              <Clock className="w-3 h-3" />
                              <span>{lesson.time_minutes} мин</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {course.teachers && course.teachers.length > 0 && (
        <div className="mb-8 w-full">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Преподаватели курса
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {course.teachers.map((teacher) => (
              <div
                key={teacher.id}
                className="p-4 bg-white rounded-lg shadow-xs transition"
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
                      <p className="text-sm text-gray-600 mt-1">
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

      <div className="w-full mt-8 bg-white rounded-lg shadow-xs p-[30px]">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" /> Отзывы (
          {reviewStats?.total_reviews || 0})
        </h2>
        <div className="flex flex-row items-center justify-between">
          {reviewStats && reviewStats.total_reviews > 0 && (
            <div className="mb-6 p-6 max-w-[390px] min-w-[390px] rotate-2 bg-gray-100 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-900 -rotate-2 mb-3">
                Распределение оценок
              </h3>
              <div className="space-y-2 -rotate-2  text-gray-800">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = ratingDistribution[rating as 1 | 2 | 3 | 4 | 5];
                  const percentage =
                    reviewStats.total_reviews > 0
                      ? (count / reviewStats.total_reviews) * 100
                      : 0;
                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-10">
                        <span className="text-sm text-gray-600">{rating}</span>
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      </div>
                      <div className="flex-1 h-2 bg-gray-300 rounded-full  overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="w-16 text-right">
                        <span className="text-sm text-gray-800">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-cyan-600 h-full p-[20px] rounded-lg flex-1 ml-[30px]">
            <p className="text-white font-semibold text-lg">
              Давайте улучшать курс вместе!
            </p>
            <p className="text-cyan-200 font-semibold text-sm mt-[10px]">
              Если вы заметили неточность или знаете о теме больше, чем я,
              нажмите на кнопку 'Написать', чтобы связаться со мной.
            </p>
            <p className="text-cyan-100 text-sm bg-cyan-700 rounded-lg p-[15px] my-[10px]">
              Ваши комментарии учитыватся. Будьте вежливы. Что бы вы изменили в
              курсе? Как он вам?
            </p>
          </div>
        </div>
      </div>

      {canWriteReview && !reviewStats?.user_review && (
        <div className="mb-4 w-full inline-flex items-center gap-2 px-4 py-3 bg-purple-500 mt-[20px] rounded-lg">
          <span className="text-sm font-semibold text-white">
            Так держать! У вас {course.completion_percent}% — можно оставить
            отзыв. Оставь отзыв и получи +40xp
          </span>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-3 p-4 bg-white mt-[20px] rounded-lg shadow-xs w-full px-[20px]">
        <Filter className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-600">Фильтр по оценке:</span>
        <button
          onClick={() => setFilterRating(null)}
          className={`px-3 py-1 text-xs rounded-full transition ${
            filterRating === null
              ? "bg-gray-800 text-gray-100"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Все
        </button>
        {[5, 4, 3, 2, 1].map((rating) => (
          <button
            key={rating}
            onClick={() =>
              setFilterRating(filterRating === rating ? null : rating)
            }
            className={`flex items-center gap-1 px-3 py-1 text-xs rounded-full transition ${
              filterRating === rating
                ? "bg-purple-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            <Star className="w-3 h-3" />
            {rating}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split("-");
              setSortBy(newSortBy as "date" | "rating");
              setSortOrder(newSortOrder as "desc" | "asc");
            }}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1 bg-white"
          >
            <option value="date-desc">Сначала новые</option>
            <option value="date-asc">Сначала старые</option>
            <option value="rating-desc">Высокий рейтинг</option>
            <option value="rating-asc">Низкий рейтинг</option>
          </select>
        </div>
      </div>

      {!isAuthenticated ? (
        <div className="mb-6 p-1 bg-purple-600 w-full rounded-lg border border-purple-200">
          <div className="text-center py-2">
            <p className="text-sm text-white font-semibold">
              🔐 Чтобы оставить отзыв, сначала{" "}
              <button
                onClick={openLogin}
                className="text-white ml-[10px] bg-purple-500 px-[20px] rounded-lg p-[10px] font-medium hover:underline"
              >
                войдите в аккаунт
              </button>
            </p>
          </div>
        </div>
      ) : !canWriteReview ? (
        <div className="mb-6 p-1 bg-purple-600 w-full rounded-lg border border-purple-200">
          <div className="text-center py-2 flex flex-row justify-between px-[20px] items-center  ">
            <p className="text-sm text-white font-semibold ">
              📚 Чтобы оставить отзыв, завершите минимум 75% курса
            </p>
            <p className="text-white ml-[10px] bg-purple-500 px-[20px] rounded-lg p-[10px] font-medium hover:underline">
              Ваш прогресс: {course.completion_percent}%
            </p>
          </div>
        </div>
      ) : !reviewStats?.user_review ? (
        <div className="mb-6 p-4 bg-white w-full rounded-xl ">
          <form onSubmit={handleSubmitReview}>
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
        </div>
      ) : null}

      <div className="space-y-4">
        {filteredSortedReviews.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            {filterRating !== null
              ? `Нет отзывов с оценкой ${filterRating} звезд${filterRating === 1 ? "ы" : filterRating <= 4 ? "ы" : ""} ✨`
              : "Пока нет отзывов. Будьте первым! ✨"}
          </p>
        ) : (
          filteredSortedReviews.map((review) => {
            const isCurrentUserReview =
              reviewStats?.user_review?.id === review.id;
            const isEditingThisReview = isEditing && isCurrentUserReview;

            return (
              <div
                key={review.id}
                className={`p-4 bg-white shadow-xs rounded-lg p-[20px] ${isCurrentUserReview && !isEditingThisReview ? "" : ""}`}
              >
                {isEditingThisReview ? (
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
                          setCommentError(null);
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
                        setNewReview((prev) => ({
                          ...prev,
                          comment: e.target.value,
                        }))
                      }
                      placeholder="Отредактируйте ваш отзыв (минимум 50 слов)..."
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
                        {submittingReview
                          ? "Сохранение..."
                          : "Сохранить изменения"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Link
                          className="cursor-pointer block overflow-hidden rounded-full"
                          href={`/profile/${review.user_id}`}
                        >
                          <AvatarWithOverlay
                            baseAvatar={review.avatar_url || "default_cat.jpg"}
                            overlayImage={review.equipped_item?.image} // 🔥 Наложение, если есть
                            alt={review.username}
                            size="md" // 🔥 Размер как в отзывах (~40px)
                            className="transition-transform duration-300 hover:scale-120"
                          />
                        </Link>
                        <div>
                          <div className="flex items-center gap-2">
                            <Link
                              className="cursor-pointer"
                              href={`/profile/${review.user_id}`}
                            >
                              <p className="font-medium hover:text-purple-700 duration-300 text-gray-900">
                                {review.username}
                              </p>
                            </Link>
                            {isCurrentUserReview && (
                              <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">
                                Вы
                              </span>
                            )}
                          </div>
                          {renderStars(review.rating)}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(review.created_at).toLocaleDateString(
                          "ru-RU",
                        )}
                      </p>
                    </div>

                    <p className="text-gray-700 mt-3 text-sm whitespace-pre-wrap">
                      {review.comment}
                    </p>

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
                            ? "text-gray-800 font-medium"
                            : "text-gray-500 hover:text-gray-700"
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
                            review.user_reaction === "dislike"
                              ? null
                              : "dislike",
                          )
                        }
                        disabled={reactingReviewId === review.id}
                        className={`flex items-center gap-1.5 text-sm transition ${
                          review.user_reaction === "dislike"
                            ? "text-gray-800 font-medium"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <ThumbsDown
                          className={`w-4 h-4 ${review.user_reaction === "dislike" ? "fill-current" : ""}`}
                        />
                        <span>{review.dislikes}</span>
                      </button>

                      {isCurrentUserReview && (
                        <div className="flex gap-2 ml-auto">
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
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
