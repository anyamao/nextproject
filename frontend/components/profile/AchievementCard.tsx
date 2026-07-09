// components/profile/AchievementCard.tsx

"use client";

import { Check } from "lucide-react";
import type { AchievementCategory } from "@/types/profile";

interface AchievementCardProps {
  category: AchievementCategory;
  title: string;
  color: string;
  nextText: string;
}

export function AchievementCard({
  category,
  title,
  color,
  nextText,
}: AchievementCardProps) {
  const bgColor = `bg-${color}-500`;
  const lightBg = `bg-${color}-200`;
  const textColor = `text-${color}-800`;
  const lightText = `text-${color}-100`;

  return (
    <div className={`${bgColor} rounded-lg p-4`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">
            {category.currentLevel.title}
          </h3>
          <div
            className={`flex flex-row items-center ${lightBg} rounded-lg p-2 px-3 mt-2`}
          >
            <p className={`${textColor} text-sm`}>
              {category.currentLevel.description}
            </p>
            <Check className={`w-4 h-4 ${textColor} ml-2`} />
          </div>
        </div>
      </div>

      {category.nextLevel && (
        <div className="mt-4">
          <div
            className={`flex justify-between text-xs font-semibold ${lightText} mb-1`}
          >
            <span>До {category.nextLevel.title}</span>
          </div>
          <p className={`text-xs ${lightText} mt-2`}>{nextText}</p>
        </div>
      )}
    </div>
  );
}
