// frontend/app/articles/[slug]/ArticleClient.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  Clock,
  Calendar,
  BookOpen,
  ChevronRight,
} from "lucide-react";
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
  image: string | null;
  created_at: string;
};

export default function ArticleClient({ article }: { article: Article }) {
  const [viewCount, setViewCount] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [topicTitle, setTopicTitle] = useState<string>("");
  const [nextArticleSlug, setNextArticleSlug] = useState<string | null>(null);
  const [articlesLoaded, setArticlesLoaded] = useState(false);

  // 🔥 Стейт для похожих статей
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    const recordView = async () => {
      const token = localStorage.getItem("token");
      if (!token || !article.slug) return;
      try {
        await apiFetch(`/articles/${article.slug}/view`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {}
    };
    recordView();
  }, [article.slug]);

  useEffect(() => {
    if (!article.id) return;
    const fetchViews = async () => {
      try {
        const data = await apiFetch(
          `/articles/${article.slug}/views?t=${Date.now()}`,
          { cache: "no-store" },
        );
        setViewCount(data.view_count);
      } catch {}
    };
    fetchViews();
  }, [article.id, article.slug]);

  useEffect(() => {
    async function loadTopicAndNextArticle() {
      try {
        const articles: Array<{
          id: number;
          slug: string;
          topic: string;
          title: string;
        }> = await apiFetch("/articles");

        const currentArticle = articles.find((a) => a.slug === article.slug);
        if (currentArticle) {
          setTopicTitle(currentArticle.topic);
          document.title = `${currentArticle.topic}: ${article.title} | MaoSchool`;
        }

        const sameTopic = articles
          .filter((a) => a.topic === article.topic)
          .sort((a, b) => a.id - b.id);

        const currentIndex = sameTopic.findIndex((a) => a.id === article.id);

        if (currentIndex !== -1 && currentIndex < sameTopic.length - 1) {
          setNextArticleSlug(sameTopic[currentIndex + 1].slug);
        } else {
          setNextArticleSlug(null);
        }
        setArticlesLoaded(true);
      } catch (err) {
        setTopicTitle(article.topic);
        setNextArticleSlug(null);
        setArticlesLoaded(true);
      }
    }

    if (article?.id && article?.slug) {
      loadTopicAndNextArticle();
    }
  }, [article?.id, article?.slug, article.topic]);

  // 🔥 Загрузка похожих статей (последние 4 в той же теме)
  useEffect(() => {
    async function fetchRelatedArticles() {
      if (!article.topic) return;
      setLoadingRelated(true);
      try {
        // Загружаем статьи темы
        const allInTopic = await apiFetch(
          `/articles?topic=${encodeURIComponent(article.topic)}`,
        );

        // Фильтруем текущую, сортируем по дате (новые сверху), берём 4
        const related = allInTopic
          .filter((a: Article) => a.slug !== article.slug)
          .sort(
            (a: Article, b: Article) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          )
          .slice(0, 4);

        setRelatedArticles(related);
      } catch (err) {
        console.error("❌ Failed to load related articles:", err);
      } finally {
        setLoadingRelated(false);
      }
    }

    fetchRelatedArticles();
  }, [article.topic, article.slug]);

  // 🔥 Форматирование даты
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
    });
  };

  return (
    <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 w-full max-w-[1000px] mx-auto gap-6">
      <div className="flex-1 w-full items-center justify-center">
        <div className="flex flex-row items-center text-gray-500 max-w-[400px] whitespace-nowrap overflow-x-auto smaller-text mb-[15px] font-semibold">
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

        <div className="w-full flex flex-col md:flex-row items-center justify-between">
          <div className="w-full ">
            <Link
              href={`/articles?topic=${encodeURIComponent(article.topic)}`}
              className="text-black hover:text-purple-600 transition flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Все статьи в теме</span>
            </Link>
          </div>
          <div className="w-full justify-end">
            <div className="flex flex-row items-center w-full justify-end">
              <div className="flex flex-row items-center mt-[5px] mr-[15px]"></div>
              <h1 className="bigger-text font-bold text-gray-900">
                {article.title}
              </h1>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center mb-[40px] w-full mt-[15px] justify-between">
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

          <div className="h-[50px] mt-[10px] md:mt-[0px] items-center flex flex-row ">
            <span className="px-3 py-1 bg-purple-100 h-[30px] text-purple-700 text-sm rounded-full font-medium">
              {article.topic}
            </span>
            <Calendar className="w-[15px] text-gray-500 mx-[5px] h-[15px]" />
            <span className="smaller-text">
              {new Date(article.created_at).toLocaleDateString("ru-RU")}
            </span>
          </div>
        </div>

        {article.content ? (
          <article
            className="prose prose-purple max-w-none w-full text-gray-800 lesson-content-root"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        ) : (
          <p className="text-gray-500 italic">Контент скоро появится</p>
        )}
      </div>

      <div className="flex flex-col  w-full flex items-center justify-center">
        <div className="flex flex-row items-center mt-[20px] justify-between">
          {article.id && <ArticleStats slug={article.slug} />}
        </div>
      </div>
      {/* 🔥 БЛОК "ПОХОЖИЕ СТАТЬИ" - с изображениями */}
      {!loadingRelated && relatedArticles.length > 0 && (
        <div className="w-full mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              Похожие статьи
            </h2>
            <Link
              href={`/articles?topic=${encodeURIComponent(article.topic.toLowerCase())}`}
              className="text-purple-600 text-sm font-medium hover:text-purple-700 transition flex items-center gap-1"
            >
              Все статьи в теме
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedArticles.map((rel) => (
              <Link
                key={rel.id}
                href={`/articles/${rel.slug}`}
                className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-purple-300 transition-all duration-300"
              >
                {/* 🔥 Изображение статьи (если есть) */}
                {rel.image && (
                  <div className="h-32 bg-gray-100 overflow-hidden">
                    <img
                      src={`/${rel.image}`}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                      {rel.topic}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(rel.created_at)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm group-hover:text-purple-700 line-clamp-2 min-h-[40px]">
                    {rel.title}
                  </h3>
                  <div className="mt-3 flex items-center text-xs text-purple-600 font-medium">
                    Читать
                    <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      {article.id && (
        <div className="mt-8 w-full">
          <CommentsSection articleId={article.id} />
        </div>
      )}
    </main>
  );
}
