// frontend/lib/achievements.ts

export type AchievementRule = {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji или название иконки
  color: string; // Tailwind класс для цвета
  levels: AchievementLevel[];

  // 🔥 Добавь эти опциональные свойства для основного уровня:
  courseCompletionThreshold?: number; // после скольких курсов переход в "Кот"
  catLevels?: AchievementLevel[]; // уровни для режима "Кот"
};

export type AchievementLevel = {
  level: number;
  threshold: number; // сколько нужно для этого уровня
  title: string; // например "Котенок 3lv"
  description: string;
};

// 🔹 Правила для основного уровня (Котенок → Кот)
export const MAIN_LEVEL_RULE: AchievementRule = {
  id: "main_level",
  name: "Уровень кота",
  description: "Развивайся, проходя тесты и курсы!",
  icon: "🐱",
  color: "bg-purple-500",
  levels: [
    {
      level: 1,
      threshold: 0,
      title: "Котенок 1lv",
      description: "Зарегистрируйся. Теперь ты котик!",
    },
    {
      level: 2,
      threshold: 1,
      title: "Котенок 2lv",
      description: "Пройди 1 тест на 75%",
    },
    {
      level: 3,
      threshold: 3,
      title: "Котенок 3lv",
      description: "Пройди 3 теста на 75%",
    },
    {
      level: 4,
      threshold: 9,
      title: "Котенок 4lv",
      description: "Пройди 9 тестов на 75%",
    },
    {
      level: 5,
      threshold: 18,
      title: "Котенок 5lv",
      description: "Пройди 18 тестов на 75%",
    },
    // Далее +9 тестов за уровень
    {
      level: 6,
      threshold: 36,
      title: "Котенок 6lv",
      description: "Пройди 36 тестов на 75%",
    },
    {
      level: 7,
      threshold: 45,
      title: "Котенок 7lv",
      description: "Пройди 45 тестов на 75%",
    },
    {
      level: 8,
      threshold: 54,
      title: "Котенок 8lv",
      description: "Пройди 54 теста на 75%",
    },
  ],
  courseCompletionThreshold: 1,
  catLevels: [
    {
      level: 1,
      threshold: 1,
      title: "Кот 1 уровня",
      description: "Пройди 1 курс на 75%",
    },
    {
      level: 2,
      threshold: 2,
      title: "Кот 2 уровня",
      description: "Пройди 2 курса на 75%",
    },
    {
      level: 3,
      threshold: 3,
      title: "Кот 3 уровня",
      description: "Пройди 3 курса на 75%",
    },
    {
      level: 4,
      threshold: 4,
      title: "Кот 4 уровня",
      description: "Пройди 4 курса на 75%",
    },
    {
      level: 5,
      threshold: 5,
      title: "Кот 5 уровня",
      description: "Пройди 5 курсов на 75%",
    },
    {
      level: 6,
      threshold: 6,
      title: "Кот 6 уровня",
      description: "Пройди 6 курсов на 75%",
    },
  ],
};

// 🔹 Уничтожитель тестов — каждый тест = уровень, начиная с 0:
export const TEST_DESTROYER_RULE: AchievementRule = {
  id: "test_destroyer",
  name: "Уничтожитель тестов",
  description: "Проходи тесты на 75% и выше!",
  icon: "🎯",
  color: "bg-emerald-500",
  levels: Array.from({ length: 20 }, (_, i) => ({
    level: i, // ← Было: i + 1, стало: i (уровни 0, 1, 2...)
    threshold: i, // ← Было: (i+1)*5 или i+1, стало: i (0 тестов = уровень 0)
    title: i === 0 ? "Уничтожитель тестов 0lv" : `Уничтожитель тестов ${i}lv`,
    description:
      i === 0
        ? "Пройди первый тест на 75%"
        : `Пройди ${i} тест${i === 1 ? "" : i < 5 ? "а" : "ов"} на 75%`,
  })),
};

// 🔹 Умный кот — каждый курс = уровень, начиная с 0:
export const SMART_CAT_RULE: AchievementRule = {
  id: "smart_cat",
  name: "Умный кот",
  description: "Завершай курсы на 75% и выше!",
  icon: "🧠",
  color: "bg-blue-500",
  levels: Array.from({ length: 10 }, (_, i) => ({
    level: i, // ← Уровни 0, 1, 2...
    threshold: i, // ← 0 курсов = уровень 0
    title: i === 0 ? "Умный кот 0lv" : `Умный кот ${i}lv`,
    description:
      i === 0
        ? "Заверши первый курс на 75%"
        : `Заверши ${i} курс${i === 1 ? "" : i < 5 ? "а" : "ов"} на 75%`,
  })),
};

// 🔹 Модный котик — каждая покупка = уровень, начиная с 0:
export const FASHION_CAT_RULE: AchievementRule = {
  id: "fashion_cat",
  name: "Модный котик",
  description: "Покупай украшения в магазине!",
  icon: "🎀",
  color: "bg-pink-500",
  levels: [
    {
      level: 0,
      threshold: 0,
      title: "Модный котик 0lv",
      description: "Сделай первую покупку",
    },
    {
      level: 1,
      threshold: 1,
      title: "Модный котик 1lv",
      description: "Купи 1 товар",
    },
    {
      level: 2,
      threshold: 2,
      title: "Модный котик 2lv",
      description: "Купи 2 товара",
    },
    ...Array.from({ length: 8 }, (_, i) => ({
      level: i + 3,
      threshold: i + 3,
      title: `Модный котик ${i + 3}lv`,
      description: `Купи ${i + 3} товаров`,
    })),
  ],
};
// 🔹 Все правила в одном месте
export const ACHIEVEMENT_RULES: Record<string, AchievementRule> = {
  main_level: MAIN_LEVEL_RULE,
  test_destroyer: TEST_DESTROYER_RULE,
  smart_cat: SMART_CAT_RULE,
  fashion_cat: FASHION_CAT_RULE,
};

// 🔹 Утилита: рассчитать текущий уровень по правилу
export function calculateLevel(
  rule: AchievementRule,
  currentValue: number,
  isCatMode: boolean = false,
): {
  currentLevel: AchievementLevel;
  nextLevel: AchievementLevel | null;
  progress: number; // 0-100%
} {
  // 🔥 Выбираем правильную таблицу уровней
  const levels = isCatMode && rule.catLevels ? rule.catLevels : rule.levels;

  // Находим текущий уровень (последний, где threshold <= currentValue)
  let current = levels[0];
  for (const level of levels) {
    if (currentValue >= level.threshold) {
      current = level;
    } else {
      break;
    }
  }

  // Находим следующий уровень
  const currentIndex = levels.findIndex((l) => l.level === current.level);
  const nextLevel =
    currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;

  // Рассчитываем прогресс
  let progress = 100;
  if (nextLevel) {
    const range = nextLevel.threshold - current.threshold;
    if (range > 0) {
      const progressValue =
        Math.min(currentValue, nextLevel.threshold) - current.threshold;
      progress = Math.min(100, Math.round((progressValue / range) * 100));
    }
  }
  return {
    currentLevel: current,
    nextLevel,
    progress,
  };
}

// 🔹 Утилита: проверить, достиг ли пользователь нового уровня
export function checkNewAchievement(
  rule: AchievementRule,
  oldValue: number,
  newValue: number,
): AchievementLevel | null {
  const { currentLevel } = calculateLevel(rule, newValue);
  const { currentLevel: oldLevel } = calculateLevel(rule, oldValue);

  if (currentLevel.level > oldLevel.level) {
    return currentLevel;
  }
  return null;
}
