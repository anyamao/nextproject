// frontend/app/ege/[slug]/[lesson]/page.tsx
import LessonClient from "./LessonClient";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lesson: string }>;
}) {
  const { slug: subjectSlug, lesson: lessonSlug } = await params;

  try {
    const lesson = await apiFetch(`/ege/${subjectSlug}/${lessonSlug}`);

    return (
      <LessonClient
        lesson={lesson}
        subjectSlug={subjectSlug}
        lessonSlug={lessonSlug}
        testId={lesson.test_id ?? null} // ✅ Передаём ID теста
      />
    );
  } catch {
    notFound();
  }
}
