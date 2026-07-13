// frontend/app/profile-settings/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Trash2, Sparkles, ChevronRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import useContactStore from "@/store/states";
import AvatarSelector from "@/components/AvatarSelector";
import ConfirmDialog from "@/components/ConfirmDialog";
import Toast from "@/components/Toast";
// 🔥 ИМПОРТИРУЕМ САНИТИЗАЦИЮ
import {
  sanitizeText,
  sanitizeUsername,
  sanitizeTextarea,
  hasDangerousPatterns,
} from "@/lib/sanitize";

type UserProfile = {
  id: number;
  username: string;
  email: string;
  avatar_url: string | null;
  first_name: string | null;
  about_me: string | null;
  created_at?: string;
  last_name: string | null;
  status: string | null;
  token_balance: number;
};

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { user, setUser, isAuthenticated, checkAuth } = useContactStore();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type?: "success" | "error" | "info";
  } | null>(null);

  // 🔥 Форма
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [status, setStatus] = useState("");
  const [username, setUsername] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("default_cat.jpg");

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    onConfirm: () => void;
    message?: string;
    title?: string;
  }>({
    isOpen: false,
    onConfirm: () => {},
    message: "",
    title: "",
  });

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "success",
  ) => {
    setToast({ message, type });
  };

  // 🔥 Проверка авторизации через store
  useEffect(() => {
    const checkAuthAndLoad = async () => {
      if (!isAuthenticated) {
        await checkAuth();
      }

      if (!useContactStore.getState().isAuthenticated) {
        router.push("/login");
        return;
      }

      await fetchProfile();
    };

    checkAuthAndLoad();
  }, [isAuthenticated]);

  // 🔥 Загрузка профиля
  const fetchProfile = async () => {
    try {
      setLoading(true);

      const data = await apiFetch("/profile/me");

      setProfile(data);

      // 🔥 Заполняем форму с санитизацией
      setUsername(sanitizeUsername(data.username));
      setFirstName(sanitizeText(data.first_name));
      setLastName(sanitizeText(data.last_name));
      setStatus(sanitizeText(data.status));
      setAboutMe(sanitizeTextarea(data.about_me));
      setSelectedAvatar(data.avatar_url || "default_cat.jpg");

      if (data) {
        setUser({
          id: data.id,
          email: data.email,
          username: sanitizeUsername(data.username),
          avatar_url: data.avatar_url || "default_cat.jpg",
          status: sanitizeText(data.status),
        });
      }
    } catch (err: any) {
      console.error("❌ Failed to load profile:", err);

      if (err?.status === 401) {
        router.push("/login");
      } else {
        setError("Не удалось загрузить профиль");
        showToast("Не удалось загрузить профиль", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Обработчики изменения полей с санитизацией
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // 🔥 Санитизируем username (удаляем недопустимые символы)
    const sanitized = sanitizeUsername(raw);
    setUsername(sanitized);
    setError(null);
  };

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // 🔥 Санитизируем текст
    const sanitized = sanitizeText(raw);
    setFirstName(sanitized);
    setError(null);
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const sanitized = sanitizeText(raw);
    setLastName(sanitized);
    setError(null);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // 🔥 Проверяем на опасные паттерны
    if (hasDangerousPatterns(raw)) {
      setError("Обнаружен запрещенный контент");
      return;
    }
    const sanitized = sanitizeText(raw);
    setStatus(sanitized);
    setError(null);
  };

  const handleAboutMeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const raw = e.target.value;
    // 🔥 Проверяем на опасные паттерны
    if (hasDangerousPatterns(raw)) {
      setError("Обнаружен запрещенный контент");
      return;
    }
    const sanitized = sanitizeTextarea(raw);
    setAboutMe(sanitized);
    setError(null);
  };

  // 🔥 Сохранение профиля
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🔥 Финальная санитизация перед отправкой
    const finalUsername = sanitizeUsername(username);
    const finalFirstName = sanitizeText(firstName);
    const finalLastName = sanitizeText(lastName);
    const finalStatus = sanitizeText(status);
    const finalAboutMe = sanitizeTextarea(aboutMe);

    // 🔥 Проверка на опасные паттерны
    if (
      hasDangerousPatterns(finalAboutMe) ||
      hasDangerousPatterns(finalStatus)
    ) {
      setError("Обнаружен запрещенный контент");
      showToast("Обнаружен запрещенный контент", "error");
      return;
    }

    if (!finalUsername || finalUsername.length < 3) {
      setError("Имя пользователя должно содержать минимум 3 символа");
      showToast("Имя пользователя должно содержать минимум 3 символа", "error");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const updated = await apiFetch("/profile/update", {
        method: "PATCH",
        body: JSON.stringify({
          username: finalUsername,
          first_name: finalFirstName || null,
          last_name: finalLastName || null,
          status: finalStatus || null,
          about_me: finalAboutMe || null,
          avatar_url: selectedAvatar,
        }),
      });

      setProfile(updated);

      setUser({
        id: updated.id,
        email: updated.email,
        username: finalUsername,
        avatar_url: updated.avatar_url || selectedAvatar,
        status: finalStatus,
      });

      setSuccess(true);
      showToast("Профиль успешно обновлён!", "success");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Ошибка при сохранении");
      showToast(err.message || "Ошибка при сохранении", "error");
    } finally {
      setSaving(false);
    }
  };

  // 🔥 Удаление аккаунта
  const handleDeleteAccount = async () => {
    setDeleting(true);
    setError(null);

    try {
      await apiFetch("/profile/delete", {
        method: "DELETE",
      });

      setUser(null);
      showToast("Аккаунт успешно удалён", "success");

      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Ошибка при удалении аккаунта");
      showToast(err.message || "Ошибка при удалении аккаунта", "error");
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    }
  };

  const openDeleteConfirmDialog = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Удаление аккаунта",
      message:
        "Вы уверены, что хотите удалить свой аккаунт? Это действие нельзя отменить. Все ваши данные, прогресс и настройки будут безвозвратно удалены.",
      onConfirm: handleDeleteAccount,
    });
  };

  // 🔥 Загрузка
  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600" />
      </main>
    );
  }

  // 🔥 Если не авторизован
  if (!useContactStore.getState().isAuthenticated) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center py-20 px-4">
        <p className="text-red-600 text-lg mb-4">Вы не авторизованы</p>
        <Link href="/login" className="text-purple-600 hover:underline">
          Войти
        </Link>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 w-full max-w-2xl mx-auto">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title || "Подтверждение"}
        message={confirmDialog.message || "Вы уверены?"}
        confirmText="Да, удалить"
        cancelText="Отмена"
        type="danger"
      />

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

      <div className="bg-pink-200 w-full rounded-lg relative flex flex-row items-center justify-between mb-[20px] p-[10px] px-[30px]">
        <p className="text-pink-900 font-bold">
          Добавь своему котику аксессуары!
        </p>
        <Link
          href="/shop"
          className="bg-pink-400 px-[20px] flex hover:bg-pink-500 duration-300 cursor-pointer flex-row items-center py-[5px] text-pink-50 rounded-lg"
        >
          магазин
          <ChevronRight className="w-4 h-4 ml-[5px]" />
          <Sparkles className="text-pink-400 w-10 absolute mb-[5px] ml-[-20px] -rotate-12 left-0 bottom-0 h-10" />
          <Sparkles className="text-pink-400 w-9 absolute mb-[10px] mr-[-15px] rotate-12 right-0 bottom-0 h-9" />
        </Link>
      </div>

      <form onSubmit={handleSaveProfile} className="w-full space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-xs">
          <AvatarSelector
            currentAvatar={selectedAvatar}
            onAvatarSelect={setSelectedAvatar}
          />
        </div>

        <div className="bg-purple-500 rotate-2 my-[30px] md:p-8 p-2 rounded-lg shadow-xs">
          <div className="flex flex-col -rotate-2 p-[20px] rounded-lg bg-purple-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Обо мне
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-purple-900 mb-2">
                  Мой юзернейм
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  minLength={3}
                  maxLength={30}
                  className="w-full p-3 bg-white rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition"
                  placeholder="Введите новое имя"
                  disabled={saving}
                />
                <p className="text-xs text-gray-700 mt-1">
                  Только буквы, цифры, _, . и -. Минимум 3 символа
                </p>
              </div>

              {error && !error.includes("удалении") && (
                <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  {error}
                </p>
              )}
            </div>

            <div className="space-y-4 mt-[10px]">
              <div>
                <label className="block text-sm font-semibold text-purple-900 mb-2">
                  Статус
                </label>
                <input
                  type="text"
                  value={status}
                  onChange={handleStatusChange}
                  maxLength={200}
                  className="w-full p-3 focus:ring-2 focus:ring-purple-500 rounded-lg bg-white outline-none transition"
                  placeholder="Например: 🎓 Студент | 💻 Разработчик"
                  disabled={saving}
                />
                <p className="text-xs text-gray-500 mt-1">До 200 символов</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-700 mb-2">
                  О себе
                </label>
                <textarea
                  value={aboutMe}
                  onChange={handleAboutMeChange}
                  maxLength={2000}
                  rows={4}
                  className="w-full p-3 bg-white rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition resize-none"
                  placeholder="Расскажите немного о себе, ваших интересах и целях..."
                  disabled={saving}
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {aboutMe.length}/2000
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-xs">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Данные для сертификата
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Укажите ваше имя и фамилию так, как они должны отображаться в
            сертификате
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Имя
              </label>
              <input
                type="text"
                value={firstName}
                onChange={handleFirstNameChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition"
                placeholder="Иван"
                disabled={saving}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Фамилия
              </label>
              <input
                type="text"
                value={lastName}
                onChange={handleLastNameChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition"
                placeholder="Иванов"
                disabled={saving}
              />
            </div>
          </div>
        </div>

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

        <div className="bg-white p-6 rounded-2xl border border-red-200 shadow-sm">
          <h2 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Опасная зона
          </h2>

          <p className="text-sm text-gray-600 mb-4">
            Удаление аккаунта необратимо. Все ваши данные, прогресс и настройки
            будут безвозвратно удалены.
          </p>
          <button
            type="button"
            onClick={openDeleteConfirmDialog}
            disabled={deleting}
            className="w-full py-3 bg-red-600 text-white border-red-200 rounded-xl font-semibold hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Trash2 className="w-5 h-5" /> Удалить аккаунт
          </button>
        </div>
      </form>
    </main>
  );
}
