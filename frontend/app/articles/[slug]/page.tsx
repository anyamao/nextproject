// frontend/app/articles/[slug]/page.tsx
import ArticleClient from "./ArticleClient";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  try {
    const article = await apiFetch(`/articles/${slug}`);
    return <ArticleClient article={article} />;
  } catch {
    notFound();
  }
}
