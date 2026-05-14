"use client";
import Contact from "./contact";
import Register from "./register";
import MainNavigation from "./mainnavigation";
import useContactStore from "@/store/states";
import Link from "next/link";
import { Flame, PawPrint, Cat, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTokens } from "@/hooks/useTokens";
import { Tooltip } from "react-tooltip";

function Mainnav() {
  const { navigationState, closeEverything, toggleNavigation } =
    useContactStore();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Перенаправляем на страницу курсов с поисковым запросом
      router.push(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery(""); // Опционально: очистить поле после поиска
    } else {
      // Если запрос пустой, просто переходим на страницу курсов
      router.push("/courses");
    }
  };
  const tokenBalance = useContactStore((state) => state.tokenBalance);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <main
      className={`w-full bg-white fixed border-b-[1px] z-21 ${navigationState ? "shadow-none" : "shadow-xs"} border-gray-200 flex items-center justify-center px-[20px]`}
    >
      <div className="w-full max-w-[1200px] h-[120px] items-center flex-1 flex flex-col">
        <div className="flex flex-row w-full flex-1 items-center mt-[15px] justify-between">
          <div className="flex flex-row justify-between items-center">
            <Link href="/">
              <img
                src="/text2.png"
                className="md:w-[160px] w-[100px] cursor-pointer"
                alt="Logo"
              />
            </Link>
            <MainNavigation />
          </div>

          <div
            className={` flex-row flex-1 border-[1px] justify-between items-center px-[5px] hidden md:flex rounded-lg h-[35px] mx-[10px] ${
              searchQuery.trim() ? "border-gray-400 " : "border-gray-300"
            }`}
          >
            <div className=" p-[10px] border-gray-200 hidden md:flex rounded-lg w-full">
              <input
                type="text"
                className="outline-none ring-none w-full text-xs"
                placeholder="Ищи курсы по имени.."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
            <button
              onClick={handleSearch}
              className="cursor-pointer"
              aria-label="Поиск"
            >
              <Search
                className={`w-7 h-7 p-1.5 rounded-lg  transition ${
                  searchQuery.trim()
                    ? "bg-gray-900 text-white"
                    : " text-gray-900"
                }`}
              />
            </button>
          </div>
          <div className="flex flex-row justify-between items-center pr-[10px]">
            <Contact />

            <div className="relative group">
              <div className="flex hidden sm:block items-center justify-center p-[7px] bg-yellow-500 rounded-full mr-[13px] ">
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  <PawPrint className="w-4 h-4" />
                  {tokenBalance}
                </span>
              </div>

              {/* 🔹 Подсказка при наведении - показываем СНИЗУ */}
            </div>

            <Register />
          </div>
        </div>

        <div className="flex overflow-x-auto overflow-y-hidden w-full scrollbar-thin scrollbar-thumb-white scrollbar-track-white sm:justify-center mb-[10px] flex-row smaller-text p-[10px] pb-[15px] sm:items-center">
          <Link
            href="/courses"
            onClick={closeEverything}
            className="ml-[20px] hover:text-blue-500 whitespace-nowrap duration-300"
          >
            Разные курсы
          </Link>
          <Link
            href="/courses/my"
            onClick={closeEverything}
            className="ml-[20px] hover:text-blue-500 whitespace-nowrap duration-300"
          >
            Мои курсы
          </Link>

          <Link
            href="/articles"
            onClick={closeEverything}
            className="ml-[20px] hover:text-blue-500 whitespace-nowrap duration-300"
          >
            Статьи
          </Link>
          <Link
            href="/shop"
            onClick={closeEverything}
            className="ml-[20px] hover:text-blue-500 whitespace-nowrap duration-300"
          >
            Магазин
          </Link>
        </div>
      </div>
    </main>
  );
}

export default Mainnav;
