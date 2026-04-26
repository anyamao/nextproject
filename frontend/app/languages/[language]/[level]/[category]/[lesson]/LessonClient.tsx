// frontend/app/languages/[language]/[level]/[category]/[lesson]/LessonClient.tsx
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
  Eye,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
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
  params: { language: string; level: string; category: string; lesson: string };
}

// ✅ Упрощённый тип без user
type CommentItemProps = {
  comment: Comment;
  depth?: number;
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

// ✅ CommentItem без user/isAuthenticated
const CommentItem = ({
  comment,
  depth = 0,
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
  const isReplying = replyingTo === comment.id;
  const isEditing = editingCommentId === comment.id;
  const marginLeft = depth === 0 ? 0 : depth === 1 ? 12 : 20;

  return (
    <div style={{ marginLeft: `${marginLeft}px` }} className="w-full">
      <div className="flex gap-3 p-4 overflow-x-auto">
        {/* Аватар */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
            {comment.user_email?.[0]?.toUpperCase() || "U"}
          </div>
        </div>

        <div className="flex-1">
          {/* Автор и дата */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-medium text-sm">
              {comment.user_email || "Аноним"}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(comment.created_at).toLocaleDateString("ru-RU")}
            </span>
          </div>

          {/* Текст комментария */}
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

          {/* Кнопки лайков и ответа */}
          <div className="flex items-center gap-4 mt-3 flex-wrap">
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

            {!isReplying && (
              <button
                onClick={() => {
                  setReplyingTo(comment.id);
                  setReplyContent(`@${comment.user_email || "Аноним"} `);
                }}
                className="text-sm text-gray-500 hover:text-purple-600"
              >
                Ответить
              </button>
            )}
          </div>

          {/* Форма ответа */}
          {isReplying && (
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

      {/* Ответы */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 space-y-2 ml-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
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
  // ❌ Убрали useContactStore — не нужен без аутентификации

  const [lesson, setLesson] = useState(initialLesson);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [userFeedback, setUserFeedback] = useState<"clear" | "unclear" | null>(
    null,
  );
  const [result, setResult] = useState<TestResult | null>(null);
  const [loadingResult, setLoadingResult] = useState(true);
  const TEST_ID = lesson?.test_id || undefined;

  const countAllComments = (commentsList: Comment[]): number => {
    return commentsList.reduce((total, comment) => {
      return (
        total + 1 + (comment.replies ? countAllComments(comment.replies) : 0)
      );
    }, 0);
  };

  // ✅ Фидбек — заглушка (без user)
  const syncFeedbackCounts = async () => {
    setLesson((prev) => ({
      ...prev,
      clear_count: prev.clear_count,
      unclear_count: prev.unclear_count,
    }));
  };

  useEffect(() => {
    if (lesson?.id) {
      syncFeedbackCounts();
    }
  }, [lesson?.id]);

  // ✅ Запись просмотра — только по session (без user)
  useEffect(() => {
    if (!lesson?.id) return;
    const recordView = async () => {
      try {
        const sessionKey = `viewed_lesson_${lesson.id}`;
        if (sessionStorage.getItem(sessionKey)) {
          return;
        }

        const sessionId =
          sessionStorage.getItem("anonymous_session_id") || crypto.randomUUID();
        sessionStorage.setItem("anonymous_session_id", sessionId);

        await apiFetch(`/api/lessons/${lesson.id}/view`, {
          method: "POST",
          headers: { "X-Session-ID": sessionId },
        });

        sessionStorage.setItem(sessionKey, "true");

        const data = await apiFetch(`/api/lessons/${lesson.id}/views`);
        setLesson((prev) => ({
          ...prev,
          view_count: data.view_count || 0,
        }));
      } catch (err) {
        console.error("Failed to record view:", err);
      }
    };
    recordView();
  }, [lesson?.id]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };
  const handleTakeTest = () => {
    if (!TEST_ID) return;
    const returnUrl = encodeURIComponent(window.location.pathname);
    router.push(`/tests?id=${TEST_ID}&returnUrl=${returnUrl}`);
  };

  // 🔁 Загрузка результата теста (упрощённо, без auth)
  useEffect(() => {
    if (!TEST_ID) {
      setLoadingResult(false);
      return;
    }

    const fetchResult = async () => {
      try {
        // 🔁 Пробуем получить результат через сессию (если бэкенд поддерживает)
        const sessionId =
          sessionStorage.getItem("anonymous_session_id") || crypto.randomUUID();
        sessionStorage.setItem("anonymous_session_id", sessionId);

        const data = await apiFetch(`/api/tests/${TEST_ID}/result`, {
          headers: { "X-Session-ID": sessionId },
        });

        if (data?.score !== undefined) {
          setResult({
            score: data.score,
            completed_at: data.completed_at || null,
          });
        }
      } catch (err) {
        // Если результата нет — это нормально, просто не показываем
        console.log("No test result found (this is OK)");
      } finally {
        setLoadingResult(false);
      }
    };

    fetchResult();
  }, [TEST_ID]);
  // ✅ Фидбек — заглушка
  const submitFeedback = async (type: "clear" | "unclear") => {
    setUserFeedback(type);
  };

  // ✅ Комментарии — без user, только анонимные
  const addComment = async (content: string, parentId?: string) => {
    // Заглушка: комментарии не сохраняются без бэкенда
    const newCommentObj: Comment = {
      id: crypto.randomUUID(),
      content: content.trim(),
      created_at: new Date().toISOString(),
      user_email: "Аноним",
      likes_count: 0,
      dislikes_count: 0,
      replies: [],
      user_liked: null,
    };

    if (parentId) {
      const addReply = (
        list: Comment[],
        id: string,
        reply: Comment,
      ): Comment[] =>
        list.map((c) =>
          c.id === id ? { ...c, replies: [...(c.replies || []), reply] } : c,
        );
      setComments((prev) => addReply(prev, parentId, newCommentObj));
    } else {
      setComments((prev) => [newCommentObj, ...prev]);
    }
    setNewComment("");
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    setSendingComment(true);
    await addComment(newComment);
    setSendingComment(false);
  };

  const handleEditComment = async (commentId: string, newContent: string) => {
    if (!newContent.trim()) return;
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId ? { ...c, content: newContent.trim() } : c,
      ),
    );
    setEditingCommentId(null);
    setEditContent("");
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Удалить этот комментарий и все ответы?")) return;
    const remove = (list: Comment[], id: string): Comment[] =>
      list
        .filter((c) => c.id !== id)
        .map((c) => ({
          ...c,
          replies: c.replies ? remove(c.replies, id) : undefined,
        }));
    setComments((prev) => remove(prev, commentId));
  };

  const handleAddReply = async (parentCommentId: string, content: string) => {
    if (!content.trim()) return;
    await addComment(content, parentCommentId);
    setReplyingTo(null);
    setReplyContent("");
  };

  const handleLikeComment = async (
    commentId: string,
    type: "like" | "dislike",
  ) => {
    // Заглушка: лайки не сохраняются без бэкенда
    const find = (list: Comment[], id: string): Comment | null => {
      for (const c of list) {
        if (c.id === id) return c;
        if (c.replies) {
          const found = find(c.replies, id);
          if (found) return found;
        }
      }
      return null;
    };
    const current = find(comments, commentId);
    const existing = current?.user_liked;

    const update = (
      list: Comment[],
      id: string,
      t: "like" | "dislike",
      old: string | null,
    ): Comment[] =>
      list.map((c) => {
        if (c.id === id) {
          let likes = c.likes_count,
            dislikes = c.dislikes_count;
          if (old === "like") likes = Math.max(0, likes - 1);
          if (old === "dislike") dislikes = Math.max(0, dislikes - 1);
          if (t === "like") likes += 1;
          else dislikes += 1;
          return {
            ...c,
            likes_count: likes,
            dislikes_count: dislikes,
            user_liked: t,
          };
        }
        if (c.replies) return { ...c, replies: update(c.replies, id, t, old) };
        return c;
      });

    setComments((prev) => update(prev, commentId, type, existing || null));
  };

  const getResultBadge = () => {
    return {
      text: "—",
      border: "border-gray-300",
      bg: "bg-gray-100",
      textColor: "text-gray-500",
    };
  };
  const badge = getResultBadge();

  return (
    <main className="flex-1 flex flex-col items-center px-[10px] sm:px-[20px] py-[30px] w-full max-w-5xl mx-auto">
      {/* Header */}
      <Link
        href={`/languages/${params.language}/${params.level}/${params.category}`}
        className="text-gray-600 hover:text-purple-600 transition flex items-center justify-between w-full mb-[25px]"
      >
        <ArrowLeft className="w-[20px] h-[20px]" />
        <div className="bg-purple-100 px-4 py-2 rounded-full text-sm font-medium text-purple-700 capitalize">
          {lesson.title}
        </div>
        <div className="w-6" />
      </Link>

      {/* Share + View Count */}
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
          </button>
        </div>
        <div className="flex flex-row items-center">
          <div className="flex flex-row items-center mx-[15px]">
            <p className="text-[10px] mr-[5px]">{lesson.view_count || 0}</p>
            <Eye className="w-[15px] h-[15px] text-gray-600" />
          </div>
        </div>
      </div>

      {/* Lesson Content */}
      <article
        className="flex flex-col items-center w-full prose prose-purple max-w-none"
        dangerouslySetInnerHTML={{ __html: lesson.content }}
      />

      {/* Feedback + Next Lesson */}
      <div className="text-wrap mt-[30px] flex justify-between items-center flex-col sm:flex-row gap-4">
        {/* Test Result / Button */}
        {TEST_ID && (
          <div className="w-full max-w-3xl mx-auto mb-10 p-4 bg-purple-50 rounded-xl text-center border border-purple-200">
            {!result && !loadingResult && (
              <>
                <p className="text-sm text-gray-700 mb-3">
                  Проверь свои знания по этому уроку!
                </p>
                <button
                  onClick={handleTakeTest}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                >
                  🎯 Пройти тест
                </button>
              </>
            )}

            {loadingResult && (
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <Loader2 className="animate-spin w-4 h-4" />
                <span>Загрузка результата...</span>
              </div>
            )}

            {result && (
              <div className="space-y-3">
                <p className="text-sm text-gray-700">
                  Ваш последний результат:
                </p>
                <div className="flex items-center justify-center gap-3">
                  <div
                    className={`rounded-full text-lg font-bold w-12 h-12 flex items-center justify-center border-2 ${
                      result.score >= 75
                        ? "text-green-900 bg-green-200 border-green-600"
                        : "text-red-900 bg-red-200 border-red-600"
                    }`}
                  >
                    {result.score}%
                  </div>
                  <button
                    onClick={handleTakeTest}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
                  >
                    Пройти ещё раз
                  </button>
                </div>
                <p className="text-xs text-gray-500">Проходной балл: 75%</p>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col items-center">
          <div className="font-semibold text-sm mb-[10px]">Как вам урок?</div>
          <div className="flex flex-row gap-3">
            <button
              onClick={() => submitFeedback("clear")}
              className={`rounded-full text-sm p-[3px] px-[10px] cursor-pointer items-center justify-center flex border-[1px] border-gray-400 transition hover:bg-black hover:text-white duration-300 ${
                userFeedback === "clear" ? "bg-black text-white" : ""
              }`}
            >
              <p>Понятно</p>
              <ThumbsUp className="ml-[5px] w-[15px] h-[15px]" />
              <p className="ml-[5px]">{lesson.clear_count}</p>
            </button>
            <button
              onClick={() => submitFeedback("unclear")}
              className={`rounded-full text-sm p-[3px] px-[10px] cursor-pointer items-center justify-center flex border-[1px] border-gray-400 transition hover:bg-black hover:text-white duration-300 ${
                userFeedback === "unclear" ? "bg-black text-white" : ""
              }`}
            >
              <p>Не понятно</p>
              <ThumbsDown className="ml-[5px] w-[15px] h-[15px]" />
              <p className="ml-[5px]">{lesson.unclear_count}</p>
            </button>
          </div>
        </div>

        <Link
          href={`/languages/${params.language}/${params.level}/${params.category}`}
          className="bg-gray-200 rounded-xl border-[1px] border-gray-300 w-[180px] flex flex-row items-center hover:translate-y-[-3px] hover:shadow-md transition-all justify-center text-sm text-gray-700 p-[10px]"
        >
          <p>Следующая тема</p>
          <ArrowRight className="text-gray-700 w-[16px] ml-[8px] h-[16px]" />
        </Link>
      </div>

      {/* Comments Section */}
      <div className="flex flex-col w-full mt-[40px]">
        <p className="font-semibold border-b-[1px] border-b-gray-300 pb-[10px] mb-[20px]">
          Комментарии ({countAllComments(comments)})
        </p>
        <div className="flex flex-row items-center mb-6 mt-[10px]">
          <div className="w-[40px] h-[40px] rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
            U
          </div>
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
