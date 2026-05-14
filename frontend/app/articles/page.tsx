// frontend/app/articles/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import {
  Search,
  BookOpen,
  Clock,
  Filter,
  Tag,
  ChevronRight,
  Heart,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  ArrowUpDown,
} from "lucide-react";

type Article = {
  id: number;
  title: string;
  slug: string;
  topic: string;
  time_minutes: number | null;
  image: string | null;
  content: string | null;
  created_at: string;
  view_count?: number;
  likes?: number;
  dislikes?: number;
};

const TOPICS = [
  { value: "", label: "Все", icon: Filter },
  { value: "избранное", label: "Избранное", icon: Heart }, // 🔥 Новый фильтр
  { value: "продуктивность", label: "Продуктивность", icon: Tag },
  { value: "забота о себе", label: "Забота о себе", icon: Heart },
  { value: "программирование", label: "Программирование", icon: BookOpen },
  { value: "образование", label: "Образование", icon: BookOpen },
  { value: "наука", label: "Наука", icon: BookOpen },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Сначала новые" },
  { value: "oldest", label: "Сначала старые" },
];

export default function ArticlesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const searchQueryFromUrl = searchParams.get("search") || "";
  const [searchQuery, setSearchQuery] = useState(searchQueryFromUrl);
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // 🔥 Состояние избранного
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Синхронизация поиска из URL
  useEffect(() => {
    const newSearchQuery = searchParams.get("search") || "";
    setSearchQuery(newSearchQuery);
  }, [searchParams]);

  useEffect(() => {
    const topicFromUrl = searchParams.get("topic") || "";
    setSelectedTopic(topicFromUrl);
  }, [searchParams]);
  // 🔥 Загрузка избранного
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
    if (token) {
      apiFetch("/articles/favorites", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((data: { favorite_ids: number[] }) => {
          setFavorites(new Set(data.favorite_ids));
        })
        .catch(() => {});
    }
  }, []);

  // Загрузка статей + статистики
  useEffect(() => {
    async function fetchArticles() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedTopic && selectedTopic !== "Избранное") {
          params.append("topic", selectedTopic);
        }
        if (searchQuery) params.append("search", searchQuery);
        params.append("with_stats", "true");

        const queryString = params.toString();
        const url = `/articles${queryString ? `?${queryString}` : ""}`;

        const data = await apiFetch(url);
        setArticles(data);
        setFilteredArticles(data);
      } catch (err) {
        console.error("Failed to fetch articles", err);
      } finally {
        setLoading(false);
      }
    }
    fetchArticles();
  }, [selectedTopic, searchQuery]);

  // Фильтрация + сортировка на клиенте
  useEffect(() => {
    let result = [...articles];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.content?.toLowerCase().includes(query),
      );
    }

    // 🔥 Фильтр "Избранное"
    if (selectedTopic === "избранное") {
      result = result.filter((a) => favorites.has(a.id));
    } else if (selectedTopic) {
      result = result.filter((a) => a.topic === selectedTopic);
    }

    // Сортировка
    result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    setFilteredArticles(result);
  }, [articles, searchQuery, selectedTopic, sortOrder, favorites]);

  // 🔥 Переключение избранного
  const toggleFavorite = async (e: React.MouseEvent, articleId: number) => {
    e.preventDefault();
    e.stopPropagation(); // Чтобы не переходить по ссылке карточки

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login"); // Поменяй на свой путь логина
      return;
    }

    try {
      await apiFetch(`/articles/${articleId}/favorite`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      setFavorites((prev) => {
        const next = new Set(prev);
        if (next.has(articleId)) next.delete(articleId);
        else next.add(articleId);
        return next;
      });
    } catch (err) {
      console.error("❌ Failed to toggle favorite:", err);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("search", value);
    else params.delete("search");
    if (selectedTopic) {
      params.set("topic", selectedTopic);
    } else {
      params.delete("topic");
    }

    router.push(`/articles?${params.toString()}`, { scroll: false });
  };

  const formatTime = (minutes: number | null) => {
    if (!minutes) return "—";
    if (minutes < 60) return `${minutes} мин`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}ч ${m}мин` : `${h}ч`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatNumber = (num: number | undefined) => {
    if (num === undefined) return "0";
    if (num >= 1000) return (num / 1000).toFixed(1).replace(".0", "") + " тыс.";
    return num.toLocaleString("ru-RU");
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 w-full max-w-[1400px] mx-auto mt-[40px]">
      <div className="w-full mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Статьи</h1>
        <p className="text-gray-600 mt-2">
          Полезные материалы для развития и вдохновения
        </p>
      </div>

      <div className="w-full mb-8 space-y-4">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск статей..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="flex flex-wrap justify-center gap-2">
            {TOPICS.map((topic) => {
              const Icon = topic.icon;
              const isActive = selectedTopic === topic.value;
              return (
                <button
                  key={topic.value || "all"} // ← Убедись, что key есть!
                  onClick={() => {
                    setSelectedTopic(topic.value);
                    const params = new URLSearchParams(searchParams.toString());
                    if (topic.value) {
                      params.set("topic", topic.value);
                    } else {
                      params.delete("topic");
                    }
                    router.push(`/articles?${params.toString()}`, {
                      scroll: false,
                    });
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
                    isActive
                      ? "bg-gray-800 text-gray-100 shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {topic.label}
                </button>
              );
            })}
          </div>

          <div className="hidden sm:block w-px h-6 bg-gray-300" />

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-gray-500" />
            <select
              value={sortOrder}
              onChange={(e) =>
                setSortOrder(e.target.value as "newest" | "oldest")
              }
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 outline-none bg-white"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600" />
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl w-full">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchQuery || selectedTopic
              ? selectedTopic === "избранное"
                ? "В избранном пока пусто. Добавляй статьи сердечком! ❤️"
                : "Статьи не найдены. Попробуйте изменить фильтры."
              : "Статей пока нет"}
          </p>
          {(searchQuery || selectedTopic) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedTopic("");
                router.push("/articles");
              }}
              className="text-purple-600 hover:underline mt-2"
            >
              Сбросить фильтры
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 justify-between md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {filteredArticles.map((article) => (
            <Link
              key={article.id}
              href={`/articles/${article.slug}`}
              className="group block bg-white rounded-lg max-w-[430px] border border-gray-200 shadow-xs hover:border-purple-300 transition-all overflow-hidden relative"
            >
              {article.image ? (
                <div className="h-65 -mx-6 -mt-6 rounded-t-2xl overflow-hidden bg-gray-100">
                  <img
                    src={`/${article.image}`}
                    alt={article.title}
                    className="w-[120%] h-[140%] mt-[-20px] ml-[15px] object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (
                        e.target as HTMLImageElement
                      ).parentElement?.classList.add("hidden");
                    }}
                  />
                </div>
              ) : (
                <div className="h-40 -mx-6 -mt-6 rounded-t-2xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-purple-300" />
                </div>
              )}

              {/* 🔥 Кнопка Избранное */}
              <button
                onClick={(e) => toggleFavorite(e, article.id)}
                className={`absolute top-4 right-4 z-10 p-2 rounded-full transition shadow-sm ${
                  favorites.has(article.id)
                    ? "bg-red-600 text-white hover:bg-red-600"
                    : "bg-white text-gray-400 hover:text-red-500 hover:bg-white"
                }`}
                title={
                  favorites.has(article.id)
                    ? "Убрать из избранного"
                    : "Добавить в избранное"
                }
              >
                <svg
                  className={`w-5 h-5 ${favorites.has(article.id) ? "fill-current" : ""}`}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  fill={favorites.has(article.id) ? "currentColor" : "none"}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>

              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                    {article.topic}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    {formatDate(article.created_at)}
                  </span>
                </div>

                <h2 className="text-lg font-semibold text-gray-900 group-hover:text-purple-700 line-clamp-2">
                  {article.title}
                </h2>

                <div className="flex flex-wrap justify-between items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                  <div className="flex flex-row items-center">
                    <div className="flex items-center gap-1 text-xs mr-[10px] text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(article.time_minutes)}</span>
                    </div>
                    <div className="flex items-center gap-1  mr-[10px]  text-xs text-gray-500">
                      <Eye className="w-4 h-4" />
                      <span>{formatNumber(article.view_count)}</span>
                    </div>
                    {(article.likes ?? 0) > 0 && (
                      <div className="flex items-center gap-1 text-xs  mr-[10px]  text-gray-500">
                        <ThumbsUp className="w-4 h-4" />
                        <span>{formatNumber(article.likes)}</span>
                      </div>
                    )}
                    {(article.dislikes ?? 0) > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <ThumbsDown className="w-4 h-4" />
                        <span>{formatNumber(article.dislikes)}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-semibold  text-purple-600 group-hover:text-purple-700 flex items-center gap-1">
                    Читать
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading &&
        filteredArticles.length > 0 &&
        (searchQuery || selectedTopic || sortOrder !== "newest") && (
          <p className="text-center text-sm text-gray-500 mt-6">
            Показано {filteredArticles.length} из {articles.length} статей
          </p>
        )}
    </main>
  );
}
