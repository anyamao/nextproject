"use client";
import Link from "next/link";
import useContactStore from "@/store/states";
import {
  LogOut,
  SlidersHorizontal,
  UserRoundPen,
  GraduationCap,
  Trophy,
  User,
  MoonStar,
  Bookmark,
} from "lucide-react";
import LogoutButton from "../ui/LogoutButton";
function ProfilePanel() {
  const { profilenavigationState, toggleprofilenavigation } = useContactStore();

  return (
    <main className="relative z-70">
      {profilenavigationState && (
        <div className="cursor-pointer p-[15px]  bg-white z-80 border-[1px] border-gray-300 w-[250px] h-[320px] fixed  right-0 top-0 mt-[60px] mr-[10px] sm:mt-[70px] shadow-md flex flex-col items-center text-black   rounded-xl ">
          <div className="flex flex-row hidden items-center py-[10px] border-b-[1px] w-full border-gray-300 ">
            <img
              src="/people1.jpg"
              className="w-[50px] h-[50px] rounded-full"
            />
            <div className="flex flex-col ml-[10px]">
              <p className="font-semibold">maotop</p> <p>Аня </p>
            </div>
          </div>
          <div className="flex flex-row items-center py-[10px] px-[10px] border-b-[1px] h-[60px] w-full border-gray-300 ">
            <LogoutButton></LogoutButton>
          </div>
          <div className="flex flex-row items-center py-[5px] px-[10px] border-b-[1px] h-[50px] w-full border-gray-300 ">
            <a className="flex items-center ">
              <UserRoundPen className="w-[17px] h-[17px] text-gray-500" />
              <span className="ml-[10px] smaller-text">Настройки</span>
            </a>
          </div>
          <div className="flex flex-row items-center py-[5px] px-[10px] border-b-[1px] h-[50px] w-full border-gray-300 ">
            <a className="flex items-center ">
              <MoonStar className="w-[17px] h-[17px] text-gray-500" />
              <span className="ml-[10px] smaller-text">
                Поставить темную тему
              </span>
            </a>
          </div>

          <div className="flex flex-row items-center py-[5px] px-[10px] border-b-[1px] h-[50px] w-full border-gray-300 ">
            <p className="flex items-center ">
              <User className="w-[17px] h-[17px] text-gray-500" />
              <span className="ml-[10px] smaller-text">Профиль</span>
            </p>
          </div>
          <div className="flex flex-row cursor-pointer items-center py-[5px] px-[10px]  h-[50px] w-full border-gray-300 flex flex-row items-center py-[5px] px-[10px] border-b-[1px] h-[50px] w-full border-gray-300 ">
            <a className="flex items-center ">
              <GraduationCap className="w-[17px] h-[17px] text-gray-500" />
              <span className="ml-[10px] smaller-text">Мои курсы</span>
            </a>
          </div>
          <div className="flex flex-row cursor-pointer items-center py-[5px] px-[10px]  h-[50px] w-full border-gray-300 flex flex-row items-center py-[5px] px-[10px] border-b-[1px] h-[50px] w-full border-gray-300 ">
            <a className="flex items-center " href="/my-bookmarks">
              <Bookmark className="w-[17px] h-[17px] text-gray-500" />
              <span className="ml-[10px] smaller-text">Мои избранные</span>
            </a>
          </div>

          <div className="flex flex-row items-center py-[5px] px-[10px]  h-[50px] w-full border-gray-300 ">
            <a className="flex items-center ">
              <Trophy className="w-[17px] h-[17px] text-gray-500" />
              <span className="ml-[10px] smaller-text">Мои достижения</span>
            </a>
          </div>
        </div>
      )}
    </main>
  );
}

export default ProfilePanel;
