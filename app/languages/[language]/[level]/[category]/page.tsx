// app/languages/[language]/[level]/[category]/page.tsx
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  CheckCircle,
  Lock,
  PlayCircle,
} from "lucide-react";
import { notFound } from "next/navigation";

type Lesson = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  estimated_minutes: number;
  display_order: number;
  is_completed?: boolean;
};

type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon?: string | null;
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
  icon?: string | null;
};

export const dynamic = "force-static";

export async function generateStaticParams() {
  // 1. Hardcoded fallback (Required for static export safety)
  const fallback = [
    { language: "english", level: "a1", category: "greetings-introductions" },
  ];

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return fallback;

    // 2. Fetch categories from DB
    const res = await fetch(`${supabaseUrl}/rest/v1/categories?select=slug`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      cache: "no-store",
    });

    if (!res.ok) return fallback;

    const categories = await res.json();
    if (!Array.isArray(categories)) return fallback;

    const languages = ["english", "spanish", "french"];
    const levels = ["a1", "a2", "b1", "b2", "c1"];
    const params = [];

    for (const lang of languages) {
      for (const level of levels) {
        for (const cat of categories) {
          if (cat.slug) {
            params.push({
              language: lang,
              level,
              category: String(cat.slug), // ✅ Force it to be a string
            });
          }
        }
      }
    }

    return params.length > 0 ? params : fallback;
  } catch (error) {
    console.error("generateStaticParams error:", error);
    return fallback;
  }
}
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

  // 2. Fetch level info
  const levelRes = await fetch(
    `${supabaseUrl}/rest/v1/levels?select=id,code,name&code=eq.${levelSlug.toUpperCase()}`,
    {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    },
  );
  const level: Level = (await levelRes.json())?.[0];
  if (!level) notFound();

  // 3. Fetch category info
  const catRes = await fetch(
    `${supabaseUrl}/rest/v1/categories?select=id,slug,name,description,icon&slug=eq.${encodeURIComponent(catSlug)}`,
    {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    },
  );
  const category: Category = (await catRes.json())?.[0];
  if (!category) notFound();

  // 4. Fetch lessons for this category
  const lessonsRes = await fetch(
    `${supabaseUrl}/rest/v1/lessons?select=id,slug,title,description,estimated_minutes,display_order&language_id=eq.${language.id}&level_id=eq.${level.id}&category_id=eq.${category.id}&is_published=eq.true&order=display_order`,
    {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    },
  );
  const lessons: Lesson[] = (await lessonsRes.json()) || [];

  // Mock completed lessons (first 2)
  const completedLessons = lessons.slice(0, 2).map((l) => l.id);

  const progress =
    Math.round((completedLessons.length / lessons.length) * 100) || 0;

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
            <div className="flex items-center gap-3 justify-center mb-1">
              <span className="text-3xl">{category.icon}</span>
              <h1 className="text-2xl font-bold">{category.name}</h1>
            </div>
            <p className="text-sm text-gray-600">
              {language.name} — {level.code}
            </p>
          </div>
          <div className="w-6"></div>
        </div>

        {/* Progress Bar */}
      </div>

      {/* Category Description */}
      {category.description && (
        <div className="w-full max-w-5xl mb-8 p-6  rounded-xl ">
          <p className="text-gray-700 text-center">{category.description}</p>
        </div>
      )}

      {/* Lessons List */}
      <div className="w-full max-w-5xl space-y-4">
        {lessons.map((lesson, index) => {
          const isCompleted = completedLessons.includes(lesson.id);
          const isLocked =
            index > 0 && !completedLessons.includes(lessons[index - 1].id);
          const isNext = index === completedLessons.length;

          return (
            <Link
              key={lesson.id}
              href={
                isLocked
                  ? "#"
                  : `/languages/${langSlug}/${levelSlug}/${catSlug}/${lesson.slug}`
              }
              className={`block p-6 rounded-xl border-2 transition-all group bg-white border-gray-300`}
            >
              <div className="flex items-start gap-4">
                {/* Lesson Number / Status Icon */}
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                  ) : isLocked ? (
                    <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-gray-500" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <PlayCircle className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>

                {/* Lesson Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-purple-700 transition-colors">
                      {index + 1}. {lesson.title}
                    </h3>
                  </div>

                  {lesson.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {lesson.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />~{lesson.estimated_minutes}{" "}
                      мин
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      Урок {index + 1} из {lessons.length}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                {!isLocked && (
                  <div className="flex-shrink-0 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all">
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                  </div>
                )}
              </div>
            </Link>
          );
        })}

        {lessons.length === 0 && (
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

      {/* Completion Badge */}
    </main>
  );
}
