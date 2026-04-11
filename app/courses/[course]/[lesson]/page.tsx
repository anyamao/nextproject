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
    { course: "unity-3d-first", lesson: "unity-3d-first" }, // ✅ Add your lesson here
  ];

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return fallbackParams;

    const res = await fetch(
      `${supabaseUrl}/rest/v1/course_lessons?select=slug&is_published=eq.true`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        next: { revalidate: 360 },
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
            course: parts[0],
            lesson: parts[1],
          };
        }
        return null;
      })
      .filter((p: { course: string; lesson: string } | null) => p !== null);

    return params.length > 0 ? params : fallbackParams;
  } catch (error) {
    console.error("❌ generateStaticParams error:", error);
    return fallbackParams;
  }
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ course: string; lesson: string }>;
}) {
  const resolvedParams = await params;
  const { course, lesson: lessonSlug } = resolvedParams;
  const fullSlug = `${course}/${lessonSlug}`;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const res = await fetch(
    `${supabaseUrl}/rest/v1/course_lessons?select=*&slug=eq.${encodeURIComponent(lessonSlug)}&is_published=eq.true`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      next: { revalidate: 360 },
    },
  );

  if (!res.ok) {
    notFound();
  }
  console.log("🔍 Debug - Params:", { course, lessonSlug });
  console.log("🔍 Debug - Querying slug:", lessonSlug); // or fullSlug
  console.log("🔍 Debug - Response status:", res.status);
  console.log("🔍 Debug - Response data:", await res.clone().text());
  const data = await res.json();
  const egeLesson = Array.isArray(data) ? data[0] : data;

  if (!egeLesson) {
    console.error("❌ No lesson found for slug:", lessonSlug);
    notFound();
  }

  // Transform to match LessonClient's Lesson type
  const lesson: Lesson = {
    id: egeLesson.id,
    slug: egeLesson.slug,
    title: egeLesson.title,
    content: egeLesson.content,
    description: egeLesson.description || "",
    level: course,
    category: course,
    test_id: egeLesson.test_id,
    estimated_minutes: egeLesson.estimated_minutes || 30,
    passing_score: egeLesson.passing_score || 70,
    clear_count: egeLesson.clear_count || 0,
    unclear_count: egeLesson.unclear_count || 0,
  };

  // ✅ CREATE A NEW PARAMS OBJECT with the shape LessonClient expects
  const clientParams = {
    level: course,
    category: course,
    lesson: lessonSlug,
  };
  // In the return statement, change this:
  return (
    <LessonClient
      initialLesson={lesson}
      initialSlug={fullSlug}
      params={{
        course, // ✅ Just pass subject
        lesson: lessonSlug, // ✅ And lesson
      }}
    />
  );
}
