// frontend/app/languages/[language]/[level]/[category]/page.tsx

import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  CheckCircle,
  PlayCircle,
  Eye,
} from "lucide-react";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api"; // ✅ Универсальный fetch

type Lesson = {
  id: number; // 🔁 Теперь int
  slug: string;
  title: string;
  description: string | null;
  estimated_minutes: number;
  order_number: number;
  view_count: number;
};

type Category = {
  id: number; // 🔁 Теперь int
  slug: string;
  name: string;
  description: string | null;
};

type Level = {
  id: number; // 🔁 Теперь int
  code: string;
  name: string;
};

type Language = {
  id: number; // 🔁 Теперь int
  slug: string;
  name: string;
  icon: string | null;
};

export const dynamic = "force-dynamic";

export default async function CategoryLessonsPage({
  params,
}: {
  params: Promise<{ language: string; level: string; category: string }>;
}) {
  const {
    language: langSlug,
    level: levelSlug,
    category: catSlug,
  } = await params;

  let language: Language | null = null;
  let level: Level | null = null;
  let category: Category | null = null;
  let lessons: Lesson[] = [];
  let error: string | null = null;

  try {
    const levelCode = levelSlug.toUpperCase();

    // 1️⃣ Fetch языка (с фоллбеком)
    try {
      language = await apiFetch(`/api/languages/${langSlug}`);
    } catch {
      language = {
        id: 0,
        slug: langSlug,
        name: langSlug.charAt(0).toUpperCase() + langSlug.slice(1),
        icon: null,
      };
    }

    // 2️⃣ Fetch уровня
    const levelsData = await apiFetch(`/api/languages/${langSlug}/levels`);
    level = levelsData.levels.find((l: Level) => l.code === levelCode) || null;
    if (!level) notFound();

    // 3️⃣ Fetch категории
    const categoriesData = await apiFetch(
      `/api/languages/${langSlug}/levels/${levelCode}/categories`,
    );
    category =
      categoriesData.categories.find((c: Category) => c.slug === catSlug) ||
      null;
    if (!category) notFound();

    // 4️⃣ Fetch уроков для этой категории
    const lessonsData = await apiFetch(
      `/api/languages/${langSlug}/levels/${levelCode}/categories/${catSlug}/lessons`,
    );
    lessons = lessonsData.lessons;
  } catch (err) {
    console.error("❌ Error fetching lessons:", err);
    error = "Не удалось загрузить уроки";
  }

  if (!category && !error) {
    notFound();
  }

  const languageName =
    language?.name || langSlug.charAt(0).toUpperCase() + langSlug.slice(1);
  const levelName = level?.name || levelSlug.toUpperCase();

  // Прогресс (заглушка — потом добавим реальное сохранение)
  const completedLessons: string[] = [];
  const progress =
    lessons.length > 0
      ? Math.round((completedLessons.length / lessons.length) * 100)
      : 0;

  return (
    <main className="flex-1 flex flex-col items-center px-[10px] sm:px-[20px] py-[30px] w-full min-h-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="w-full mb-[10px]">
        <div className="flex items-center justify-between">
          <Link
            href={`/languages/${langSlug}/${levelSlug}`}
            className="text-gray-600 hover:text-purple-600 transition"
          >
            <ArrowLeft className="w-6 h-6 cursor-pointer" />
          </Link>
          <div className="text-center">
            <h1 className="text-2xl font-bold">{category?.name}</h1>
            <p className="text-sm text-gray-600">
              {languageName} — {levelName}
            </p>
          </div>
          <div className="w-6"></div>
        </div>
      </div>

      {/* Description */}
      {category?.description && (
        <div className="w-full max-w-5xl mb-8 p-6 rounded-xl bg-gray-50">
          <p className="text-gray-700 text-center">{category.description}</p>
        </div>
      )}

      {/* Progress bar */}
      {lessons.length > 0 && (
        <div className="w-full max-w-5xl mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Прогресс категории</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-center py-10">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <Link
            href={`/languages/${langSlug}/${levelSlug}`}
            className="text-purple-600 hover:underline"
          >
            ← Вернуться к темам
          </Link>
        </div>
      )}

      {/* Lessons list */}
      <div className="w-full max-w-5xl space-y-4">
        {lessons.map((lesson, index) => {
          const isCompleted = completedLessons.includes(lesson.id.toString());
          const isLocked =
            index > 0 &&
            !completedLessons.includes(lessons[index - 1]?.id.toString());

          return (
            <Link
              key={lesson.id}
              href={`/languages/${langSlug}/${levelSlug}/${catSlug}/${lesson.slug}`}
              className={`block p-6 rounded-xl border-2 transition-all group bg-white border-gray-200 hover:border-purple-300 hover:shadow-lg cursor-pointer ${
                isLocked ? "opacity-60 pointer-events-none" : ""
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <PlayCircle className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-row items-center w-full justify-between">
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-purple-700 transition-colors mb-2">
                      {index + 1}. {lesson.title}
                    </h3>
                  </div>
                  {lesson.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {lesson.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />~
                      {lesson.estimated_minutes || 30} мин
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      Урок {index + 1} из {lessons.length}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex-shrink-0 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all">
                  <ArrowLeft className="w-5 h-5 rotate-180" />
                </div>

                {/* Completed badge */}
                {isCompleted && (
                  <div className="flex-shrink-0 text-green-500">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                )}
              </div>
            </Link>
          );
        })}

        {/* Empty state */}
        {lessons.length === 0 && !error && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              Уроки для этой категории пока не добавлены
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Проверьте позже — мы постоянно добавляем новый контент!
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
