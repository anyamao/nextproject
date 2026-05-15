import { ACHIEVEMENT_RULES, calculateLevel } from "@/lib/achievements";

export type UserStats = {
  testsPassed75: number;
  coursesCompleted75: number;
  itemsPurchased: number;
  hasCustomAvatar: boolean;
};

export function getAchievements(stats: UserStats) {
  const isCatMode = stats.coursesCompleted75 >= 1;
  const mainValue = isCatMode ? stats.coursesCompleted75 : stats.testsPassed75;

  const mainResult = calculateLevel(
    ACHIEVEMENT_RULES.main_level,
    mainValue,
    isCatMode,
  );

  const testResult = calculateLevel(
    ACHIEVEMENT_RULES.test_destroyer,
    stats.testsPassed75,
  );

  const smartResult = calculateLevel(
    ACHIEVEMENT_RULES.smart_cat,
    stats.coursesCompleted75,
  );

  const fashionResult = calculateLevel(
    ACHIEVEMENT_RULES.fashion_cat,
    stats.itemsPurchased,
  );

  return {
    main: {
      ...mainResult,
      isCatMode,
      icon: isCatMode ? "😺" : "🐱",
      rule: ACHIEVEMENT_RULES.main_level,
    },
    test_destroyer: {
      ...testResult,
      icon: "🎯",
      rule: ACHIEVEMENT_RULES.test_destroyer,
    },
    smart_cat: {
      ...smartResult,
      icon: "🧠",
      rule: ACHIEVEMENT_RULES.smart_cat,
    },
    fashion_cat: {
      ...fashionResult,
      icon: "🎀",
      rule: ACHIEVEMENT_RULES.fashion_cat,
    },
  };
}
