// frontend/app/courses/[course]/page.tsx

import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";

type Lesson = {
  id: number; // 🔁 Теперь int
  slug: string;
  title: string;
  description: string | null;
  estimated_minutes: number | null;
  view_count: number;
};

type Course = {
  id: number; // 🔁 Теперь int
  slug: string;
  name: string;
  subject: string | null;
  description: string | null;
  image: string;
};

export const dynamic = "force-dynamic";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ course: string }>;
}) {
  const { course: courseSlug } = await params;

  let lessons: Lesson[] = [];
  let currentCourse: Course | null = null;
  let error: string | null = null;

  try {
    // 1️⃣ Fetch курса
    const courseRes = await fetch(
      `http://localhost:8010/api/courses/${courseSlug}`,
      { cache: "no-store" },
    );

    if (courseRes.ok) {
      currentCourse = await courseRes.json();
    } else if (courseRes.status === 404) {
      error = "Курс не найден";
    } else {
      error = "Не удалось загрузить курс";
    }

    // 2️⃣ Fetch уроков (только если курс найден)
    if (currentCourse?.id) {
      const lessonsRes = await fetch(
        `http://localhost:8010/api/courses/${courseSlug}/lessons`,
        { cache: "no-store" },
      );

      if (lessonsRes.ok) {
        const data = await lessonsRes.json();
        lessons = data.lessons;
      }
    }
  } catch (err) {
    console.error("❌ Failed to fetch:", err);
    error = "Ошибка подключения к серверу";
  }

  // 404 если курс не найден
  if (!currentCourse && !error) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <p className="text-gray-500 text-lg">Курс не найден</p>
        <Link href="/courses" className="text-purple-600 hover:underline mt-4">
          ← Вернуться к списку курсов
        </Link>
      </main>
    );
  }

  const courseName =
    currentCourse?.name ||
    courseSlug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <main className="flex-1 flex flex-col items-center px-[10px] sm:px-[20px] py-[30px] w-full min-h-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between w-full mb-6">
        <Link
          href="/courses"
          className="text-gray-600 hover:text-purple-600 transition"
        >
          <ArrowLeft className="w-6 h-6 cursor-pointer" />
        </Link>
        <div className="bigger-text font-semibold">{courseName}</div>
        <div></div>
      </div>

      {error && (
        <div className="text-center py-10 mb-8">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <Link href="/courses" className="text-purple-600 hover:underline">
            ← Вернуться к списку курсов
          </Link>
        </div>
      )}

      {/* Subject badge */}
      {currentCourse?.subject && (
        <div className="mb-4">
          <span className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
            {currentCourse.subject}
          </span>
        </div>
      )}

      {/* Description */}
      <p className="text-gray-600 mb-8 text-center">
        {currentCourse?.description || "Курс по выбранному предмету"}
      </p>

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
              href={`/courses/${courseSlug}/${lesson.slug}`}
              className="block p-[20px] bg-white hover:ml-[30px] duration-300 shadow-xs transition-all border-[1px] border-gray-300 rounded-xl flex flex-row justify-between group"
            >
              <div className="flex flex-row w-full">
                <div className="bg-purple-400 h-full w-[5px] rounded-l-xl"></div>
                <div className="flex flex-col ml-[10px] items-start w-full">
                  <div className="flex flex-row items-center w-full flex-1 justify-between">
                    <h2 className="ord-text font-semibold">{lesson.title}</h2>
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
          ))}
        </div>
      )}
    </main>
  );
}
