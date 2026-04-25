"use client";

import { useState, useEffect, SyntheticEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowRight, Eye, BookmarkCheck } from "lucide-react";
import FavoriteButton from "@/ui/FavoriteButton";
import useContactStore from "@/store/states";

interface Article {
  id: string;
  slug: string;
  name: string;
  category: string;
  time: string;
  text: string;
  image: string;
  created_at: string;
  view_count: number;
}

export default function FavoritesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useContactStore();
  const supabase = createClient();

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setLoading(false);
      return;
    }

    const fetchFavoriteArticles = async () => {
      try {
        // 1. Get favorite article IDs from article_favorites table
        const { data: favorites, error: favError } = await supabase
          .from("article_favorites")
          .select("article_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (favError) throw favError;

        if (!favorites || favorites.length === 0) {
          setArticles([]);
          setLoading(false);
          return;
        }

        const articleIds = favorites.map((fav) => fav.article_id);

        const { data: articlesData, error: articlesError } = await supabase
          .from("articles")
          .select("*")
          .in("id", articleIds)
          .order("created_at", { ascending: false });

        if (articlesError) throw articlesError;

        const { data: viewCounts } = await supabase
          .from("article_views")
          .select("article_id")
          .in("article_id", articleIds);

        const viewCountMap = new Map<string, number>();
        if (viewCounts) {
          viewCounts.forEach((view) => {
            viewCountMap.set(
              view.article_id,
              (viewCountMap.get(view.article_id) || 0) + 1,
            );
          });
        }

        const articlesWithViews = (articlesData || []).map((article) => ({
          ...article,
          view_count: viewCountMap.get(article.id) || 0,
        }));

        setArticles(articlesWithViews);
      } catch (error) {
        console.error("Error fetching favorite articles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavoriteArticles();
  }, [user, isAuthenticated]);

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return null;
    const cleanPath = imagePath.replace(/^['"]|['"]$/g, "");
    if (cleanPath.startsWith("http")) return cleanPath;
    return cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  };

  const handleImageError = (e: SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget;
    img.style.display = "none";
    const placeholder = img.nextElementSibling as HTMLElement;
    if (placeholder) {
      placeholder.style.display = "flex";
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex flex-col items-center px-[10px] sm:px-[20px] py-[30px] w-full max-w-6xl mx-auto">
        <div className="text-center py-12">
          <BookmarkCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Мои статьи</h1>
          <p className="text-gray-500">
            Войдите чтобы просмотреть избранные статьи
          </p>
          <Link
            href="/login"
            className="inline-block mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Войти
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center px-[10px] sm:px-[20px] py-[30px] w-full max-w-6xl mx-auto">
        <div className="text-wrap-no flex w-full mb-6">
          <p className="bigger-text font-semibold">Мои статьи</p>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse text-gray-400">
            Загрузка избранных статей...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center px-[10px] sm:px-[20px] py-[30px] w-full max-w-6xl mx-auto">
      <div className="flex flex-row w-full items-center justify-between">
        <Link
          href="/"
          className="text-gray-600 hover:text-purple-600 transition"
        >
          <ArrowRight className="w-6 h-6 rotate-180 cursor-pointer" />
        </Link>
        <p className="bigger-text font-bold">Мои избранные</p>
        <div></div>
      </div>

      <div className="text-wrap-no flex w-full mb-8">
        <p className="bigger-text font-semibold">Мои избранные статьи</p>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm w-full">
          <BookmarkCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            У вас пока нет избранных статей
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Сохраняйте статьи, чтобы читать их позже
          </p>
          <Link
            href="/articles"
            className="inline-block mt-4 text-purple-600 hover:text-purple-700 font-medium hover:underline"
          >
            Посмотреть все статьи
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
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
                <div className="flex items-center gap-2 text-xs w-full flex-row justify-between  text-gray-400 mb-2">
                  <div className="flex  flex-row items-center   ">
                    {" "}
                    <span>📚 {article.category || "Без категории"}</span>
                    <span className="mx-[5px]">•</span>
                    <span>⏱️ {article.time || "5 мин"} чтения</span>
                  </div>
                  {/*ONLY ALTER THESE 4 LINES IN FRONTNED, ONLY THIS DIV, NOTHING ELSE*/}
                  <div className=" flex  flex-row items-center mr-[15px]">
                    <p className="text-[10px] mr-[5px]">
                      {article.view_count || 0}
                    </p>
                    <Eye className="w-[15px] h-[15px] text-gray-400"></Eye>
                  </div>
                  {/*END OF DIV FOR ALTERING, DONT ALTER ANYTHING ELSE!!!*/}
                  <FavoriteButton articleId={article.id} />
                </div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                  {article.name}
                </h2>
                <div className="mt-3 flex flex-row items-center text-purple-500 text-sm font-medium group-hover:underline">
                  <p>Читать эту статью</p>
                  <ArrowRight className=" ml-[10px] w-[15px] h-[15px]" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
