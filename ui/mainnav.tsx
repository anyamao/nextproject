"use client";
import Contact from "./contact";
import Register from "./register";
import MainNavigation from "./mainnavigation";
import useContactStore from "@/store/states";
import Link from "next/link";
import { Flame } from "lucide-react";
import Image from "next/image";
function Mainnav() {
  const { navigationState, closeEverything, toggleNavigation } =
    useContactStore();

  return (
    <main
      className={`w-full bg-white fixed  border-b-[1px] z-21 ${navigationState ? "shadow-none" : "shadow-xs"}  border-gray-200 flex items-center justify-center px-[20px]  `}
    >
      <div className="  w-full max-w-[1200px] h-[120px] items-center   flex-1   flex flex-col">
        <div className="flex flex-row w-full flex-1 items-center   mt-[15px] justify-between">
          <div className="flex flex-row justify-between items-center ">
            <Link href="/">
              {" "}
              <img
                src="/text2.png"
                className="md:w-[160px] w-[100px]  cursor-pointer"
              />
            </Link>
            <MainNavigation></MainNavigation>
          </div>
          <div className="flex flex-row justify-between   items-center  pr-[10px] ">
            <Contact></Contact>
            <div className="flex hidden sm:block items-center justify-center p-[7px] bg-orange-100 rounded-full mr-[13px]">
              <Flame className="text-orange-400 w-[20px] h-[20px]"></Flame>
            </div>
            <Register></Register>
          </div>
        </div>
        <div className=" flex overflow-x-scroll  overflow-y-hidden w-full scrollbar-thin scrollbar-thumb-white scrollbar-track-white sm:justify-center   mb-[10px] flex-row smaller-text  p-[10px] pb-[15px]   sm:items-center">
          {" "}
          <Link
            href="/chats"
            onClick={closeEverything}
            className="hover:text-blue-500 whitespace-nowrap hidden duration-300"
          >
            Общаться
          </Link>
          <Link
            href="/english"
            onClick={closeEverything}
            className="hover:text-blue-500 whitespace-nowrap  ml-[20px] duration-300"
          >
            ⭐Кружок английского &apos;Шэкспир&apos;
          </Link>
          <Link
            href="/languages"
            onClick={closeEverything}
            className=" ml-[20px] whitespace-nowrap  hover:text-blue-500 duration-300"
          >
            Учить языки
          </Link>
          <Link
            href="/ege"
            onClick={closeEverything}
            className="ml-[20px] hover:text-blue-500  whitespace-nowrap  duration-300"
          >
            Подготовиться к ЕГЭ
          </Link>
          <Link
            href="/courses"
            onClick={closeEverything}
            className="ml-[20px] hover:text-blue-500    whitespace-nowrap  duration-300"
          >
            Разные курсы
          </Link>
          {" "}
          <Link
            href="/languages"
            onClick={closeEverything}
            className=" ml-[20px] whitespace-nowrap  hover:text-blue-500 duration-300"
          >
            Олимпиадное программирование
          </Link>
          <Link
            href=""
            onClick={closeEverything}
            className="ml-[20px] hover:text-blue-500  whitespace-nowrap   duration-300"
          >
            Статьи
          </Link>
        </div>
      </div>
    </main>
  );
}

export default Mainnav;
