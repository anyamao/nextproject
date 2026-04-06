"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Lesson,
  Comment as CommentType,
  LessonReaction,
  TestResult,
} from "@/types/database";
import { useAuthListener } from "@/hooks/useAuthListener";

interface LessonClientProps {
  initialLesson: Lesson | null;
  level: string;
  category: string;
  lessonName: string;
}

export default function LessonClient({
  initialLesson,
  level,
  category,
  lessonName,
}: LessonClientProps) {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const { user } = useAuthListener();

  const [lesson, setLesson] = useState<Lesson | null>(initialLesson);
  const [loading, setLoading] = useState(!initialLesson);
  const [newComment, setNewComment] = useState("");
  const [submittingReaction, setSubmittingReaction] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (initialLesson) return;

    async function fetchLesson() {
      try {
        const { data: lessonData, error: lessonError } = await supabase
          .from("lessons")
          .select(
            `
          *,
          categories!inner (
            name,
            levels!inner (name)
          )
        `,
          )
          .eq("name", lessonName)
          .eq("categories.name", category)
          .eq("categories.levels.name", level)
          .single();

        if (lessonError) throw lessonError;
        if (!lessonData) throw new Error("Lesson not found");

        const { data: reactions } = await supabase
          .from("lesson_reactions")
          .select("reaction_type, user_id")
          .eq("lesson_id", lessonData.id);

        const { data: comments } = await supabase
          .from("comments")
          .select("id, lesson_id, user_id, content, created_at, updated_at")
          .eq("lesson_id", lessonData.id)
          .order("created_at", { ascending: false });

        let testResults: TestResult[] = [];
        const { data: tests } = await supabase
          .from("tests")
          .select("id")
          .eq("lesson_id", lessonData.id)
          .single();

        if (tests && user) {
          const { data: results } = await supabase
            .from("test_results")
            .select("*")
            .eq("test_id", tests.id)
            .eq("user_id", user.id)
            .single();
          if (results) testResults = [results];
        }
        const reactionsList = reactions || [];
        const understood_count = reactionsList.filter(
          (r: LessonReaction) => r.reaction_type === "understood",
        ).length;
        const not_understood_count = reactionsList.filter(
          (r: LessonReaction) => r.reaction_type === "not_understood",
        ).length;
        const userReaction = user
          ? (reactionsList.find((r: LessonReaction) => r.user_id === user.id)
              ?.reaction_type as "understood" | "not_understood" | null)
          : null;

        setLesson({
          ...lessonData,
          understood_count,
          not_understood_count,
          user_reaction: userReaction,
          comments: comments || [],
          test_results: testResults,
        });
      } catch (error) {
        console.error("Error fetching lesson:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLesson();
  }, [initialLesson, level, category, lessonName, supabase, user]);
  const handleReaction = async (type: "understood" | "not_understood") => {
    if (!user || !lesson) return;
    setSubmittingReaction(true);
    try {
      const { error: upsertError } = await supabase
        .from("lesson_reactions")
        .upsert(
          {
            lesson_id: lesson.id,
            user_id: user.id,
            reaction_type: type,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "lesson_id,user_id",
          },
        );

      if (upsertError) throw upsertError;

      const { data: reactions } = await supabase
        .from("lesson_reactions")
        .select("reaction_type, user_id")
        .eq("lesson_id", lesson.id);

      if (reactions) {
        const understood_count = reactions.filter(
          (r: LessonReaction) => r.reaction_type === "understood",
        ).length;
        const not_understood_count = reactions.filter(
          (r: LessonReaction) => r.reaction_type === "not_understood",
        ).length;

        setLesson((prev) =>
          prev
            ? {
                ...prev,
                understood_count,
                not_understood_count,
                user_reaction: type,
              }
            : null,
        );
      }
    } catch (error) {
      console.error("Error submitting reaction:", error);
    } finally {
      setSubmittingReaction(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !lesson || !newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const { data, error } = await supabase
        .from("comments")
        .insert({
          lesson_id: lesson.id,
          user_id: user.id,
          content: newComment.trim(),
        })
        .select("id, lesson_id, user_id, content, created_at, updated_at")
        .single();

      if (error) throw error;

      setLesson((prev: Lesson | null) =>
        prev
          ? {
              ...prev,
              comments: [data, ...(prev.comments || [])],
            }
          : null,
      );
      setNewComment("");
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setSubmittingComment(false);
    }
  };
  const copyLessonLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link copied!");
  };

  const goToTest = () => {
    router.push(`/english/${level}/${category}/${lessonName}/test`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-xl">
        Loading lesson...
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex items-center justify-center min-h-screen text-xl text-red-500">
        Lesson not found
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-gray-500 uppercase mb-1">
              {level.toUpperCase()} / {category}
            </div>
            <h1 className="text-3xl font-bold">{lesson.display_name}</h1>
          </div>
          <button
            onClick={copyLessonLink}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
          >
            📋 Copy Link
          </button>
        </div>
        {lesson.comments?.map((comment: CommentType) => (
          <div key={comment.id} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Anonymous
              </span>
              <span className="text-xs text-gray-500">
                {new Date(comment.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-800">{comment.content}</p>
          </div>
        ))}
      </div>

      <div
        className="prose prose-lg max-w-none mb-8 p-6 bg-white rounded-lg shadow-sm border"
        dangerouslySetInnerHTML={{ __html: lesson.content }}
      />

      <div className="mb-8 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">
          Did you understand this lesson?
        </h2>
        <div className="flex gap-4">
          <button
            onClick={() => handleReaction("understood")}
            disabled={submittingReaction || !user}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
              lesson.user_reaction === "understood"
                ? "bg-green-500 text-white"
                : "bg-white border-2 border-green-500 text-green-600 hover:bg-green-50"
            } disabled:opacity-50`}
          >
            ✓ Understood ({lesson.understood_count || 0})
          </button>
          <button
            onClick={() => handleReaction("not_understood")}
            disabled={submittingReaction || !user}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
              lesson.user_reaction === "not_understood"
                ? "bg-red-500 text-white"
                : "bg-white border-2 border-red-500 text-red-600 hover:bg-red-50"
            } disabled:opacity-50`}
          >
            ✗ Not Understood ({lesson.not_understood_count || 0})
          </button>
        </div>
        {!user && (
          <p className="text-sm text-gray-500 mt-2 text-center">
            Please login to react
          </p>
        )}
      </div>

      {/* Test Button */}
      <div className="mb-8">
        <button
          onClick={goToTest}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg"
        >
          📝 Take the Test
        </button>
      </div>

      {/* Comments */}
      <div className="border-t pt-8">
        <h2 className="text-2xl font-bold mb-6">
          Comments ({lesson.comments?.length || 0})
        </h2>
        {user ? (
          <form onSubmit={handleCommentSubmit} className="mb-8">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full p-4 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              disabled={submittingComment}
            />
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {submittingComment ? "Posting..." : "Post Comment"}
              </button>
            </div>
          </form>
        ) : (
          <p className="mb-8 text-gray-500">Please login to comment</p>
        )}

        <div className="space-y-4">
          {lesson.comments?.map((comment: CommentType) => (
            <div key={comment.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {comment.user_email || "Anonymous"}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-800">{comment.content}</p>
            </div>
          ))}
          {(!lesson.comments || lesson.comments.length === 0) && (
            <p className="text-gray-500 text-center py-8">
              No comments yet. Be the first!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
