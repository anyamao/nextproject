// frontend/app/courses/[slug]/[lesson]/page.tsx
import LessonClient from "./LessonClient";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";

type Lesson = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  time_minutes: number | null;
  test_id: number | null;
};

// ✅ Обязательно: отключаем кэширование для динамических маршрутов
//
export default async function CourseLessonPage({
  params,
}: {
  params: Promise<{ slug: string; lesson: string }>;
}) {
  const { slug: subjectSlug, lesson: lessonSlug } = await params;

  // ⚠️ Next.js 15 prefetch использует '...' как плейсхолдер.
  // Не возвращай null! Просто рендерим лоадер или пустой скелетон.
  if (lessonSlug === "..." || subjectSlug === "...") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-200 border-t-purple-600" />
      </div>
    );
  }

  try {
    const lesson = await apiFetch(`/courses/${subjectSlug}/${lessonSlug}`);
    return (
      <LessonClient
        lesson={lesson}
        subjectSlug={subjectSlug}
        lessonSlug={lessonSlug}
        testId={lesson.test_id ?? null}
      />
    );
  } catch {
    notFound();
  }
}
