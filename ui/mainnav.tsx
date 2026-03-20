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
    <main>
      <div className="border-b-[1px] shadow-xs border-b-gray-300 min-w-screen md:ml-[0px] ml-[-40px]  min-h-[120px] items-center justify-center   md:px-[50px]  flex flex-col">
        <div className="flex flex-row w-full  md:max-w-[1300px] max-w-[550px] h-[100px] flex-1 items-center   mt-[15px] justify-between">
          <div className="flex flex-row justify-between items-center w-[350px] ">
            <Link href="/">
              {" "}
              <img src="/text2.png" className="w-[200px] cursor-pointer" />
            </Link>
            <MainNavigation></MainNavigation>
          </div>
          <div className="flex flex-row justify-between ml-[30px] items-center min-w-[180px] pr-[10px] ">
            <Contact></Contact>

            <Register></Register>
          </div>
        </div>
        <div className=" flex overflow-auto md:px-[20px] mb-[10px] flex-row h-[60px] max-w-[550px] md:max-w-[1300px]  md:justify-center items-center">
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
            className="ml-[20px] hover:text-blue-500 duration-300"
          >
            Математика
          </Link>
        </div>
      </div>
    </main>
  );
}

export default Mainnav;
