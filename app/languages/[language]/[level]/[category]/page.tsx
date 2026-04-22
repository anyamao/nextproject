// app/languages/[language]/[level]/[category]/page.tsx
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  CheckCircle,
  Lock,
  Eye,
  PlayCircle,
} from "lucide-react";
import { notFound } from "next/navigation";

type Lesson = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  estimated_minutes: number;
  order_number: number;
  view_count: number;
};

type LessonFromDB = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  estimated_minutes: number;
  order_number: number;
};

type LessonView = {
  lesson_id: string;
};

type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  try {
    // 1. Получаем язык
    const langRes = await fetch(
      `${supabaseUrl}/rest/v1/languages?select=id,slug,name,icon&slug=eq.${encodeURIComponent(langSlug)}&is_published=eq.true`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        cache: "no-store",
      },
    );
    const language: Language | undefined = (await langRes.json())?.[0];
    if (!language) notFound();

    // 2. Получаем уровень
    const levelRes = await fetch(
      `${supabaseUrl}/rest/v1/levels?select=id,code,name&language_id=eq.${language.id}&code=eq.${levelSlug.toUpperCase()}&is_published=eq.true`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        cache: "no-store",
      },
    );
    const level: Level | undefined = (await levelRes.json())?.[0];
    if (!level) notFound();

    // 3. Получаем категорию - УБРАЛИ icon ИЗ SELECT
    const catRes = await fetch(
      `${supabaseUrl}/rest/v1/categories?select=id,slug,name,description&slug=eq.${encodeURIComponent(catSlug)}&language_id=eq.${language.id}&level_id=eq.${level.id}&is_published=eq.true`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        cache: "no-store",
      },
    );

    const category: Category | undefined = (await catRes.json())?.[0];
    if (!category) notFound();

    // 4. Получаем уроки
    const lessonsRes = await fetch(
      `${supabaseUrl}/rest/v1/ege_lessons?select=id,slug,title,description,estimated_minutes,order_number&language_id=eq.${language.id}&level_id=eq.${level.id}&category_id=eq.${category.id}&is_published=eq.true&order=order_number.asc`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        cache: "no-store",
      },
    );

    const lessonsData: LessonFromDB[] = await lessonsRes.json();
    const lessonsFromDB: LessonFromDB[] = Array.isArray(lessonsData)
      ? lessonsData
      : [];

    // Fetch view counts for all lessons
    let lessons: Lesson[] = [];

    if (lessonsFromDB.length > 0) {
      const lessonIds = lessonsFromDB.map((lesson) => lesson.id);

      // Fetch all views for these lessons
      const viewsRes = await fetch(
        `${supabaseUrl}/rest/v1/lesson_views?select=lesson_id&lesson_id=in.(${lessonIds.join(",")})`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
          cache: "no-store",
        },
      );

      // Count views per lesson
      const viewCountMap = new Map<string, number>();
      if (viewsRes.ok) {
        const viewsData: LessonView[] = await viewsRes.json();
        if (Array.isArray(viewsData)) {
          viewsData.forEach((view: LessonView) => {
            viewCountMap.set(
              view.lesson_id,
              (viewCountMap.get(view.lesson_id) || 0) + 1,
            );
          });
        }
      }

      // Combine lessons with their view counts
      lessons = lessonsFromDB.map((lesson: LessonFromDB) => ({
        ...lesson,
        view_count: viewCountMap.get(lesson.id) || 0,
      }));
    } else {
      lessons = lessonsFromDB.map((lesson: LessonFromDB) => ({
        ...lesson,
        view_count: 0,
      }));
    }

    const completedLessons: string[] = [];
    const progress =
      lessons.length > 0
        ? Math.round((completedLessons.length / lessons.length) * 100)
        : 0;

    return (
      <main className="flex-1 flex flex-col items-center px-[10px] sm:px-[20px] py-[30px] w-full min-h-full max-w-5xl mx-auto">
        <div className="w-full mb-[10px]">
          <div className="flex items-center justify-between">
            <Link
              href={`/languages/${langSlug}/${levelSlug}`}
              className="text-gray-600 hover:text-purple-600 transition"
            >
              <ArrowLeft className="w-6 h-6 cursor-pointer" />
            </Link>
            <div className="text-center">
              <h1 className="text-2xl font-bold">{category.name}</h1>
              <p className="text-sm text-gray-600">
                {language.name} — {level.code}
              </p>
            </div>
            <div className="w-6"></div>
          </div>
        </div>

        {category.description && (
          <div className="w-full max-w-5xl mb-8 p-6 rounded-xl">
            <p className="text-gray-700 text-center">{category.description}</p>
          </div>
        )}

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

        <div className="w-full max-w-5xl space-y-4">
          {lessons.map((lesson, index) => {
            const isCompleted = completedLessons.includes(lesson.id);
            const isLocked =
              index > 0 && !completedLessons.includes(lessons[index - 1]?.id);

            return (
              <Link
                key={lesson.id}
                href={`/languages/${langSlug}/${levelSlug}/${catSlug}/${lesson.slug}`}
                className={`block p-6 rounded-xl border-2 transition-all group bg-white border-gray-200 hover:border-purple-300 hover:shadow-lg cursor-pointer`}
              >
                <div className="flex items-start gap-4">
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

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-row items-center w-full justify-between">
                      <h3 className="text-lg font-bold text-gray-800 group-hover:text-purple-700 transition-colors mb-2">
                        {index + 1}. {lesson.title}
                      </h3>
                      <div className="flex flex-row items-center mb-2 mx-[15px]">
                        <p className="text-[10px] mr-[5px]">
                          {lesson.view_count || 0}
                        </p>
                        <Eye className="w-[15px] h-[15px] text-gray-400"></Eye>
                      </div>
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

                  <div className="flex-shrink-0 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all">
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                  </div>

                  {isCompleted && (
                    <div className="flex-shrink-0 text-green-500">
                      <CheckCircle className="w-5 h-5" />
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
      </main>
    );
  } catch (error) {
    console.error("Error:", error);
    notFound();
  }
}
