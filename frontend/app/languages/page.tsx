import Link from "next/link";
import { Globe, ArrowLeft, Flag, Languages } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Language = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  image: string;
  created_at: string;
};

export const dynamic = "force-dynamic";

export default async function LanguagesHubPage() {
  let languages: Language[] = [];
  let error: string | null = null;

  try {
    const data = await apiFetch("/api/languages");
    // ✅ ИСПРАВЛЕНО: правильный ключ + фоллбек
    languages = data.languages || [];
  } catch (err) {
    console.error("❌ Failed to fetch languages:", err);
    error = "Не удалось загрузить языки";
  }

  // ... остальной код без изменений ...
  // Но обязательно убери пробелы в switch:
  const getLanguageIcon = (slug: string, icon?: string | null) => {
    if (icon) {
      if (icon.startsWith("http")) {
        return (
          <img
            src={icon}
            alt=""
            className="w-8 h-8 rounded-full object-cover"
          />
        );
      }
      return <span className="text-2xl">{icon}</span>;
    }
    // ✅ Убраны пробелы в case:
    switch (slug) {
      case "english": // ✅ Без пробела!
        return <Flag className="w-8 h-8 text-blue-600" />;
      case "spanish":
        return <Flag className="w-8 h-8 text-red-600" />;
      // ... остальные case тоже без пробелов
      default:
        return <Globe className="w-8 h-8 text-purple-600" />;
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-purple-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Назад
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Изучение языков
        </h1>
        <p className="text-gray-600 mb-8">
          Выберите язык для начала обучения. Каждый курс включает уровни A1–C1,
          интерактивные уроки, практику и тесты для проверки прогресса.
        </p>

        {/* Загрузка */}
        {languages.length === 0 && !error && (
          <div className="flex justify-center py-20 mt-[20px]">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600" />
          </div>
        )}

        {/* Ошибка */}
        {error && (
          <div className="text-center py-20">
            <p className="text-red-600 text-lg mb-4">{error}</p>
            <p className="text-gray-500">
              Проверьте подключение к интернету или попробуйте позже
            </p>
          </div>
        )}

        {/* Список языков */}
        {languages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-[20px]">
            {languages.map((language) => (
              <Link
                key={language.id}
                href={`/languages/${language.slug}`}
                className="group block p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-purple-300 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-gray-50 rounded-xl group-hover:bg-purple-50 transition-colors w-[100px] h-[130px] overflow-hidden flex items-center justify-center">
                    {language.image ? (
                      <img
                        src={
                          language.image.startsWith("http")
                            ? language.image
                            : `/${language.image}`
                        }
                        alt={language.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl">
                        {getLanguageIcon(language.slug, language.icon)}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                      {language.name}
                    </h2>
                    <p className="text-gray-600 mt-2 text-sm line-clamp-2">
                      {language.description || "Полный курс от A1 до C1"}
                    </p>

                    <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        📚 5 уровней
                      </span>
                      <span className="flex items-center gap-1">
                        🎯 Интерактив
                      </span>
                    </div>
                  </div>

                  <div className="text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all">
                    →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Пусто */}
        {languages.length === 0 && !error && (
          <div className="text-center py-20 bg-gray-50 rounded-2xl mt-6">
            <Languages className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Языки пока не добавлены
            </h3>
            <p className="text-gray-500 mb-6">
              Администратор ещё не добавил доступные языки
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
