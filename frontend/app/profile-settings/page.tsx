// frontend/app/profile-settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2, AlertTriangle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import useContactStore from "@/store/states";
import AvatarSelector from "@/components/AvatarSelector"; // ✅ Импортируем

type UserProfile = {
  id: number;
  username: string;
  email: string;
  avatar_url: string;
  first_name: string | null; // 🔥 Добавь
  last_name: string | null;
  status: string | null;
};

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { setUser, toggleLogin } = useContactStore();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [username, setUsername] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("default_cat.jpg");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 🔹 1️⃣ Загрузка профиля при маунте
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/auth/login");
          return;
        }

        const data = await apiFetch("/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setProfile(data);
        setUsername(data.username);
        setFirstName(data.first_name || "");
        setLastName(data.last_name || "");
        setSelectedAvatar(data.avatar_url || "default_cat.jpg");
      } catch (err: any) {
        console.error("❌ Failed to load profile:", err);
        setError("Не удалось загрузить профиль");
        if (err?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.push("/auth/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  // 🔹 2️⃣ Сохранение изменений (имя + аватар)
  // 🔹 2️⃣ Сохранение изменений (имя + аватар)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || username.length < 3) {
      setError("Имя должно содержать минимум 3 символа");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem("token");

      console.log("🔵 [ProfileSettings] Sending avatar:", selectedAvatar);

      const updated = await apiFetch("/profile/settings", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          first_name: firstName.trim() || null, // 🔥 Добавь
          last_name: lastName.trim() || null, // 🔥 Добавь
          avatar_url: selectedAvatar,
        }),
      });

      console.log("🟢 [ProfileSettings] Response from server:", updated);
      console.log(
        "🟢 [ProfileSettings] updated.avatar_url:",
        updated.avatar_url,
      );

      setProfile(updated);
      // ✅ Обновляем localStorage и store
      const newUser = {
        id: updated.id,
        email: updated.email,
        username: updated.username,
        avatar_url: updated.avatar_url || selectedAvatar,
        status: updated.status,
        first_name: updated.first_name || firstName, // 🔥 Добавь
        last_name: updated.last_name || lastName, // 🔥 Добавь
      };

      console.log("🟢 [ProfileSettings] Saving to localStorage:", newUser);
      localStorage.setItem("user", JSON.stringify(newUser));
      setUser(newUser);
      setSuccess(true);

      console.log("🟢 [ProfileSettings] Saving to localStorage:", newUser);
      localStorage.setItem("user", JSON.stringify(newUser));
      setUser(newUser);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("❌ [ProfileSettings] Error:", err);
      setError(err.message || "Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };
  // 🔹 3️⃣ Удаление аккаунта
  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");

      await apiFetch("/profile/delete", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      // ✅ Полная очистка и редирект
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      toggleLogin();

      window.location.href = "/";
    } catch (err: any) {
      setError(err.message || "Ошибка при удалении аккаунта");
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  // 🔹 Лоадер
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

      <form onSubmit={handleSaveProfile} className="w-full space-y-6">
        {/* ✅ Выбор аватара */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <AvatarSelector
            currentAvatar={selectedAvatar}
            onAvatarSelect={setSelectedAvatar}
          />
        </div>

        {/* ✅ Карточка: Имя пользователя */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Имя пользователя
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Новое имя
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                minLength={3}
                maxLength={30}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition"
                placeholder="Введите новое имя"
                disabled={saving}
              />
              <p className="text-xs text-gray-500 mt-1">
                Минимум 3 символа, максимум 30
              </p>
            </div>

            {error && !error.includes("удалении") && (
              <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </p>
            )}

            {success && (
              <p className="text-green-600 text-sm bg-green-50 p-3 rounded-lg">
                ✅ Профиль обновлён!
              </p>
            )}

            <button
              type="submit"
              disabled={saving || !username.trim() || username.length < 3}
              className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          </div>
        </div>
        {/* ✅ Карточка: ФИО для сертификата */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Данные для сертификата
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Укажите ваше имя и фамилию так, как они должны отображаться в
            сертификате
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Имя *
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition"
                placeholder="Иван"
                disabled={saving}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Фамилия *
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition"
                placeholder="Иванов"
                disabled={saving}
              />
            </div>
          </div>
        </div>
        {/* 🔴 Карточка: Удаление аккаунта */}
        <div className="bg-white p-6 rounded-2xl border border-red-200 shadow-sm">
          <h2 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Опасная зона
          </h2>

          {!showDeleteConfirm ? (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Удаление аккаунта необратимо. Все ваши данные, прогресс и
                настройки будут безвозвратно удалены.
              </p>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="w-full py-3 bg-red-50 text-red-700 border-2 border-red-200 rounded-xl font-semibold hover:bg-red-100 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" /> Удалить аккаунт
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">
                  <strong>Вы уверены?</strong> Это действие нельзя отменить. Все
                  ваши данные будут удалены навсегда.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition disabled:opacity-50"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      Удаление...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" /> Да, удалить
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </form>
    </main>
  );
}
