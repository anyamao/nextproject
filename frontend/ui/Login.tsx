// frontend/components/Login.tsx — твой оригинальный код + 2 правки
"use client";

import { useState, useEffect } from "react"; // 🔥 ПРАВКА 1: добавил useEffect
import { useRouter } from "next/navigation";
import useContactStore from "@/store/states";
import { X, Eye, EyeOff } from "lucide-react";

// ✅ Вынесем утилиту в отдельный файл позже, пока оставим здесь
function getRussianErrorMessage(error: string): string {
  const errorMap: Record<string, string> = {
    "User already registered": "Этот email уже зарегистрирован",
    "email rate limit exceeded": "Слишком много попыток. Подождите 1 час",
    "Invalid login credentials": "Неверный email или пароль",
    "Email not confirmed": "Подтвердите ваш email",
    'duplicate key value violates unique constraint "profiles_username_key"':
      "Этот юзернейм уже занят",
    'new row for relation "profiles" violates check constraint "username_length"':
      "Юзернейм должен быть минимум 3 символа",
    "Failed to sign up": "Не удалось зарегистрироваться. Попробуйте позже",
    "Failed to log in": "Не удалось войти. Проверьте данные",
  };
  return errorMap[error] || "Произошла ошибка. Попробуйте ещё раз";
}

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    loginState,
    toggleLogin,
    passwordState,
    togglePassword,
    openRegister,
    toggleforgotpassword,
    setUser,
  } = useContactStore();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // 🔥 ПРАВКА 1: Скролл наверх при открытии модалки
  useEffect(() => {
    if (loginState) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [loginState]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // ✅ Используем apiFetch или прямой fetch с правильным URL и JSON
      const BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3010";

      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // ✅ JSON, не form-data!
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to log in");
      }

      // ✅ Сохраняем токен и пользователя
      // ✅ Сохраняем токен и пользователя
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser({
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        avatar_url: data.user.avatar_url || "default_cat.jpg", // ✅ Обязательно!
        status: data.user.status,
      });
      // ✅ Закрываем модалку
      toggleLogin();

      // 🔥 ПРАВКА 2: Полная перезагрузка ТЕКУЩЕЙ страницы (не редирект!)
      window.location.reload();
    } catch (err: unknown) {
      const rawMessage =
        err instanceof Error ? err.message : "Failed to log in";
      setError(getRussianErrorMessage(rawMessage));
    } finally {
      setLoading(false);
    }
  };

  if (!loginState) return null;

  return (
    <main>
      <div className="w-full z-23 overflow-x-hidden absolute h-full backdrop-blur-xs bg-gray-100 flex justify-center flex-1">
        <div className="bg-white shadow-xs text-black relative w-[80%] max-w-[500px] h-[430px] ord-text rounded-xl flex flex-col items-center mt-[50px] md:mt-[100px] p-[20px]">
          <div className="w-full flex justify-end">
            <X
              className="cursor-pointer w-[17px] h-[17px] text-gray-400"
              onClick={toggleLogin}
            />
          </div>
          <div className="bigger-text font-semibold border-b-[1px] border-b-gray-300 pb-[10px]">
            Привет! Мы по тебе скучали
          </div>

          <form
            onSubmit={handleLogin}
            className="w-full max-w-[400px] flex flex-col items-center"
          >
            {/* Email */}
            <div className="flex flex-col min-w-full mt-[20px]">
              <label className="ml-[10px] font-semibold">Ваш email</label>
              <div className="w-full bg-white mt-[5px] h-[40px] p-[10px] px-[20px] overflow-x-auto overflow-y-hidden border-[1px] border-gray-300 flex items-center rounded-lg">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full outline-none"
                  placeholder="mao@gmail.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col min-w-full mt-[20px]">
              <label className="ml-[10px] font-semibold">Ваш пароль</label>
              <div className="w-full bg-white mt-[5px] h-[40px] p-[10px] px-[20px] overflow-x-auto overflow-y-hidden border-[1px] border-gray-300 flex items-center rounded-lg">
                <input
                  type={passwordState ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full outline-none"
                  minLength={6}
                />
                <Eye
                  onClick={togglePassword}
                  className={`${passwordState ? "" : "hidden"} cursor-pointer text-gray-400 w-[20px] h-[20px]`}
                />
                <EyeOff
                  onClick={togglePassword}
                  className={`${passwordState ? "hidden" : ""} cursor-pointer text-gray-400 w-[20px] h-[20px]`}
                />
              </div>
              <div className="flex items-end justify-end w-full">
                <p
                  onClick={() => {
                    toggleLogin();
                    toggleforgotpassword();
                  }}
                  className="text-blue-700 smaller-text cursor-pointer font-semibold mt-[10px]"
                >
                  Забыли пароль?
                </p>
              </div>
            </div>

            {/* Error */}
            <p className="h-[15px] smaller-text mt-[10px] text-center text-red-700">
              {error || ""}
            </p>

            {/* Submit */}
            <button
              type="submit"
              className="w-[80%] h-[40px] mt-[20px] bg-purple-500 text-white rounded-lg disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Входим.." : "Войти"}
            </button>
          </form>

          {/* Register link */}
          <div className="mt-[10px] flex">
            <p>Нет аккаунта?</p>
            <p
              className="font-semibold text-blue-700 cursor-pointer ml-[5px]"
              onClick={() => {
                toggleLogin();
                openRegister();
              }}
            >
              Зарегистрироваться
            </p>
          </div>

          <img
            src="/peek1.png"
            className="absolute w-[170px] top-0 left-0 mt-[-106px]"
            alt="Decor"
          />
        </div>
      </div>
    </main>
  );
}
