import { Suspense } from "react";
import ResultsContent from "./ResultsContent";

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

  const returnTo = resolvedSearchParams.returnTo || null;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600" />
        </div>
      }
    >
      <ResultsContent testId={testId} returnTo={returnTo} />
    </Suspense>
  );
}
