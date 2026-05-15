import { Suspense } from "react";
import CoursesContent from "./CourseContent";

export default function CoursesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 w-full max-w-[1100px] mx-auto mt-[40px]">
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600" />
          </div>
        </div>
      }
    >
      <CoursesContent />
    </Suspense>
  );
}
