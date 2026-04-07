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
import { useState, useEffect } from "react";
import useContactStore from "@/store/states";
import { supabase } from "@/lib/supabase";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
type TestResult = {
  score: number;
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

// ─────────────────────────────────────────────────────────────
// COMMENT ITEM COMPONENT (OUTSIDE LessonClient to prevent re-render issues)
// ─────────────────────────────────────────────────────────────
//
//
type User = {
  id: string;
  email?: string;
  user_metadata?: {
    username?: string;
  };
};
type CommentItemProps = {
  comment: Comment;
  depth?: number;
  user: User | null;
  isAuthenticated: boolean;
  editingCommentId: string | null;
  editContent: string;
  replyingTo: string | null;
  replyContent: string;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onReply: (id: string, content: string) => void;
  onLike: (id: string, type: "like" | "dislike") => void;
  setEditingCommentId: (id: string | null) => void;
  setEditContent: (content: string) => void;
  setReplyingTo: (id: string | null) => void;
  setReplyContent: (content: string) => void;
};

const CommentItem = ({
  comment,
  depth = 0,
  user,
  isAuthenticated,
  editingCommentId,
  editContent,
  replyingTo,
  replyContent,
  onEdit,
  onDelete,
  onReply,
  onLike,
  setEditingCommentId,
  setEditContent,
  setReplyingTo,
  setReplyContent,
}: CommentItemProps) => {
  const isOwner = user?.id === comment.user_id;
  const isReplying = replyingTo === comment.id;
  const isEditing = editingCommentId === comment.id;

  return (
    <div
      className={`${depth > 0 ? "ml-12 border-l-2 border-gray-200 pl-4" : ""}`}
    >
      <div className="flex gap-3 p-4 bg-white rounded-lg shadow-sm">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold flex-shrink-0">
          {comment.user_email?.[0]?.toUpperCase() || "U"}
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
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 border rounded-lg"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => onEdit(comment.id, editContent)}
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
                  onClick={() => onLike(comment.id, "like")}
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
                  onClick={() => onLike(comment.id, "dislike")}
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
                  onClick={() => onDelete(comment.id)}
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
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Написать ответ..."
                className="w-full p-2 border rounded-lg"
                rows={2}
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => onReply(comment.id, replyContent)}
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
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              user={user}
              isAuthenticated={isAuthenticated}
              editingCommentId={editingCommentId}
              editContent={editContent}
              replyingTo={replyingTo}
              replyContent={replyContent}
              onEdit={onEdit}
              onDelete={onDelete}
              onReply={onReply}
              onLike={onLike}
              setEditingCommentId={setEditingCommentId}
              setEditContent={setEditContent}
              setReplyingTo={setReplyingTo}
              setReplyContent={setReplyContent}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN LESSON CLIENT COMPONENT
// ─────────────────────────────────────────────────────────────
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
  const lessonName = initialSlug?.split("/").pop() || "";

  // ─────────────────────────────────────────────────────────────
  // HELPER: Count all comments including replies
  // ─────────────────────────────────────────────────────────────
  const countAllComments = (commentsList: Comment[]): number => {
    return commentsList.reduce((total, comment) => {
      return (
        total + 1 + (comment.replies ? countAllComments(comment.replies) : 0)
      );
    }, 0);
  };

  // ─────────────────────────────────────────────────────────────
  // FETCH COMMENTS
  // ─────────────────────────────────────────────────────────────

  // ✅ Keep this useEffect (fetches counts on page load)

  // Add this useEffect after your state declarations

  // Helper to fetch live counts directly from lesson_feedback
  const syncFeedbackCounts = async (lessonId: string) => {
    try {
      const [clearRes, unclearRes] = await Promise.all([
        supabase
          .from("lesson_feedback")
          .select("*", { count: "exact", head: true })
          .eq("lesson_id", lessonId)
          .eq("feedback_type", "clear"),
        supabase
          .from("lesson_feedback")
          .select("*", { count: "exact", head: true })
          .eq("lesson_id", lessonId)
          .eq("feedback_type", "unclear"),
      ]);

      if (clearRes.error) throw clearRes.error;
      if (unclearRes.error) throw unclearRes.error;

      setLesson((prev) => ({
        ...prev,
        clear_count: clearRes.count ?? 0,
        unclear_count: unclearRes.count ?? 0,
      }));
    } catch (err) {
      console.error("Failed to sync feedback counts:", err);
    }
  };

  // Fetch live counts when component mounts or lesson changes
  useEffect(() => {
    if (lesson?.id) {
      syncFeedbackCounts(lesson.id);
    }
  }, [lesson?.id]);

  useEffect(() => {
    if (!lesson?.id) return;

    const fetchComments = async () => {
      try {
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

        if (error) throw error;
        if (!commentsData) {
          setComments([]);
          return;
        }

        // Fetch user's likes
        let userLikes: { comment_id: string; like_type: string }[] = [];
        if (isAuthenticated && user) {
          const commentIds = commentsData.map((c) => c.id);
          const { data: likesData } = await supabase
            .from("comment_likes")
            .select("comment_id, like_type")
            .in("comment_id", commentIds)
            .eq("user_id", user.id);

          userLikes = likesData || [];
        }

        // Fetch usernames from profiles
        const userIds = [...new Set(commentsData.map((c) => c.user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", userIds);

        const usernameMap = new Map<string, string>();
        if (profilesData) {
          profilesData.forEach((profile) => {
            if (profile.username) {
              usernameMap.set(profile.id, profile.username);
            }
          });
        }

        // Transform comments
        const commentsWithUsers: Comment[] = commentsData.map((c) => {
          const username = usernameMap.get(c.user_id);
          const userLike = userLikes.find((l) => l.comment_id === c.id);

          return {
            id: c.id,
            user_id: c.user_id,
            content: c.content,
            created_at: c.created_at,
            updated_at: c.updated_at,
            parent_id: c.parent_id,
            likes_count: c.likes_count || 0,
            dislikes_count: c.dislikes_count || 0,
            user_email: username || `User${c.user_id.split("-")[0]}`,
            replies: [],
            user_liked: userLike?.like_type as "like" | "dislike" | null,
          };
        });

        // Nest replies
        const nestComments = (comments: Comment[]): Comment[] => {
          const commentMap = new Map<string, Comment>();
          const rootComments: Comment[] = [];

          comments.forEach((c) => {
            commentMap.set(c.id, { ...c, replies: [] });
          });

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

        setComments(nestComments(commentsWithUsers));
      } catch (err) {
        console.error("❌ Exception fetching comments:", err);
      } finally {
        setLoadingComments(false);
      }
    };

    fetchComments();
  }, [lesson?.id, user, isAuthenticated]);

  // ─────────────────────────────────────────────────────────────
  // FETCH TEST RESULT
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
          .select("score, completed_at")
          .eq("user_id", user.id)
          .eq("test_id", TEST_ID)
          .order("score", { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== "PGRST116") throw error;
        if (data)
          setResult({
            score: data.score,
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

  // ─────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────
  const handleTakeTest = () => {
    if (!TEST_ID) return;
    const returnUrl = encodeURIComponent(window.location.pathname);
    router.push(`/tests?id=${TEST_ID}&returnUrl=${returnUrl}`);
    console.log("🔍 Test ID:", TEST_ID);
    console.log("🔍 Lesson test_id:", lesson?.test_id);
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
    if (!user) {
      alert("Пожалуйста, войдите чтобы оставить отзыв");
      return;
    }

    try {
      // 1. Save/Update vote in lesson_feedback
      const { error: upsertError } = await supabase
        .from("lesson_feedback")
        .upsert(
          { lesson_id: lesson.id, user_id: user.id, feedback_type: type },
          { onConflict: "lesson_id,user_id" },
        );

      if (upsertError) throw upsertError;

      // 2. Update UI state
      setUserFeedback(type);

      // 3. Immediately refetch accurate counts from DB
      await syncFeedbackCounts(lesson.id);
    } catch (err) {
      console.error("❌ Error saving feedback:", err);
      alert("Не удалось сохранить отзыв");
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
        const username =
          user?.user_metadata?.username || `User${user.id.split("-")[0]}`;
        const newCommentObj: Comment = {
          ...comment,
          user_email: username,
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

  const handleAddReply = async (parentCommentId: string, content: string) => {
    if (!content.trim() || !user) return;

    try {
      const { data: reply, error } = await supabase
        .from("comments")
        .insert({
          lesson_id: lesson.id,
          user_id: user.id,
          content: content.trim(),
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

      const username =
        user?.user_metadata?.username || `User${user.id.split("-")[0]}`;
      const newReply: Comment = {
        ...reply,
        user_email: username,
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

  const handleLikeComment = async (
    commentId: string,
    type: "like" | "dislike",
  ) => {
    if (!user) return;

    try {
      const currentComment = comments.find((c) => c.id === commentId);
      const existingLike = currentComment?.user_liked;

      if (existingLike === type) {
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
                      ? Math.max(0, c.likes_count - 1)
                      : c.likes_count,
                dislikes_count:
                  type === "dislike"
                    ? existingLike === "like"
                      ? c.dislikes_count + 1
                      : c.dislikes_count + 1
                    : existingLike === "dislike"
                      ? Math.max(0, c.dislikes_count - 1)
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
    return {
      text: `${result.score}%`,
      border: "border-green-500",
      bg: "bg-green-200",
      textColor: "text-green-900",
    };
  };

  const badge = getResultBadge();

  // ─────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <main className="flex-1 flex flex-col items-center px-[10px] sm:px-[20px] py-[30px] w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between w-full mb-6">
        <Link
          href={`/english/${lesson.level}/${lesson.category}`}
          className="text-gray-600 hover:text-purple-600 transition"
        >
          <ArrowLeft className="w-6 h-6 cursor-pointer" />
        </Link>
        <div className="bg-purple-100 px-4 py-2 rounded-full text-sm font-medium text-purple-700 capitalize">
          {lesson.level.toUpperCase()}: {lesson.category} — {lessonName}
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
                : result.score >= 75
                  ? `Ваш результат - ${result.score}%! Так держать!`
                  : `Ваш результат - ${result.score}%! Вы можете лучше`}
          </div>
          <div
            className={`rounded-full smaller-text ml-[15px] w-[35px] h-[35px] cursor-default items-center justify-center flex border-[1px] ${result ? (result.score >= 75 ? "text-green-900 bg-green-200 border-green-600" : "border-red-700 text-red-900 bg-red-200") : ""}`}
          >
            {badge.text}
          </div>
        </div>
      </div>

      {/* Lesson Content */}
      <article
        className="flex flex-col items-center"
        dangerouslySetInnerHTML={{ __html: lesson.content }}
      />

      {/* Test Button */}
      <div className="text-wrap mt-[30px] flex justify-between items-center flex-col sm:flex-row">
        {TEST_ID && (
          <button
            onClick={handleTakeTest}
            className="bg-purple-900 sm:hidden block cursor-pointer text-white hover:translate-y-[-10px] hover:shadow-md transition-all flex text-[20px] items-center justify-center font-semibold rounded-xl w-[200px] max-h-[40px]"
          >
            <p> {result ? "Перепройти тест" : "Пройти тест"}</p>
          </button>
        )}

        {/* Feedback Buttons */}
        <div className="flex flex-col items-center">
          <div className="font-semibold ord-text mb-[10px]">Как вам урок?</div>
          <div className="flex flex-row gap-3">
            <button
              onClick={() => submitFeedback("clear")}
              className={`rounded-full smaller-text p-[3px] px-[10px] cursor-pointer items-center justify-center flex border-[1px] border-gray-400 transition hover:bg-black hover:border-black  hover:text-white duration-300 ${
                userFeedback === "clear" ? "" : ""
              }`}
            >
              <p>Понятно</p>
              <ThumbsUp className=" ml-[5px] w-[15px] h-[15px]" />
              <p className="ml-[5px]">{lesson.clear_count}</p>
            </button>
            <button
              onClick={() => submitFeedback("unclear")}
              className={`rounded-full smaller-text p-[3px] px-[10px] cursor-pointer items-center justify-center flex border-[1px] border-gray-400 transition hover:bg-black hover:border-black  hover:text-white duration-300  ${
                userFeedback === "unclear" ? "" : ""
              }`}
            >
              <p>Не понятно</p>
              <ThumbsDown className=" ml-[5px] w-[15px] h-[15px]" />
              <p className="ml-[5px]">{lesson.unclear_count}</p>
            </button>
          </div>
        </div>
        {TEST_ID && (
          <button
            onClick={handleTakeTest}
            className="bg-purple-600 cursor-pointer text-white hover:translate-y-[-10px] hover:shadow-md transition-all flex text-[16px] items-center justify-center font-semibold rounded-xl h-[60px] w-[250px]"
          >
            <p> {result ? "Перепройти тест" : "Пройти тест"}</p>
          </button>
        )}

        {/* Next Lesson */}
        <Link
          href={`/english/${lesson.level}/${lesson.category}/vocabulary`}
          className="bg-gray-300 rounded-xl border-[1px] border-gray-400 w-[200px] flex flex-row items-center hover:translate-y-[-5px] hover:shadow-md transition-all justify-center ord-text text-gray-700 p-[10px] px-[20px] mt-[10px] sm:mt-0"
        >
          <p>Следующий урок</p>
          <ArrowRight className="text-gray-700 w-[20px] ml-[10px] h-[20px]" />
        </Link>
      </div>

      {/* Comments Section */}
      <div className="text-wrap-no flex flex-col w-full mt-[40px]">
        <p className="font-semibold border-b-[1px] border-b-gray-300 pb-[10px] mb-[20px]">
          Комментарии ({countAllComments(comments)})
        </p>
        <p className=" pb-[10px] mb-[15px] smaller-text">
          Спасибо, что прошли этот урок! Поделитесь своим мнением об уроке, что
          было непонятно, что понравилось. Что бы вы дополнили?
        </p>

        {/* Comment Form */}
        <div className="flex flex-row items-center mb-6 mt-[20px]">
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
              <CommentItem
                key={comment.id}
                comment={comment}
                user={user}
                isAuthenticated={isAuthenticated}
                editingCommentId={editingCommentId}
                editContent={editContent}
                replyingTo={replyingTo}
                replyContent={replyContent}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
                onReply={handleAddReply}
                onLike={handleLikeComment}
                setEditingCommentId={setEditingCommentId}
                setEditContent={setEditContent}
                setReplyingTo={setReplyingTo}
                setReplyContent={setReplyContent}
              />
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
