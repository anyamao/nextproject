import { Suspense } from "react";
import ArticlesContent from "./ArticlesContent";

export default function ArticlesPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600" />
        </main>
      }
    >
      <ArticlesContent />
    </Suspense>
  );
}
