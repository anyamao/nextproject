// frontend/app/articles/[slug]/ArticleStats.tsx
"use client";

import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, Eye } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function ArticleStats({ slug }: { slug: string }) {
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [views, setViews] = useState(0);
  const [myReaction, setMyReaction] = useState<"like" | "dislike" | null>(null);
  const [loading, setLoading] = useState(false);

  // Загрузка статистики
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiFetch(`/articles/${slug}/stats`);
        setLikes(data.likes);
        setDislikes(data.dislikes);
        setViews(data.views);
        setMyReaction(data.user_reaction);
      } catch (err) {
        console.error("Failed to fetch stats");
      }
    };
    fetchStats();
  }, [slug]);

  // Обработчик реакции
  const handleReaction = async (type: "like" | "dislike") => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Войдите, чтобы оценивать статьи!");
      return;
    }

    const newReaction = myReaction === type ? "none" : type;

    setLoading(true);
    try {
      await apiFetch(`/articles/${slug}/reaction`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reaction_type: newReaction }),
      });

      // Перезагружаем статистику
      const data = await apiFetch(`/articles/${slug}/stats`);
      setLikes(data.likes);
      setDislikes(data.dislikes);
      setMyReaction(data.user_reaction);
    } catch (err) {
      console.error("Reaction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-6 border-t border-b border-gray-200 mt-8">
      {/* 👍👎 Реакции */}
      <div className="flex items-center gap-4">
        <p className="text-sm font-medium text-gray-500 mr-2">
          Понравилась статья?
        </p>

        <button
          onClick={() => handleReaction("like")}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
            myReaction === "like"
              ? "bg-green-100 border-green-300 text-green-700 shadow-sm"
              : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <ThumbsUp className="w-4 h-4" />
          <span className="font-bold">{likes}</span>
        </button>

        <button
          onClick={() => handleReaction("dislike")}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
            myReaction === "dislike"
              ? "bg-red-100 border-red-300 text-red-700 shadow-sm"
              : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <ThumbsDown className="w-4 h-4" />
          <span className="font-bold">{dislikes}</span>
        </button>
      </div>

      {/* 👁️ Просмотры */}
      <div className="flex items-center gap-2 text-gray-500">
        <Eye className="w-4 h-4" />
        <span className="text-sm font-medium">
          {views.toLocaleString("ru-RU")} прочтений
        </span>
      </div>
    </div>
  );
}
