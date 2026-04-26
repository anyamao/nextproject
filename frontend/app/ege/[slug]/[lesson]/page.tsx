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
  test_id: number | null; // ✅ Убедитесь, что это поле есть!
};

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lesson: string }>;
}) {
  const { slug: subjectSlug, lesson: lessonSlug } = await params;

  try {
    // 🔍 Отладка: лог на сервере
    // console.log("🔍 SERVER DEBUG: Fetching lesson", {
    //  subjectSlug,
    //   lessonSlug,
    // });

    const lesson: Lesson = await apiFetch(`/ege/${subjectSlug}/${lessonSlug}`);

    //console.log("🔍 SERVER DEBUG: Lesson received", {
    // id: lesson.id,
    // title: lesson.title,
    // test_id: lesson.test_id,
    // testIdType: typeof lesson.test_id,
    // });

    return (
      <LessonClient
        lesson={lesson}
        subjectSlug={subjectSlug}
        lessonSlug={lessonSlug}
        testId={lesson.test_id ?? null} // ✅ Гарантируем, что это null или number
      />
    );
  } catch (error) {
    console.error("❌ Error fetching lesson:", error);
    notFound();
  }
}
