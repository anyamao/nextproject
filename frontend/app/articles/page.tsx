// frontend/app/articles/page.tsx
"use client";

import { useState, useEffect, SyntheticEvent } from "react";
import Link from "next/link";
import { ArrowRight, Eye } from "lucide-react";
// import FavoriteButton from "@/ui/FavoriteButton"; // Закомментируй пока

interface Article {
  id: number; // 🔁 Теперь int, а не string
  slug: string;
  name: string;
  category: string;
  time: string;
  text: string;
  image: string | null;
  created_at: string;
  view_count: number;
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch("http://localhost:8010/api/articles");

        if (!response.ok) {
          throw new Error("Failed to fetch articles");
        }

        const data = await response.json();
        setArticles(data.articles);
      } catch (error) {
        console.error("Error fetching articles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const getImageUrl = (imagePath: string | null) => {
    if (!imagePath) return null;
    const cleanPath = imagePath.replace(/^['"]|['"]$/g, "");
    if (cleanPath.startsWith("http")) return cleanPath;
    return cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  };

  const getPreview = (text: string) => {
    if (!text) return "";
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const preview = sentences.slice(0, 2).join(". ");
    return preview.length > 150
      ? preview.slice(0, 150) + "..."
      : preview + (preview ? "." : "");
  };

  const handleImageError = (e: SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget;
    img.style.display = "none";
    const placeholder = img.nextElementSibling as HTMLElement;
    if (placeholder) {
      placeholder.style.display = "flex";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-gray-400">Загрузка статей...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Статьи</h1>
      <p className="text-gray-500 mb-8">Полезные материалы для учёбы и жизни</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/articles/${article.slug}`}
            className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 block"
          >
            <div className="relative h-48 bg-gray-100 overflow-hidden">
              {getImageUrl(article.image) ? (
                <img
                  src={getImageUrl(article.image)!}
                  alt={article.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={handleImageError}
                />
              ) : null}
              <div
                className="w-full h-full flex items-center justify-center text-gray-400"
                style={{
                  display: getImageUrl(article.image) ? "none" : "flex",
                }}
              >
                📖
              </div>
              <span className="absolute top-3 left-3 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                {article.category || "Статья"}
              </span>
            </div>

            <div className="p-4">
              <div className="flex items-center gap-2 text-xs w-full flex-row justify-between text-gray-400 mb-2">
                <div className="flex flex-row items-center">
                  <span>📚 {article.category || "Без категории"}</span>
                  <span className="mx-[5px]">•</span>
                  <span>⏱️ {article.time || "5 мин"} чтения</span>
                </div>
                <div className="flex flex-row items-center mr-[15px]">
                  <p className="text-[10px] mr-[5px]">
                    {article.view_count || 0}
                  </p>
                  <Eye className="w-[15px] h-[15px] text-gray-400" />
                </div>
                {/* <FavoriteButton articleId={article.id} /> */}{" "}
                {/* Закомментируй пока */}
              </div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                {article.name}
              </h2>
              <div className="mt-3 flex flex-row items-center text-purple-500 text-sm font-medium group-hover:underline">
                <p>Читать эту статью</p>
                <ArrowRight className="ml-[10px] w-[15px] h-[15px]" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {articles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">Статьи пока не добавлены</p>
        </div>
      )}
    </div>
  );
}
