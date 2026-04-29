// frontend/components/LanguageCommentsSection.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Send,
  Reply,
  Trash2,
  Pencil,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import useContactStore from "@/store/states";

type Comment = {
  id: number;
  user_id: number;
  username: string;
  avatar_url: string | null;
  content: string;
  parent_id: number | null;
  created_at: string;
  updated_at: string | null;
  likes: number;
  dislikes: number;
  user_reaction: "like" | "dislike" | null;
  replies: Comment[];
};

interface LanguageCommentsSectionProps {
  lessonId: number;
}

export default function LanguageCommentsSection({
  lessonId,
}: LanguageCommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  const currentUser = useContactStore((state) => state.user);
  const currentUserId =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")?.id
      : null;

  // Загрузка комментариев
  useEffect(() => {
    // frontend/components/LanguageCommentsSection.tsx
    // frontend/components/LanguageCommentsSection.tsx

    const fetchComments = async () => {
      try {
        console.log(
          `🔍 [Comments] Fetching from: /languages/lessons/${lessonId}/comments`,
        );

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8010"}/languages/lessons/${lessonId}/comments`,
          {
            headers: {
              "Content-Type": "application/json",
              ...(localStorage.getItem("token") && {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              }),
            },
            cache: "no-store",
          },
        );

        console.log(`🔍 [Comments] Response status: ${response.status}`);

        const text = await response.text(); // 🔥 Читаем как текст сначала
        console.log(`🔍 [Comments] Raw response: ${text.substring(0, 200)}...`);

        const data = JSON.parse(text); // 🔥 Парсим вручную
        console.log(
          `✅ [Comments] Parsed: count=${data.length}, type=${Array.isArray(data) ? "array" : typeof data}`,
        );

        setComments(data);
      } catch (err) {
        console.error("❌ [Comments] Fetch error:", err);
      }
    };
    fetchComments();
  }, [lessonId]);

  // Отправка комментария
  // frontend/components/LanguageCommentsSection.tsx
  // frontend/components/LanguageCommentsSection.tsx

  const handleSubmit = async (
    e: React.FormEvent,
    parentId: number | null = null,
  ) => {
    e.preventDefault();
    const content = parentId ? replyContent : newComment;
    if (!content.trim()) return;

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      // Отправляем комментарий
      const response = await apiFetch(
        `/languages/lessons/${lessonId}/comments`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content, parent_id: parentId }),
        },
      );

      console.log("✅ [Comments] Server response:", response);

      // 🔥 КОСТЫЛЬ: ждём 500мс чтобы БД успела закоммитить
      console.log("⏳ [Comments] Waiting for DB commit...");
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Перезагружаем список
      console.log("🔍 [Comments] Reloading comments list...");
      const updatedComments = await apiFetch(
        `/languages/lessons/${lessonId}/comments`,
      );
      console.log("✅ [Comments] Loaded", updatedComments.length, "comments");

      setComments(updatedComments);
      setNewComment("");
      setReplyContent("");
      setReplyingTo(null);
    } catch (err) {
      console.error("❌ [Comments] Error:", err);
      alert("Не удалось отправить комментарий");
    } finally {
      setLoading(false);
    }
  };
  // Удаление
  const handleDelete = async (commentId: number) => {
    if (!confirm("Удалить комментарий?")) return;
    try {
      const token = localStorage.getItem("token");
      await apiFetch(`/languages/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await apiFetch(`/languages/lessons/${lessonId}/comments`);
      setComments(data);
    } catch (err) {
      console.error("Failed to delete comment", err);
    }
  };

  // Редактирование
  const handleEdit = async (commentId: number) => {
    if (!editContent.trim()) return;
    try {
      const token = localStorage.getItem("token");
      await apiFetch(`/languages/comments/${commentId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: editContent }),
      });
      const data = await apiFetch(`/languages/lessons/${lessonId}/comments`);
      setComments(data);
      setEditingId(null);
    } catch (err) {
      console.error("Failed to edit comment", err);
    }
  };

  // Реакция
  // Внутри handleReaction в LanguageCommentsSection.tsx:

  const handleReaction = async (
    commentId: number,
    type: "like" | "dislike",
  ) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Войдите, чтобы оценивать комментарии!");
      return;
    }

    // 🔍 Находим комментарий в состоянии
    const comment = comments.find((c) => c.id === commentId);
    if (!comment) return;

    const currentReaction = comment.user_reaction;
    const newReaction = currentReaction === type ? "none" : type;

    // ✅ Оптимистичное обновление (сразу меняем в UI)
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
              ...c,
              user_reaction: newReaction,
              likes:
                newReaction === "like"
                  ? c.likes + (currentReaction !== "like" ? 1 : -1)
                  : c.likes,
              dislikes:
                newReaction === "dislike"
                  ? c.dislikes + (currentReaction !== "dislike" ? 1 : -1)
                  : c.dislikes,
            }
          : c,
      ),
    );

    try {
      console.log("🔍 [Reaction] Sending reaction:", {
        commentId,
        newReaction,
      });

      await apiFetch(`/languages/comments/${commentId}/reaction`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reaction_type: newReaction }),
      });

      console.log("✅ [Reaction] Server confirmed");

      // ✅ Перезагружаем комментарии для синхронизации с сервером
      const data = await apiFetch(`/languages/lessons/${lessonId}/comments`);
      setComments(data);
    } catch (err) {
      console.error("❌ [Reaction] Failed:", err);
      // ❌ Откат изменений при ошибке
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                user_reaction: currentReaction,
                likes: comment.likes,
                dislikes: comment.dislikes,
              }
            : c,
        ),
      );
    }
  };
  // Хелпер для аватарки
  const getAvatarUrl = (comment: Comment) => {
    if (comment.user_id === currentUser?.id) {
      return currentUser.avatar_url || "default_cat.jpg";
    }
    return comment.avatar_url || "default_cat.jpg";
  };

  return (
    <div className="mt-12 pt-8 border-t border-gray-200">
      <h2 className="font-bold text-xl mb-4">Комментарии</h2>
      <p className="text-gray-600 text-sm mb-6">
        Обсудите урок, задайте вопросы, поделитесь мнением
      </p>

      {/* Форма нового комментария */}
      <form onSubmit={(e) => handleSubmit(e)} className="mb-8">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Напишите комментарий..."
          className="w-full border border-purple-300 shadow-sm bg-white rounded-xl focus:ring-2 focus:ring-purple-400 outline-none resize-none p-3"
          rows={3}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !newComment.trim()}
          className="mt-3 px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
        >
          <Send className="w-4 h-4" /> Отправить
        </button>
      </form>

      {/* Список комментариев */}
      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="p-4 flex flex-row w-full">
            <img
              src={`/avatars/${getAvatarUrl(comment)}`}
              alt={comment.username}
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/avatars/default_cat.jpg";
              }}
            />
            <div className="flex flex-col w-full ml-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-semibold text-sm text-gray-900">
                    {comment.username}
                  </span>
                  <span className="text-gray-500 text-xs ml-2">
                    {new Date(comment.created_at).toLocaleDateString("ru-RU")}
                  </span>
                </div>
                {currentUserId === comment.user_id && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingId(comment.id);
                        setEditContent(comment.content);
                      }}
                      className="text-gray-400 hover:text-purple-600 transition"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-gray-400 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {editingId === comment.id ? (
                <div className="mt-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    rows={2}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleEdit(comment.id)}
                      className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition"
                    >
                      Сохранить
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-700 mt-2 text-sm">{comment.content}</p>
              )}

              {/* Реакции */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReaction(comment.id, "like")}
                    className={`flex items-center gap-1 text-sm transition ${
                      comment.user_reaction === "like"
                        ? "text-green-600 font-semibold"
                        : "text-gray-500 hover:text-green-600"
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" /> {comment.likes || 0}
                  </button>
                  <button
                    onClick={() => handleReaction(comment.id, "dislike")}
                    className={`flex items-center gap-1 text-sm transition ${
                      comment.user_reaction === "dislike"
                        ? "text-red-600 font-semibold"
                        : "text-gray-500 hover:text-red-600"
                    }`}
                  >
                    <ThumbsDown className="w-4 h-4" /> {comment.dislikes || 0}
                  </button>
                </div>

                <button
                  onClick={() => {
                    setReplyingTo(comment.id);
                    setReplyContent(`@${comment.username} `);
                  }}
                  className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                >
                  <Reply className="w-3 h-3" /> Ответить
                </button>
              </div>

              {/* Форма ответа */}
              {replyingTo === comment.id && (
                <form
                  onSubmit={(e) => handleSubmit(e, comment.id)}
                  className="mt-4 ml-6 border-l-2 border-gray-200 pl-4"
                >
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`Ответить @${comment.username}...`}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                    rows={2}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      type="submit"
                      disabled={loading || !replyContent.trim()}
                      className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition disabled:opacity-50"
                    >
                      Отправить
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition"
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              )}

              {/* Ответы */}
              {comment.replies?.length > 0 && (
                <div className="mt-4 ml-6 space-y-3 border-l-2 border-gray-200 pl-4">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-start justify-between">
                        <span className="font-semibold text-sm text-gray-900">
                          {reply.username}
                        </span>
                        {currentUserId === reply.user_id && (
                          <button
                            onClick={() => handleDelete(reply.id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-gray-700 mt-1 text-sm">
                        {reply.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <p className="text-gray-500 text-center py-8">
            Пока нет комментариев. Будь первым! 👇
          </p>
        )}
      </div>
    </div>
  );
}
