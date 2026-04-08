// app/ege/[subject]/[lesson]/page.tsx
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

export async function generateStaticParams() {
  const fallbackParams = [
    { subject: "math", lesson: "test-lesson" }, // ✅ Add your lesson here
    { subject: "physics", lesson: "mechanics" },
    { subject: "russian", lesson: "grammar" },
  ];

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return fallbackParams;

    const res = await fetch(
      `${supabaseUrl}/rest/v1/ege_lessons?select=slug&is_published=eq.true`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        cache: "no-store",
      },
    );

    if (!res.ok) return fallbackParams;

    const lessons = await res.json();

    if (!lessons || lessons.length === 0) return fallbackParams;

    const params = lessons
      .map((l: { slug: string }) => {
        const parts = l.slug.split("/");
        if (parts.length >= 2) {
          return {
            subject: parts[0],
            lesson: parts[1],
          };
        }
        return null;
      })
      .filter((p: { subject: string; lesson: string } | null) => p !== null);

    return params.length > 0 ? params : fallbackParams;
  } catch (error) {
    console.error("❌ generateStaticParams error:", error);
    return fallbackParams;
  }
}

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
      next: { revalidate: 3600 },
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

  // Transform to match LessonClient's Lesson type
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

  // ✅ CREATE A NEW PARAMS OBJECT with the shape LessonClient expects
  const clientParams = {
    level: subject,
    category: subject,
    lesson: lessonSlug,
  };
  // In the return statement, change this:
  return (
    <LessonClient
      initialLesson={lesson}
      initialSlug={fullSlug}
      params={{
        subject, // ✅ Just pass subject
        lesson: lessonSlug, // ✅ And lesson
      }}
    />
  );
}
