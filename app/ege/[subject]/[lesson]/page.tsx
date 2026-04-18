import LessonClient from "./LessonClient";
import { notFound } from "next/navigation";

type Lesson = {
  id: string;
  slug: string;
  title: string;
  content: string;
  description: string;
  level: string;
  category: string;
  test_id: string | null;
  estimated_minutes: number;
  passing_score: number;
  clear_count: number;
  unclear_count: number;
};
export const revalidate = 60;
export default async function LessonPage({
  params,
}: {
  params: Promise<{ subject: string; lesson: string }>;
}) {
  const resolvedParams = await params;
  const { subject, lesson: lessonSlug } = resolvedParams;
  const fullSlug = `${subject}/${lessonSlug}`;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const res = await fetch(
    `${supabaseUrl}/rest/v1/ege_lessons?select=*&slug=eq.${encodeURIComponent(fullSlug)}&is_published=eq.true`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      next: { revalidate: 60 },
    },
  );

  if (!res.ok) {
    notFound();
  }

  const data = await res.json();
  const egeLesson = Array.isArray(data) ? data[0] : data;

  if (!egeLesson) {
    notFound();
  }

  const lesson: Lesson = {
    id: egeLesson.id,
    slug: egeLesson.slug,
    title: egeLesson.title,
    content: egeLesson.content,
    description: egeLesson.description || "",
    level: subject,
    category: subject,
    test_id: egeLesson.test_id,
    estimated_minutes: egeLesson.estimated_minutes || 30,
    passing_score: egeLesson.passing_score || 70,
    clear_count: egeLesson.clear_count || 0,
    unclear_count: egeLesson.unclear_count || 0,
  };

  const clientParams = {
    level: subject,
    category: subject,
    lesson: lessonSlug,
  };
  return (
    <LessonClient
      initialLesson={lesson}
      initialSlug={fullSlug}
      params={{
        subject,
        lesson: lessonSlug,
      }}
    />
  );
}
