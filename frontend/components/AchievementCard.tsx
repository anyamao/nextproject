// frontend/components/AchievementCard.tsx
"use client";

import { Trophy, Lock, CheckCircle } from "lucide-react";

type AchievementCardProps = {
  icon: string;
  title: string;
  description: string;
  color: string;
  currentLevel: number;
  nextLevel: number | null;
  progress: number;
  isUnlocked: boolean;
};

export default function AchievementCard({
  icon,
  title,
  description,
  color,
  currentLevel,
  nextLevel,
  progress,
  isUnlocked,
}: AchievementCardProps) {
  return (
    <div className={`p-4 rounded-xl border ${color} bg-white shadow-sm`}>
      <div className="flex items-start gap-3">
        {/* Иконка */}
        <div
          className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white text-lg font-bold`}
        >
          {icon}
        </div>

        {/* Контент */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            {isUnlocked ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <Lock className="w-4 h-4 text-gray-400" />
            )}
          </div>

          <p className="text-sm text-gray-600 mt-1">{description}</p>

          {/* Прогресс бар */}
          {nextLevel && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Уровень {currentLevel}</span>
                <span>
                  До {nextLevel}: {100 - progress}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${color.replace("bg-", "bg-").replace("-500", "-500")} rounded-full transition-all`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
