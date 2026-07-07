// frontend/components/Signup.tsx

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import useContactStore from "@/store/states";
import { apiFetch } from "@/lib/api";
import { X, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";

// ====== ВАЛИДАЦИЯ ======
const validators = {
  email: (email: string) => {
    if (!email) return null;
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!regex.test(email)) return "Введите корректный email";
    return null;
  },
  username: (username: string) => {
    if (!username) return null;
    if (username.length < 3) return "Минимум 3 символа";
    if (username.length > 30) return "Максимум 30 символов";
    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      return "Только буквы, цифры, _, . и -";
    }
    if (
      ["admin", "root", "system", "moderator"].includes(username.toLowerCase())
    ) {
      return "Этот username зарезервирован";
    }
    return null;
  },
  password: (password: string) => {
    if (!password) return null;
    if (password.length < 8) return "Минимум 8 символов";
    if (password.length > 128) return "Максимум 128 символов";
    if (!/[A-Z]/.test(password)) return "Добавьте заглавную букву";
    if (!/[a-z]/.test(password)) return "Добавьте строчную букву";
    if (!/\d/.test(password)) return "Добавьте цифру";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return "Добавьте спецсимвол";
    }
    return null;
  },
};

// ====== ИНДИКАТОР СИЛЫ ПАРОЛЯ ======
const PasswordStrength = ({ password }: { password: string }) => {
  const getStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    return score;
  };

  const strength = getStrength();
  const colors = [
    "bg-gray-200",
    "bg-red-500",
    "bg-yellow-500",
    "bg-green-500",
    "bg-green-600",
  ];
  const labels = ["", "Слабый", "Средний", "Надежный", "Очень надежный"];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 h-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`flex-1 rounded transition-colors ${
              i < strength ? colors[strength] : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <p
        className={`text-xs mt-0.5 ${
          strength === 0
            ? "text-gray-400"
            : strength === 1
              ? "text-red-500"
              : strength === 2
                ? "text-yellow-500"
                : "text-green-500"
        }`}
      >
        {labels[strength]}
      </p>
    </div>
  );
};

// ====== ОШИБКИ ======
function getRussianErrorMessage(error: string): string {
  const errorMap: Record<string, string> = {
    "User already registered": "Этот email уже зарегистрирован",
    "Username already taken": "Этот юзернейм уже занят",
    "Password too weak": "Пароль слишком простой",
    "Invalid email": "Неверный формат email",
    "Email not verified": "Email не подтвержден",
    "Registration failed. Please try again.":
      "Ошибка регистрации. Попробуйте позже",
    "Failed to sign up": "Не удалось зарегистрироваться. Попробуйте позже",
  };
  return errorMap[error] || "Произошла ошибка. Попробуйте ещё раз";
}

// ====== ОСНОВНОЙ КОМПОНЕНТ ======
export default function Signup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>(
    {},
  );

  const {
    registerState,
    openLogin,
    toggleRegister,
    passwordState,
    togglePassword,
    // 🔥 НЕ ИСПОЛЬЗУЕМ setUser и checkAuth, делаем сами
  } = useContactStore();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
  });

  // ====== ВАЛИДАЦИЯ ======
  const validateField = useCallback((name: string, value: string) => {
    let error = null;
    if (name === "email") error = validators.email(value);
    else if (name === "username") error = validators.username(value);
    else if (name === "password") error = validators.password(value);

    setFieldErrors((prev) => ({ ...prev, [name]: error }));
    return error;
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);

    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const validateForm = () => {
    const fields = ["email", "username", "password"];
    let isValid = true;

    fields.forEach((field) => {
      const value = formData[field as keyof typeof formData];
      const error = validateField(field, value);
      setTouched((prev) => ({ ...prev, [field]: true }));
      if (error) isValid = false;
    });

    return isValid;
  };

  // ====== РЕГИСТРАЦИЯ ======
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      // 🔥 РЕГИСТРАЦИЯ
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

      // 🔥 СОХРАНЯЕМ ПОЛЬЗОВАТЕЛЯ В STORE НАПРЯМУЮ
      // Используем setUser из store
      useContactStore.setState((state) => ({
        ...state,
        user: {
          id: data.user.id,
          email: data.user.email,
          username: data.user.username,
          avatar_url: data.user.avatar_url || "default_cat.jpg",
          status: data.user.status,
        },
        isAuthenticated: true,
        isLoading: false,
      }));

      // 🔥 Также сохраняем в localStorage для персистентности
      if (typeof window !== "undefined") {
        const userData = {
          id: data.user.id,
          email: data.user.email,
          username: data.user.username,
          avatar_url: data.user.avatar_url || "default_cat.jpg",
          status: data.user.status,
        };
        localStorage.setItem("user", JSON.stringify(userData));
        // Сохраняем в maoschool-storage напрямую
        const storageData = {
          state: {
            tokenBalance: 0,
            user: userData,
            isAuthenticated: true,
          },
          version: 0,
        };
        localStorage.setItem("maoschool-storage", JSON.stringify(storageData));
      }

      setSuccess(true);

      setTimeout(() => {
        toggleRegister();
        router.push("/dashboard");
        router.refresh();
      }, 2000);
    } catch (err: unknown) {
      const rawMessage =
        err instanceof Error ? err.message : "Failed to sign up";
      setError(getRussianErrorMessage(rawMessage));
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  // ====== УСПЕШНАЯ РЕГИСТРАЦИЯ ======
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

  // ====== ФОРМА РЕГИСТРАЦИИ ======
  return (
    <main>
      {registerState && (
        <div className="w-full z-23 overflow-x-hidden absolute h-full backdrop-blur-xs bg-gray-100 flex justify-center flex-1">
          <div className="bg-white shadow-xs text-black relative w-[80%] max-w-[500px] h-[560px] ord-text rounded-xl flex flex-col items-center mt-[50px] md:mt-[100px] p-[20px]">
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
              {/* USERNAME */}
              <div className="flex flex-col min-w-full mt-[25px]">
                <label className="ml-[10px] font-semibold">
                  Придумайте юзернейм
                </label>
                <div
                  className={`w-full bg-white mt-[5px] h-[40px] p-[10px] px-[20px] overflow-x-auto overflow-y-hidden border-[1px] flex items-center rounded-lg transition-colors ${
                    touched.username && fieldErrors.username
                      ? "border-red-500 ring-1 ring-red-500"
                      : touched.username &&
                          !fieldErrors.username &&
                          formData.username
                        ? "border-green-500 ring-1 ring-green-500"
                        : "border-gray-300"
                  }`}
                >
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="maotop"
                    required
                    className="w-full outline-none"
                    minLength={3}
                    maxLength={30}
                  />
                  {touched.username &&
                    !fieldErrors.username &&
                    formData.username && (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    )}
                </div>
                {touched.username && fieldErrors.username && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {fieldErrors.username}
                  </p>
                )}
                {touched.username &&
                  !fieldErrors.username &&
                  formData.username && (
                    <p className="mt-1 text-xs text-green-500 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Доступно
                    </p>
                  )}
              </div>

              {/* EMAIL */}
              <div className="flex flex-col min-w-full mt-[20px]">
                <label className="ml-[10px] font-semibold">Ваш email</label>
                <div
                  className={`w-full bg-white mt-[5px] h-[40px] p-[10px] px-[20px] overflow-x-auto overflow-y-hidden border-[1px] flex items-center rounded-lg transition-colors ${
                    touched.email && fieldErrors.email
                      ? "border-red-500 ring-1 ring-red-500"
                      : touched.email && !fieldErrors.email && formData.email
                        ? "border-green-500 ring-1 ring-green-500"
                        : "border-gray-300"
                  }`}
                >
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full outline-none"
                    placeholder="mao@gmail.com"
                    required
                  />
                  {touched.email && !fieldErrors.email && formData.email && (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  )}
                </div>
                {touched.email && fieldErrors.email && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* PASSWORD */}
              <div className="flex flex-col min-w-full mt-[20px]">
                <label className="ml-[10px] font-semibold">
                  Придумайте пароль
                </label>
                <div
                  className={`w-full bg-white mt-[5px] h-[40px] p-[10px] px-[20px] overflow-x-auto overflow-y-hidden border-[1px] flex items-center rounded-lg transition-colors ${
                    touched.password && fieldErrors.password
                      ? "border-red-500 ring-1 ring-red-500"
                      : touched.password &&
                          !fieldErrors.password &&
                          formData.password
                        ? "border-green-500 ring-1 ring-green-500"
                        : "border-gray-300"
                  }`}
                >
                  <input
                    type={passwordState ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="••••••••"
                    required
                    className="w-full outline-none"
                    minLength={8}
                    maxLength={128}
                  />
                  <button
                    type="button"
                    onClick={togglePassword}
                    className="flex-shrink-0"
                  >
                    {passwordState ? (
                      <EyeOff className="cursor-pointer text-gray-400 w-[20px] h-[20px] hover:text-gray-600 transition-colors" />
                    ) : (
                      <Eye className="cursor-pointer text-gray-400 w-[20px] h-[20px] hover:text-gray-600 transition-colors" />
                    )}
                  </button>
                </div>
                {touched.password && fieldErrors.password && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {fieldErrors.password}
                  </p>
                )}

                <PasswordStrength password={formData.password} />

                {touched.password &&
                  !fieldErrors.password &&
                  formData.password && (
                    <div className="mt-1 text-xs text-gray-500 space-y-0.5">
                      <p
                        className={
                          formData.password.length >= 8 ? "text-green-600" : ""
                        }
                      >
                        • {formData.password.length >= 8 ? "✓" : "—"} Минимум 8
                        символов
                      </p>
                      <p
                        className={
                          /[A-Z]/.test(formData.password) &&
                          /[a-z]/.test(formData.password)
                            ? "text-green-600"
                            : ""
                        }
                      >
                        •{" "}
                        {/[A-Z]/.test(formData.password) &&
                        /[a-z]/.test(formData.password)
                          ? "✓"
                          : "—"}{" "}
                        Заглавные и строчные буквы
                      </p>
                      <p
                        className={
                          /\d/.test(formData.password) ? "text-green-600" : ""
                        }
                      >
                        • {/\d/.test(formData.password) ? "✓" : "—"} Цифра
                      </p>
                      <p
                        className={
                          /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
                            ? "text-green-600"
                            : ""
                        }
                      >
                        •{" "}
                        {/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
                          ? "✓"
                          : "—"}{" "}
                        Спецсимвол
                      </p>
                    </div>
                  )}
              </div>

              <p className="h-[15px] smaller-text mt-[15px] text-center text-red-700">
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
                    Регистрируем..
                  </span>
                ) : (
                  "Зарегистрироваться"
                )}
              </button>
            </form>

            <div className="mt-[10px] flex items-center">
              <p>Уже есть аккаунт? </p>
              <p
                className="font-semibold ml-[5px] cursor-pointer text-blue-700 hover:text-blue-800 transition-colors"
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
