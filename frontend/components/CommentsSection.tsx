// frontend/components/CommentsSection.tsx
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
  content: string;
  parent_id: number | null;
  created_at: string;
  updated_at: string | null;
  likes: number;
  dislikes: number;
  avatar_url: string | null;
  user_reaction: "like" | "dislike" | null;
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
  const currentUser = useContactStore((state) => state.user);

  const currentUserId =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")?.id
      : null;
  const getAvatarUrl = (comment: Comment) => {
    // Если это комментарий текущего пользователя — берём свежую аватарку из store
    if (comment.user_id === currentUser?.id) {
      return currentUser.avatar_url || "default_cat.jpg";
    }
    // Иначе — аватарка из данных комментария
    return comment.avatar_url || "default_cat.jpg";
  };

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
  const handleReaction = async (
    commentId: number,
    type: "like" | "dislike",
  ) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Войдите, чтобы оценивать комментарии!");
      return;
    }

    // Если кликнул на уже выбранное — снимаем реакцию
    const comment = comments.find((c) => c.id === commentId);
    const currentReaction = comment?.user_reaction;
    const newReaction = currentReaction === type ? "none" : type;

    try {
      await apiFetch(`/comments/${commentId}/reaction`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reaction_type: newReaction }),
      });

      // Перезагружаем комментарии для обновления статистики
      const data = await apiFetch(`/${entityType}/${entityId}/comments`);
      setComments(data);
    } catch (err) {
      console.error("Failed to react to comment", err);
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
    <div className="mt-12 pt-8 border-t w-full  border-gray-200">
      <p className="font-bold bigger-text ">Комментарии</p>
      <p className="text-gray-600 ord-text mt-[10px]">
        Обсудите пройденный урок, поделитесь мнением, вопросами. Что было
        непонятно? Что бы вы улучшили?
      </p>
      {/* Форма нового комментария */}
      <form onSubmit={(e) => handleSubmit(e)} className="mb-8 ord-text">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Напишите комментарий..."
          className="w-full border border-purple-300 shadow-xs bg-white mt-[20px] rounded-xl focus:ring-2 focus:ring-purple-400 outline-none resize-none p-[10px]"
          rows={3}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !newComment.trim()}
          className="mt-3 px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50 flex smaller-text items-center gap-2"
        >
          <Send className="w-4 h-4" /> Отправить
        </button>
      </form>

      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className=" px-[10px] flex flex-row w-full ">
            {/* Шапка комментария */}
            <img
              src={`/avatars/white_cat.jpg`}
              alt={comment.username}
              className="w-[30px] h-[30px] rounded-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/avatars/default_cat.jpg";
              }}
            />
            <div className="flex flex-col w-full">
              <div className="flex flex-col ml-[10px]  w-full">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-semibold smaller-text text-gray-900">
                      {comment.username}
                    </span>
                  </div>
                  {currentUserId === comment.user_id && (
                    <div className="flex gap-2 ">
                      <button
                        onClick={() => {
                          setEditingId(comment.id);
                          setEditContent(comment.content);
                        }}
                        className="text-gray-400 hover:text-purple-600 transition"
                      >
                        <Pencil className=" w-[15px] h-[15px]" />
                      </button>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-gray-400 hover:text-red-600 transition"
                      >
                        <Trash2 className="w-[15px] h-[15px]" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Контент или режим редактирования */}
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

                {/* Футер: реакции + ответ + время */}
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
                      <ThumbsUp className="text-gray-500 w-[15px] h-[15px]"></ThumbsUp>{" "}
                      {comment.likes || 0}
                    </button>
                    <button
                      onClick={() => handleReaction(comment.id, "dislike")}
                      className={`flex items-center gap-1 text-sm transition ${
                        comment.user_reaction === "dislike"
                          ? "text-red-600 font-semibold"
                          : "text-gray-500 hover:text-red-600"
                      }`}
                    >
                      <ThumbsDown className="text-gray-500 w-[15px] h-[15px]"></ThumbsDown>{" "}
                      {comment.dislikes || 0}
                    </button>
                  </div>

                  {/* Время */}
                  <span className="text-xs text-gray-400 ml-auto">
                    {new Date(comment.created_at).toLocaleDateString("ru-RU")}
                  </span>
                </div>

                {/* Форма ответа (универсальная: и для корневых, и для вложенных) */}
                {replyingTo === comment.id && (
                  <form
                    onSubmit={(e) => handleSubmit(e, comment.id)}
                    className="mt-4 ml-6 border-l-2 border-gray-200 pl-4"
                  >
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={`Ответить @${comment.username}...`}
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
              </div>

              {/* Ответы на комментарий (рекурсивный рендеринг) */}
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
