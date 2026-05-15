"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import {
  Search,
  Check,
  BookOpen,
  Code,
  Globe,
  Filter,
  LanguagesIcon,
  Notebook,
  Heart,
  ChevronRight,
  Braces,
} from "lucide-react";

type Course = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  image: string | null;
  category: string | null;
  certificate_available?: boolean;
  duration_minutes?: number | null;
  enrolled_count?: number;
  rating?: number | null;
  is_favorite?: boolean;
  completion_percent?: number | null;
  is_enrolled?: boolean;
};

const CATEGORIES = [
  { value: "", label: "Все", icon: Filter },
  { value: "Английский", label: "Английский", icon: Globe },
  { value: "Веб-разработка", label: "Веб-разработка", icon: Code },
  { value: "Анализ данных", label: "Анализ данных", icon: Braces },
  { value: "ЕГЭ", label: "ЕГЭ", icon: Notebook },
  { value: "Китайский", label: "Китайский", icon: LanguagesIcon },
];

export default function CoursesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const searchQueryFromUrl = searchParams.get("search") || "";
  const categoryFromUrl = searchParams.get("category") || "";

  const [searchQuery, setSearchQuery] = useState(searchQueryFromUrl);
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl);
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (selectedCategory !== categoryFromUrl) {
      const params = new URLSearchParams(searchParams.toString());
      if (selectedCategory) {
        params.set("category", selectedCategory);
      } else {
        params.delete("category");
      }
      router.push(`/courses?${params.toString()}`, { scroll: false });
    }
  }, [selectedCategory, router]); // ← Убрали searchParams!
  useEffect(() => {
    async function fetchCourses() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCategory) params.append("category", selectedCategory);
        if (searchQuery) params.append("search", searchQuery);

        const queryString = params.toString();
        const url = `/courses/subjects${queryString ? `?${queryString}` : ""}`;

        const data = await apiFetch(url);
        setCourses(data);
        setFilteredCourses(data);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    let result = courses;

    if (searchQuery) {
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (selectedCategory) {
      result = result.filter((c) => c.category === selectedCategory);
    }

    setFilteredCourses(result);
  }, [courses, searchQuery, selectedCategory]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);

    if (token) {
      apiFetch("/courses/favorites", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((data: Array<{ course_id: number }>) => {
          const favIds = new Set<number>(data.map((f) => f.course_id));
          setFavorites(favIds);
        })
        .catch(() => {});
    }
  }, []);

  const toggleFavorite = async (e: React.MouseEvent, courseId: number) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    try {
      const isFav = favorites.has(courseId);

      await apiFetch(`/courses/${courseId}/favorite`, {
        method: isFav ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      setFavorites((prev) => {
        const next = new Set(prev);
        if (isFav) next.delete(courseId);
        else next.add(courseId);
        return next;
      });
    } catch (err) {}
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "—";
    if (minutes < 60) return `${minutes} мин`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}ч ${mins}мин` : `${hours}ч`;
  };

  const renderRating = (rating: number | null | undefined) => {
    if (rating === null || rating === undefined) return null;

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= Math.round(rating)
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="text-xs text-gray-500 ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    router.push(`/courses?${params.toString()}`, { scroll: false });
  };

  const handleCategoryChange = (categoryValue: string) => {
    setSelectedCategory(categoryValue);
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 w-full max-w-[1400px] mx-auto mt-[40px]">
      <div className="w-full mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Курсы</h1>
        <p className="text-gray-600 mt-2">
          Найдите курс для развития ваших навыков
        </p>
      </div>

      <div className="w-full mb-8 space-y-4">
        <div className="w-full mb-8 space-y-4">
          <div className="max-w-md mx-auto">
            <div className="flex items-center gap-3 w-full border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-purple-400 transition  pl-3 pr-3">
              <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Поиск курсов..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="flex-1 py-3 outline-none bg-transparent"
              />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap w-full justify-center gap-2">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.value;

            return (
              <button
                key={cat.value || "all"}
                onClick={() => handleCategoryChange(cat.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs  font-medium transition ${
                  isActive
                    ? "bg-gray-800 text-gray-100 shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600" />
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl w-full">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchQuery || selectedCategory
              ? "Курсы не найдены. Попробуйте изменить фильтры."
              : "Курсы пока не добавлены"}
          </p>
          {(searchQuery || selectedCategory) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("");
                router.push("/courses");
              }}
              className="text-purple-600 hover:underline mt-2"
            >
              Сбросить фильтры
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 justify-between md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {filteredCourses.map((course) => {
            const isFav = favorites.has(course.id);

            return (
              <Link
                key={course.id}
                href={`/courses/promo/${course.slug}`}
                className="group block bg-white rounded-lg max-w-[430px] border border-gray-200 shadow-xs hover:border-purple-300 transition-all overflow-hidden relative"
              >
                {course.is_enrolled &&
                  (course.completion_percent ?? 0) >= 90 && (
                    <div className="absolute flex flex-row items-center top-48 right-3 bg-gray-900 text-xs font-semibold z-10 w-[110px] px-[15px] py-[5px] items-center justify-center text-white rounded-lg h-[28px]">
                      <p>Пройдено</p>
                      <Check className="ml-[5px] w-4 h-4"></Check>
                    </div>
                  )}

                <button
                  onClick={(e) => toggleFavorite(e, course.id)}
                  className={`absolute top-4 right-4 z-10 p-2 rounded-full transition shadow-sm ${
                    isFav
                      ? "bg-red-600 text-white hover:bg-red-600"
                      : "bg-white text-gray-400 hover:text-red-500 hover:bg-white"
                  }`}
                  title={
                    isFav ? "Убрать из избранного" : "Добавить в избранное"
                  }
                >
                  <svg
                    className={`w-5 h-5 ${isFav ? "fill-current" : ""}`}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    fill={isFav ? "currentColor" : "none"}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>

                {course.image && (
                  <div className="h-65 -mx-6 -mt-6 rounded-t-2xl overflow-hidden bg-gray-100">
                    <img
                      src={`/${course.image}`}
                      alt={course.title}
                      className="w-[120%] h-[140%] mt-[-20px] ml-[15px] object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (
                          e.target as HTMLImageElement
                        ).parentElement?.classList.add("hidden");
                      }}
                    />
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    {course.category && (
                      <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                        {CATEGORIES.find((c) => c.value === course.category)
                          ?.label || course.category}
                      </span>
                    )}
                    {course.certificate_available && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg bg-yellow-200 text-yellow-700">
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Сертификат
                      </span>
                    )}
                  </div>

                  <h2 className="text-lg font-semibold text-gray-900 group-hover:text-purple-700 line-clamp-1">
                    {course.title}
                  </h2>
                  {course.description && (
                    <p className="text-gray-600 mt-2 text-sm line-clamp-2">
                      {course.description}
                    </p>
                  )}

                  <div className="flex flex-row justify-between items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                    <div className="flex flex-row items-center">
                      {course.duration_minutes && (
                        <div className="flex items-center gap-1 mr-[10px] text-xs text-gray-500">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>{formatDuration(course.duration_minutes)}</span>
                        </div>
                      )}
                      {course.enrolled_count !== undefined && (
                        <div className="flex items-center gap-1 mr-[10px] text-xs text-gray-500">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                            />
                          </svg>
                          <span>{course.enrolled_count}+</span>
                        </div>
                      )}
                      {renderRating(course.rating)}
                    </div>
                    {course.is_enrolled ? (
                      <Link
                        href={`/courses/${course.slug}`}
                        className="bg-purple-500 text-sm font-semibold ml-[10px] hover:bg-purple-600 rounded-lg flex flex-row items-center text-white p-[10px]"
                      >
                        <p>Продолжить</p>
                        <ChevronRight className="w-5 h-5 ml-[10px]" />
                      </Link>
                    ) : (
                      <Link
                        href={`/courses/promo/${course.slug}`}
                        className="bg-purple-500 text-sm font-semibold hover:bg-purple-600 rounded-lg flex flex-row items-center text-white p-[10px]"
                      >
                        <p>Записаться</p>
                        <ChevronRight className="w-5 h-5 ml-[10px]" />
                      </Link>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {!loading &&
        filteredCourses.length > 0 &&
        (searchQuery || selectedCategory) && (
          <p className="text-center text-sm text-gray-500 mt-6">
            Показано {filteredCourses.length} из {courses.length} курсов
          </p>
        )}
    </main>
  );
}
