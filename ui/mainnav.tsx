"use client";
import Contact from "./contact";
import Register from "./register";
import MainNavigation from "./mainnavigation";
import useContactStore from "@/store/states";
import Link from "next/link";
import Image from "next/image";
function Mainnav() {
  const {
    navigationState,
    closeNavigation,
    closeEverything,
    toggleNavigation,
  } = useContactStore();

  return (
    <main
      className={`w-full  border-b-[1px] z-20 ${navigationState ? "shadow-none" : "shadow-xs"}  border-gray-200 flex items-center justify-center px-[20px]  `}
    >
      <div className="  w-full max-w-[1200px] max-h-[120px] items-center   flex-1   flex flex-col">
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

            <Register></Register>
          </div>
        </div>
        <div className=" flex overflow-x-scroll  overflow-y-hidden w-full scrollbar-thin scrollbar-thumb-white scrollbar-track-white    mb-[10px] flex-row smaller-text  p-[10px] pb-[15px]   items-center">
          {" "}
          <Link
            href="/english"
            onClick={closeEverything}
            className="hover:text-blue-500 whitespace-nowrap duration-300"
          >
            ⭐Кружок английского &apos;Шэкспир&apos;
          </Link>
          <Link
            href="/english/A2"
            onClick={closeEverything}
            className=" ml-[20px] whitespace-nowrap  hover:text-blue-500 duration-300"
          >
            🔥Бесплатные материалы
          </Link>
          <Link
            href="/english"
            onClick={closeEverything}
            className=" ml-[20px] whitespace-nowrap  hover:text-blue-500 duration-300"
          >
            Английский
          </Link>
          <Link
            href="/maths"
            onClick={closeEverything}
            className="ml-[20px] hover:text-blue-500  whitespace-nowrap  duration-300"
          >
            Математика
          </Link>
          <Link
            href="/maths"
            onClick={closeEverything}
            className="ml-[20px] hover:text-blue-500    whitespace-nowrap  duration-300"
          >
            Программирование
          </Link>
          <Link
            href="/maths"
            onClick={closeEverything}
            className="ml-[20px] hover:text-blue-500    whitespace-nowrap   duration-300"
          >
            Инженерия
          </Link>
          <Link
            href="/maths"
            onClick={closeEverything}
            className="ml-[20px] hover:text-blue-500   whitespace-nowrap   duration-300"
          >
            Физика
          </Link>
          <Link
            href="/maths"
            onClick={closeEverything}
            className="ml-[20px] hover:text-blue-500  whitespace-nowrap   duration-300"
          >
            Китайский
          </Link>
          <Link
            href="/maths"
            onClick={closeEverything}
            className="ml-[20px] hover:text-blue-500  whitespace-nowrap   duration-300"
          >
            Немецкий
          </Link>
          {" "}
          <Link
            href="/maths"
            onClick={closeEverything}
            className="ml-[20px] hover:text-blue-500  whitespace-nowrap   duration-300"
          >
            Анализ данных
          </Link>
          <Link
            href="/maths"
            onClick={closeEverything}
            className="ml-[20px] hover:text-blue-500 whitespace-nowrap   duration-300"
          >
            Русский
          </Link>
        </div>
      </div>
    </main>
  );
}

export default Mainnav;
