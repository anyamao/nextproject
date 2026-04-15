// app/articles/[slug]/page.tsx
import ArticlesClient from "./ArticlesClient";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server"; // ← правильный импорт для Server Component

type Article = {
  id: string;
  slug: string;
  name: string;
  category: string;
  time: string;
  text: string;
  image: string;
  created_at: string;
  clear_count: number;
  unclear_count: number;
};

export async function generateStaticParams() {
  // Для generateStaticParams нужно использовать fetch или прямой запрос
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/articles?select=slug`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return [{ slug: "example-article" }];
    }

    const articles = await res.json();

    if (!articles || articles.length === 0) {
      return [{ slug: "example-article" }];
    }

    return articles.map((article: { slug: string }) => ({
      slug: article.slug,
    }));
  } catch (error) {
    console.error("❌ generateStaticParams error:", error);
    return [{ slug: "example-article" }];
  }
}
export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  const supabase = await createClient();

  const { data: article, error } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !article) {
    notFound();
  }

  // ✅ ДОБАВЛЯЕМ image в formattedArticle
  const formattedArticle = {
    id: article.id,
    title: article.name,
    content: article.text,
    description: article.category,
    estimated_minutes: parseInt(article.time) || 5,
    clear_count: article.clear_count || 0,
    unclear_count: article.unclear_count || 0,
    slug: article.slug,
    image: article.image, // ← ЭТО КЛЮЧЕВОЕ ПОЛЕ!
  };

  return (
    <ArticlesClient
      initialArticle={formattedArticle}
      initialSlug={slug}
      params={{ slug }}
    />
  );
}
