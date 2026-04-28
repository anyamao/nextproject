// frontend/app/profile-settings/page.tsx
"use client";
import useContactStore from "@/store/states";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, MessageCircle, User } from "lucide-react";
import { apiFetch } from "@/lib/api";
import AvatarSelector from "@/components/AvatarSelector"; // ✅ Импортируй

type UserProfile = {
  id: number;
  username: string;
  email: string;
  avatar_url: string;
  status: string | null;
};

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    registerState,
    openLogin,
    toggleRegister,
    passwordState,
    togglePassword,
    setUser,
  } = useContactStore();
  // Форма
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState("");
  const [selectedAvatar, setSelectedAvatar] =
    useState<string>("default_cat.jpg");

  // Загрузка профиля
  useEffect(() => {
    const fetchProfile = async () => {
      // frontend/app/profile-settings/page.tsx (внутри handleSubmit)

      try {
        const token = localStorage.getItem("token");
        const updated = await apiFetch("/profile/settings", {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username.trim() || undefined,
            avatar_url: selectedAvatar,
            status: status.trim() || null,
          }),
        });

        setProfile(updated);
        setSuccess(true);

        // ✅ ВАЖНО: Обновляем store И localStorage
        const newUser = {
          id: updated.id,
          email: updated.email,
          username: updated.username,
          avatar_url: updated.avatar_url || "default_cat.jpg",
          status: updated.status,
          created_at: updated.created_at,
        };

        localStorage.setItem("user", JSON.stringify(newUser));
        setUser(newUser); // ✅ Это триггерит перерисовку всех компонентов!

        console.log(
          "✅ [ProfileSettings] Store updated with new avatar:",
          newUser.avatar_url,
        );

        setTimeout(() => setSuccess(false), 3000);
      } catch (err: any) {
        setError(err.message || "Ошибка при сохранении");
      }
    };
    fetchProfile();
  }, [router]);

  // Сохранение
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem("token");
      const updated = await apiFetch("/profile/settings", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim() || undefined,
          avatar_url: selectedAvatar,
          status: status.trim() || null,
        }),
      });

      setProfile(updated);
      setSuccess(true);

      // Обновляем localStorage
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...user,
          username: updated.username,
          avatar_url: updated.avatar_url,
        }),
      );

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600" />
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 w-full max-w-2xl mx-auto">
      <div className="w-full mb-8">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-purple-600 transition flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" /> Назад
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">
          Настройки профиля
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full space-y-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm"
      >
        {/* ✅ Выбор аватара */}
        <AvatarSelector
          currentAvatar={selectedAvatar}
          onAvatarSelect={setSelectedAvatar}
        />

        {/* Предпросмотр текущей аватарки */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-300">
            <img
              src={`/avatars/${selectedAvatar}`}
              alt="Selected avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="font-medium text-gray-900">Текущая аватарка</p>
            <p className="text-sm text-gray-500">{selectedAvatar}</p>
          </div>
        </div>

        {/* Юзернейм */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <User className="w-4 h-4" /> Имя пользователя
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={3}
            maxLength={30}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
            placeholder="Ваше уникальное имя"
          />
        </div>

        {/* Статус */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" /> Статус
          </label>
          <textarea
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            maxLength={200}
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none"
            placeholder="Расскажите о себе..."
          />
          <p className="text-xs text-gray-500 mt-1 text-right">
            {status.length}/200
          </p>
        </div>

        {/* Сообщения */}
        {error && (
          <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            {error}
          </p>
        )}
        {success && (
          <p className="text-green-600 text-sm bg-green-50 p-3 rounded-lg">
            ✅ Профиль обновлён!
          </p>
        )}

        {/* Кнопка */}
        <button
          type="submit"
          disabled={saving || !username.trim()}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              Сохранение...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" /> Сохранить изменения
            </>
          )}
        </button>
      </form>
    </main>
  );
}
