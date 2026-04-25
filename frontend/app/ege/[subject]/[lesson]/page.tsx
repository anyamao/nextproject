// frontend/app/ege/[subject]/[lesson]/page.tsx

import LessonClient from "./LessonClient";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api"; // ✅ Универсальный fetch

type Lesson = {
  id: number; // 🔁 Теперь int (из FastAPI)
  slug: string;
  title: string;
  content: string | null;
  description: string | null;
  estimated_minutes: number | null;
  passing_score: number | null;
  clear_count: number;
  unclear_count: number;
  view_count: number;
  test_id: string | null;
};

// 🔁 Маппинг коротких slug'и → полные (для бэкенда)
const mapSubjectSlug = (slug: string): string => {
  const map: Record<string, string> = {
    math: "math-profile-ege",
    physics: "physics-ege",
    russian: "russian-ege",
    informatics: "informatics-ege",
  };
  return map[slug] || slug;
};

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ subject: string; lesson: string }>;
}) {
  const { subject: subjectSlug, lesson: lessonSlug } = await params;

  try {
    // 🔁 Преобразуем короткий slug в полный для бэкенда
    const backendSubject = mapSubjectSlug(subjectSlug);

    // 🔁 Fetch к твоему FastAPI бэкенду
    const lessonData: Lesson = await apiFetch(
      `/api/courses/${backendSubject}/lessons/${lessonSlug}`,
    );

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
      view_count: lessonData.view_count || 0,
      test_id: lessonData.test_id || null,
      level: subjectSlug, // Для совместимости с LessonClient
      category: subjectSlug,
    };

    return (
      <LessonClient
        initialLesson={lesson}
        initialSlug={`${subjectSlug}/${lessonSlug}`}
        params={{
          subject: subjectSlug,
          lesson: lessonSlug,
        }}
      />
    );
  } catch (error) {
    console.error("❌ Error fetching lesson:", error);
    notFound();
  }
}
