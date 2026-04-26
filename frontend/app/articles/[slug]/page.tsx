// frontend/app/articles/[slug]/page.tsx

import ArticlesClient from "./ArticlesClient";
import { notFound } from "next/navigation";

// Тип статьи (должен совпадать с бэкендом)
type Article = {
  id: number;
  slug: string;
  name: string;
  category: string;
  time: string;
  text: string;
  image: string | null;
  created_at: string;
  view_count: number;
};

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // 🔁 Fetch к твоему FastAPI бэкенду
  const res = await fetch(`http://localhost:8010/api/articles/${slug}`, {
    cache: "no-store", // Не кешируем, чтобы видеть изменения сразу
  });

  // Статья не найдена
  if (res.status === 404) {
    notFound();
  }

  // Ошибка сервера
  if (!res.ok) {
    console.error("Failed to fetch article:", await res.text());
    notFound();
  }

  const article: Article = await res.json();

  // Форматируем для ArticlesClient (сохраняем совместимость)
  const formattedArticle = {
    id: article.id.toString(), // ArticlesClient ожидает string
    title: article.name,
    content: article.text,
    description: article.category,
    estimated_minutes: parseInt(article.time) || 5,
    clear_count: 0, // Пока заглушка, потом добавим эндпоинты
    unclear_count: 0,
    slug: article.slug,
    image: article.image || "",
    view_count: article.view_count,
  };

  return (
    <ArticlesClient
      initialArticle={formattedArticle}
      initialSlug={slug}
      params={{ slug }}
    />
  );
}
