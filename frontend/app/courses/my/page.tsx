// frontend/app/courses/my-courses/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import {
  Search,
  Filter,
  Pin,
  PinOff,
  MoreVertical,
  LogOut,
  BookOpen,
  CheckCircle,
  Clock,
  Award,
  ChevronRight,
  Heart,
  UserPlus,
} from "lucide-react";
import useContactStore from "@/store/states";
import { useTokens } from "@/hooks/useTokens";

type MyCourse = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  image: string | null;
  category: string | null;
  duration_minutes: number | null;
  certificate_available: boolean;
  completion_percent: number;
  is_favorite: boolean; // ❤️ Сердечко (бэкенд)
  is_enrolled: boolean; // ✅ Записан на курс
  teachers?: Array<{ id: number; full_name: string }>;
  total_units?: number;
  completed_units?: number;
};

type TabType = "enrolled" | "wishlist"; // 🔥 Вкладки: "Прохожу" / "Хочу пройти"

// 🔹 Хук для локального закрепления курсов (Pin)
function usePinnedCourses() {
  const [pinnedIds, setPinnedIds] = useState<Set<number>>(new Set());

  // Загрузка из localStorage при маунте
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("pinned_courses");
    if (stored) {
      try {
        const ids = JSON.parse(stored) as number[];
        setPinnedIds(new Set(ids));
      } catch {}
    }
  }, []);

  // Сохранение в localStorage при изменении
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("pinned_courses", JSON.stringify([...pinnedIds]));
  }, [pinnedIds]);

  const togglePin = (courseId: number) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });
  };

  const isPinned = (courseId: number) => pinnedIds.has(courseId);

  return { pinnedIds, togglePin, isPinned };
}

