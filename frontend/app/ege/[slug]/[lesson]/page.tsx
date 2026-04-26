// frontend/app/ege/[slug]/[lesson]/page.tsx
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
};

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lesson: string }>;
}) {
  const { slug: subjectSlug, lesson: lessonSlug } = await params;

  try {
    // ✅ Запрос к новому эндпоинту: /ege/{subject}/{lesson}
    const lesson: Lesson = await apiFetch(`/ege/${subjectSlug}/${lessonSlug}`);

    return (
      <LessonClient
        lesson={lesson}
        subjectSlug={subjectSlug}
        lessonSlug={lessonSlug}
      />
    );
  } catch (error) {
    console.error("❌ Error fetching lesson:", error);
    notFound();
  }
}
