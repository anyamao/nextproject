// app/languages/[language]/[level]/page.tsx
import Link from "next/link";
import {
  ArrowLeft,
  Lock,
  BookOpen,
  CheckCircle,
  Clock,
  Trophy,
} from "lucide-react";
import { notFound } from "next/navigation";

type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon?: string | null;
  display_order: number;
  lessons_count?: number;
  is_completed?: boolean;
};

type DbCategory = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string | null;
};
type Level = {
  id: string;
  code: string;
  name: string;
};

// A1 Categories - 18 essential topics for beginner English
const A1_CATEGORIES = [
  {
    slug: "greetings-introductions",
    name: "Greetings & Introductions",
    description: "Learn to say hello, introduce yourself, and meet new people",
    icon: "👋",
    order: 1,
  },
  {
    slug: "personal-information",
    name: "Personal Information",
    description:
      "Talk about your name, age, nationality, and where you're from",
    icon: "📝",
    order: 2,
  },
  {
    slug: "numbers-counting",
    name: "Numbers & Counting",
    description: "Master numbers 1-100, phone numbers, and prices",
    icon: "🔢",
    order: 3,
  },
  {
    slug: "colors-shapes",
    name: "Colors & Shapes",
    description: "Describe objects by their colors and basic shapes",
    icon: "🎨",
    order: 4,
  },
  {
    slug: "family-friends",
    name: "Family & Friends",
    description: "Talk about your family members and relationships",
    icon: "👨‍👩‍👧‍👦",
    order: 5,
  },
  {
    slug: "daily-routines",
    name: "Daily Routines",
    description: "Describe your everyday activities and schedule",
    icon: "⏰",
    order: 6,
  },
  {
    slug: "food-drinks",
    name: "Food & Drinks",
    description: "Order food, talk about meals, and discuss preferences",
    icon: "🍕",
    order: 7,
  },
  {
    slug: "shopping-money",
    name: "Shopping & Money",
    description: "Buy things, ask about prices, and handle transactions",
    icon: "🛒",
    order: 8,
  },
  {
    slug: "time-dates",
    name: "Time & Dates",
    description: "Tell time, talk about days, months, and dates",
    icon: "📅",
    order: 9,
  },
  {
    slug: "weather-seasons",
    name: "Weather & Seasons",
    description: "Discuss the weather and different seasons",
    icon: "🌤️",
    order: 10,
  },
  {
    slug: "home-living",
    name: "Home & Living",
    description: "Describe your house, rooms, and furniture",
    icon: "🏠",
    order: 11,
  },
  {
    slug: "city-places",
    name: "City & Places",
    description: "Navigate the city and talk about important locations",
    icon: "🏙️",
    order: 12,
  },
  {
    slug: "transportation",
    name: "Transportation",
    description: "Use buses, trains, taxis, and ask for directions",
    icon: "🚇",
    order: 13,
  },
  {
    slug: "hobbies-free-time",
    name: "Hobbies & Free Time",
    description: "Talk about your interests and leisure activities",
    icon: "🎮",
    order: 14,
  },
  {
    slug: "work-jobs",
    name: "Work & Jobs",
    description: "Discuss professions, workplaces, and daily tasks",
    icon: "💼",
    order: 15,
  },
  {
    slug: "health-body",
    name: "Health & Body",
    description: "Talk about body parts, health, and visiting a doctor",
    icon: "🏥",
    order: 16,
  },
  {
    slug: "animals-nature",
    name: "Animals & Nature",
    description: "Describe animals, pets, and the natural world",
    icon: "🐶",
    order: 17,
  },
  {
    slug: "travel-directions",
    name: "Travel & Directions",
    description: "Ask for and give directions, travel vocabulary",
    icon: "🗺️",
    order: 18,
  },
];

export const dynamic = "force-static";

export async function generateStaticParams() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const fallback = [
    { language: "english", level: "a1" },
    { language: "english", level: "a2" },
    { language: "spanish", level: "a1" },
  ];

  if (!supabaseUrl || !supabaseKey) return fallback;

  try {
    // Fetch all language-level combinations
    const res = await fetch(`${supabaseUrl}/rest/v1/languages?select=slug`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    });
    if (!res.ok) return fallback;
    const langs = await res.json();

    const levels = ["a1", "a2", "b1", "b2", "c1"];
    const params = [];

    for (const lang of langs) {
      for (const level of levels) {
        params.push({ language: lang.slug, level });
      }
    }

    return params.length > 0 ? params : fallback;
  } catch {
    return fallback;
  }
}

