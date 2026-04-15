// app/languages/[language]/page.tsx
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  Lock,
  BookOpen,
  Trophy,
  Clock,
} from "lucide-react";
import { notFound } from "next/navigation";

type Level = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  display_order: number;
  categories_count?: number;
};

type Language = {
  id: string;
  slug: string;
  name: string;
  icon?: string | null;
};

export async function generateStaticParams() {
  const fallback = [
    { language: "english" },
    { language: "spanish" },
    { language: "french" },
    { language: "german" },
    { language: "italian" },
    { language: "russian" },
  ];

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return fallback;

    const res = await fetch(`${supabaseUrl}/rest/v1/languages?select=slug`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      cache: "no-store",
    });

    if (!res.ok) return fallback;

    const langs = await res.json();
    if (!langs || langs.length === 0) return fallback;

    return langs.map((l: { slug: string }) => ({ language: l.slug }));
  } catch {
    return fallback;
  }
}

export default async function LanguageRoadmapPage({
  params,
}: {
  params: Promise<{ language: string }>;
}) {
  const { language: langSlug } = await params;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // 1. Fetch language info
  const langRes = await fetch(
    `${supabaseUrl}/rest/v1/languages?select=id,slug,name,icon&slug=eq.${encodeURIComponent(langSlug)}`,
    {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    },
  );
  const language: Language = (await langRes.json())?.[0];
  if (!language) notFound();

  // 2. Fetch levels
  const levelsRes = await fetch(
    `${supabaseUrl}/rest/v1/levels?select=id,code,name,description,display_order&order=display_order`,
    {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    },
  );
  const allLevels: Level[] = await levelsRes.json();

  // 3. Fetch category counts per level for this language
  const categoryCountsRes = await fetch(
    `${supabaseUrl}/rest/v1/language_level_categories?select=level_id,count:category_id&language_id=eq.${language.id}&order=level_id`,
    {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    },
  );

  // ✅ ИСПРАВЛЕНИЕ: гарантируем, что categoryCounts будет массивом
  let categoryCounts: { level_id: string; count: number }[] = [];
  const countsData = await categoryCountsRes.json();

  if (Array.isArray(countsData)) {
    categoryCounts = countsData;
  } else if (countsData && typeof countsData === "object") {
    // Если пришёл объект, пытаемся извлечь массив
    categoryCounts = Object.values(countsData).filter(Array.isArray)[0] || [];
  }
  // Если ничего не подошло — оставляем пустой массив

  // Merge counts into levels
  const levels = allLevels.map((level) => ({
    ...level,
    categories_count:
      categoryCounts.find((c) => c.level_id === level.id)?.count || 0,
  }));

  // Mock progress data
  const completedLevels = ["A1"];

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
            <h1 className="text-2xl font-bold">{language.name}</h1>
          </div>
          <div></div>
        </div>
        <p className="text-gray-600 ord-text mt-4 max-w-2xl">
          Пройдите все уровни от {levels[0]?.code} до{" "}
          {levels[levels.length - 1]?.code}. Каждый уровень включает
          интерактивные уроки, практику и тесты.
        </p>
      </div>

      <div className="relative w-full">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 hidden sm:block" />

        <div className="space-y-8">
          {levels.map((level, index) => {
            const isCompleted = completedLevels.includes(level.code);
            const isLocked =
              index > 0 && !completedLevels.includes(levels[index - 1].code);

            return (
              <div
                key={level.id}
                className="relative flex items-start gap-4 sm:gap-6"
              >
                <div className="relative z-10 flex-shrink-0">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ord-text text-purple-600 bg-purple-200 border-[1px] border-purple-500 transition-all`}
                  >
                    {level.code}
                  </div>
                </div>

                <Link
                  href={`/languages/${langSlug}/${level.code.toLowerCase()}`}
                  className={`flex-1 p-5 rounded-xl border-2 transition-all group bg-white border-[1px] border-gray-300 shadow-xs`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-800">
                          {level.code} — {level.name}
                        </h3>
                      </div>

                      <p className="text-gray-600 text-sm mb-3">
                        {level.description || "Освойте базовые навыки общения"}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4 text-purple-500" />
                          {level.categories_count || 5} тем
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-purple-500" />~
                          {20 + index * 10} часов
                        </span>
                        <span className="flex items-center gap-1">
                          <Trophy className="w-4 h-4 text-purple-500" />
                          {3 + index} теста
                        </span>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {completedLevels.length === levels.length && (
        <div className="mt-12 p-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl text-white text-center shadow-lg">
          <Trophy className="w-12 h-12 mx-auto mb-3" />
          <h3 className="text-xl font-bold mb-2">Поздравляем! 🎉</h3>
          <p className="opacity-90">Вы завершили весь курс {language.name}!</p>
        </div>
      )}
    </main>
  );
}
