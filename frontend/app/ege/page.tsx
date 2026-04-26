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
  created_at: string;
};

export default function EgePage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubjects() {
      try {
        // ✅ Запрос к новому эндпоинту (без авторизации, публичный)
        const data = await apiFetch("/ege/subjects");
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
    <main className="flex-1 flex flex-col items-center px-[10px] sm:px-[20px] py-[30px] w-full min-h-full max-w-5xl mx-auto">
      <div className="w-full">
        <div className="flex flex-row w-full items-center justify-between">
          <Link
            href="/"
            className="text-gray-600 hover:text-purple-600 transition"
          >
            <ArrowLeft className="w-6 h-6 cursor-pointer" />
          </Link>
          <p className="bigger-text font-bold">ЕГЭ Подготовка</p>
          <div></div>
        </div>
        <p className="text-gray-600 ord-text max-w-2xl mt-[20px] mx-auto">
          Выберите предмет для начала подготовки. Каждый урок включает теорию,
          практические задания и тест для проверки знаний. :)
        </p>
      </div>

      {/* Загрузка */}
      {loading && (
        <div className="flex justify-center py-20 mt-[20px]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600" />
        </div>
      )}

      {/* Ошибка */}
      {error && !loading && (
        <div className="text-center py-20">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <p className="text-gray-500">
            Проверьте подключение к интернету или попробуйте позже
          </p>
        </div>
      )}

      {/* Список предметов */}
      {!loading && !error && subjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-[20px] w-full">
          {subjects.map((subject) => (
            <Link
              key={subject.id}
              href={`/ege/${subject.slug}`}
              className="group block p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-purple-300 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                {subject.image && (
                  <img
                    src={subject.image}
                    alt={subject.title}
                    className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                    onError={(e) => {
                      // Если картинка не загрузилась — показываем заглушку
                      (e.target as HTMLImageElement).src =
                        "/subjects/placeholder.svg";
                    }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                    {subject.title}
                  </h2>
                  <p className="text-gray-600 mt-2 text-sm line-clamp-2">
                    {subject.description || "Курс подготовки к ЕГЭ"}
                  </p>
                </div>
                <div className="text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all">
                  →
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Пустой список */}
      {!loading && !error && subjects.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-2xl w-full">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Предметы пока не добавлены
          </h3>
          <p className="text-gray-500 mb-6">
            Администратор ещё не добавил доступные предметы
          </p>
        </div>
      )}
    </main>
  );
}
