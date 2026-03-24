"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      const session = data?.session;

      if (error || !session) {
        setError(
          "Ссылка недействительна или истекла. Запросите сброс пароля заново.",
        );
        return;
      }
    };

    checkSession();
  }, []);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.password.length < 6) {
      setError("Пароль должен быть минимум 6 символов");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Пароли не совпадают");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (error) throw error;

      setSuccess(true);

      setTimeout(() => {
        router.push("/?login=true");
      }, 2000);
    } catch (err: unknown) {
      console.error("Update password error:", err);
      const message =
        err instanceof Error ? err.message : "Не удалось обновить пароль";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !error && !success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p>Обновляем пароль...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-xl font-bold mb-2">Пароль обновлён!</h2>
          <p className="text-gray-600 mb-6">
            Теперь вы можете войти с новым паролем.
          </p>
          <button
            onClick={() => router.push("/?login=true")}
            className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            Войти
          </button>
        </div>
      </div>
    );
  }

  if (error && !formData.password) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Ошибка</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/?forgot=true")}
            className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            Запросить сброс заново
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-2 text-center">Новый пароль</h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          Придумайте надёжный пароль для вашего аккаунта
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Новый пароль
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Подтвердите пароль
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Обновляем..." : "Обновить пароль"}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">
          Ссылка для сброса пароля действительна 1 час и может быть использована
          только один раз.
        </p>
      </div>
    </div>
  );
}
