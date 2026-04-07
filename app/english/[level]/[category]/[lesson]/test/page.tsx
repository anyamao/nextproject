// ✅ generateStaticParams for static export
export async function generateStaticParams() {
  return [{ level: "a2", category: "people", lesson: "grammar" }];
}

import TestClient from "./TestClient";

// ✅ Make the component async and await params
export default async function TestPage({
  params,
}: {
  params: Promise<{ level: string; category: string; lesson: string }>;
}) {
  // ✅ Await the params Promise
  const { level, category, lesson } = await params;

  // Now pass the resolved values to client component
  return <TestClient level={level} category={category} lessonName={lesson} />;
}