export default async function LevelCategoriesPage({
  params,
}: {
  params: Promise<{ language: string; level: string }>;
}) {
  const { language: langSlug, level: levelSlug } = await params;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // 1. Fetch language info
  const langRes = await fetch(
    `${supabaseUrl}/rest/v1/languages?select=id,slug,name,icon&slug=eq.${encodeURIComponent(langSlug)}`,
    {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    },
  );
  const language = (await langRes.json())?.[0];
  if (!language) notFound();

  // 2. Fetch level info
  const levelRes = await fetch(
    `${supabaseUrl}/rest/v1/levels?select=id,code,name&code=eq.${levelSlug.toUpperCase()}`,
    {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    },
  );
  const level: Level = (await levelRes.json())?.[0];
  if (!level) notFound();

  // 3. Fetch categories from database (if any exist)

  // Fetch categories from database (if any exist)
  const categoriesRes = await fetch(
    `${supabaseUrl}/rest/v1/categories?select=id,slug,name,description,icon&order=display_order`,
    {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    },
  );
  const dbCategoriesRaw = await categoriesRes.json();

  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbCategories: any[] = Array.isArray(dbCategoriesRaw)
    ? dbCategoriesRaw
    : [];

  // Merge database categories with fallback A1 categories
  const categories: Category[] = A1_CATEGORIES.map((cat, index) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbCat = dbCategories.find((c: any) => c.slug === cat.slug);

    return {
      id: dbCat?.id || `temp-${index}`,
      slug: cat.slug,
      name: cat.name,
      description: cat.description,
      icon: dbCat?.icon || cat.icon,
      display_order: cat.order,
      lessons_count: 17,
      is_completed: index < 3,
    };
  });

  // Mock progress
  const completedCount = categories.filter((c) => c.is_completed).length;
  const progressPercent = Math.round(
    (completedCount / categories.length) * 100,
  );

  return (
    <main className="flex-1 flex flex-col items-center px-[10px] sm:px-[20px] py-[30px] w-full min-h-full max-w-5xl mx-auto">
      <div className="w-full mb-8">
        <div className="flex items-center justify-between">
          <Link
            href={`/languages/${langSlug}`}
            className="text-gray-600 hover:text-purple-600 transition"
          >
            <ArrowLeft className="w-6 h-6 cursor-pointer" />
          </Link>
          <div className="text-center">
            <h1 className="text-2xl font-bold">
              {language.name} — {level.code}
            </h1>
            <p className="text-sm text-gray-600">{level.name}</p>
          </div>
          <div className="w-6"></div>
        </div>

        {/* Progress Bar */}
      </div>

      {/* Categories Roadmap */}
      <div className="relative w-full">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-300 via-purple-500 to-indigo-300 hidden sm:block" />

        <div className="space-y-6">
          {categories.map((category, index) => {
            const isCompleted = category.is_completed || false;
            const isLocked = index > 0 && !categories[index - 1].is_completed;
            const isNext = index === completedCount;

            return (
              <div
                key={category.id}
                className="relative flex items-start gap-4 sm:gap-6"
              >
                {/* Category indicator */}
                <div className="relative z-10 flex-shrink-0">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl border-[1px] transition-all text-purple-600 shadow-lg bg-purple-200 border-purple-400 
                    `}
                  ></div>
                  {/* Order number */}
                  <div className="absolute -bottom-1 -right-1 bg-white border-2 border-purple-300 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold text-purple-600 shadow">
                    {index + 1}
                  </div>
                </div>

                {/* Category card */}
                <Link
                  href={`/languages/${langSlug}/${levelSlug}/${category.slug}`}
                  className={`flex-1 p-5 rounded-xl border-2 transition-all group  bg-white border-gray-300 
                  `}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-800 group-hover:text-purple-700 transition-colors">
                          {category.name}
                        </h3>
                      </div>

                      <p className="text-gray-600 text-sm mb-3">
                        {category.description}
                      </p>

                      {/* Stats */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {category.lessons_count} уроков
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />~
                          {Math.floor(category.lessons_count! * 15)} мин
                        </span>
                        <span className="flex items-center gap-1">
                          <Trophy className="w-4 h-4" />
                          {Math.floor(category.lessons_count! / 2)} теста
                        </span>
                      </div>
                    </div>

                    {/* Arrow/Lock */}
                    <div className="flex-shrink-0">
                      <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                  {/* Mini progress for in-progress category */}
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Completion Badge */}
      {completedCount === categories.length && (
        <div className="mt-12 p-8 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-2xl text-white text-center shadow-2xl">
          <Trophy className="w-16 h-16 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">
            🎉 Уровень {level.code} завершён!
          </h3>
          <p className="opacity-90 mb-4">
            Вы освоили все {categories.length} тем уровня {level.code}!
          </p>
          <Link
            href={`/languages/${langSlug}`}
            className="inline-block bg-white text-orange-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
          >
            Перейти к следующему уровню →
          </Link>
        </div>
      )}
    </main>
  );
}
