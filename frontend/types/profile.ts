// types/profile.ts

export type CompletedCourse = {
  id: number;
  title: string;
  slug: string;
  image: string | null;
  completion_percent: number;
};

export type EquippedItem = {
  id: number;
  name: string;
  image: string;
  price: number;
  description: string | null;
};

export type PublicProfile = {
  id: number;
  username: string;
  avatar_url: string | null;
  first_name: string | null;
  last_name: string | null;
  status: string | null;
  about_me: string | null;
  created_at: string;
  token_balance: number;
  completed_courses: CompletedCourse[];
  equipped_item?: EquippedItem | null;
};

export type UserAchievementStats = {
  testsPassed75: number;
  coursesCompleted75: number;
  itemsPurchased: number;
  hasCustomAvatar: boolean;
};

export type AchievementLevel = {
  level: number;
  title: string;
  description: string;
  threshold: number;
  isCatMode?: boolean;
};

export type AchievementCategory = {
  currentLevel: AchievementLevel;
  nextLevel: AchievementLevel | null;
  progress: number;
};

export type Achievements = {
  main: AchievementCategory;
  test_destroyer: AchievementCategory;
  smart_cat: AchievementCategory;
  fashion_cat: AchievementCategory;
};
