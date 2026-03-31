"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import useContactStore from "@/store/states";
import { X } from "lucide-react";

export default function ForgotPassword() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { forgotpasswordState, toggleforgotpassword, openLogin } =
    useContactStore();

  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email.includes("@")) {
      setError("Введите корректный email");
      setLoading(false);
      return;
    }
    try {
      const baseUrl = window.location.origin;
      const redirectUrl = `${baseUrl}/reset-password`;

      console.log("Sending reset email with redirect to:", redirectUrl);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (err: unknown) {
      console.error("Password reset error:", err);
      const message =
        err instanceof Error ? err.message : "Ошибка отправки письма";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  function getRussianErrorMessage(error: string): string {
    const errorMap: Record<string, string> = {
      "Email not confirmed": "Подтвердите ваш email сначала",
      "User not found": "Если аккаунт существует, письмо отправлено",
      "rate limit exceeded": "Слишком много попыток. Подождите 1 час",
    };
    return errorMap[error] || "Произошла ошибка. Попробуйте ещё раз";
  }

  if (success) {
    return (
      <main>
        {forgotpasswordState && (
          <div className="w-full z-23 overflow-x-hidden absolute h-full backdrop-blur-xs bg-gray-100 flex justify-center flex-1">
            <div className="bg-white shadow-xs text-black relative w-[80%] max-w-[500px] h-[380px] rounded-xl flex flex-col items-center mt-[50px] md:mt-[100px] p-[20px]">
              <div className="w-full flex justify-end">
                <X
                  className="cursor-pointer w-[17px] h-[17px] text-gray-400"
                  onClick={toggleforgotpassword}
                />
              </div>

              <div className="text-center mt-[40px]">
                <div className="text-4xl mb-4">✉️</div>
                <h3 className="font-semibold text-lg mb-2">
                  Письмо отправлено!
                </h3>
                <p className="text-sm text-gray-600">
                  Если аккаунт с этим email существует, вы получите письмо со
                  ссылкой для сброса пароля.
                </p>
                <p className="text-xs text-gray-400 mt-4">
                  Не получили письмо? Проверьте папку &apos;Спам&apos; или
                  попробуйте ещё раз через час.
                </p>
              </div>

              <button
                onClick={() => {
                  toggleforgotpassword();
                  openLogin();
                }}
                className="mt-[30px] px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
              >
                Вернуться ко входу
              </button>
            </div>
          </div>
        )}
      </main>
    );
  }

  return (
    <main>
      {forgotpasswordState && (
        <div className="w-full z-23 overflow-x-hidden absolute h-full backdrop-blur-xs bg-gray-100 flex justify-center flex-1">
          <div className="bg-white shadow-xs text-black relative w-[80%] max-w-[500px] h-[380px] rounded-xl flex flex-col items-center mt-[50px] md:mt-[100px] p-[20px]">
            <div className="w-full flex justify-end">
              <X
                className="cursor-pointer w-[17px] h-[17px] text-gray-400"
                onClick={toggleforgotpassword}
              />
            </div>

            <div className="bigger-text font-semibold border-b-[1px] border-b-gray-300 pb-[10px]">
              Восстановление пароля
            </div>

            <div className="text-center mt-[20px] text-sm text-gray-600">
              Введите ваш email, и мы отправим инструкцию по сбросу пароля
            </div>

            <form
              onSubmit={handleSubmit}
              className="w-full max-w-[400px] flex flex-col items-center mt-[20px]"
            >
              <div className="flex flex-col min-w-full">
                <label className="ml-[10px] font-semibold text-sm">
                  Ваш email
                </label>
                <div className="w-full bg-white mt-[5px] h-[40px] p-[10px] px-[20px] border-[1px] border-gray-300 flex items-center rounded-lg">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full outline-none text-sm"
                    placeholder="mao@gmail.com"
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="h-[15px] text-xs text-center text-red-700 mt-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-[80%] h-[40px] mt-[20px] bg-purple-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Отправляем..." : "Отправить письмо"}
              </button>
            </form>

            <div className="mt-[10px] flex text-sm">
              <p>Вспомнили пароль?</p>
              <button
                onClick={() => {
                  toggleforgotpassword();
                  openLogin();
                }}
                className="font-semibold text-blue-700 ml-[5px] hover:underline"
              >
                Войти
              </button>
            </div>

            <img
              src="/peek1.png"
              className="absolute w-[170px] top-0 left-0 mt-[-106px]"
            />
          </div>
        </div>
      )}
    </main>
  );
}
