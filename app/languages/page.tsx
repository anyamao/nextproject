import Link from "next/link";
import { Globe, ArrowLeft, BookOpen, Flag, Languages } from "lucide-react";

type Language = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon?: string | null;
  image: string;
  created_at: string;
};

export default async function LanguagesHubPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let languages: Language[] = [];
  let error: string | null = null;

  try {
    if (supabaseUrl && supabaseKey) {
      const url = `${supabaseUrl}/rest/v1/languages?select=id,slug,name,image,description,icon,created_at&order=name`;
      console.log("🔍 Fetching:", url);

      const res = await fetch(url, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        next: { revalidate: 60 },
      });

      console.log("🔍 Status:", res.status, res.ok ? "OK" : "ERROR");

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Response error:", errorText);
        error = `Ошибка ${res.status}: ${errorText.slice(0, 100)}`;
      } else {
        languages = await res.json();
        console.log("✅ Languages loaded:", languages.length);
      }
    }
  } catch (err) {
    console.error("❌ Fetch exception:", err);
    error = "Ошибка подключения к базе данных";
  }
  const getLanguageIcon = (slug: string, icon?: string | null) => {
    if (icon) {
      return (
        <img src={icon} alt="" className="w-8 h-8 rounded-full object-cover" />
      );
    }

    switch (slug) {
      case "english":
        return <Flag className="w-8 h-8 text-blue-600" />; // 🇬🇧
      case "spanish":
        return <Flag className="w-8 h-8 text-red-600" />; // 🇪🇸
      case "french":
        return <Flag className="w-8 h-8 text-blue-700" />; // 🇫🇷
      case "german":
        return <Flag className="w-8 h-8 text-yellow-600" />; // 🇩🇪
      case "italian":
        return <Flag className="w-8 h-8 text-green-600" />; // 🇮🇹
      case "chinese":
        return <Flag className="w-8 h-8 text-red-700" />; // 🇨🇳
      case "japanese":
        return <Flag className="w-8 h-8 text-red-500" />; // 🇯🇵
      case "russian":
        return <Flag className="w-8 h-8 text-blue-500" />; // 🇷🇺
      default:
        return <Globe className="w-8 h-8 text-purple-600" />;
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center px-[10px] sm:px-[20px] py-[30px] w-full min-h-full max-w-5xl mx-auto">
      <div className="w-full">
        <div className="flex flex-row w-full items-center justify-between">
          <Link
            href="/"
            className="text-gray-600 hover:text-purple-600 transition"
          >
            <ArrowLeft className="w-6 h-6 cursor-pointer" />
          </Link>

          <p className="bigger-text font-bold">Изучение языков</p>
          <div></div>
        </div>
        <p className="text-gray-600 ord-text max-w-2xl mt-[20px] mx-auto">
          Выберите язык для начала обучения. Каждый курс включает уровни A1–C1,
          интерактивные уроки, практику и тесты для проверки прогресса.
        </p>
      </div>

      {languages.length === 0 && !error && (
        <div className="flex justify-center py-20 mt-[20px]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600" />
        </div>
      )}

      {error && (
        <div className="text-center py-20">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <p className="text-gray-500">
            Проверьте подключение к интернету или попробуйте позже
          </p>
        </div>
      )}

      {languages.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-[20px]">
          {languages.map((language) => (
            <Link
              key={language.id}
              href={`/languages/${language.slug}`}
              className="group block p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-purple-300 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="bg-gray-50 rounded-xl group-hover:bg-purple-50 transition-colors w-[100px] h-[130px] overflow-hidden">
                  <img
                    src={`/${language.image}`}
                    className="w-full h-full object-cover"
                  />
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

      {languages.length === 0 && !error && (
        <div className="text-center py-20 bg-gray-50 rounded-2xl">
          <Languages className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Языки пока не добавлены
          </h3>
          <p className="text-gray-500 mb-6">
            Администратор ещё не добавил доступные языки
          </p>
        </div>
      )}
    </main>
  );
}
