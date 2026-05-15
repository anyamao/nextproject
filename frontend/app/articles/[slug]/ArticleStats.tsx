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

  useEffect(() => {
    if (!slug) return;

    const fetchStats = async () => {
      try {
        setLoading(true);

        const data = await apiFetch(`/articles/${slug}/stats`);

        setViews(data.view_count ?? 0);
        setLikes(data.likes ?? 0); // ← Добавь это
        setDislikes(data.dislikes ?? 0); // ← И это
        setMyReaction(data.user_reaction); // ← И это
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [slug]);

  const handleReaction = async (type: "like" | "dislike") => {
    const token = localStorage.getItem("token");
    if (!token) {
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

      const data = await apiFetch(`/articles/${slug}/stats`);

      setLikes(data.likes ?? 0);
      setDislikes(data.dislikes ?? 0);
      setMyReaction(data.user_reaction);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-6 border-t border-b border-gray-200 mt-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => handleReaction("like")}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 cursor-pointer  rounded-full  transition-all ${
            myReaction === "like"
              ? "bg-gray-800 text-gray-100 "
              : "bg-white  text-gray-600 hover:bg-gray-50"
          }`}
        >
          <ThumbsUp className="w-4 h-4" />
          <span className="font-bold">{likes}</span>
        </button>

        <button
          onClick={() => handleReaction("dislike")}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 cursor-pointer rounded-full transition-all ${
            myReaction === "dislike"
              ? "bg-gray-800 text-gray-100"
              : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <ThumbsDown className="w-4 h-4" />
          <span className="font-bold">{dislikes}</span>
        </button>
      </div>

      <div className="flex items-center gap-2 text-gray-500">
        <Eye className="w-4 h-4" />
        <span className="text-sm font-medium">
          {(views ?? 0).toLocaleString("ru-RU")}
        </span>
      </div>
    </div>
  );
}
