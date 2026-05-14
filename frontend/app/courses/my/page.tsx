import { Suspense } from "react";
import MyCoursesContent from "./MyCoursesContent";

export default function MyCoursesPage() {
  return (
    <Suspense
      fallback={
        // 🔥 Простой лоадер (можно изменить)
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600" />
        </main>
      }
    >
      <MyCoursesContent />
    </Suspense>
  );
}
