// frontend/components/FlashcardSession.tsx
"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import {
  X,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  CheckCircle,
  ArrowLeft as ArrowBack,
} from "lucide-react";

type Flashcard = {
  id: number;
  front: string;
  back: string;
  hint?: string | null;
  example?: string | null;
  user_progress?: {
    next_review: string | null;
    interval_days: number;
    ease_factor: number;
    repetitions: number;
  } | null;
};

type FlashcardDeck = {
  id: number;
  title: string;
  description: string | null;
  lesson_id: number;
  card_count: number;
  cards: Flashcard[];
  due_count: number;
  new_count: number;
  mastered_count: number;
};

interface FlashcardSessionProps {
  lessonId: number;
  onClose: () => void;
}

export default function FlashcardSession({
  lessonId,
  onClose,
}: FlashcardSessionProps) {
  const [deck, setDeck] = useState<FlashcardDeck | null>(null);
  const [queue, setQueue] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false); // 🔥 Для анимации завершения

  // Загружаем колоду
  useEffect(() => {
    async function fetchDeck() {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const data = await apiFetch(`/lessons/${lessonId}/flashcards`, {
          headers,
        });
        setDeck(data);

        // Фильтруем карточки: новые + те, что пора повторить
        const studyQueue = data.cards.filter((c: Flashcard) => {
          if (!c.user_progress) return true;
          const nextReview = c.user_progress.next_review;
          return !nextReview || new Date(nextReview) <= new Date();
        });

        setQueue(studyQueue);
        console.log(
          `🗂️ [Flashcards] Loaded ${studyQueue.length} cards for study`,
        );
      } catch (err) {
        console.error("❌ Failed to load flashcards", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDeck();
  }, [lessonId]);

  const currentCard = queue[currentIndex];
  const progress =
    queue.length > 0 ? Math.round((currentIndex / queue.length) * 100) : 0;
  const isLastCard = currentIndex === queue.length - 1;

  // 🔹 Переход к следующей карточке
  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      if (currentIndex < queue.length - 1) {
        setCurrentIndex((i) => i + 1);
      }
    }, 150);
  };

  // 🔹 Завершение сессии
  const handleComplete = () => {
    setIsCompleting(true);
    setIsFlipped(false);

    // 🔥 Небольшая задержка для анимации, затем закрываем
    setTimeout(() => {
      onClose();
    }, 800);
  };

  // 🔹 Переход к предыдущей карточке
  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      if (currentIndex > 0) {
        setCurrentIndex((i) => i - 1);
      }
    }, 150);
  };

  // 🔹 Переворот карточки
  const handleFlip = () => {
    if (!isFlipped) setIsFlipped(true);
    if (isFlipped) setIsFlipped(false);
  };

  // 🔹 Возврат к уроку (досрочное закрытие)
  const handleReturnToLesson = () => {
    // 🔥 Можно добавить сохранение прогресса здесь
    onClose();
  };

  // 🔹 Обработка клавиш ← → / Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.code === "Space") {
        e.preventDefault(); // 🔥 Чтобы страница не скроллилась
        handleFlip();
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        isLastCard ? handleComplete() : handleNext();
      }
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") handleReturnToLesson();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, queue.length, isLastCard, isFlipped]);

  // 🔹 Экран завершения с анимацией
  if (isCompleting) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center z-50 p-4">
        <div className="text-center animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Отличная работа! 🎉
          </h3>
          <p className="text-gray-600 mb-6">
            Вы повторили {queue.length} карточ
            {queue.length % 10 === 1 && queue.length % 100 !== 11
              ? "у"
              : queue.length % 10 >= 2 &&
                  queue.length % 10 <= 4 &&
                  (queue.length % 100 < 10 || queue.length % 100 >= 20)
                ? "и"
                : "ек"}
          </p>
          <p className="text-sm text-gray-500">Возвращаемся к уроку...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Загружаем карточки...</p>
        </div>
      </div>
    );
  }

  if (!deck || queue.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <RotateCw className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Карточки закончились! 🎉
          </h3>
          <p className="text-gray-600 mb-6">
            {deck?.mastered_count
              ? `Вы выучили ${deck.mastered_count} карточек в этой колоде.`
              : "Добавьте новые карточки или вернитесь позже."}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition"
          >
            Вернуться к уроку
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-100   flex items-center justify-center z-50 p-4 pt-[100px]">
      <div className="w-full max-w-2xl">
        {/* 🔝 Заголовок + кнопка "Вернуться к уроку" */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleReturnToLesson}
            className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition px-3 py-2 rounded-lg hover:bg-purple-50"
            title="Вернуться к уроку (Esc)"
          >
            <ArrowBack className="w-4 h-4" />
            <span className="text-sm font-medium">Вернуться к уроку</span>
          </button>

          <div className="text-right">
            <p className="text-gray-600 text-sm">
              Карточка {currentIndex + 1} из {queue.length}
            </p>
          </div>

          <button
            onClick={handleReturnToLesson}
            className="p-2 text-gray-400 hover:text-gray-600 transition rounded-lg hover:bg-gray-100"
            title="Закрыть (Esc)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 📊 Прогресс-бар */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Прогресс сессии</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 🎮 Навигация: стрелки ← → (или "Завершить" на последней) */}
        <div className="flex items-center justify-between mb-4 px-2">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`p-3 rounded-xl transition flex items-center gap-2 ${
              currentIndex === 0
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
            }`}
            title="Предыдущая карточка (←)"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">Назад</span>
          </button>

          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="p-3 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition"
            title="Перевернуть карточку"
          >
            <RotateCw
              className={`w-5 h-5 transition-transform duration-300 ${isFlipped ? "rotate-180" : ""}`}
            />
          </button>

          {/* 🔥 Кнопка меняется на последней карточке */}
          {isLastCard ? (
            <button
              onClick={handleComplete}
              className="p-3 rounded-xl transition flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white shadow-md"
              title="Завершить повторение (→)"
            >
              <span className="text-sm font-medium hidden sm:inline">
                Завершить
              </span>
              <CheckCircle className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="p-3 rounded-xl transition flex items-center gap-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50"
              title="Следующая карточка (→)"
            >
              <span className="text-sm font-medium hidden sm:inline">
                Далее
              </span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 🗂️ Карточка с анимацией переворота */}
        <div
          className={`relative w-full aspect-[4/3] [perspective:1000px] cursor-pointer select-none ${
            isFlipped ? "flipped" : ""
          }`}
          onClick={handleFlip}
        >
          <div
            className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${
              isFlipped ? "[transform:rotateY(180deg)]" : ""
            }`}
          >
            {/* 🔹 Лицевая сторона (вопрос) */}
            <div className="absolute inset-0 [backface-visibility:hidden] bg-white rounded-3xl shadow-xl border-2 border-purple-100 p-8 flex flex-col items-center justify-center text-center">
              <p className="text-2xl font-medium text-gray-900 mb-4">
                {currentCard.front}
              </p>
              {currentCard.hint && (
                <p className="text-sm text-gray-500 italic">
                  💡 {currentCard.hint}
                </p>
              )}
              <p className="absolute bottom-6 text-xs text-gray-400">
                ← Нажмите или используйте стрелки →
              </p>
            </div>

            {/* 🔹 Обратная сторона (ответ) */}
            <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-white rounded-3xl shadow-xl border-2 border-purple-200 p-8 flex flex-col items-center justify-center text-center">
              <p className="text-2xl font-semibold text-purple-800 mb-2">
                {currentCard.back}
              </p>
              <p className="ord-text font-semibold text-gray-600 mb-4">
                {currentCard.front}
              </p>

              {currentCard.example && (
                <p className="text-sm text-gray-600 italic  border-purple-300  py-2">
                  "{currentCard.example}"
                </p>
              )}
              <p className="absolute bottom-6 text-xs text-gray-400">
                ← Нажмите или используйте стрелки →
              </p>
            </div>
          </div>
        </div>

        {/* 💡 Подсказка по управлению */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <span className="hidden sm:inline">← → клавиши для навигации •</span>
          <span>
            Клик по карточке или пробел для переворота • Esc для возврата к
            уроку
          </span>
        </div>
      </div>
    </div>
  );
}
