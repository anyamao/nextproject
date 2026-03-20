import Contact from "./contact";
import Register from "./register";
import MainNavigation from "./mainnavigation";
import useContactStore from "@/store/states";
import Link from "next/link";
import Image from "next/image";
function mainnav() {
  return (
    <main>
      <div className="border-b-[1px] shadow-xs border-b-gray-300 min-w-screen   min-h-[120px] items-center justify-center   px-[50px] flex flex-col">
        <div className="flex flex-row w-full max-w-[1300px] h-[100px] flex-1 items-center   mt-[15px] justify-between">
          <div className="flex flex-row justify-between items-center w-[350px] ">
            <Link href="/">
              {" "}
              <img
                src="/Telegram Desktop/text2.png"
                className="w-[200px] cursor-pointer"
              />
            </Link>
            <MainNavigation></MainNavigation>
          </div>
          <div className="flex flex-row justify-between ml-[30px] items-center min-w-[180px] pr-[10px] ">
            <Contact></Contact>

            <Register></Register>
          </div>
        </div>
        <div className="flex px-[20px] flex-row h-[60px] w-full max-w-[1300px] justify-center items-center">
          {" "}
          <Link href="/english" className="hover:text-blue-500  duration-300">
            ⭐Кружок английского &apos;Шэкспир&apos;
          </Link>
          <Link
            href="/english"
            className=" ml-[20px] hover:text-blue-500 duration-300"
          >
            Английский
          </Link>
          <Link
            href="/maths"
            className="ml-[20px] hover:text-blue-500 duration-300"
          >
            Математика
          </Link>
        </div>
      </div>
    </main>
  );
}

export default mainnav;