export default function MyCoursesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, openLogin } = useContactStore();
  const { balance } = useTokens();
  const { togglePin, isPinned } = usePinnedCourses(); // 🔥 Хук для пинов

  const [courses, setCourses] = useState<MyCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("enrolled"); // 🔥 Активная вкладка
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [unenrolling, setUnenrolling] = useState<number | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  // Закрытие меню при клике вне
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Загрузка курсов
  useEffect(() => {
    async function fetchMyCourses() {
      if (!isAuthenticated) return;

      console.log("🔵 [MyCourses] Fetching courses...");
      try {
        // 🔥 Загружаем ВСЕ курсы: и записанные, и в избранном
        const data = await apiFetch(`/courses/my?include_wishlist=true`);
        console.log("🟢 [MyCourses] Loaded:", data.length, "courses");

        if (data.length > 0) {
          console.log("🔍 [MyCourses] First course:", {
            id: data[0].id,
            title: data[0].title,
            is_enrolled: data[0].is_enrolled,
            is_favorite: data[0].is_favorite,
            total_units: data[0].total_units,
            completed_units: data[0].completed_units,
          });
        }
        setCourses(data);
      } catch (err) {
        console.error("❌ [MyCourses] Failed to load:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMyCourses();
  }, [isAuthenticated]);

  // 🔹 Фильтрация по вкладке + поиску
  const filteredCourses = courses.filter((course) => {
    // Поиск по названию
    if (
      searchQuery &&
      !course.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // Фильтр по вкладке
    if (activeTab === "enrolled") {
      return course.is_enrolled; // Только записанные
    } else {
      return course.is_favorite && !course.is_enrolled; // В избранном, но не записан
    }
  });

  // 🔹 Сортировка: закреплённые (Pin) всегда первыми
  const sortedCourses = [...filteredCourses].sort((a, b) => {
    const aPinned = isPinned(a.id);
    const bPinned = isPinned(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return 0;
  });

  // Переключение сердечка (синхронизация с бэкендом)
  const toggleFavorite = async (
    e: React.MouseEvent,
    courseId: number,
    courseSlug: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("❤️ [Favorite] Toggle clicked:", { courseId, courseSlug });

    const token = localStorage.getItem("token");
    if (!token) {
      openLogin();
      return;
    }

    try {
      const course = courses.find((c) => c.id === courseId);
      if (!course) return;

      const method = course.is_favorite ? "DELETE" : "POST";
      console.log(
        `❤️ [Favorite] Calling ${method} /courses/${courseId}/favorite`,
      );

      await apiFetch(`/courses/${courseId}/favorite`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("🟢 [Favorite] Success, updating local state");
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId ? { ...c, is_favorite: !c.is_favorite } : c,
        ),
      );
    } catch (err) {
      console.error("❌ [Favorite] Failed:", err);
    }
  };

  // 🔹 Локальное закрепление курса (Pin) — НЕ синхронизируется с бэкендом
  const handleTogglePin = (e: React.MouseEvent, courseId: number) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("📌 [Pin] Toggle clicked:", courseId);
    togglePin(courseId);
  };

  // Выход из курса
  const handleUnenroll = async (courseId: number, courseSlug: string) => {
    console.log("🔴 [Unenroll] === BUTTON CLICKED ===", {
      courseId,
      courseSlug,
    });

    if (!confirm("Вы уверены, что хотите отменить запись на этот курс?")) {
      console.log("⚠️ [Unenroll] User cancelled");
      setOpenMenu(null);
      return;
    }

    console.log("🔵 [Unenroll] User confirmed, starting request...");
    setUnenrolling(courseId);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("❌ [Unenroll] No token found");
        return;
      }

      const url = `/courses/${courseSlug}/unenroll`;
      console.log(`🔵 [Unenroll] Calling DELETE ${url}`);

      const response = await apiFetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("🟢 [Unenroll] Server response:", response);

      // Удаляем курс из списка
      setCourses((prev) => {
        const filtered = prev.filter((c) => c.id !== courseId);
        console.log(
          `🟢 [Unenroll] State updated: ${prev.length} → ${filtered.length} courses`,
        );
        return filtered;
      });
    } catch (err: any) {
      console.error("❌ [Unenroll] Request failed:", {
        message: err?.message,
        status: err?.status,
        data: err?.data,
      });
      alert(
        `Не удалось отменить запись: ${err?.message || "Неизвестная ошибка"}`,
      );
    } finally {
      console.log("🟡 [Unenroll] Cleanup: resetting states");
      setUnenrolling(null);
      setOpenMenu(null);
    }
  };

  // Форматирование времени
  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "—";
    if (minutes < 60) return `${minutes} мин`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}ч ${m}мин` : `${h}ч`;
  };

  // Прогресс в юнитах
  const getUnitProgress = (course: MyCourse) => {
    const total =
      course.total_units ??
      Math.max(1, Math.ceil(course.completion_percent / 25));
    const completed =
      course.completed_units ??
      Math.floor((course.completion_percent / 100) * total);
    return { completed: Math.min(completed, total), total };
  };

  // Заглушка для неавторизованных
  if (!isAuthenticated) {
    return (
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="text-center bg-white rounded-2xl border border-gray-200 p-8 max-w-md">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Войдите, чтобы увидеть свои курсы
          </h2>
          <p className="text-gray-600 mb-6">
            После входа вы сможете отслеживать прогресс, управлять записями и
            сохранять курсы в избранное.
          </p>
          <button
            onClick={openLogin}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition"
          >
            Войти в аккаунт
          </button>
        </div>
      </main>
    );
  }

  // Лоадер
  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600" />
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 w-full max-w-[1200px] mx-auto">
      {/* 🔹 Заголовок */}
      <div className="w-full mb-8">
        <Link
          href="/courses"
          className="text-gray-600 hover:text-purple-600 transition flex items-center gap-2 mb-4"
        >
          <ChevronRight className="w-4 h-4 rotate-180" /> Все курсы
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Мои курсы</h1>
        <p className="text-gray-600 mt-2">
          Управляйте своими записями и отслеживайте прогресс
        </p>
      </div>

      {/* 🔹 Вкладки + Поиск */}
      <div className="w-full mb-6 space-y-4">
        {/* Вкладки */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("enrolled")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === "enrolled"
                ? "bg-white text-purple-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Прохожу ({courses.filter((c) => c.is_enrolled).length})
            </span>
          </button>
          <button
            onClick={() => setActiveTab("wishlist")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === "wishlist"
                ? "bg-white text-purple-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <span className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Хочу пройти (
              {courses.filter((c) => c.is_favorite && !c.is_enrolled).length})
            </span>
          </button>
        </div>

        {/* Поиск */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={
              activeTab === "enrolled"
                ? "Поиск по пройденным..."
                : "Поиск по желаемым..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none transition"
          />
        </div>
      </div>

      {/* 🔹 Список курсов */}
      {sortedCourses.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl w-full">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchQuery
              ? "Курсы не найдены. Попробуйте изменить поиск."
              : activeTab === "enrolled"
                ? "У вас пока нет записей на курсы"
                : "У вас пока нет курсов в списке «Хочу пройти»"}
          </p>
          {activeTab === "wishlist" && !searchQuery && (
            <Link
              href="/courses"
              className="text-purple-600 hover:underline mt-2 inline-block"
            >
              Перейти к каталогу курсов →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {sortedCourses.map((course) => {
            const { completed, total } = getUnitProgress(course);
            const progressPercent = Math.min(course.completion_percent, 100);
            const pinned = isPinned(course.id);

            return (
              <div
                key={course.id}
                onClick={() => router.push(`/courses/${course.slug}`)}
                className="group block bg-white rounded-xl border border-gray-200 shadow-xs hover:shadow-lg hover:border-purple-300 transition-all overflow-hidden relative cursor-pointer"
              >
                {/* 🔹 Кнопки управления */}
                <div className="absolute top-3 right-3 z-20 flex items-center gap-2 pointer-events-none">
                  {/* 📌 Pin (локальное закрепление) */}
                  <button
                    onClick={(e) => handleTogglePin(e, course.id)}
                    className={`p-2 rounded-full transition shadow-sm pointer-events-auto ${
                      pinned
                        ? "bg-purple-100 text-purple-600 hover:bg-purple-200"
                        : "bg-white text-gray-400 hover:text-purple-600 hover:bg-white"
                    }`}
                    title={pinned ? "Открепить" : "Закрепить"}
                  >
                    {pinned ? (
                      <PinOff className="w-4 h-4 fill-current" />
                    ) : (
                      <Pin className="w-4 h-4" />
                    )}
                  </button>

                  {/* ❤️ Favorite (сердечко — синхронизация с бэкендом) */}
                  <button
                    onClick={(e) => toggleFavorite(e, course.id, course.slug)}
                    className={`p-2 rounded-full transition shadow-sm pointer-events-auto ${
                      course.is_favorite
                        ? "bg-red-100 text-red-500 hover:bg-red-200"
                        : "bg-white text-gray-400 hover:text-red-500 hover:bg-white"
                    }`}
                    title={
                      course.is_favorite
                        ? "Убрать из избранного"
                        : "В избранное"
                    }
                  >
                    <Heart
                      className={`w-4 h-4 ${course.is_favorite ? "fill-current" : ""}`}
                    />
                  </button>

                  {/* ⋮ Меню действий */}
                </div>

                {/* 🔹 Обложка */}
                {course.image && (
                  <div className="h-40 bg-gray-100 overflow-hidden pointer-events-none">
                    <img
                      src={`/${course.image}`}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                      onError={(e) => {
                        (
                          e.target as HTMLImageElement
                        ).parentElement?.classList.add("hidden");
                      }}
                    />
                  </div>
                )}

                {/* 🔹 Контент */}
                <div className="p-4 pointer-events-none">
                  <div className="flex items-start justify-between mb-2">
                    {course.category && (
                      <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                        {course.category}
                      </span>
                    )}
                    {course.certificate_available && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        <Award className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-gray-900 group-hover:text-purple-700 line-clamp-1">
                    {course.title}
                  </h3>

                  {course.description && (
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                      {course.description}
                    </p>
                  )}

                  {/* 🔹 Прогресс бар (только для записанных курсов) */}
                  {course.is_enrolled && (
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          Прогресс
                        </span>
                        <span className="font-medium text-purple-600">
                          {completed}/{total} юнитов
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1 text-right">
                        {course.completion_percent}%
                      </p>
                    </div>
                  )}

                  {/* 🔹 Мета-информация */}
                  <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                    {course.duration_minutes && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDuration(course.duration_minutes)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
