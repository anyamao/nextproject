// frontend/app/courses/promo/[slug]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Clock, Award } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function CoursePromoPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        // 🔹 Берём данные из уже рабочего эндпоинта
        const courses = await apiFetch("/courses/subjects");
        const found = courses.find((c: any) => c.slug === slug);
        setCourse(found);
      } catch (err) {
        console.error("❌ Failed to load course promo:", err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchCourse();
  }, [slug]);

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

  return (
    <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 w-full max-w-4xl mx-auto">
      <div className="w-full mb-6">
        <Link
          href="/courses"
          className="text-gray-600 hover:text-purple-600 transition flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" /> Все курсы
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden w-full">
        {/* Обложка */}
        {course.image && (
          <div className="h-64 sm:h-80 bg-gray-100 overflow-hidden">
            <img
              src={`/${course.image}`}
              alt={course.title}
              className="w-full h-full object-cover"
              onError={(e) =>
                (e.target as HTMLImageElement).parentElement?.classList.add(
                  "hidden",
                )
              }
            />
          </div>
        )}

        {/* Контент */}
        <div className="p-6 sm:p-8">
          {course.category && (
            <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 mb-3">
              {course.category}
            </span>
          )}

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {course.title}
          </h1>

          {course.description && (
            <p className="text-gray-600 leading-relaxed mb-8 whitespace-pre-wrap">
              {course.description}
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-gray-100">
            <Link
              href={`/courses/${slug}`}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition shadow-md"
            >
              <BookOpen className="w-5 h-5" /> Начать обучение
            </Link>

            <p className="text-sm text-gray-500">
              Перейти к списку уроков и прогрессу
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
