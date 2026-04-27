// frontend/app/articles/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Tag } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Article = {
  id: number;
  title: string;
  slug: string;
  topic: string;
  time_minutes: number | null;
  image: string | null;
};

const TOPICS = [
  "Все",
  "забота о себе",
  "продуктивность",
  "технологии",
  "лайфхаки",
  "мотивация",
];

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [activeTopic, setActiveTopic] = useState("Все");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const query =
          activeTopic === "Все"
            ? ""
            : `?topic=${encodeURIComponent(activeTopic)}`;
        const data = await apiFetch(`/articles${query}`);
        setArticles(data);
      } catch (err) {
        console.error("Failed to fetch articles", err);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [activeTopic]);

  return (
    <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 w-full max-w-5xl mx-auto">
      <div className="w-full mb-6">
        <Link
          href="/"
          className="text-gray-600 hover:text-purple-600 transition flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" /> На главную
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Статьи</h1>
        <p className="text-gray-600 mt-2">
          Полезные материалы для развития и вдохновения
        </p>
      </div>

      {/* 🔍 Фильтр по темам */}
      <div className="flex flex-wrap gap-2 mb-8">
        {TOPICS.map((topic) => (
          <button
            key={topic}
            onClick={() => setActiveTopic(topic)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              activeTopic === topic
                ? "bg-purple-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {topic === "Все" ? <Tag className="w-4 h-4 inline mr-1" /> : null}
            {topic}
          </button>
        ))}
      </div>

      {/* 📰 Список статей */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-200 border-t-purple-600" />
        </div>
      ) : articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/articles/${article.slug}`}
              className="group block p-5 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all"
            >
              <span className="inline-block px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-md mb-3 font-medium">
                {article.topic}
              </span>
              <h2 className="text-lg font-semibold text-gray-900 group-hover:text-purple-700 line-clamp-2">
                {article.title}
              </h2>
              {article.time_minutes && (
                <div className="flex items-center gap-1 text-gray-500 text-sm mt-3">
                  <Clock className="w-3 h-3" /> {article.time_minutes} мин
                </div>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-2xl w-full">
          <p className="text-gray-500">Статей по этой теме пока нет</p>
        </div>
      )}
    </main>
  );
}
