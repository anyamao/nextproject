// frontend/components/LevelUpNotification.tsx
"use client";

import { useEffect, useState } from "react";
import { X, Trophy, Sparkles, Star } from "lucide-react";

type LevelUpNotificationProps = {
  isVisible: boolean;
  onClose: () => void;
  newLevel: string;
  oldLevel: string;
  achievementType: "test" | "course";
};

export default function LevelUpNotification({
  isVisible,
  onClose,
  newLevel,
  oldLevel,
  achievementType,
}: LevelUpNotificationProps) {
  const [animationStage, setAnimationStage] = useState(0);

  useEffect(() => {
    if (isVisible) {
      // Анимация появления
      setAnimationStage(0);
      const timer1 = setTimeout(() => setAnimationStage(1), 100);
      const timer2 = setTimeout(() => setAnimationStage(2), 300);

      // Автозакрытие через 5 секунд
      const timer3 = setTimeout(() => {
        onClose();
      }, 5000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const messages = {
    test: "🎯 Тест пройден!",
    course: "🎓 Курс завершён!",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Затемнение фона */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-500 ${
          animationStage >= 1 ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Модальное окно */}
      <div
        className={`relative bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl transform transition-all duration-500 pointer-events-auto ${
          animationStage >= 2
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-90 opacity-0 translate-y-10"
        }`}
      >
        {/* Кнопка закрытия */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Иконки */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-50 animate-pulse" />
            <div className="relative bg-gradient-to-br from-yellow-400 to-orange-500 w-24 h-24 rounded-full flex items-center justify-center shadow-lg">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-300 animate-bounce" />
            <Star className="absolute -bottom-1 -left-2 w-6 h-6 text-yellow-200 animate-pulse" />
          </div>
        </div>

        {/* Текст */}
        <div className="text-center text-white">
          <p className="text-lg font-medium mb-2 opacity-90">
            {messages[achievementType]}
          </p>

          <h2 className="text-3xl font-bold mb-2">
            {oldLevel} → {newLevel}
          </h2>

          <div className="flex items-center justify-center gap-2 mt-4">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <p className="text-sm opacity-90">Поздравляем с новым уровнем!</p>
            <Sparkles className="w-5 h-5 text-yellow-300" />
          </div>

          {/* Прогресс-бар */}
          <div className="mt-6 bg-white/20 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-1000"
              style={{ width: `${animationStage >= 2 ? 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Конфетти (упрощённое) */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-ping"
              style={{
                backgroundColor: ["#FBBF24", "#F59E0B", "#FCD34D", "#FDE68A"][
                  i % 4
                ],
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
