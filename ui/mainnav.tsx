import Contact from "./contact";
import Register from "./register";
import MainNavigation from "./mainnavigation";

import Link from "next/link";
import Image from "next/image";
function mainnav() {
  return (
    <div className="border-b-[1px] shadow-xs border-b-gray-300 min-w-screen min-h-[90px] items-center justify-center px-[50px] flex">
      <div className="flex flex-row max-w-[1300px] flex-1 items-center justify-between">
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
        <div className="flex flex-row justify-between items-center w-[200px] pr-[10px] ">
          <Contact></Contact>

          <Register></Register>
        </div>
      </div>
    </div>
  );
}

export default mainnav;
