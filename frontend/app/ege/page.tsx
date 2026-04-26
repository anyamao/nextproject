// frontend/app/ege/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Subject = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  image: string | null;
};

export default function EgePage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubjects() {
      try {
        // ✅ Запрос на /ege (бэкенд на порту 8010)
        const data = await apiFetch("/ege");
        setSubjects(data);
      } catch (err) {
        console.error("Failed to fetch subjects:", err);
        setError("Не удалось загрузить предметы");
      } finally {
        setLoading(false);
      }
    }
    fetchSubjects();
  }, []);

  return (
    <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 w-full max-w-5xl mx-auto">
      <div className="w-full mb-8">
        <Link
          href="/"
          className="text-gray-600 hover:text-purple-600 transition flex items-center gap-2"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">
          ЕГЭ Подготовка
        </h1>
        <p className="text-gray-600 mt-2">
          Выберите предмет для начала подготовки
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
        </div>
      )}

      {!loading && !error && subjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {subjects.map((subject) => (
            <Link
              key={subject.id}
              href={`/ege/${subject.slug}`} // ✅ Прямая ссылка: /ege/math-profile
              className="group block p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-purple-300 transition-all"
            >
              <h2 className="text-xl font-semibold text-gray-900 group-hover:text-purple-700">
                {subject.title}
              </h2>
              {subject.description && (
                <p className="text-gray-600 mt-2 text-sm line-clamp-2">
                  {subject.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}

      {!loading && !error && subjects.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-2xl w-full">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Предметы пока не добавлены</p>
        </div>
      )}
    </main>
  );
}
