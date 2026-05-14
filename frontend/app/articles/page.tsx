// frontend/app/articles/page.tsx
import { Suspense } from "react"; // ← Добавь этот импорт
import ArticlesContent from "./ArticlesContent"; // ← Импорт нового компонента

// 🔥 Убери "use client" отсюда — это теперь серверный компонент!

export default function ArticlesPage() {
  return (
    <Suspense
      fallback={
        // 🔥 Простой лоадер (можно кастомизировать)
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600" />
        </main>
      }
    >
      <ArticlesContent />
    </Suspense>
  );
}
