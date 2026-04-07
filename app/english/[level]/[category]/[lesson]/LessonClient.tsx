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
import { Copy, ThumbsUp, ThumbsDown } from "lucide-react";
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
          .select(
            "id, lesson_id, user_id, content, created_at, updated_at, author_name, author_avatar",
          ) // ✅ Added missing fields
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
      // Fetch username from profiles table
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      const authorName =
        profile?.username || user.email?.split("@")[0] || "Пользователь";

      const { data, error } = await supabase
        .from("comments")
        .insert({
          lesson_id: lesson.id,
          user_id: user.id,
          content: newComment.trim(),
          author_name: authorName,
          author_avatar: "aiclose.png", // Default avatar
        })
        .select(
          "id, lesson_id, user_id, content, created_at, updated_at, author_name, author_avatar",
        )
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
    <div className="w-full h-full flex flex-col items-center">
      <div className="text-wrap-no">
        <div className="text-gray-500 smaller-text">
          {level.toUpperCase()} / {category}
        </div>

        <p className="bigger-text font-semibold">{lesson.display_name}</p>

        <div className="flex flex-row items-center justify-between mt-[20px]">
          <div
            onClick={copyLessonLink}
            className=" flex flex-row items-center cursor-pointer bg-white justify-center h-[50px] w-[150px] rounded-xl"
          >
            <div className="flex items-center justify-center rounded-full p-[7px] border-[1px] border-gray-400">
              <Copy className="text-black w-[13px] h-[13px]  " />{" "}
            </div>
            <p className="font-semibold ml-[7px]  ">Copy Link</p>
          </div>

          {lesson.test_results && lesson.test_results.length > 0 && (
            <div className="font-semibold">
              <button
                onClick={() =>
                  router.push(
                    `/english/${level}/${category}/${lessonName}/test`,
                  )
                }
                className={` ${
                  lesson.test_results[0].score >= 75
                    ? "bg-green-100 text-green-800 hover:bg-green-200 flex items-center h-[50px] w-[170px]"
                    : "bg-red-200 text-red-800 hover:bg-yellow-200 rounded-xl h-[50px] w-[180px]"
                }`}
              >
                {lesson.test_results[0].score >= 75 ? "✓" : "✗"}
                <span>
                  Test: {lesson.test_results[0].score}%
                  <span className="text-xs opacity-75 ml-1">
                    (
                    {lesson.test_results[0].score >= 75
                      ? "Passed"
                      : "Try Again"}
                    )
                  </span>
                </span>
              </button>
            </div>
          )}

          {(!lesson.test_results || lesson.test_results.length === 0) && (
            <div className="p-[10px] px-[20px]">
              <button
                onClick={() =>
                  router.push(
                    `/english/${level}/${category}/${lessonName}/test`,
                  )
                }
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium hover:bg-blue-200 transition-colors"
              >
                📝 Take the Test
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="" dangerouslySetInnerHTML={{ __html: lesson.content }} />

      <div className="text-wrap-no flex flex-col justify-center items-center">
        <h2 className="text-lg font-semibold mb-4">Как вам урок?</h2>
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

      {/* Comments Section */}

      {/* Comments Section - ALWAYS VISIBLE */}
      <div className="border-t pt-8">
        <h2 className="text-2xl font-bold mb-6">
          Комментарии ({lesson.comments?.length || 0})
        </h2>

        {/* Auth Warning - Only shows for guests */}
        {!user && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <span className="text-2xl">🔒</span>
            <div className="flex-1">
              <p className="text-yellow-800 font-medium mb-1">
                Только для зарегистрированных пользователей
              </p>
              <p className="text-yellow-700 text-sm mb-3">
                Пожалуйста, войдите в систему, чтобы оставлять комментарии.
              </p>
              <button className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors">
                Войти сейчас
              </button>
            </div>
          </div>
        )}

        {/* Comment Form - Active for users, Disabled for guests */}
        {user ? (
          <form onSubmit={handleCommentSubmit} className="mb-8">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Напишите комментарий..."
              className="w-full p-4 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              disabled={submittingComment}
            />
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submittingComment ? "Отправка..." : "Отправить комментарий"}
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-8">
            <textarea
              placeholder="Войдите, чтобы написать комментарий..."
              className="w-full p-4 border rounded-lg resize-none bg-gray-100 cursor-not-allowed"
              rows={3}
              disabled
            />
            <div className="mt-2 flex justify-end">
              <button
                disabled
                className="px-6 py-2 bg-gray-300 text-gray-500 rounded-lg font-medium cursor-not-allowed"
              >
                Требуется вход
              </button>
            </div>
          </div>
        )}

        {/* Comments List - RENDERS FOR EVERYONE */}
        <div className="space-y-4">
          {lesson.comments && lesson.comments.length > 0 ? (
            lesson.comments.map((comment) => {
              const isCurrentUser = user && comment.user_id === user.id;

              return (
                <div key={comment.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <img
                        src={comment.author_avatar || "/aiclose.png"}
                        alt={comment.author_name || "User"}
                        className="w-10 h-10 rounded-full object-cover border border-gray-300"
                      />
                    </div>

                    {/* Comment Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">
                            {comment.author_name || "Пользователь"}
                          </span>
                          {isCurrentUser && (
                            <span className="text-xs text-blue-600 font-medium">
                              (вы)
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleDateString(
                            "ru-RU",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </div>
                      <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-gray-500 text-center py-8">
              Пока нет комментариев. Будьте первым!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
