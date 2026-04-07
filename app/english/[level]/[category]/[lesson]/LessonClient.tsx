// app/english/[level]/[category]/[lesson]/LessonClient.tsx
"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  Loader2,
  Send,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import useContactStore from "@/store/states";
import { supabase } from "@/lib/supabase";

// Types
type TestResult = {
  score: number;
  passed: boolean;
  completed_at: string | null;
};

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

type Comment = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  parent_id?: string | null;
  likes_count: number;
  dislikes_count: number;
  user_email: string;
  replies?: Comment[];
  user_liked?: "like" | "dislike" | null;
};

interface LessonClientProps {
  initialLesson: Lesson;
  initialSlug: string;
  params: { level: string; category: string; lesson: string };
}

export default function LessonClient({
  initialLesson,
  initialSlug,
  params,
}: LessonClientProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useContactStore();

  // State
  const [lesson, setLesson] = useState<Lesson>(initialLesson);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);

  // UI state
  const [copySuccess, setCopySuccess] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [loadingResult, setLoadingResult] = useState(true);

  // Comment features state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [userFeedback, setUserFeedback] = useState<"clear" | "unclear" | null>(
    null,
  );
  const TEST_ID = lesson?.test_id || undefined;

  // ─────────────────────────────────────────────────────────────
  // Fetch comments with replies and user likes
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    // Guard clause
    if (!lesson?.id) return;

    const fetchComments = async () => {
      try {
        console.log("🔍 Fetching comments for lesson:", lesson.id);

        const { data: commentsData, error } = await supabase
          .from("comments")
          .select(
            `
          id,
          user_id,
          content,
          created_at,
          updated_at,
          parent_id,
          likes_count,
          dislikes_count
        `,
          )
          .eq("lesson_id", lesson.id)
          .eq("is_deleted", false)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("❌ Error fetching comments:", error);
          throw error;
        }

        if (!commentsData) {
          console.warn("⚠️ No comments data returned");
          setComments([]);
          return;
        }

        console.log("🔍 Fetched comments:", commentsData.length);

        // Fetch user's likes if authenticated
        let userLikes: { comment_id: string; like_type: string }[] = [];
        if (isAuthenticated && user) {
          const commentIds = commentsData.map((c) => c.id);
          const { data: likesData } = await supabase
            .from("comment_likes")
            .select("comment_id, like_type")
            .in("comment_id", commentIds)
            .eq("user_id", user.id);

          userLikes = likesData || [];
          console.log("🔍 User likes:", userLikes.length);
        }

        // Transform to Comment type with proper username
        const commentsWithUsers: Comment[] = commentsData.map((c) => {
          return {
            id: c.id,
            user_id: c.user_id,
            content: c.content,
            created_at: c.created_at,
            updated_at: c.updated_at,
            parent_id: c.parent_id,
            likes_count: c.likes_count || 0,
            dislikes_count: c.dislikes_count || 0,
            user_email: "User", // Will be updated below
            replies: [],
            user_liked: null,
          };
        });

        // Fetch usernames from profiles
        const userIds = [...new Set(commentsData.map((c) => c.user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", userIds);

        // Create map of user_id → username
        const usernameMap = new Map<string, string>();
        if (profilesData) {
          profilesData.forEach((profile) => {
            if (profile.username) {
              usernameMap.set(profile.id, profile.username);
            }
          });
        }

        // Update comments with usernames
        commentsWithUsers.forEach((comment) => {
          const username = usernameMap.get(comment.user_id);
          comment.user_email =
            username || `User${comment.user_id.split("-")[0]}`;

          // Set user's like status
          const userLike = userLikes.find((l) => l.comment_id === comment.id);
          comment.user_liked = userLike?.like_type as "like" | "dislike" | null;
        });

        // Nest replies
        const nestedComments = nestComments(commentsWithUsers);
        console.log("✅ Comments fetched and nested:", nestedComments.length);
        setComments(nestedComments);
      } catch (err) {
        console.error("❌ Exception fetching comments:", err);
      } finally {
        setLoadingComments(false);
      }
    };

    // Helper to nest comments
    const nestComments = (comments: Comment[]): Comment[] => {
      const commentMap = new Map<string, Comment>();
      const rootComments: Comment[] = [];

      // Create map of all comments
      comments.forEach((c) => {
        commentMap.set(c.id, {
          ...c,
          replies: [],
        });
      });

      // Nest replies under parents
      comments.forEach((c) => {
        const comment = commentMap.get(c.id);
        if (!comment) return;

        if (c.parent_id) {
          const parent = commentMap.get(c.parent_id);
          if (parent) {
            if (!parent.replies) parent.replies = [];
            parent.replies.push(comment);
          }
        } else {
          rootComments.push(comment);
        }
      });

      return rootComments;
    };

    fetchComments();
  }, [lesson?.id, user, isAuthenticated]);

  // ─────────────────────────────────────────────────────────────
  // Fetch test result
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !user || !TEST_ID) {
      setLoadingResult(false);
      return;
    }

    const fetchResult = async () => {
      try {
        const { data, error } = await supabase
          .from("test_results")
          .select("score, passed, completed_at")
          .eq("user_id", user.id)
          .eq("test_id", TEST_ID)
          .order("score", { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== "PGRST116") throw error;
        if (data)
          setResult({
            score: data.score,
            passed: data.passed,
            completed_at: data.completed_at,
          });
      } catch (err) {
        console.error("Error fetching test result:", err);
      } finally {
        setLoadingResult(false);
      }
    };

    fetchResult();
  }, [user, isAuthenticated, TEST_ID]);
  if (!initialLesson || !initialSlug) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin w-8 h-8 text-purple-500" />
        <p className="ml-4 text-gray-600">Загрузка урока...</p>
      </div>
    );
  }
  // ─────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────
  const countAllComments = (comments: Comment[]): number => {
    return comments.reduce((total, comment) => {
      return (
        total + 1 + (comment.replies ? countAllComments(comment.replies) : 0)
      );
    }, 0);
  };

  const handleTakeTest = () => {
    if (!TEST_ID) return;
    const returnUrl = encodeURIComponent(window.location.pathname);
    router.push(`/tests?id=${TEST_ID}&returnUrl=${returnUrl}`);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const submitFeedback = async (type: "clear" | "unclear") => {
    if (!user) return;

    try {
      const { error } = await supabase.from("lesson_feedback").upsert(
        {
          lesson_id: lesson?.id,
          user_id: user.id,
          feedback_type: type,
        },
        { onConflict: "lesson_id,user_id" },
      );

      if (!error) {
        setUserFeedback(type);

        // Re-fetch lesson to get updated counts
        const { data: updatedLesson, error: fetchError } = await supabase
          .from("lessons")
          .select("clear_count, unclear_count")
          .eq("id", lesson?.id)
          .single();

        if (updatedLesson && !fetchError) {
          setLesson((prev) => ({
            ...prev,
            clear_count: updatedLesson.clear_count,
            unclear_count: updatedLesson.unclear_count,
          }));
        }
      }
    } catch (err) {
      console.error("Error submitting feedback:", err);
    }
  };

  const addComment = async (content: string) => {
    if (!user) return;

    try {
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
        const newCommentObj: Comment = {
          ...comment,
          user_email: user.email?.split("@")[0] || "Вы",
          replies: [],
          user_liked: null,
        };
        setComments((prev) => [newCommentObj, ...prev]);
        setNewComment("");
      }
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    setSendingComment(true);
    await addComment(newComment);
    setSendingComment(false);
  };

  // NEW: Edit comment
  const handleEditComment = async (commentId: string, newContent: string) => {
    if (!newContent.trim()) return;

    try {
      const { error } = await supabase
        .from("comments")
        .update({
          content: newContent.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", commentId);

      if (error) throw error;

      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, content: newContent.trim() } : c,
        ),
      );
      setEditingCommentId(null);
      setEditContent("");
    } catch (err) {
      console.error("Error editing comment:", err);
    }
  };

  // NEW: Delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Удалить этот комментарий и все ответы?")) return;

    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      const removeCommentAndReplies = (
        commentsList: Comment[],
        id: string,
      ): Comment[] => {
        return commentsList
          .filter((c) => c.id !== id)
          .map((c) => ({
            ...c,
            replies: c.replies
              ? removeCommentAndReplies(c.replies, id)
              : undefined,
          }));
      };

      setComments((prev) => removeCommentAndReplies(prev, commentId));
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  // NEW: Add reply
  const handleAddReply = async (parentCommentId: string) => {
    if (!replyContent.trim() || !user) return;

    try {
      const { data: reply, error } = await supabase
        .from("comments")
        .insert({
          lesson_id: lesson.id,
          user_id: user.id,
          content: replyContent.trim(),
          parent_id: parentCommentId,
        })
        .select()
        .single();

      if (error) throw error;

      const addReplyToComment = (
        commentsList: Comment[],
        parentId: string,
        replyObj: Comment,
      ): Comment[] => {
        return commentsList.map((c) => {
          if (c.id === parentId) {
            return {
              ...c,
              replies: [...(c.replies || []), replyObj],
            };
          }
          if (c.replies) {
            return {
              ...c,
              replies: addReplyToComment(c.replies, parentId, replyObj),
            };
          }
          return c;
        });
      };

      const newReply: Comment = {
        ...reply,
        user_email: user.email?.split("@")[0] || "Вы",
        replies: [],
        user_liked: null,
      };

      setComments((prev) => addReplyToComment(prev, parentCommentId, newReply));
      setReplyingTo(null);
      setReplyContent("");
    } catch (err) {
      console.error("Error adding reply:", err);
    }
  };

  // NEW: Like/Dislike comment
  const handleLikeComment = async (
    commentId: string,
    type: "like" | "dislike",
  ) => {
    if (!user) return;

    try {
      const currentComment = comments.find((c) => c.id === commentId);
      const existingLike = currentComment?.user_liked;

      if (existingLike === type) {
        // Unlike
        const { error } = await supabase
          .from("comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id);

        if (error) throw error;

        setComments((prev) =>
          prev.map((c) => {
            if (c.id === commentId) {
              return {
                ...c,
                likes_count:
                  type === "like"
                    ? Math.max(0, c.likes_count - 1)
                    : c.likes_count,
                dislikes_count:
                  type === "dislike"
                    ? Math.max(0, c.dislikes_count - 1)
                    : c.dislikes_count,
                user_liked: null,
              };
            }
            return c;
          }),
        );
      } else {
        // Upsert like/dislike
        const { error } = await supabase.from("comment_likes").upsert(
          {
            comment_id: commentId,
            user_id: user.id,
            like_type: type,
          },
          {
            onConflict: "comment_id,user_id",
          },
        );

        if (error) throw error;

        setComments((prev) =>
          prev.map((c) => {
            if (c.id === commentId) {
              return {
                ...c,
                likes_count:
                  type === "like"
                    ? existingLike === "dislike"
                      ? c.likes_count + 1
                      : c.likes_count + 1
                    : existingLike === "like"
                      ? c.likes_count - 1
                      : c.likes_count,
                dislikes_count:
                  type === "dislike"
                    ? existingLike === "like"
                      ? c.dislikes_count + 1
                      : c.dislikes_count + 1
                    : existingLike === "dislike"
                      ? c.dislikes_count - 1
                      : c.dislikes_count,
                user_liked: type,
              };
            }
            return c;
          }),
        );
      }
    } catch (err) {
      console.error("Error liking comment:", err);
    }
  };

  const getResultBadge = () => {
    if (!isAuthenticated)
      return {
        text: "—",
        border: "border-gray-300",
        bg: "bg-gray-100",
        textColor: "text-gray-500",
      };
    if (loadingResult)
      return {
        text: "...",
        border: "border-gray-300",
        bg: "bg-gray-100",
        textColor: "text-gray-500",
      };
    if (!result)
      return {
        text: "—",
        border: "border-gray-300",
        bg: "bg-gray-100",
        textColor: "text-gray-500",
      };
    if (result.passed)
      return {
        text: `${result.score}%`,
        border: "border-green-500",
        bg: "bg-green-200",
        textColor: "text-green-900",
      };
    return {
      text: `${result.score}%`,
      border: "border-red-500",
      bg: "bg-red-200",
      textColor: "text-red-900",
    };
  };

  const badge = getResultBadge();
  const lessonName = initialSlug?.split("/").pop() || ""; // ✅ Safe with optional chaining
  // ─────────────────────────────────────────────────────────────
  // CommentItem Component
  // ─────────────────────────────────────────────────────────────
  const CommentItem = ({
    comment,
    depth = 0,
  }: {
    comment: Comment;
    depth?: number;
  }) => {
    const isOwner = user?.id === comment.user_id;
    const isReplying = replyingTo === comment.id;
    const isEditing = editingCommentId === comment.id;

    return (
      <div
        className={`${depth > 0 ? "ml-12 border-l-2 border-gray-200 pl-4" : ""}`}
      >
        <div className="flex gap-3 p-4 bg-white rounded-lg shadow-sm">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold flex-shrink-0">
            {comment.user_email?.[0]?.toUpperCase() || "А"}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{comment.user_email}</span>
              <span className="text-xs text-gray-400">
                {new Date(comment.created_at).toLocaleDateString("ru-RU")}
              </span>
              {comment.updated_at &&
                comment.updated_at !== comment.created_at && (
                  <span className="text-xs text-gray-400">(изменено)</span>
                )}
            </div>

            {isEditing ? (
              <div className="mt-2">
                <textarea
                  // ✅ Add stable key to prevent re-mounting
                  key={`edit-${comment.id}`}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  rows={3}
                  // ✅ Auto-focus when editing starts
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleEditComment(comment.id, editContent)}
                    className="px-3 py-1 bg-green-500 text-white rounded text-sm"
                  >
                    Сохранить
                  </button>
                  <button
                    onClick={() => {
                      setEditingCommentId(null);
                      setEditContent("");
                    }}
                    className="px-3 py-1 bg-gray-400 text-white rounded text-sm"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700">{comment.content}</p>
            )}
            <div className="flex items-center gap-4 mt-3">
              {isAuthenticated && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLikeComment(comment.id, "like")}
                    className={`flex items-center gap-1 text-sm ${
                      comment.user_liked === "like"
                        ? "text-blue-600"
                        : "text-gray-500 hover:text-blue-600"
                    }`}
                  >
                    <ThumbsUp size={14} />
                    <span>{comment.likes_count}</span>
                  </button>
                  <button
                    onClick={() => handleLikeComment(comment.id, "dislike")}
                    className={`flex items-center gap-1 text-sm ${
                      comment.user_liked === "dislike"
                        ? "text-red-600"
                        : "text-gray-500 hover:text-red-600"
                    }`}
                  >
                    <ThumbsDown size={14} />
                    <span>{comment.dislikes_count}</span>
                  </button>
                </div>
              )}

              {isAuthenticated && !isReplying && (
                <button
                  onClick={() => {
                    setReplyingTo(comment.id);
                    setReplyContent("");
                  }}
                  className="text-sm text-gray-500 hover:text-purple-600"
                >
                  Ответить
                </button>
              )}

              {isOwner && !isEditing && (
                <div className="flex gap-2 ml-auto">
                  <button
                    onClick={() => {
                      setEditingCommentId(comment.id);
                      setEditContent(comment.content);
                    }}
                    className="text-sm text-gray-500 hover:text-blue-600"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-sm text-gray-500 hover:text-red-600"
                  >
                    Удалить
                  </button>
                </div>
              )}
            </div>

            {isAuthenticated && isReplying && (
              <div className="mt-3">
                <textarea
                  // ✅ Add stable key
                  key={`reply-${comment.id}`}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Написать ответ..."
                  className="w-full p-2 border rounded-lg"
                  rows={2}
                  // ✅ Auto-focus
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleAddReply(comment.id)}
                    className="px-3 py-1 bg-purple-500 text-white rounded text-sm"
                  >
                    Отправить
                  </button>
                  <button
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyContent("");
                    }}
                    className="px-3 py-1 bg-gray-400 text-white rounded text-sm"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 space-y-2">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // Main Render
  // ─────────────────────────────────────────────────────────────
  return (
    <main className="flex-1 flex flex-col items-center px-[10px] sm:px-[20px] py-[30px] w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between w-full mb-6">
        <Link
          href={`/english/${lesson?.level}/${lesson?.category}`}
          className="text-gray-600 hover:text-purple-600 transition"
        >
          <ArrowLeft className="w-6 h-6 cursor-pointer" />
        </Link>
        <div className="bg-purple-100 px-4 py-2 rounded-full text-sm font-medium text-purple-700 capitalize">
          {lesson?.level.toUpperCase()}: {lesson?.category} — {lessonName}
        </div>
        <div className="w-6" />
      </div>

      {/* Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 w-full mb-8">
        {/* Copy Link */}
        <div className="bg-white flex p-[15px] items-center shadow-xs rounded-lg">
          <div className="font-semibold smaller-text">Поделитесь уроком</div>
          <button
            onClick={handleCopyLink}
            className="rounded-full ml-[15px] cursor-pointer items-center justify-center p-[7px] border-[1px] border-gray-400 hover:bg-gray-50 transition relative"
          >
            {copySuccess ? (
              <Check className="w-[15px] h-[15px] text-green-600" />
            ) : (
              <Copy className="w-[15px] h-[15px] text-gray-700" />
            )}
            {copySuccess && (
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                Скопировано!
              </span>
            )}
          </button>
        </div>

        {/* Test Result Badge */}
        <div className="bg-white flex flex-row p-[15px] items-center shadow-xs rounded-lg">
          <div className="font-semibold smaller-text">
            {!isAuthenticated
              ? "Войдите, чтобы видеть результат"
              : !result
                ? "Пройдите тест, чтобы узнать свой результат"
                : result.passed
                  ? `Ваш результат - ${result.score}%! Так держать!`
                  : `Ваш результат - ${result.score}%! Вы можете лучше`}
          </div>
          <div
            className={`rounded-full smaller-text ml-[15px] w-[35px] h-[35px] cursor-default items-center justify-center flex border-[1px] ${badge.border} ${badge.bg} ${badge.textColor}`}
          >
            {badge.text}
          </div>
        </div>
      </div>

      {/* Lesson Content */}
      <article
        className="text-wrap mt-[50px] prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: lesson?.content }}
      />

      {/* Test Button */}
      {TEST_ID && (
        <div className="text-wrap mt-[30px] flex justify-center">
          <button
            onClick={handleTakeTest}
            className="bg-purple-600 cursor-pointer text-white hover:translate-y-[-10px] hover:shadow-md transition-all flex text-[20px] items-center justify-center font-semibold rounded-xl md:w-[350px] w-[270px] h-[60px] md:h-[80px]"
          >
            {result?.passed ? "Пройти тест ещё раз" : "Пройти тест!"}
          </button>
        </div>
      )}

      {/* Feedback Buttons */}
      <div className="text-wrap flex flex-col sm:flex-row items-center justify-between w-full mt-[30px]">
        <div className="flex flex-col items-center">
          <div className="font-semibold ord-text mb-[10px]">Как вам урок?</div>
          <div className="flex flex-row gap-3">
            <button
              onClick={() => submitFeedback("clear")}
              className={`rounded-full smaller-text p-[3px] px-[10px] cursor-pointer items-center justify-center flex border-[1px] transition ${
                userFeedback === "clear"
                  ? "bg-green-100 border-green-300 text-green-700"
                  : "border-gray-400 hover:bg-gray-50"
              }`}
            >
              <p>Понятно</p>
              <ThumbsUp className="text-gray-700 ml-[5px] w-[15px] h-[15px]" />
              <p className="ml-[5px]">{lesson?.clear_count}</p>
            </button>
            <button
              onClick={() => submitFeedback("unclear")}
              className={`rounded-full smaller-text p-[3px] px-[10px] cursor-pointer items-center justify-center flex border-[1px] transition ${
                userFeedback === "unclear"
                  ? "bg-red-100 border-red-300 text-red-700"
                  : "border-gray-400 hover:bg-gray-50"
              }`}
            >
              <p>Не понятно</p>
              <ThumbsDown className="text-gray-700 ml-[5px] w-[15px] h-[15px]" />
              <p className="ml-[5px]">{lesson?.unclear_count}</p>
            </button>
          </div>
        </div>

        {/* Next Lesson */}
        <Link
          href={`/english/${lesson?.level}/${lesson?.category}/vocabulary`}
          className="bg-purple-600 rounded-xl w-[200px] sm:w-[250px] flex flex-row items-center hover:translate-y-[-5px] hover:shadow-md transition-all justify-center text-white p-[10px] px-[20px] mt-[10px] sm:mt-0"
        >
          <p>Следующий урок</p>
          <ArrowRight className="text-white w-[20px] ml-[10px] h-[20px]" />
        </Link>
      </div>

      {/* Comments Section */}
      <div className="text-wrap-no flex flex-col w-full mt-[40px]">
        <p className="font-semibold border-b-[1px] border-b-gray-300 pb-[10px] mb-[20px]">
          Комментарии ({countAllComments(comments)})
        </p>

        {/* Comment Form */}
        <div className="flex flex-row items-center mb-6">
          <img
            src="/aiclose.png"
            className="w-[40px] h-[40px] rounded-full"
            alt="Avatar"
          />
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Оставить комментарий"
            className="ml-[10px] flex-1 border-b border-gray-300 pb-2 outline-none focus:border-purple-500 transition"
            onKeyDown={(e) => e.key === "Enter" && handleSendComment()}
          />
          <button
            onClick={handleSendComment}
            disabled={!newComment.trim() || sendingComment}
            className="ml-2 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
          >
            {sendingComment ? (
              <Loader2 className="animate-spin w-4 h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {loadingComments ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin w-6 h-6 text-gray-400" />
            </div>
          ) : comments.length > 0 ? (
            comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">
              Пока нет комментариев. Будьте первым!
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
