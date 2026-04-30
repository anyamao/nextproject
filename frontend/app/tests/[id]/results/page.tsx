// frontend/app/tests/[id]/results/page.tsx
// 🚫 БЕЗ "use client" — это серверный компонент!

import { Suspense } from "react";
import ResultsContent from "./ResultsContent"; // ✅ Импортируем клиентский компонент

export default async function TestResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const testId = parseInt(resolvedParams.id, 10);

  // 🔍 Получаем returnTo из URL-параметров
  const returnTo = resolvedSearchParams.returnTo || null;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600" />
        </div>
      }
    >
      {/* ✅ Передаём testId и returnTo как обычные props */}
      <ResultsContent testId={testId} returnTo={returnTo} />
    </Suspense>
  );
}
