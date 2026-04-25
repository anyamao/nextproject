// frontend/app/ege/[subject]/page.tsx

import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";
import { apiFetch } from "@/lib/api"; // ✅ Используем универсальный fetch

type Lesson = {
  id: number; // 🔁 Теперь int
  slug: string;
  title: string;
  description: string | null;
  estimated_minutes: number | null;
  view_count: number;
};

export const dynamic = "force-dynamic";

export default async function SubjectHubPage({
  params,
}: {
  params: Promise<{ subject: string }>;
}) {
  const { subject: subjectSlug } = await params;

  // 📚 Мета-данные предметов (для отображения)
  const subjectMeta: Record<string, { name: string; description: string }> = {
    "math-profile-ege": {
      name: "Профильная математика",
      description:
        "Полная подготовка к ЕГЭ по математике: алгебра, геометрия, задачи с разбором",
    },
    "physics-ege": {
      name: "Физика",
      description: "Механика, электричество, оптика — всё для высокого балла",
    },
    "russian-ege": {
      name: "Русский язык",
      description: "Грамматика, сочинение, тесты — системная подготовка",
    },
    "informatics-ege": {
      name: "Информатика",
      description: "Программирование, алгоритмы, базы данных",
    },
  };

  const currentSubject = subjectMeta[subjectSlug] || {
    name: subjectSlug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase()),
    description: "Подготовка к ЕГЭ",
  };

  let lessons: Lesson[] = [];
  let error: string | null = null;

  try {
    // 🔁 Fetch к твоему FastAPI бэкенду
    const data = await apiFetch(`/api/ege/${subjectSlug}/lessons`);
    lessons = data.lessons;
  } catch (err) {
    console.error("❌ Failed to fetch lessons:", err);
    error = "Не удалось загрузить уроки";
  }

  return (
    <main className="flex-1 flex flex-col items-center px-[10px] sm:px-[20px] py-[30px] w-full min-h-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between w-full mb-6">
        <Link
          href="/ege"
          className="text-gray-600 hover:text-purple-600 transition"
        >
          <ArrowLeft className="w-6 h-6 cursor-pointer" />
        </Link>
        <div className="bigger-text font-semibold">{currentSubject.name}</div>
      </div>

      {/* Description */}
      <p className="text-gray-600 mb-8">{currentSubject.description}</p>

      {/* Error state */}
      {error && (
        <div className="text-center py-10">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <Link href="/ege" className="text-purple-600 hover:underline">
            ← Вернуться к списку предметов
          </Link>
        </div>
      )}

      {/* Lessons list */}
      {lessons.length === 0 && !error ? (
        <p className="text-gray-500 text-center py-10">
          Пока нет доступных уроков.
        </p>
      ) : (
        <div className="grid gap-4 w-full">
          {lessons.map((lesson) => (
            <Link
              key={lesson.id}
              href={`/ege/${subjectSlug}/${lesson.slug}`}
              className="block p-[20px] bg-white hover:ml-[30px] duration-300 shadow-xs transition-all border-[1px] border-gray-300 rounded-xl flex flex-row justify-between group"
            >
              <div className="flex flex-row w-full">
                <div className="bg-purple-400 h-full w-[5px] rounded-l-xl"></div>
                <div className="flex flex-col ml-[10px] w-full items-start">
                  <div className="flex flex-row items-center w-full flex-1 justify-between">
                    <h2 className="ord-text font-semibold">{lesson.title}</h2>
                    <div className="flex flex-row items-center mx-[15px]">
                      <p className="text-[10px] mr-[5px]">
                        {lesson.view_count || 0}
                      </p>
                      <Eye className="w-[15px] h-[15px] text-gray-400" />
                    </div>
                  </div>
                  <p className="text-gray-600 mt-1">
                    {lesson.description || "Описание урока"}
                  </p>
                  <span className="text-sm text-gray-600 mt-[5px] inline-block">
                    ⏱ {lesson.estimated_minutes ?? 30} мин
                  </span>
                </div>
              </div>
              <ArrowLeft className="w-5 h-5 mt-[15px] text-gray-400 rotate-180 group-hover:translate-x-1 transition-transform" />
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
