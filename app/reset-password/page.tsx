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

  // Debug version - change this to force cache refresh
  const DEBUG_VERSION = "v2.2";

  useEffect(() => {
    console.log(`🔍 ResetPassword ${DEBUG_VERSION} loaded`);
    console.log("URL:", window.location.href);

    const checkSession = async () => {
      const result = await supabase.auth.getSession();
      const session = result.data?.session;
      const sessionError = result.error;

      if (sessionError) {
        setError("Ошибка: " + sessionError.message);
        return;
      }

      if (!session) {
        setError("Ссылка недействительна или истекла.");
        return;
      }

      console.log("✅ Valid recovery session");
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
      const result = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (result.error) throw result.error;

      // ✅ Clear recovery session to prevent redirect loop
      await supabase.auth.signOut();

      setSuccess(true);

      setTimeout(() => {
        router.push("/?login=true");
        router.refresh();
      }, 2000);
    } catch (err: unknown) {
      console.error("Update error:", err);
      setError(
        err instanceof Error ? err.message : "Не удалось обновить пароль",
      );
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER: Loading
  // ─────────────────────────────────────────────────────────────
  if (loading && !error && !success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50/95 backdrop-blur-sm">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Обновляем пароль...</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: Success
  // ─────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50/95 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full text-center">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-xl font-bold mb-2">Пароль обновлён!</h2>
          <p className="text-gray-600 mb-6">Теперь войдите с новым паролем.</p>
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

  // ─────────────────────────────────────────────────────────────
  // RENDER: Error (invalid token)
  // ─────────────────────────────────────────────────────────────
  if (error && !formData.password) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50/95 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full text-center">
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

  // ─────────────────────────────────────────────────────────────
  // RENDER: Password Reset Form
  // ─────────────────────────────────────────────────────────────
  return (
    // ✅ Full viewport overlay with proper z-index
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50/95 backdrop-blur-sm p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full relative">
        {/* Debug version tag - remove in production */}
        <span className="absolute top-2 right-3 text-xs text-gray-300">
          {DEBUG_VERSION}
        </span>

        <h2 className="text-xl font-bold mb-2 text-center">Новый пароль</h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          Придумайте надёжный пароль
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {/* Form Errors */}
          {error && formData.password && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 font-medium transition"
          >
            {loading ? "Обновляем..." : "Обновить пароль"}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">
          Ссылка действительна 1 час
        </p>
      </div>
    </div>
  );
}
