// frontend/components/Login.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useContactStore from "@/store/states";
import { apiFetch } from "@/lib/api";
import { X, Eye, EyeOff } from "lucide-react";

function getRussianErrorMessage(error: string): string {
  const errorMap: Record<string, string> = {
    "Invalid credentials": "Неверный email или пароль",
    "User not found": "Пользователь не найден",
    "Email not confirmed": "Подтвердите ваш email",
    "Too many login attempts": "Слишком много попыток. Подождите 1 час",
    "email rate limit exceeded": "Слишком много попыток. Подождите 1 час",
    "Incorrect password": "Неверный пароль",
    "Failed to log in": "Не удалось войти. Проверьте данные",
    "Session expired": "Сессия истекла, войдите снова",
    "Too many requests": "Слишком много попыток. Подождите 1 минуту",
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
    login,
    checkAuth, // 🔥 Добавляем checkAuth
  } = useContactStore();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    if (loginState) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setError(null);
      setFormData({ email: "", password: "" });
    }
  }, [loginState]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError(null);

    if (!formData.email || !formData.password) {
      setError("Заполните все поля");
      setLoading(false);
      return;
    }

    try {
      // 🔥 Логин через store
      await login(formData.email, formData.password);

      // 🔥 Обновляем состояние авторизации
      await checkAuth();

      // Закрываем модалку
      toggleLogin();

      // 🔥 Редирект с обновлением состояния
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const rawMessage =
        err instanceof Error ? err.message : "Failed to log in";

      if (rawMessage.includes("Too many requests")) {
        setError("Слишком много попыток входа. Подождите 1 минуту");
      } else {
        setError(getRussianErrorMessage(rawMessage));
      }

      setLoading(false);
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

            <p className="h-[15px] smaller-text mt-[10px] text-center text-red-700">
              {error || ""}
            </p>

            <button
              type="submit"
              className="w-[80%] h-[40px] mt-[20px] bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Входим..
                </span>
              ) : (
                "Войти"
              )}
            </button>
          </form>

          <div className="mt-[10px] flex">
            <p>Нет аккаунта?</p>
            <p
              className="font-semibold text-blue-700 cursor-pointer ml-[5px] hover:text-blue-800 transition-colors"
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
