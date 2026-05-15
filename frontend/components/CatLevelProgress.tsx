"use client";

import { Trophy, PawPrint, Star, Sparkles, Target } from "lucide-react";

type CatLevel = {
  level: number;
  title: string;
  description: string;
  requiredCourses: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
};

const catLevels: CatLevel[] = [
  {
    level: 0,
    title: "Котёнок 🐱",
    description: "Выбрать аватарку",
    requiredCourses: 0,
    icon: <PawPrint className="w-5 h-5" />,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-300",
  },
  {
    level: 1,
    title: "Котик 🐈",
    description: "Пройдите 1 курс на 75%",
    requiredCourses: 1,
    icon: <Star className="w-5 h-5" />,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-300",
  },
  {
    level: 2,
    title: "Кот 1 уровня 🐈‍⬛",
    description: "Пройдите 2 курса",
    requiredCourses: 2,
    icon: <Sparkles className="w-5 h-5" />,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-300",
  },
  {
    level: 3,
    title: "Кот 2 уровня 🐾",
    description: "Пройдите 3 курса",
    requiredCourses: 3,
    icon: <Target className="w-5 h-5" />,
    color: "text-cyan-600",
    bgColor: "bg-cyan-100",
    borderColor: "border-cyan-300",
  },
  {
    level: 4,
    title: "Кот 3 уровня 🎯",
    description: "Пройдите 5 курсов",
    requiredCourses: 5,
    icon: <Trophy className="w-5 h-5" />,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
    borderColor: "border-emerald-300",
  },
  {
    level: 5,
    title: "Кот 4 уровня 👑",
    description: "Пройдите 7 курсов",
    requiredCourses: 7,
    icon: <Trophy className="w-5 h-5" />,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    borderColor: "border-amber-300",
  },
  {
    level: 6,
    title: "Кот 5 уровня 🌟",
    description: "Пройдите 10 курсов",
    requiredCourses: 10,
    icon: <Sparkles className="w-5 h-5" />,
    color: "text-rose-600",
    bgColor: "bg-rose-100",
    borderColor: "border-rose-300",
  },
  {
    level: 7,
    title: "Кот 6 уровня 🔥",
    description: "Пройдите 13 курсов",
    requiredCourses: 13,
    icon: <Sparkles className="w-5 h-5" />,
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
    borderColor: "border-indigo-300",
  },
  {
    level: 8,
    title: "Кот 7 уровня 💫",
    description: "Пройдите 16 курсов",
    requiredCourses: 16,
    icon: <Sparkles className="w-5 h-5" />,
    color: "text-fuchsia-600",
    bgColor: "bg-fuchsia-100",
    borderColor: "border-fuchsia-300",
  },
  {
    level: 9,
    title: "Кот 8 уровня 👑",
    description: "Пройдите 20 курсов",
    requiredCourses: 20,
    icon: <Trophy className="w-5 h-5" />,
    color: "text-amber-700",
    bgColor: "bg-amber-100",
    borderColor: "border-amber-400",
  },
  {
    level: 10,
    title: "Легендарный кот 🦁",
    description: "Пройдите 25+ курсов",
    requiredCourses: 25,
    icon: <Trophy className="w-5 h-5" />,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    borderColor: "border-yellow-400",
  },
];

interface CatLevelProgressProps {
  completedCoursesCount: number;
  hasAvatar: boolean;
}

export default function CatLevelProgress({
  completedCoursesCount,
  hasAvatar,
}: CatLevelProgressProps) {
  const getCurrentLevel = () => {
    if (!hasAvatar) return 0;
    for (let i = catLevels.length - 1; i >= 0; i--) {
      if (completedCoursesCount >= catLevels[i].requiredCourses) {
        return catLevels[i].level;
      }
    }
    return 0;
  };

  const currentLevel = getCurrentLevel();
  const currentLevelData = catLevels[currentLevel];

  const nextLevel = catLevels[currentLevel + 1];
  const progressToNext = nextLevel
    ? Math.min(
        100,
        Math.round(
          ((completedCoursesCount - currentLevelData.requiredCourses) /
            (nextLevel.requiredCourses - currentLevelData.requiredCourses)) *
            100,
        ),
      )
    : 100;

  return (
    <div className="p-6 mb-8 w-full flex flex-col justify-center">
      <div className="flex items-center bg-pink-200 rounded-lg p-[10px] px-[20px] gap-2 mb-4">
        <h2 className="text-lg font-bold text-pink-900">Точки роста кота</h2>
      </div>

      <div className="flex items-center justify-center w-full">
        <div className="text-center bg-yellow-400 w-[200px] rounded-lg mb-6">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${currentLevelData.bgColor} ${currentLevelData.borderColor} border-2 mb-3`}
          >
            {currentLevelData.icon}
            <span className={`font-bold ${currentLevelData.color}`}>
              {currentLevelData.title}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {currentLevelData.description}
          </p>
        </div>
      </div>

      {nextLevel && (
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>До {nextLevel.title}</span>
            <span>
              {completedCoursesCount} / {nextLevel.requiredCourses} курсов
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${progressToNext}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Осталось{" "}
            {Math.max(0, nextLevel.requiredCourses - completedCoursesCount)}{" "}
            курсов
          </p>
        </div>
      )}

      <div>
        <p className="text-xs font-medium text-gray-500 mb-3">Все уровни:</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {catLevels.map((level) => {
            const isUnlocked = level.level <= currentLevel;
            const isCurrent = level.level === currentLevel;

            return (
              <div
                key={level.level}
                className={`relative p-2 rounded-xl text-center transition-all ${
                  isUnlocked
                    ? level.bgColor + " opacity-100"
                    : "bg-gray-50 opacity-50"
                } ${isCurrent ? "ring-2 ring-purple-400 shadow-md" : ""}`}
              >
                {isUnlocked ? (
                  <>
                    <div className="flex justify-center mb-1">
                      <div className={level.color}>{level.icon}</div>
                    </div>
                    <p
                      className={`text-xs font-medium ${isUnlocked ? level.color : "text-gray-400"}`}
                    >
                      {level.title.split(" ")[0]}
                      {level.title.split(" ")[1] && (
                        <span className="text-[10px]">
                          {" "}
                          {level.title.split(" ")[1]}
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {level.requiredCourses > 0
                        ? `${level.requiredCourses} курс`
                        : "Старт"}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex justify-center mb-1">
                      <div className="text-gray-400">
                        <PawPrint className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-xs font-medium text-gray-400">
                      {level.title.split(" ")[0]}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {level.requiredCourses} курс
                    </p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {nextLevel && (
        <div className="mt-4 pt-3 border-t border-purple-200 text-center">
          <p className="text-xs text-purple-600">
            {progressToNext === 100
              ? "🎉 Поздравляем! Вы достигли нового уровня!"
              : `✨ Осталось ${Math.max(0, nextLevel.requiredCourses - completedCoursesCount)} ${getCourseWord(nextLevel.requiredCourses - completedCoursesCount)} до следующего уровня!`}
          </p>
        </div>
      )}
    </div>
  );
}

function getCourseWord(count: number): string {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return "курсов";
  if (lastDigit === 1) return "курс";
  if (lastDigit >= 2 && lastDigit <= 4) return "курса";
  return "курсов";
}
