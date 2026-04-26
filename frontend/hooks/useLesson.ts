// hooks/useLesson.ts
"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface Lesson {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string; // HTML
  subject: string;
  level: string;
  category: string;
  subcategory: string;
  estimated_minutes: number;
  test_id: string | null;
  views_count: number;
  clear_count: number;
  unclear_count: number;
  published_at: string | null;
}

export interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_email?: string;
}

export function useLesson(slug: string) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userFeedback, setUserFeedback] = useState<"clear" | "unclear" | null>(null);

  // Fetch lesson + comments
  useEffect(() => {
    if (!slug) return;
    const fetchData = async () => {
      try {
        const { data: lesson, error: lessonError } = await supabase
          .from("lessons")
          .select("*")
          .eq("slug", slug)
          .eq("is_published", true)
          .single();

        if (lessonError || !lesson) throw lessonError;
        setLesson(lesson);

        const { data: comments } = await supabase
          .from("comments")
          .select("*")
          .eq("lesson_id", lesson.id)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false });

        if (comments) {
          setComments(
            comments.map((c) => ({
              ...c,
              user_email: c.user_email || "Аноним",
            }))
          );
        }
      } catch (err) {
        console.error("Error fetching lesson:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  // ✅ Фидбек — заглушка (без user.id)
  const submitFeedback = async (type: "clear" | "unclear") => {
    // Заглушка: фидбек не сохраняется без user.id
    setUserFeedback(type);
    setLesson((prev) =>
      prev
        ? {
            ...prev,
            clear_count: type === "clear" ? prev.clear_count + 1 : prev.clear_count,
            unclear_count: type === "unclear" ? prev.unclear_count + 1 : prev.unclear_count,
          }
        : null
    );
  };

  return {
    lesson,
    comments,
    loading,
    userFeedback,
    submitFeedback,
  };
}
