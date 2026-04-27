// frontend/app/courses/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, ArrowLeft, Code, Laptop, Globe } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Subject = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  image: string | null;
};

export default function CoursesPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubjects() {
      try {
        // 🔁 Запрос к новому эндпоинту для обычных курсов
        const data = await apiFetch("/courses/subjects");
        setSubjects(data);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
        setError("Не удалось загрузить курсы");
      } finally {
        setLoading(false);
      }
    }
    fetchSubjects();
  }, []);

  // Иконка для курса (опционально, для красоты)
  const getCourseIcon = (slug: string) => {
    if (slug.includes("programming") || slug.includes("python"))
      return <Code className="w-10 h-10 text-purple-500" />;
    if (slug.includes("web") || slug.includes("frontend"))
      return <Globe className="w-10 h-10 text-blue-500" />;
    return <Laptop className="w-10 h-10 text-gray-500" />;
  };

  return (
    <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 w-full max-w-5xl mx-auto">
      <div className="w-full mb-8">
        <Link
          href="/"
          className="text-gray-600 hover:text-purple-600 transition flex items-center gap-2"
        >
          <ArrowLeft className="w-6 h-6" />
          <span>На главную</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Курсы</h1>
        <p className="text-gray-600 mt-2">
          Практические курсы по программированию и технологиям
        </p>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600" />
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-20">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <p className="text-gray-500">Попробуйте обновить страницу</p>
        </div>
      )}

      {!loading && !error && subjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {subjects.map((subject) => (
            <Link
              key={subject.id}
              href={`/courses/${subject.slug}`}
              className="group block p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-purple-300 transition-all"
            >
              <div className="flex items-start gap-4">
                {/* Иконка курса */}
                <div className="flex-shrink-0 p-3 bg-gray-50 rounded-xl">
                  {getCourseIcon(subject.slug)}
                </div>

                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                    {subject.title}
                  </h2>
                  {subject.description && (
                    <p className="text-gray-600 mt-2 text-sm line-clamp-2">
                      {subject.description}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && !error && subjects.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-2xl w-full">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Курсы пока не добавлены
          </h3>
          <p className="text-gray-500">
            Скоро здесь появятся новые практические курсы!
          </p>
        </div>
      )}
    </main>
  );
}
