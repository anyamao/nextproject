"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import useContactStore from "@/store/states";
import { apiFetch } from "@/lib/api";

type Course = {
  id: number;
  title: string;
  slug: string;
  category: string | null;
};

type Article = {
  id: number;
  title: string;
  slug: string;
  topic: string;
};

function NavigationPanel() {
  const { navigationState, toggleNavigation } = useContactStore();
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const [activeItem, setActiveItem] = useState<"courses" | "articles" | null>(
    null,
  );

  // Данные из API
  const [courses, setCourses] = useState<Course[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingArticles, setLoadingArticles] = useState(true);

  // Группировка курсов по категориям
  const [groupedCourses, setGroupedCourses] = useState<
    Record<string, Course[]>
  >({});

  // Группировка статей по темам (topic)
  const [groupedArticles, setGroupedArticles] = useState<
    Record<string, Article[]>
  >({});

  // Загрузка курсов из API (существующий эндпоинт)
  useEffect(() => {
    async function fetchCourses() {
      try {
        const data = await apiFetch("/courses/subjects");
        setCourses(data);

        // Группируем курсы по категориям
        const grouped: Record<string, Course[]> = {};
        data.forEach((course: Course) => {
          const category = course.category || "Другие";
          if (!grouped[category]) {
            grouped[category] = [];
          }
          grouped[category].push(course);
        });
        setGroupedCourses(grouped);
      } catch (err) {
        console.error("Failed to fetch courses for navigation:", err);
      } finally {
        setLoadingCourses(false);
      }
    }

    fetchCourses();
  }, []);

  // Загрузка статей из API (существующий эндпоинт)
  useEffect(() => {
    async function fetchArticles() {
      try {
        const data = await apiFetch("/articles");
        setArticles(data);

        // Группируем статьи по темам (topic)
        const grouped: Record<string, Article[]> = {};
        data.forEach((article: Article) => {
          const topic = article.topic || "Другие";
          if (!grouped[topic]) {
            grouped[topic] = [];
          }
          grouped[topic].push(article);
        });
        setGroupedArticles(grouped);
      } catch (err) {
        console.error("Failed to fetch articles for navigation:", err);
      } finally {
        setLoadingArticles(false);
      }
    }

    fetchArticles();
  }, []);

  // Handle animation on open/close
  useEffect(() => {
    if (navigationState) {
      setShouldRender(true);
      setIsAnimatingOut(false);
      setTimeout(() => {
        setIsAnimatingIn(true);
      }, 10);
    } else if (shouldRender) {
      setIsAnimatingIn(false);
      setIsAnimatingOut(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsAnimatingOut(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [navigationState, shouldRender]);

  if (!shouldRender) return null;

  // Получаем список категорий, в которых есть хотя бы один курс
  const availableCourseCategories = Object.keys(groupedCourses).filter(
    (cat) => groupedCourses[cat]?.length > 0,
  );

  // Получаем список тем, в которых есть хотя бы одна статья
  const availableArticleTopics = Object.keys(groupedArticles).filter(
    (topic) => groupedArticles[topic]?.length > 0,
  );

  return (
    <main>
      <div className="fixed inset-0 z-40">
        {/* Затемнение фона */}
        <div
          className={`absolute inset-0 bg-black/50 transition-all duration-300 ${
            isAnimatingOut
              ? "opacity-0"
              : isAnimatingIn
                ? "opacity-100"
                : "opacity-0"
          }`}
          onClick={toggleNavigation}
        />

        {/* Панель навигации - выезжает сверху */}
        <div
          className={`absolute top-0 left-0 mt-[10px] right-0 bg-white shadow-lg z-50 transition-all duration-300 ${
            isAnimatingOut
              ? "-translate-y-full opacity-0"
              : isAnimatingIn
                ? "translate-y-0 opacity-100"
                : "-translate-y-full opacity-0"
          }`}
        >
          <div className="max-w-[1300px] mx-auto w-full flex flex-col p-[20px] px-[30px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Меню</h2>
              <button
                onClick={toggleNavigation}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex flex-row gap-[60px] mt-[40px] min-h-[300px]">
              {/* Левая колонка - основные пункты */}
              <div className="flex flex-col border-r border-gray-200 pr-[40px] min-w-[150px]">
                <div
                  onMouseEnter={() => setActiveItem("courses")}
                  className="cursor-pointer"
                >
                  <Link
                    onClick={toggleNavigation}
                    href="/courses"
                    className={`block ord-text py-3 hover:text-purple-600 transition ${
                      activeItem === "courses"
                        ? "text-purple-600 font-semibold"
                        : "text-gray-800 font-semibold"
                    }`}
                  >
                    Курсы
                  </Link>
                </div>
                <div
                  onMouseEnter={() => setActiveItem("articles")}
                  className="cursor-pointer"
                >
                  <Link
                    onClick={toggleNavigation}
                    href="/articles"
                    className={`block ord-text py-3 hover:text-purple-600 transition ${
                      activeItem === "articles"
                        ? "text-purple-600 font-semibold"
                        : "text-gray-800 font-semibold"
                    }`}
                  >
                    Статьи
                  </Link>
                </div>
              </div>

              {/* Правая колонка - контент, который меняется при наведении */}
              <div className="flex-1 mt-[20px]">
                {/* Контент для "Курсы" */}
                {activeItem === "courses" && (
                  <div className="flex flex-row flex-wrap gap-[40px] animate-in fade-in slide-in-from-right-5 duration-300">
                    {loadingCourses ? (
                      <p className="text-gray-400">Загрузка курсов...</p>
                    ) : availableCourseCategories.length > 0 ? (
                      availableCourseCategories.map((category) => (
                        <div
                          key={category}
                          className="flex flex-col min-w-[160px]"
                        >
                          <p className="font-semibold text-purple-600 mb-3 pb-2 border-b border-purple-200">
                            {category}
                          </p>
                          {groupedCourses[category]
                            ?.slice(0, 5)
                            .map((course) => (
                              <Link
                                key={course.id}
                                href={`/courses/promo/${course.slug}`}
                                onClick={toggleNavigation}
                                className="text-gray-600 hover:text-purple-600 py-2 text-sm transition truncate max-w-[180px]"
                                title={course.title}
                              >
                                {course.title}
                              </Link>
                            ))}
                          {groupedCourses[category]?.length > 5 && (
                            <Link
                              href={`/courses?category=${encodeURIComponent(category)}`}
                              onClick={toggleNavigation}
                              className="text-purple-500 hover:text-purple-700 py-2 text-xs transition mt-1"
                            >
                              Показать все →
                            </Link>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400">Курсы временно недоступны</p>
                    )}
                  </div>
                )}

                {/* Контент для "Статьи" */}
                {activeItem === "articles" && (
                  <div className="flex flex-row flex-wrap gap-[40px] animate-in fade-in slide-in-from-right-5 duration-300">
                    {loadingArticles ? (
                      <p className="text-gray-400">Загрузка статей...</p>
                    ) : availableArticleTopics.length > 0 ? (
                      availableArticleTopics.map((topic) => (
                        <div
                          key={topic}
                          className="flex flex-col min-w-[160px]"
                        >
                          <p className="font-semibold text-purple-600 mb-3 pb-2 border-b border-purple-200">
                            {topic}
                          </p>
                          {groupedArticles[topic]
                            ?.slice(0, 5)
                            .map((article) => (
                              <Link
                                key={article.id}
                                href={`/articles/${article.slug}`}
                                onClick={toggleNavigation}
                                className="text-gray-600 hover:text-purple-600 py-2 text-sm transition truncate max-w-[180px]"
                                title={article.title}
                              >
                                {article.title}
                              </Link>
                            ))}
                          {groupedArticles[topic]?.length > 5 && (
                            <Link
                              href={`/articles?topic=${encodeURIComponent(topic)}`}
                              onClick={toggleNavigation}
                              className="text-purple-500 hover:text-purple-700 py-2 text-xs transition mt-1"
                            >
                              Показать все →
                            </Link>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400">
                        Статьи временно недоступны
                      </p>
                    )}
                  </div>
                )}

                {/* По умолчанию показываем приветствие */}
                {activeItem === null && (
                  <div className="flex items-center justify-center h-full text-gray-400 animate-in fade-in duration-300">
                    <p>Наведите на пункт меню, чтобы увидеть список</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default NavigationPanel;
