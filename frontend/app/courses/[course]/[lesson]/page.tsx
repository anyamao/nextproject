// frontend/app/courses/[course]/[lesson]/page.tsx

import LessonClient from "./LessonClient";
import { notFound } from "next/navigation";

type Lesson = {
  id: number; // 🔁 Теперь int
  slug: string;
  title: string;
  content: string | null;
  description: string | null;
  estimated_minutes: number | null;
  passing_score: number | null;
  clear_count: number;
  unclear_count: number;
  test_id: string | null;
  view_count: number;
};

type Course = {
  id: number; // 🔁 Теперь int
  slug: string;
  name: string;
};

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ course: string; lesson: string }>;
}) {
  const { course: courseSlug, lesson: lessonSlug } = await params;

  try {
    // 1️⃣ Fetch урока напрямую по slug (бэкенд сам найдёт курс)
    const lessonRes = await fetch(
      `http://localhost:8000/api/courses/${courseSlug}/lessons/${lessonSlug}`,
      { cache: "no-store" },
    );

    // 404 если урок не найден
    if (lessonRes.status === 404) {
      notFound();
    }

    // Ошибка сервера
    if (!lessonRes.ok) {
      console.error(
        "❌ Lesson fetch failed:",
        lessonRes.status,
        await lessonRes.text(),
      );
      notFound();
    }

    const lessonData: Lesson = await lessonRes.json();

    // 🔁 Форматируем для LessonClient (сохраняем совместимость)
    const lesson = {
      id: lessonData.id.toString(), // LessonClient ожидает string
      slug: lessonData.slug,
      title: lessonData.title,
      content: lessonData.content || "",
      description: lessonData.description || "",
      estimated_minutes: lessonData.estimated_minutes || 30,
      passing_score: lessonData.passing_score || 70,
      clear_count: lessonData.clear_count || 0,
      unclear_count: lessonData.unclear_count || 0,
      test_id: lessonData.test_id || null,
      view_count: lessonData.view_count || 0,
    };

    return (
      <LessonClient
        initialLesson={lesson}
        initialSlug={`${courseSlug}/${lessonSlug}`}
        params={{
          course: courseSlug,
          lesson: lessonSlug,
        }}
      />
    );
  } catch (error) {
    console.error("❌ Error fetching lesson:", error);
    notFound();
  }
}
