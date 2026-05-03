// frontend/app/courses/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import {
  Search,
  BookOpen,
  Code,
  Globe,
  Calculator,
  Filter,
  LanguagesIcon,
  Notebook,
  Braces,
} from "lucide-react";

type Course = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  image: string | null;
  category: string | null; // ✅ Новое поле
};

// 🎨 Категории для фильтрации
const CATEGORIES = [
  { value: "", label: "Все", icon: Filter },
  { value: "Английский", label: "Английский", icon: Globe },
  { value: "Веб-разработка", label: "Веб-разработка", icon: Code },
  { value: "Анализ данных", label: "Анализ данных", icon: Braces },
  { value: "ЕГЭ", label: "ЕГЭ", icon: Notebook },
  { value: "Китайский", label: "Китайский", icon: LanguagesIcon },
];

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔍 Состояния для поиска и фильтра
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Загрузка курсов
  useEffect(() => {
    async function fetchCourses() {
      try {
        // ✅ Передаём параметры поиска и категории в бэкенд
        const params = new URLSearchParams();
        if (selectedCategory) params.append("category", selectedCategory);
        if (searchQuery) params.append("search", searchQuery);

        const queryString = params.toString();
        const url = `/courses/subjects${queryString ? `?${queryString}` : ""}`;

        const data = await apiFetch(url);
        setCourses(data);
        setFilteredCourses(data);
      } catch (err) {
        console.error("Failed to fetch courses", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, [selectedCategory, searchQuery]); // ✅ Перезагружаем при изменении фильтров

  // 🔍 Локальная фильтрация (опционально, если хочешь мгновенный отклик)
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

  return (
    <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 w-full max-w-6xl mx-auto">
      {/* 🔝 Заголовок */}
      <div className="w-full mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Курсы</h1>
        <p className="text-gray-600 mt-2">
          Найдите курс для развития ваших навыков
        </p>
      </div>

      {/* 🔍 Поиск и фильтры */}
      <div className="w-full mb-8 space-y-4">
        {/* Поисковая строка */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск курсов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition"
          />
        </div>

        {/* Кнопки категорий */}
        <div className="flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.value;

            return (
              <button
                key={cat.value || "all"}
                onClick={() => setSelectedCategory(cat.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
                  isActive
                    ? "bg-purple-600 text-white shadow-md"
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

      {/* 📚 Список курсов */}
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
              }}
              className="text-purple-600 hover:underline mt-2"
            >
              Сбросить фильтры
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {filteredCourses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.slug}`}
              className="group block p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-purple-300 transition-all"
            >
              {/* 🏷️ Бейдж категории */}
              {course.category && (
                <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 mb-3">
                  {CATEGORIES.find((c) => c.value === course.category)?.label ||
                    course.category}
                </span>
              )}

              <h2 className="text-xl font-semibold text-gray-900 group-hover:text-purple-700">
                {course.title}
              </h2>

              {course.description && (
                <p className="text-gray-600 mt-2 text-sm line-clamp-2">
                  {course.description}
                </p>
              )}

              {/* 📊 Статистика (заглушка) */}
            </Link>
          ))}
        </div>
      )}

      {/* 💡 Подсказка */}
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
