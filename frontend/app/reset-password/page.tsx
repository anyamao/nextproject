"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client"; // your existing client

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<
    "verifying" | "ready" | "updating" | "success" | "error"
  >("verifying");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const handleReset = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error || !session) {
          setStatus("error");
          setMessage("Ссылка устарела или недействительна. Запросите новую.");
          return;
        }

        setStatus("ready");
      } catch (err) {
        console.error("Session verification failed:", err);
        setStatus("error");
        setMessage("Ошибка проверки ссылки");
      }
    };

    handleReset();
  }, [supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      setMessage("Пароль должен содержать минимум 6 символов");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Пароли не совпадают");
      return;
    }

    setStatus("updating");

    try {
      const { error } = await supabase.auth.updateUser({
        password: password.trim(),
      });

      if (error) throw error;

      setStatus("success");
      setMessage("Пароль успешно обновлён! Перенаправляем...");

      window.location.hash = "";

      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 2000);
    } catch (err) {
      console.error("Password update failed:", err);
      setStatus("error");
    }
  };

  if (status === "verifying") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Проверка ссылки...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl shadow max-w-md w-full text-center">
          <p className="text-red-600 mb-4">❌ {message}</p>
          <button
            onClick={() => router.push("/forgot-password")}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Запросить новую ссылку
          </button>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-green-600 text-lg">✅ {message}</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-[50px] rounded-xl shadow max-w-md w-full">
        <h1 className="bigger-text border-b-[1px] border-gray-300  pb-[10px] font-bold mb-4 text-center">
          Введите новый пароль
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 mt-[40px]">
          <div>
            <label className="block  font-medium mb-[5px]  ord-text ml-[5px] font-semibold">
              Новый пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded-lg border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block ord-text font-semibold ml-[5px] mt-[20px] mb-[5px]">
              Подтвердите пароль
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border-gray-300 mb-[20px] p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={status === "updating"}
            className="w-full py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition"
          >
            {status === "updating" ? "Обновляем..." : "Установить пароль"}
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mb-[20px] mt-4">
          Ссылка действительна 1 час и может быть использована только один раз.
        </p>
      </div>
    </main>
  );
}
