"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useContactStore from "@/store/states";
import { apiFetch } from "@/lib/api";
import { X, Eye, EyeOff } from "lucide-react";

function getRussianErrorMessage(error: string): string {
  const errorMap: Record<string, string> = {
    "User already registered": "Этот email уже зарегистрирован",
    "Username already taken": "Этот юзернейм уже занят",
    "Failed to sign up": "Не удалось зарегистрироваться. Попробуйте позже",
  };
  return errorMap[error] || "Произошла ошибка. Попробуйте ещё раз";
}

export default function Signup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 🔐 Валидация (убран конфликт 36/72, оставлено логичное ограничение)
    if (formData.password.length < 6) {
      setError("Пароль должен быть минимум 6 символов");
      setLoading(false);
      return;
    }
    if (formData.password.length > 128) {
      setError("Пароль слишком длинный (макс. 128 символов)");
      setLoading(false);
      return;
    }
    if (formData.username.length < 3) {
      setError("Юзернейм должен быть минимум 3 символа");
      setLoading(false);
      return;
    }

    try {
      const data = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          username: formData.username,
        }),
      });
      if (!data?.user) {
        throw new Error("No user data in response");
      }
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser({
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        avatar_url: data.user.avatar_url || "default_cat.jpg", // ✅ Обязательно!
        status: data.user.status,
      });
      setSuccess(true);
      toggleRegister();
    } catch (err: unknown) {
      const rawMessage =
        err instanceof Error ? err.message : "Failed to sign up";
      setError(getRussianErrorMessage(rawMessage));
    } finally {
      setLoading(false);
    }
  };

  // ✅ Экран успеха
  if (success) {
    return (
      <main>
        {registerState && (
          <div className="w-full z-23 absolute h-full backdrop-blur-xs bg-gray-100 flex justify-center flex-1">
            <div className="bg-white shadow-xs text-black relative w-[90%] max-w-[550px] h-[450px] ord-text rounded-xl flex flex-col items-center mt-[50px] md:mt-[100px] p-[20px]">
              <div className="w-full flex justify-end">
                <X
                  className="cursor-pointer w-[17px] h-[17px] text-gray-400"
                  onClick={toggleRegister}
                />
              </div>
              <div className="bigger-text flex flex-col items-center pb-[10px]">
                <p>
                  Успешно! Аккаунт создан для{" "}
                  <span className="font-semibold inline pl-[5px]">
                    {formData.email || ""}
                  </span>
                </p>
                <div className="mt-[10px] ord-text bg-purple-100 rounded-xl p-[10px] flex items-center justify-center text-center">
                  Теперь вы можете войти на сайт
                </div>
                <img
                  src="/congratulations.jpg"
                  className="mt-[20px] w-[300px]"
                  alt="Success"
                />
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }
  return (
    <main>
      {registerState && (
        <div className="w-full z-23 overflow-x-hidden absolute h-full backdrop-blur-xs bg-gray-100 flex justify-center flex-1">
          <div className="bg-white shadow-xs text-black relative w-[80%] max-w-[500px] h-[520px] ord-text rounded-xl flex flex-col items-center mt-[50px] md:mt-[100px] p-[20px]">
            <div className="w-full flex justify-end">
              <X
                className="cursor-pointer w-[17px] h-[17px] text-gray-400"
                onClick={toggleRegister}
              />
            </div>
            <div className="bigger-text font-semibold border-b-[1px] border-b-gray-300 pb-[10px]">
              Добро пожаловать! Впишите свои данные
            </div>
            <form
              onSubmit={handleSignup}
              className="w-full max-w-[400px] flex flex-col items-center"
            >
              <div className="flex flex-col min-w-full mt-[25px]">
                <label className="ml-[10px] font-semibold">
                  Придумайте юзернейм
                </label>
                <div className="w-full bg-white mt-[5px] h-[40px] p-[10px] px-[20px] overflow-x-auto overflow-y-hidden border-[1px] border-gray-300 flex items-center rounded-lg">
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="maotop"
                    required
                    className="w-full outline-none"
                    minLength={3}
                  />
                </div>
              </div>

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
                <label className="ml-[10px] font-semibold">
                  Придумайте пароль
                </label>
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
              </div>

              <p className="h-[15px] smaller-text mt-[15px] text-center text-red-700">
                {error || ""}
              </p>

              <button
                type="submit"
                className="w-[80%] h-[40px] mt-[20px] bg-purple-500 text-white rounded-lg"
                disabled={loading}
              >
                {loading ? "Регистрируем.." : "Зарегистрироваться"}
              </button>
            </form>

            <div className="mt-[10px] flex items-center">
              <p>Уже есть аккаунт? </p>
              <p
                className="font-semibold ml-[5px] cursor-pointer text-blue-700"
                onClick={openLogin}
              >
                Войти
              </p>
            </div>
            <img
              src="/peek2.png"
              className="absolute w-[200px] right-0 mr-[-183px] top-0 mt-[30px]"
              alt="Decor"
            />
          </div>
        </div>
      )}
    </main>
  );
}
