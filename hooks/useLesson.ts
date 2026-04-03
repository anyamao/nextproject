"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import useContactStore from "@/store/states";

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
  user_id: string;
  content: string;
  created_at: string;
  user_email?: string; // Joined from auth.users
}

export function useLesson(slug: string) {
  const { user } = useContactStore();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userFeedback, setUserFeedback] = useState<"clear" | "unclear" | null>(
    null,
  );

  // Fetch lesson + comments + user feedback
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
          .select(
            `
            *,
            profiles:user_id ( username )
          `,
          )
          .eq("lesson_id", lesson.id)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false });

        if (comments) {
          setComments(
            comments.map((c) => ({
              ...c,
              user_email: c.profiles?.username || "Аноним",
            })),
          );
        }

        if (user) {
          const { data: feedback } = await supabase
            .from("lesson_feedback")
            .select("feedback_type")
            .eq("lesson_id", lesson.id)
            .eq("user_id", user.id)
            .maybeSingle();

          if (feedback) setUserFeedback(feedback.feedback_type);
        }
      } catch (err) {
        console.error("Error fetching lesson:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, user]);

  const submitFeedback = async (type: "clear" | "unclear") => {
    if (!user || !lesson) return;

    const { error } = await supabase.from("lesson_feedback").upsert({
      lesson_id: lesson.id,
      user_id: user.id,
      feedback_type: type,
    });

    if (!error) {
      setUserFeedback(type);
      setLesson((prev) =>
        prev
          ? {
              ...prev,
              clear_count:
                type === "clear"
                  ? prev.clear_count + (userFeedback === "clear" ? 0 : 1)
                  : prev.clear_count - (userFeedback === "clear" ? 1 : 0),
              unclear_count:
                type === "unclear"
                  ? prev.unclear_count + (userFeedback === "unclear" ? 0 : 1)
                  : prev.unclear_count - (userFeedback === "unclear" ? 1 : 0),
            }
          : null,
      );
    }
  };

  const addComment = async (content: string) => {
    if (!user || !lesson) return;

    const { data: comment, error } = await supabase
      .from("comments")
      .insert({
        lesson_id: lesson.id,
        user_id: user.id,
        content: content.trim(),
      })
      .select()
      .single();

    if (!error && comment) {
      setComments((prev) => [
        {
          id: comment.id,
          user_id: user.id,
          content: comment.content,
          created_at: comment.created_at,
          user_email: user.email?.split("@")[0] || "Вы",
        },
        ...prev,
      ]);
    }
  };

  return {
    lesson,
    comments,
    loading,
    userFeedback,
    submitFeedback,
    addComment,
  };
}
