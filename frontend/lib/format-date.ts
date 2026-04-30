// frontend/lib/format-date.ts

export function formatTimeAgo(isoString: string | null): string {
  if (!isoString) return "никогда";

  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "никогда"; // ✅ Защита от невалидной даты

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "сегодня";
  if (diffDays === 1) return "вчера";
  if (diffDays < 7) return `${diffDays} дн. назад`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} нед. назад`;

  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}
