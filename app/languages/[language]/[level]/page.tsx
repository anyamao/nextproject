// app/languages/[language]/[level]/page.tsx
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { notFound } from "next/navigation";

type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  order_number: number;
};

type Level = {
  id: string;
  code: string;
  name: string;
};

type Language = {
  id: string;
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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // 1. Получаем язык
  const langRes = await fetch(
    `${supabaseUrl}/rest/v1/languages?select=id,slug,name,icon&slug=eq.${encodeURIComponent(langSlug)}&is_published=eq.true`,
    {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      cache: "no-store",
    },
  );
  const language: Language | undefined = (await langRes.json())?.[0];
  if (!language) notFound();

  // 2. Получаем уровень
  const levelRes = await fetch(
    `${supabaseUrl}/rest/v1/levels?select=id,code,name&language_id=eq.${language.id}&code=eq.${levelSlug.toUpperCase()}&is_published=eq.true`,
    {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      cache: "no-store",
    },
  );
  const level: Level | undefined = (await levelRes.json())?.[0];
  if (!level) notFound();

  // 3. Получаем категории - УБРАЛИ icon ИЗ SELECT
  const categoriesRes = await fetch(
    `${supabaseUrl}/rest/v1/categories?select=id,slug,name,description,order_number&language_id=eq.${language.id}&level_id=eq.${level.id}&is_published=eq.true&order=order_number.asc`,
    {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      cache: "no-store",
    },
  );

  const categoriesData = await categoriesRes.json();

  // Убеждаемся, что categories это массив
  const categories: Category[] = Array.isArray(categoriesData)
    ? categoriesData
    : [];

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
              {language.name} — {level.code.toUpperCase()}
            </h1>
            <p className="text-sm text-gray-600">{level.name}</p>
          </div>
          <div className="w-6"></div>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Пока нет доступных тем
          </h3>
          <p className="text-gray-500">
            Для уровня {level.code.toUpperCase()} еще не добавлены категории
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
                        {category.description}
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
