// frontend/components/AchievementCard.tsx
"use client";

import { Check, Lock } from "lucide-react";

type AchievementCardProps = {
  icon: string;
  title: string;
  description: string;
  color: string;

  // 🔥 Новые пропсы для уровней:
  currentLevelTitle: string; // "Умный кот 1lv"
  nextLevelTitle: string | null; // "Умный кот 2lv" или null
  progress: number; // 0-100%
  nextMessage: string; // "Пройдите ещё 1 курс на 75%"
  isUnlocked: boolean;
};

export default function AchievementCard({
  icon,
  title,
  description,
  color,
  currentLevelTitle,
  nextLevelTitle,
  progress,
  nextMessage,
  isUnlocked,
}: AchievementCardProps) {
  return (
    <div className={`p-4 rounded-xl   bg-white shadow-sm`}>
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{currentLevelTitle}</h3>
            {isUnlocked ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Lock className="w-4 h-4 text-gray-400" />
            )}
          </div>

          <p className="text-sm text-gray-600 mt-1">{description}</p>

          {/* Прогресс до следующего уровня */}
          {nextLevelTitle && progress < 100 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>До {nextLevelTitle}</span>
                <span>{100 - progress}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${color.replace("bg-", "bg-")} rounded-full transition-all`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{nextMessage}</p>
            </div>
          )}

          {/* Если уровень максимален */}
          {!nextLevelTitle && (
            <p className="text-xs text-green-600 mt-2 font-medium">
              ✅ Максимальный уровень достигнут!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
