"use client";
import { supabase } from "@/lib/supabase";
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
  Eye,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import useContactStore from "@/store/states";
import { apiFetch } from "@/lib/api";
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
  estimated_minutes: number;
  passing_score: number;
  clear_count: number;
  unclear_count: number;
  test_id: string | null;
  view_count: number;
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

type User = {
  id: string;
  email?: string;
  user_metadata?: {
    username?: string;
  };
};

interface LessonClientProps {
  initialLesson: Lesson;
  initialSlug: string;
  params: { subject: string; lesson: string };
}

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

  const marginLeft = depth === 0 ? 0 : depth === 1 ? 12 : 20;

  return (
    <div style={{ marginLeft: `${marginLeft}px` }} className="">
      <div className="flex gap-3 p-4   overflow-x-auto">
        <Link
          href={`/profile-page?id=${comment.user_id}`}
          className="flex-shrink-0 group"
          title="View profile"
        >
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold flex-shrink-0">
            {comment.user_email?.[0]?.toUpperCase() || "U"}
          </div>
        </Link>
        <div className="">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-medium text-sm break-word">
              {comment.user_email}
            </span>
            <span className="text-xs text-gray-400 flex-shrink-0">
              {new Date(comment.created_at).toLocaleDateString("ru-RU")}
            </span>
            {comment.updated_at &&
              comment.updated_at !== comment.created_at && (
                <span className="text-xs text-gray-400 flex-shrink-0">
                  (изменено)
                </span>
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
            <p className="text-gray-700 break-words whitespace-pre-wrap">
              {comment.content}
            </p>
          )}

          <div className="flex items-center gap-4 mt-3 ">
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
                  setReplyContent(`@${comment.user_email} `);
                }}
                className="smaller-text text-gray-500 hover:text-purple-600"
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
                  className="smaller-text text-gray-500 hover:text-blue-600"
                >
                  Редактировать
                </button>
                <button
                  onClick={() => onDelete(comment.id)}
                  className="smaller-text text-gray-500 hover:text-red-600"
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
export default function LessonClient({
  initialLesson,
  initialSlug,
  params,
}: LessonClientProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useContactStore();
  const [hasTest, setHasTest] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  const [lesson, setLesson] = useState<Lesson>(initialLesson);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);

  const [copySuccess, setCopySuccess] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [loadingResult, setLoadingResult] = useState(true);

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [userFeedback, setUserFeedback] = useState<"clear" | "unclear" | null>(
    null,
  );

  const TEST_ID = lesson?.test_id || undefined;
  const lessonName = initialSlug?.split("/").pop() || "";

  const countAllComments = (commentsList: Comment[]): number => {
    return commentsList.reduce((total, comment) => {
      return (
        total + 1 + (comment.replies ? countAllComments(comment.replies) : 0)
      );
    }, 0);
  };

  // frontend/app/ege/[subject]/[lesson]/LessonClient.tsx
  // ✅ Replace the old syncFeedbackCounts function with this FastAPI version:
  const syncFeedbackCounts = async (lessonId: string) => {
    try {
      // 🔁 Fetch feedback counts from FastAPI
      const data = await apiFetch(`/api/lessons/${lessonId}/feedback`);

      setLesson((prev) => ({
        ...prev,
        clear_count: data.clear_count ?? 0,
        unclear_count: data.unclear_count ?? 0,
      }));

      // If the user has already reacted, highlight the button
      if (data.user_feedback) {
        setUserFeedback(data.user_feedback as "clear" | "unclear");
      }
    } catch (err) {
      console.error("Failed to sync feedback counts:", err);
    }
  };
  useEffect(() => {
    if (lesson?.id) {
      syncFeedbackCounts(lesson.id);
    }
  }, [lesson?.id]);

  // frontend/app/ege/[subject]/[lesson]/LessonClient.tsx

  // 🔁 Замени этот useEffect (примерно строки 359-400):
  // 🔁 Замени этот useEffect на код ниже:
  //
  //
  //

  // Replace the useEffect containing `const recordView = ...` with this:
  // ✅ Replace the view counting logic with this FastAPI version:

  // ✅ НОВЫЙ КОД — замени весь useEffect на этот:
  // Проверка теста при монтировании
  useEffect(() => {
    console.log("🔍 Checking for test...");
    console.log("🔍 lesson.test_id:", lesson?.test_id);
    console.log("🔍 lesson:", lesson);

    // 🔁 Просто проверяем, есть ли test_id в уроке
    if (lesson?.test_id) {
      console.log("✅ Test exists! ID:", lesson.test_id);
      setHasTest(true);
    } else {
      console.log("❌ No test_id in lesson");
      setHasTest(false);
    }
  }, [lesson?.test_id]);

  // frontend/app/ege/[subject]/[lesson]/LessonClient.tsx

  // 🔁 Внутри компонента, замени старый useEffect на этот:

  useEffect(() => {
    if (!lesson?.id) return;

    const recordView = async () => {
      try {
        // 🔁 Уникальный ключ: пользователь + урок
        const userId =
          user?.id ||
          `anon_${sessionStorage.getItem("anonymous_session_id") || "unknown"}`;
        const sessionKey = `viewed_lesson_fastapi_${userId}_${lesson.id}`;

        if (sessionStorage.getItem(sessionKey)) {
          console.log("✅ Already viewed by this user in this session");
          return;
        }

        // 🔁 Генерируем session_id для анонимов (если ещё нет)
        let sessionId = sessionStorage.getItem("anonymous_session_id");
        if (!sessionId) {
          sessionId = crypto.randomUUID();
          sessionStorage.setItem("anonymous_session_id", sessionId);
        }

        // 🔁 Отправляем запрос на FastAPI
        const response = await apiFetch(`/api/lessons/${lesson.id}/view`, {
          method: "POST",
          headers: {
            "X-Session-ID": sessionId,
          },
        });

        // 🔁 Обновляем счётчик, если бэкенд вернул новое значение
        if (response?.view_count !== undefined) {
          setLesson((prev) => ({
            ...prev,
            view_count: response.view_count,
          }));
          sessionStorage.setItem(sessionKey, "true");
          console.log(
            `✅ View recorded: ${response.view_count} (user: ${userId})`,
          );
        }
      } catch (err) {
        console.error("Failed to record view via FastAPI:", err);
      }
    };

    recordView();
  }, [lesson?.id, user?.id]); // ✅ Добавили user?.id в зависимости!
  // 🔁 Очищаем ключи просмотров при смене пользователя
  useEffect(() => {
    const userId = user?.id || "anon";

    // Удаляем все ключи, которые НЕ принадлежат текущему пользователю
    Object.keys(sessionStorage)
      .filter((key) => key.startsWith("viewed_lesson_fastapi_"))
      .forEach((key) => {
        // Ключ вида: viewed_lesson_fastapi_USERID_LESSONID
        const parts = key.split("_");
        const keyUserId = parts[4]; // 4-й элемент — userId

        if (keyUserId !== userId) {
          sessionStorage.removeItem(key);
        }
      });
  }, [user?.id]);
  useEffect(() => {
    if (!isAuthenticated || !user || !TEST_ID) {
      setLoadingResult(false);
      return;
    }

    const fetchResult = async () => {
      try {
        // 🔁 Используем apiFetch вместо supabase
        const data = await apiFetch(`/api/tests/${TEST_ID}/result`);

        setResult({
          score: data.score,
          completed_at: null, // Можно добавить поле в ответ бэкенда, если нужно
        });
      } catch (err) {
        console.error("Error fetching test result:", err);
        // Если результата нет — это нормально, просто не показываем
      } finally {
        setLoadingResult(false);
      }
    };

    fetchResult();
  }, [user, isAuthenticated, TEST_ID]);

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
    if (!user) {
      alert("Пожалуйста, войдите чтобы оставить отзыв");
      return;
    }

    try {
      // 🔁 Отправляем фидбек через FastAPI
      const data = await apiFetch(`/api/lessons/${lesson.id}/feedback`, {
        method: "POST",
        body: JSON.stringify({ feedback_type: type }),
      });

      // Обновляем счётчики и реакцию пользователя
      setLesson((prev) => ({
        ...prev,
        clear_count: data.clear_count,
        unclear_count: data.unclear_count,
      }));
      setUserFeedback(data.user_feedback);
    } catch (err) {
      console.error("❌ Feedback error:", err);
    }
  };

  const removeFeedback = async () => {
    if (!user || !lesson.id) return;

    try {
      await apiFetch(`/api/lessons/${lesson.id}/feedback`, {
        method: "DELETE",
      });

      // Обновляем счётчики
      const data = await apiFetch(`/api/lessons/${lesson.id}/feedback`);
      setLesson((prev) => ({
        ...prev,
        clear_count: data.clear_count,
        unclear_count: data.unclear_count,
      }));
      setUserFeedback(null);
    } catch (err) {
      console.error("❌ Remove feedback error:", err);
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
      console.error("❌ Comment error:", err);
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
      console.error("❌ Edit error:", err);
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
      console.error("❌ Delete error:", err);
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
      console.error("❌ Reply error:", err);
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
      console.error("❌ Like error:", err);
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
      border: result.score >= 75 ? "border-green-500" : "border-red-500",
      bg: result.score >= 75 ? "bg-green-200" : "bg-red-200",
      textColor: result.score >= 75 ? "text-green-900" : "text-red-900",
    };
  };

  const badge = getResultBadge();

  return (
    <main className="flex-1 flex flex-col items-center px-[10px] sm:px-[20px] py-[30px] w-full max-w-5xl mx-auto">
      <div className="flex flex-row w-full items-center justify-between">
        {" "}
        <Link
          href={`/ege/${params.subject}`}
          className="text-gray-600 hover:text-purple-600 transition mb-4 inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-[20px] h-[20px]" />
        </Link>
        <div className="bg-purple-100 px-4 py-2 rounded-full text-sm font-medium text-purple-700 capitalize">
          {lesson.title}
        </div>
        <div className="w-6" />
      </div>
      <p className="text-gray-600 mb-6 w-full">{lesson.description}</p>

      <div className="flex flex-wrap items-center justify-between gap-3 w-full mb-8">
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
        <div className="flex flex-row items-center">
          {TEST_ID && (
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
                className={`rounded-full text-sm ml-[15px] w-[35px] h-[35px] cursor-default items-center justify-center flex border-[1px] ${
                  result
                    ? result.score >= 75
                      ? "text-green-900 bg-green-200 border-green-600"
                      : "border-red-700 text-red-900 bg-red-200"
                    : ""
                }`}
              >
                {badge.text}
              </div>
            </div>
          )}
        </div>
      </div>

      <article
        className="flex flex-col items-center prose prose-purple max-w-none mb-10"
        dangerouslySetInnerHTML={{ __html: lesson.content }}
      />

      <div className="text-wrap mt-[30px] flex justify-between items-center flex-col sm:flex-row gap-4">
        {/* Кнопка "Пройти тест" */}
        {hasTest && isAuthenticated && (
          <button
            onClick={() => {
              const returnUrl = encodeURIComponent(window.location.pathname);
              router.push(`/tests?id=${lesson.test_id}&returnUrl=${returnUrl}`);
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm whitespace-nowrap"
          >
            Начать тест
          </button>
        )}

        {hasTest && !isAuthenticated && (
          <div className="w-full max-w-3xl mx-auto mb-10 p-4 bg-gray-50 rounded-xl text-center">
            <p className="text-sm text-gray-600 mb-2">
              🔐 Чтобы пройти тест,{" "}
              <button className="text-purple-600 hover:underline">
                войдите
              </button>{" "}
              или{" "}
              <button className="text-purple-600 hover:underline">
                зарегистрируйтесь
              </button>
            </p>
          </div>
        )}
        <div className="flex flex-col items-center">
          <div className="font-semibold text-sm mb-[10px]">Как вам урок?</div>
          <div className="flex flex-row gap-3">
            <button
              onClick={() =>
                userFeedback === "clear"
                  ? removeFeedback()
                  : submitFeedback("clear")
              }
              className={`rounded-full text-sm p-[3px] px-[10px] cursor-pointer items-center justify-center flex border-[1px] border-gray-400 transition hover:bg-black hover:text-white duration-300 ${
                userFeedback === "clear" ? "bg-black text-white" : ""
              }`}
            >
              <p>Понятно</p>
              <ThumbsUp className="ml-[5px] w-[15px] h-[15px]" />
              <p className="ml-[5px]">{lesson.clear_count}</p>
            </button>
            <button
              onClick={() =>
                userFeedback === "unclear"
                  ? removeFeedback()
                  : submitFeedback("unclear")
              }
              className={`rounded-full text-sm p-[3px] px-[10px] cursor-pointer items-center justify-center flex border-[1px] border-gray-400 transition hover:bg-black hover:text-white duration-300 ${
                userFeedback === "unclear" ? "bg-black text-white" : ""
              }`}
            >
              <p>Не понятно</p>
              <ThumbsDown className="ml-[5px] w-[15px] h-[15px]" />
              <p className="ml-[5px]">{lesson.unclear_count}</p>
            </button>
          </div>
          <p className="smaller-text text-gray-600">
            Система лайков в разработке
          </p>
        </div>

        <Link
          href={`/ege/${params.subject}`}
          className="bg-gray-200 rounded-xl border-[1px] border-gray-300 w-[180px] flex flex-row items-center hover:translate-y-[-3px] hover:shadow-md transition-all justify-center text-sm text-gray-700 p-[10px]"
        >
          <p>Следующий урок</p>
          <ArrowRight className="text-gray-700 w-[16px] ml-[8px] h-[16px]" />
        </Link>
      </div>

      <div className="flex flex-col w-full mt-[40px]">
        <p className="font-semibold border-b-[1px] border-b-gray-300 pb-[10px] mb-[20px]">
          Комментарии ({countAllComments(comments)})
        </p>
        <p className="smaller-text text-gray-600">
          Система комментариев в разработке
        </p>
        <div className="flex flex-row items-center mb-6 mt-[10px] w-full">
          <img
            src="/aiclose.png"
            className="w-[40px] h-[40px] rounded-full bg-gray-200 flex-shrink-0"
            alt="Avatar"
          />
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Оставить комментарий"
            className="ml-[10px] flex-1 border-b border-gray-300 pb-2 outline-none focus:border-purple-500 transition min-w-0"
            onKeyDown={(e) => e.key === "Enter" && handleSendComment()}
          />
          <button
            onClick={handleSendComment}
            disabled={!newComment.trim() || sendingComment}
            className="ml-2 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition flex-shrink-0"
          >
            {sendingComment ? (
              <Loader2 className="animate-spin w-4 h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
