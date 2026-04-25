// frontend/app/languages/[language]/[level]/page.tsx

import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api"; // ✅ Универсальный fetch

type Category = {
  id: number; // 🔁 Теперь int (из FastAPI)
  slug: string;
  name: string;
  description: string | null;
  order_number: number;
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

export default async function LevelCategoriesPage({
  params,
}: {
  params: Promise<{ language: string; level: string }>;
}) {
  const { language: langSlug, level: levelSlug } = await params;

  let level: Level | null = null;
  let language: Language | null = null;
  let categories: Category[] = [];
  let error: string | null = null;

  try {
    const levelCode = levelSlug.toUpperCase(); // "a2" → "A2"

    // 1️⃣ Fetch языка (с фоллбеком, если эндпоинт ещё не создан)
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

    // 2️⃣ Fetch уровней → находим нужный по коду
    const levelsData = await apiFetch(`/api/languages/${langSlug}/levels`);
    level = levelsData.levels.find((l: Level) => l.code === levelCode) || null;

    if (!level) {
      notFound();
    }

    // 3️⃣ Fetch категорий для этого уровня
    const categoriesData = await apiFetch(
      `/api/languages/${langSlug}/levels/${levelCode}/categories`,
    );
    categories = categoriesData.categories;
  } catch (err) {
    console.error("❌ Error fetching categories:", err);
    error = "Не удалось загрузить темы";
  }

  if (!level && !error) {
    notFound();
  }

  const levelName = level?.name || levelSlug.toUpperCase();
  const languageName =
    language?.name || langSlug.charAt(0).toUpperCase() + langSlug.slice(1);

  return (
    <main className="flex-1 flex flex-col items-center px-[10px] sm:px-[20px] py-[30px] w-full min-h-full max-w-5xl mx-auto">
      <div className="w-full mb-8">
        <div className="flex items-center justify-between">
          <Link
            href={`/languages/${langSlug}`}
            className="text-gray-600 hover:text-purple-600 transition"
          >
            <ArrowLeft className="w-6 h-6 cursor-pointer" />
          </Link>
          <div className="text-center">
            <h1 className="text-2xl font-bold">
              {languageName} — {levelName}
            </h1>
            <p className="text-sm text-gray-600">Выберите тему для начала</p>
          </div>
          <div className="w-6"></div>
        </div>
      </div>

      {error && (
        <div className="text-center py-10">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <Link
            href={`/languages/${langSlug}`}
            className="text-purple-600 hover:underline"
          >
            ← Вернуться к уровням
          </Link>
        </div>
      )}

      {categories.length === 0 && !error ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Пока нет доступных тем
          </h3>
          <p className="text-gray-500">
            Для уровня {levelName} еще не добавлены категории
          </p>
        </div>
      ) : (
        <div className="relative w-full">
          <div className="space-y-6">
            {categories.map((category, index) => (
              <div
                key={category.id}
                className="relative flex items-start gap-4 sm:gap-6"
              >
                <div className="relative z-10 flex-shrink-0">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold bg-purple-100 border-2 border-purple-500 text-purple-600 shadow-lg">
                    {index + 1}
                  </div>
                </div>

                <Link
                  href={`/languages/${langSlug}/${levelSlug}/${category.slug}`}
                  className="flex-1 p-5 rounded-xl border-2 transition-all group bg-white border-gray-200 hover:border-purple-300 hover:shadow-lg cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 group-hover:text-purple-700 transition-colors mb-2">
                        {category.name}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {category.description || "Описание темы"}
                      </p>
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
