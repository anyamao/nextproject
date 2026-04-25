// frontend/app/languages/[language]/page.tsx

import Link from "next/link";
import { ArrowLeft, BookOpen, Trophy, Clock } from "lucide-react";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api"; // ✅ Универсальный fetch

type Level = {
  id: number; // 🔁 Теперь int
  code: string;
  name: string;
  description: string | null;
  display_order: number;
  categories_count?: number;
};

type Language = {
  id: number; // 🔁 Теперь int
  slug: string;
  name: string;
  icon: string | null;
};

export const dynamic = "force-dynamic";

export default async function LanguageRoadmapPage({
  params,
}: {
  params: Promise<{ language: string }>;
}) {
  const { language: langSlug } = await params;

  let language: Language | null = null;
  let levels: Level[] = [];
  let error: string | null = null;

  try {
    // 1️⃣ Fetch языка
    const langData = await apiFetch(`/api/languages/${langSlug}`);
    language = langData;

    if (!language) {
      notFound();
    }

    // 2️⃣ Fetch уровней для этого языка
    const levelsData = await apiFetch(`/api/languages/${langSlug}/levels`);
    levels = levelsData.levels;
  } catch (err) {
    console.error("❌ Error fetching language data:", err);
    error = "Не удалось загрузить данные";
  }

  if (!language && !error) {
    notFound();
  }

  return (
    <main className="flex-1 flex flex-col items-center px-[10px] sm:px-[20px] py-[30px] w-full min-h-full max-w-5xl mx-auto">
      <div className="w-full mb-8 flex flex-col items-center text-center">
        <div className="flex items-center w-full justify-between">
          <Link
            href="/languages"
            className="text-gray-600 hover:text-purple-600 transition"
          >
            <ArrowLeft className="w-6 h-6 cursor-pointer" />
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{language?.name}</h1>
          </div>
          <div></div>
        </div>
        <p className="text-gray-600 ord-text mt-4 max-w-2xl">
          {levels.length > 0
            ? `Пройдите все уровни от ${levels[0]?.code} до ${levels[levels.length - 1]?.code}. Каждый уровень включает интерактивные уроки, практику и тесты.`
            : "Уровни для этого языка скоро появятся"}
        </p>
      </div>

      {error && (
        <div className="text-center py-10">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <Link href="/languages" className="text-purple-600 hover:underline">
            ← Вернуться к списку языков
          </Link>
        </div>
      )}

      {levels.length === 0 && !error ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Пока нет доступных уровней
          </h3>
          <p className="text-gray-500">
            Для языка {language?.name} еще не добавлены уровни. Загляните позже!
          </p>
        </div>
      ) : (
        <div className="relative w-full">
          <div className="space-y-8">
            {levels.map((level, index) => (
              <div
                key={level.id}
                className="relative flex items-start gap-4 sm:gap-6"
              >
                <div className="relative z-10 flex-shrink-0">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-purple-100 border-2 border-purple-500 text-purple-600">
                    {level.code}
                  </div>
                </div>

                <Link
                  href={`/languages/${langSlug}/${level.code.toLowerCase()}`}
                  className="flex-1 p-5 rounded-xl border-2 transition-all group bg-white border-gray-200 hover:border-purple-300 hover:shadow-lg cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-xl font-bold text-gray-800 group-hover:text-purple-700 transition-colors">
                          {level.code} — {level.name}
                        </h3>
                      </div>

                      <p className="text-gray-600 text-sm mb-3">
                        {level.description || "Освойте базовые навыки общения"}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4 text-purple-500" />
                          {level.categories_count || 0} тем
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-purple-500" />~
                          {Math.max(10, (index + 1) * 10)} часов
                        </span>
                        <span className="flex items-center gap-1">
                          <Trophy className="w-4 h-4 text-purple-500" />
                          {Math.max(2, index + 2)} теста
                        </span>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform rotate-180" />
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
