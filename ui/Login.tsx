"use client";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import useContactStore from "@/store/states";
import { X, Eye, EyeOff } from "lucide-react";
export default function Signup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const {
    loginState,
    toggleLogin,
    passwordState,
    togglePassword,
    openLogin,
    openRegister,
  } = useContactStore();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null); // Clear errors on type
  };
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      setSuccess(true);
      router.refresh();
    } catch (err: unknown) {
      const rawMessage =
        err instanceof Error ? err.message : "Failed to log in";

      const russianMessage = getRussianErrorMessage(rawMessage);

      setError(russianMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    window.location.reload();
  }

  return (
    <main>
      {loginState && (
        <div className="w-full z-23 overflow-x-hidden absolute h-full backdrop-blur-xs bg-gray-100 flex justify-center  flex-1">
          <div className="bg-white shadow-xs text-black relative w-[80%] max-w-[500px] h-[430px]  ord-text rounded-xl flex flex-col items-center  mt-[50px] md:mt-[100px] p-[20px]">
            <div className="w-full flex justify-end  ">
              <X
                className="cursor-pointer w-[17px] h-[17px] text-gray-400"
                onClick={toggleLogin}
              ></X>
            </div>
            <div className="bigger-text font-semibold border-b-[1px] border-b-gray-300 pb-[10px] ">
              Привет! Мы по тебе скучали
            </div>
            <form
              onSubmit={handleLogin}
              className="w-full max-w-[400px] flex flex-col items-center "
            >
              <div className="flex flex-col min-w-full mt-[20px]">
                <label className="ml-[10px] font-semibold">Ваш email</label>
                <div className="w-full  bg-white mt-[5px] h-[40px] p-[10px] px-[20px] overflow-x-auto overflow-y-hidden border-[1px] border-gray-300 flex items-center rounded-lg">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className=" w-full  outline-none "
                    placeholder="mao@gmail.com"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col min-w-full mt-[20px]">
                <label className="ml-[10px] font-semibold">Ваш пароль</label>
                <div className="w-full  bg-white mt-[5px] h-[40px] p-[10px] px-[20px] overflow-x-auto overflow-y-hidden border-[1px] border-gray-300 flex items-center rounded-lg">
                  <input
                    type={passwordState ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className=" w-full  outline-none "
                    minLength={6}
                  />
                  <Eye
                    onClick={togglePassword}
                    className={` ${passwordState ? "" : "hidden"}  cursor-pointer text-gray-400 w-[20px] h-[20px]`}
                  ></Eye>
                  <EyeOff
                    onClick={togglePassword}
                    className={` ${passwordState ? "hidden" : ""}  cursor-pointer text-gray-400 w-[20px] h-[20px]`}
                  ></EyeOff>
                </div>
                <div className="flex items-end justify-end">
                  <p className="  text-blue-700 smaller-text cursor-pointer font-semibold mt-[10px]">
                    Забыли пароль?
                  </p>
                </div>
              </div>

              <p className="h-[15px] smaller-text text-center text-red-700">
                {error || ""}
              </p>

              <button
                type="submit"
                className="w-[80%] h-[40px] mt-[30px] bg-purple-500 text-white rounded-lg"
                disabled={loading}
              >
                {loading ? "Входим.." : "Войти"}
              </button>
            </form>

            <div className="mt-[10px] flex">
              <p>Нет аккаунта?</p>
              <p
                className="font-semibold text-blue-700 cursor-pointer ml-[5px]"
                onClick={openRegister}
              >
                Зарегистрироваться
              </p>
            </div>
            <img
              src="/peek1.png"
              className="absolute w-[170px] top-0 left-0 mt-[-106px] "
            />
          </div>{" "}
        </div>
      )}
    </main>
  );
}
