// frontend/app/articles/[slug]/ArticleClient.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, Clock, Calendar } from "lucide-react";
import { apiFetch } from "@/lib/api";
import ArticleStats from "./ArticleStats";
import CommentsSection from "@/components/CommentsSection";
import CopyLinkButton from "@/components/LinkButton";

type Article = {
  id: number;
  title: string;
  topic: string;
  slug: string;
  content: string | null;
  time_minutes: number | null;
  created_at: string;
};

export default function ArticleClient({ article }: { article: Article }) {
  const [viewCount, setViewCount] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ✅ Для хлебных крошек и "Следующей статьи"
  const [topicTitle, setTopicTitle] = useState<string>("");
  const [nextArticleSlug, setNextArticleSlug] = useState<string | null>(null);
  const [articlesLoaded, setArticlesLoaded] = useState(false);

  // 🔍 Проверка авторизации
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  // 👁️ Записать просмотр
  useEffect(() => {
    const recordView = async () => {
      const token = localStorage.getItem("token");
      if (!token || !article.slug) return;
      try {
        await apiFetch(`/articles/${article.slug}/view`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("✅ View request sent");
      } catch (err) {
        console.log("ℹ️ View not recorded");
      }
    };
    recordView();
  }, [article.slug]);

  // 👁️ Загрузить счётчик просмотров
  useEffect(() => {
    if (!article.id) return;
    const fetchViews = async () => {
      try {
        const data = await apiFetch(
          `/articles/${article.slug}/views?t=${Date.now()}`,
          {
            cache: "no-store",
          },
        );
        setViewCount(data.view_count);
      } catch {
        console.log("ℹ️ Could not fetch view count");
      }
    };
    fetchViews();
  }, [article.id, article.slug]);

  // ✅ Загрузка темы и следующей статьи
  useEffect(() => {
    async function loadTopicAndNextArticle() {
      try {
        // 1️⃣ Загружаем все статьи для получения названия темы и поиска следующей
        const articles: Array<{
          id: number;
          slug: string;
          topic: string;
          title: string;
        }> = await apiFetch("/articles");

        // Находим текущую статью
        const currentArticle = articles.find((a) => a.slug === article.slug);
        if (currentArticle) {
          setTopicTitle(currentArticle.topic);
          document.title = `${currentArticle.topic}: ${article.title} | MaoSchool`;
        }

        // Фильтруем статьи по той же теме и сортируем по id
        const sameTopic = articles
          .filter((a) => a.topic === article.topic)
          .sort((a, b) => a.id - b.id);

        const currentIndex = sameTopic.findIndex((a) => a.id === article.id);

        if (currentIndex !== -1 && currentIndex < sameTopic.length - 1) {
          // ✅ Есть следующая статья в этой теме!
          setNextArticleSlug(sameTopic[currentIndex + 1].slug);
        } else {
          // ❌ Это последняя статья в теме
          setNextArticleSlug(null);
        }
        setArticlesLoaded(true);
      } catch (err) {
        console.error("Failed to load topic/next article", err);
        setTopicTitle(article.topic);
        setNextArticleSlug(null);
        setArticlesLoaded(true);
      }
    }

    if (article?.id && article?.slug) {
      loadTopicAndNextArticle();
    }
  }, [article?.id, article?.slug, article.topic]);

  return (
    <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 w-full max-w-[1000px] mx-auto gap-6">
      <div className="flex-1 w-full items-center justify-center">
        {/* 🍞 Хлебные крошки: Статьи / Тема / */}
        <div className="flex flex-row items-center text-gray-500 smaller-text mb-[15px] font-semibold">
          <Link className="hover:underline" href="/articles">
            Статьи /
          </Link>
          <Link
            className="hover:underline "
            href={`/articles?topic=${encodeURIComponent(article.topic)}`}
          >
            {topicTitle || article.topic} /
          </Link>
        </div>

        {/* Заголовок + просмотры */}
        <div className="w-full flex flex-row items-center justify-between">
          <Link
            href={`/articles?topic=${encodeURIComponent(article.topic)}`}
            className="text-black hover:text-purple-600 transition flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Все статьи в теме</span>
          </Link>

          <div className="flex flex-row items-center">
            <div className="flex flex-row items-center mt-[5px] mr-[15px]"></div>
            <h1 className="bigger-text font-bold text-gray-900">
              {article.title}
            </h1>
          </div>
        </div>

        {/* Панель: Поделиться + время */}
        <div className="flex flex-row items-center mb-[40px] w-full mt-[15px] justify-between">
          <div className="flex flex-row items-center bg-white h-[50px] px-[10px] rounded-lg shadow-sm border-[1px] border-gray-200">
            <div className="flex flex-row items-center px-[7px] py-[3px] min-w-[90px]">
              <p className="smaller-text text-gray-600">Поделиться</p>
              <CopyLinkButton variant="icon" />
            </div>
            {article.time_minutes && (
              <div className="flex flex-row items-center border-l-[1px] border-gray-300">
                <p className="text-gray-600 pl-[10px] text-sm">
                  ~{article.time_minutes} минут
                </p>
                <Clock className="w-[15px] h-[15px] text-gray-600 ml-[5px]" />
              </div>
            )}
          </div>

          {/* Пустой блок для сохранения выравнивания (нет теста) */}
          <div className="h-[50px] items-center flex flex-row ">
            <span className="px-3 py-1 bg-purple-100 h-[30px] text-purple-700 text-sm rounded-full font-medium">
              {article.topic}
            </span>
            <Calendar className="w-[15px] text-gray-500 mx-[5px] h-[15px]" />
            <span className="smaller-text">
              {new Date(article.created_at).toLocaleDateString("ru-RU")}
            </span>
          </div>
        </div>

        {/* Мета-информация */}

        {/* Контент статьи */}
        {article.content ? (
          <article
            className="prose prose-purple max-w-none w-full text-gray-800 lesson-content-root"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        ) : (
          <p className="text-gray-500 italic">Контент скоро появится</p>
        )}
      </div>

      {/* Нижняя панель: реакции + следующая статья */}
      <div className="flex flex-col  w-full flex items-center justify-center">
        <div className="flex flex-row items-center mt-[20px] justify-between">
          {article.id && <ArticleStats slug={article.slug} />}
        </div>
      </div>

      {article.id && (
        <div className="mt-8 w-full">
          <CommentsSection articleId={article.id} />
        </div>
      )}
    </main>
  );
}
