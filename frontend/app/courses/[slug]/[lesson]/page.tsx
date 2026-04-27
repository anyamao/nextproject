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

export const dynamic = "force-dynamic";

export default async function CourseLessonPage({
  params,
}: {
  params: Promise<{ slug: string; lesson: string }>;
}) {
  const { slug: subjectSlug, lesson: lessonSlug } = await params;

  try {
    // 🔁 Запрос к эндпоинту урока курса
    const lesson: Lesson = await apiFetch(
      `/courses/${subjectSlug}/${lessonSlug}`,
    );

    return (
      <LessonClient
        lesson={lesson}
        subjectSlug={subjectSlug}
        lessonSlug={lessonSlug}
        testId={lesson.test_id ?? null}
      />
    );
  } catch (error) {
    console.error("❌ Error fetching lesson:", error);
    notFound();
  }
}
