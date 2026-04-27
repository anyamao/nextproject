// frontend/app/articles/[slug]/ArticleClient.tsx
"use client";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import ArticleStats from "./ArticleStats"; // ✅ Импортируй компонент
import { useEffect } from "react";
type Article = {
  title: string;
  topic: string;
  slug: string;
  content: string | null;
  time_minutes: number | null;
  created_at: string;
};

export default function ArticleClient({ article }: { article: Article }) {
  useEffect(() => {
    const recordView = async () => {
      const token = localStorage.getItem("token");
      if (!token) return; // Не записываем для гостей

      try {
        // Проверяем, не записывали ли уже в этой сессии (оптимизация)
        const sessionKey = `viewed_article_${article.slug}`;
        if (sessionStorage.getItem(sessionKey)) {
          return;
        }

        await apiFetch(`/articles/${article.slug}/view`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Помечаем, что уже записали
        sessionStorage.setItem(sessionKey, "true");

        console.log("✅ Article view recorded");
      } catch (err) {
        console.log("ℹ️ View not recorded:", err);
      }
    };

    recordView();
  }, [article.slug]);

  return (
    <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 w-full max-w-3xl mx-auto">
      <Link
        href="/articles"
        className="text-gray-600 hover:text-purple-600 transition flex items-center gap-2 mb-6 self-start"
      >
        <ArrowLeft className="w-5 h-5" /> Все статьи
      </Link>

      <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full mb-4 font-medium">
        {article.topic}
      </span>

      <h1 className="text-3xl font-bold text-gray-900 mb-4">{article.title}</h1>

      <div className="flex items-center gap-4 text-gray-500 text-sm mb-8">
        {article.time_minutes && (
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" /> ~{article.time_minutes} мин
          </span>
        )}
        <span>{new Date(article.created_at).toLocaleDateString("ru-RU")}</span>
      </div>

      {article.content ? (
        <article
          className="prose prose-purple max-w-none w-full text-gray-800"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      ) : (
        <p className="text-gray-500 italic">Контент скоро появится</p>
      )}

      {/* 👍👎👁️ Статистика и реакции */}
      <ArticleStats slug={article.slug} />
    </main>
  );
}
