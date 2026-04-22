import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";

type Lesson = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  estimated_minutes: number | null;
  image?: string;
  view_count: number;
};

type Course = {
  id: string;
  slug: string;
  name: string;
  subject: string | null;
  description: string | null;
  estimated_minutes: number | null;
  image: string;
};

type LessonFromDB = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  estimated_minutes: number | null;
};

type LessonView = {
  lesson_id: string;
};

export const dynamic = "force-dynamic";

export default async function SubjectHubPage({
  params,
}: {
  params: Promise<{ course: string }>;
}) {
  const { course } = await params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let lessons: Lesson[] = [];
  let currentCourse: Course | null = null;
  let error: string | null = null;

  try {
    if (supabaseUrl && supabaseKey) {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/courses?select=id,slug,name,subject,description,estimated_minutes,image&slug=eq.${encodeURIComponent(course)}&is_published=eq.true`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
          cache: "no-store",
        },
      );

      if (res.ok) {
        const coursesData = await res.json();
        if (coursesData && coursesData.length > 0) {
          currentCourse = coursesData[0];
        } else {
          error = "Курс не найден";
        }
      } else {
        error = "Не удалось загрузить курс";
      }

      if (currentCourse?.id) {
        const lessonsRes = await fetch(
          `${supabaseUrl}/rest/v1/ege_lessons?select=id,slug,title,description,estimated_minutes&course_id=eq.${currentCourse.id}&is_published=eq.true&order=order_number.asc`,
          {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            },
            cache: "no-store",
          },
        );

        if (lessonsRes.ok) {
          const lessonsData: LessonFromDB[] = await lessonsRes.json();

          if (lessonsData && lessonsData.length > 0) {
            const lessonIds = lessonsData.map((lesson) => lesson.id);

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

            lessons = lessonsData.map((lesson: LessonFromDB) => ({
              ...lesson,
              view_count: viewCountMap.get(lesson.id) || 0,
            }));
          } else {
            lessons = lessonsData.map((lesson: LessonFromDB) => ({
              ...lesson,
              view_count: 0,
            }));
          }

          console.log(
            `✅ Found ${lessons.length} lessons for course ${currentCourse.name}`,
          );
        } else {
          console.warn("⚠️ Lessons fetch failed:", await lessonsRes.text());
        }
      }
    }
  } catch (err) {
    console.error("❌ Failed to fetch:", err);
    error = "Ошибка подключения к базе данных";
  }

  if (!currentCourse && !error) {
    notFound();
  }

  return (
    <main className="flex-1 flex flex-col items-center px-[10px] sm:px-[20px] py-[30px] w-full min-h-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between w-full mb-6 h-full">
        <Link
          href="/courses"
          className="text-gray-600 hover:text-purple-600 transition"
        >
          <ArrowLeft className="w-6 h-6 cursor-pointer" />
        </Link>
        <div className="bigger-text font-semibold">
          {currentCourse?.name ||
            course.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
        </div>
      </div>

      {error && (
        <div className="text-center py-10 mb-8">
          <p className="text-red-600 text-lg mb-4">{error}</p>
        </div>
      )}

      {currentCourse?.subject && (
        <div className="mb-4">
          <span className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
            {currentCourse.subject}
          </span>
        </div>
      )}

      <p className="text-gray-600 mb-8 text-center">
        {currentCourse?.description || "Курс по выбранному предмету"}
      </p>

      {lessons.length === 0 && !error ? (
        <p className="text-gray-500 text-center py-10">
          Пока нет доступных уроков.
        </p>
      ) : (
        <div className="grid gap-4 w-full h-full">
          {lessons.map((lesson) => {
            const lessonPart = lesson.slug;
            return (
              <Link
                key={lesson.id}
                href={`/courses/${course}/${lessonPart}`}
                className="block p-[20px] bg-white hover:ml-[30px] duration-300 shadow-xs transition-all border-[1px] border-gray-300 rounded-xl flex flex-row justify-between group transition"
              >
                <div className="flex flex-row w-full">
                  <div className="bg-purple-400 h-full w-[5px] rounded-l-xl"></div>
                  <div className="flex flex-col ml-[10px]  items-start w-full">
                    <div className="flex flex-row items-center w-full flex-1 justify-between">
                      <h2 className="ord-text font-semibold">{lesson.title}</h2>
                      <div className=" flex  flex-row items-center mx-[15px]">
                        <p className="text-[10px] mr-[5px]">
                          {lesson.view_count || 0}
                        </p>
                        <Eye className="w-[15px] h-[15px] text-gray-400"></Eye>
                      </div>
                    </div>
                    <p className="text-gray-600 mt-1 text-sm">
                      {lesson.description || "Описание урока"}
                    </p>
                    <span className="text-xs text-gray-500 mt-[5px] inline-block">
                      ⏱ {lesson.estimated_minutes ?? 30} мин
                    </span>
                  </div>
                </div>

                <ArrowLeft className="w-5 h-5 mt-[15px] text-gray-400 rotate-180 group-hover:translate-x-1 transition-transform" />
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
