// frontend/components/CommentsSection.tsx
"use client";

import { useState, useEffect } from "react";
import { Send, Reply, Trash2, Pencil } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Comment = {
  id: number;
  user_id: number;
  username: string;
  content: string;
  parent_id: number | null;
  created_at: string;
  replies: Comment[];
};

interface CommentsSectionProps {
  lessonId?: number;
  articleId?: number;
}

export default function CommentsSection({
  lessonId,
  articleId,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  const currentUserId =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")?.id
      : null;

  const entityType = lessonId ? "lessons" : "articles";
  const entityId = lessonId || articleId;

  // Загрузка комментариев
  useEffect(() => {
    if (!entityId) return;
    const fetchComments = async () => {
      try {
        const data = await apiFetch(`/${entityType}/${entityId}/comments`);
        setComments(data);
      } catch (err) {
        console.error("Failed to fetch comments", err);
      }
    };
    fetchComments();
  }, [entityType, entityId]);

  // Отправка нового комментария
  // Отправка нового комментария
  const handleSubmit = async (
    e: React.FormEvent,
    parentId: number | null = null,
  ) => {
    e.preventDefault();
    const content = parentId ? replyContent : newComment;
    if (!content.trim() || !entityId) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // ✅ Отправляем lesson_id/article_id в ТЕЛЕ запроса
      const requestBody = {
        content,
        parent_id: parentId,
        lesson_id: lessonId || null,
        article_id: articleId || null,
      };

      await apiFetch("/comments", {
        // ✅ Без query-параметров!
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      // Перезагружаем комментарии
      const data = await apiFetch(`/${entityType}/${entityId}/comments`);
      setComments(data);
      setNewComment("");
      setReplyContent("");
      setReplyingTo(null);
    } catch (err) {
      console.error("Failed to post comment", err);
      alert("Не удалось отправить комментарий");
    } finally {
      setLoading(false);
    }
  };
  // Удаление комментария
  const handleDelete = async (commentId: number) => {
    if (!confirm("Удалить комментарий?")) return;
    try {
      const token = localStorage.getItem("token");
      await apiFetch(`/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await apiFetch(`/${entityType}/${entityId}/comments`);
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
      await apiFetch(`/comments/${commentId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: editContent }),
      });
      const data = await apiFetch(`/${entityType}/${entityId}/comments`);
      setComments(data);
      setEditingId(null);
    } catch (err) {
      console.error("Failed to edit comment", err);
    }
  };

  if (!entityId) return null;

  return (
    <div className="mt-12 pt-8 border-t border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">💬 Комментарии</h2>

      {/* Форма нового комментария */}
      <form onSubmit={(e) => handleSubmit(e)} className="mb-8">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Напишите комментарий..."
          className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none resize-none"
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
          <div key={comment.id} className="bg-gray-50 p-4 rounded-xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-semibold text-gray-900">
                  {comment.username}
                </span>
                <span className="text-gray-500 text-sm ml-2">
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
              <div className="mt-3">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  rows={2}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleEdit(comment.id)}
                    className="px-4 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition"
                  >
                    Сохранить
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-4 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 mt-2 whitespace-pre-wrap">
                {comment.content}
              </p>
            )}

            {/* Кнопка ответа */}
            {!comment.parent_id && (
              <button
                onClick={() => setReplyingTo(comment.id)}
                className="mt-3 text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
              >
                <Reply className="w-3 h-3" /> Ответить
              </button>
            )}

            {/* Форма ответа */}
            {replyingTo === comment.id && (
              <form
                onSubmit={(e) => handleSubmit(e, comment.id)}
                className="mt-4 ml-6 border-l-2 border-gray-200 pl-4"
              >
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Напишите ответ..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                  rows={2}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="submit"
                    disabled={loading || !replyContent.trim()}
                    className="px-4 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition disabled:opacity-50"
                  >
                    Отправить
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="px-4 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            )}

            {/* Ответы на комментарий */}
            {comment.replies?.length > 0 && (
              <div className="mt-4 ml-6 space-y-3 border-l-2 border-gray-200 pl-4">
                {comment.replies.map((reply) => (
                  <div key={reply.id} className="bg-white p-3 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-semibold text-gray-900 text-sm">
                          {reply.username}
                        </span>
                        <span className="text-gray-500 text-xs ml-2">
                          {new Date(reply.created_at).toLocaleDateString(
                            "ru-RU",
                          )}
                        </span>
                      </div>
                      {currentUserId === reply.user_id && (
                        <button
                          onClick={() => handleDelete(reply.id)}
                          className="text-gray-400 hover:text-red-600 transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-gray-700 mt-1 text-sm whitespace-pre-wrap">
                      {reply.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
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
