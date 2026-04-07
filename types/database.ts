export interface LessonReaction {
  reaction_type: "understood" | "not_understood";
  user_id: string;
}

export interface Comment {
  id: string;
  lesson_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author_name?: string; // ✅ Add this
  author_avatar?: string; // ✅ Add this
  user_email?: string;
}

export interface TestResult {
  id: string;
  test_id: string;
  user_id: string;
  score: number;
  total_questions: number;
  completed_at: string;
}

export interface Lesson {
  id: string;
  category_id: string;
  name: string;
  display_name: string;
  content: string;
  order_index: number;
  created_at: string;
  lesson_reactions?: LessonReaction[];
  comments?: Comment[];
  test_results?: TestResult[];
  understood_count?: number;
  not_understood_count?: number;
  user_reaction?: "understood" | "not_understood" | null;
}
