// frontend/app/articles/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Tag, Search } from "lucide-react";
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
  "Забота о себе",
  "Программирование",
  "Продуктивность",
  "Образование",
  "Наука",
];

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [activeTopic, setActiveTopic] = useState("Все");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Загрузка статей с бэкенда
  useEffect(() => {
    async function fetchArticles() {
      setLoading(true);
      try {
        // ✅ Формируем параметры запроса
        const params = new URLSearchParams();
        if (activeTopic !== "Все") {
          params.append("topic", activeTopic);
        }
        if (searchQuery.trim()) {
          params.append("search", searchQuery.trim());
        }

        const queryString = params.toString();
        const url = `/articles${queryString ? `?${queryString}` : ""}`;

        const data = await apiFetch(url);
        setArticles(data);
      } catch (err) {
        console.error("Failed to fetch articles", err);
      } finally {
        setLoading(false);
      }
    }
    fetchArticles();
  }, [activeTopic, searchQuery]); // ✅ Перезагружаем при изменении фильтров

  // 🔍 Локальная фильтрация для мгновенного отклика (опционально)
  useEffect(() => {
    let result = articles;

    // Фильтр по теме (если бэкенд не справился)
    if (activeTopic !== "Все") {
      result = result.filter((a) => a.topic === activeTopic);
    }

    // Поиск по названию (если бэкенд не справился)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((a) => a.title.toLowerCase().includes(query));
    }

    setFilteredArticles(result);
  }, [articles, activeTopic, searchQuery]);

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

      {/* 🔍 Поиск + Фильтр по темам */}
      <div className="w-full mb-8 space-y-4">
        {/* Поисковая строка */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск статей..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Кнопки тем */}
        <div className="flex flex-wrap justify-center gap-2">
          {TOPICS.map((topic) => (
            <button
              key={topic}
              onClick={() => setActiveTopic(topic)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
                activeTopic === topic
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {topic === "Все" ? <Tag className="w-4 h-4" /> : null}
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* 📰 Список статей */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-200 border-t-purple-600" />
        </div>
      ) : filteredArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {filteredArticles.map((article) => (
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
          <p className="text-gray-500">
            {searchQuery || activeTopic !== "Все"
              ? "Статьи не найдены. Попробуйте изменить фильтры."
              : "Статей пока нет"}
          </p>
          {(searchQuery || activeTopic !== "Все") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveTopic("Все");
              }}
              className="text-purple-600 hover:underline mt-2"
            >
              Сбросить фильтры
            </button>
          )}
        </div>
      )}

      {/* 💡 Инфо о фильтрации */}
      {!loading && (searchQuery || activeTopic !== "Все") && (
        <p className="text-center text-sm text-gray-500 mt-6">
          Показано {filteredArticles.length} из {articles.length} статей
        </p>
      )}
    </main>
  );
}
