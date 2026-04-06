import LessonClient from "./LessonClient";
import { Lesson, LessonReaction } from "@/types/database";

export async function generateStaticParams() {
  if (process.env.NODE_ENV !== "production") {
    return [
      { level: "a2", category: "people", lesson: "grammar" },
      { level: "a2", category: "people", lesson: "vocabulary" },
      { level: "a2", category: "people", lesson: "reading" },
    ];
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/lessons?select=name,categories(name,levels(name))`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
      },
    );

    if (!response.ok) return [];

    const lessons = await response.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return lessons.map((lesson: any) => ({
      level: lesson.categories.levels.name,
      category: lesson.categories.name,
      lesson: lesson.name,
    }));
  } catch {
    return [];
  }
}

//
//
//
//
//
export default async function LessonPage({
  params,
}: {
  params: Promise<{ level: string; category: string; lesson: string }>;
}) {
  const { level, category, lesson: lessonName } = await params;

  let initialLesson: Lesson | null = null;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/lessons?select=*,categories(name,levels(name)),lesson_reactions(reaction_type,user_id),comments(*,user_email:users!comments_user_id_fkey(email)),test_results(score,total_questions,completed_at)&name=eq.${lessonName}&categories.name=eq.${category}&categories.levels.name=eq.${level}`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
        next: { revalidate: 3600 },
      },
    );

    if (response.ok) {
      const lessonData = await response.json();
      if (lessonData) {
        const reactions = lessonData.lesson_reactions || [];
        initialLesson = {
          ...lessonData,
          understood_count: reactions.filter(
            (r: LessonReaction) => r.reaction_type === "understood",
          ).length,
          not_understood_count: reactions.filter(
            (r: LessonReaction) => r.reaction_type === "not_understood",
          ).length,
          user_reaction: null,
          comments: lessonData.comments || [],
          test_results: lessonData.test_results || [],
        };
      }
    }
  } catch {}

  return (
    <LessonClient
      initialLesson={initialLesson}
      level={level}
      category={category}
      lessonName={lessonName}
    />
  );
}
