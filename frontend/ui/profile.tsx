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
    <main className="relative absolute hidden z-70 bg-red-500">
      {0 && (
        <div className="cursor-pointer p-[15px]  bg-white z-80 border-[1px] border-gray-300 w-[250px] h-[70px]  right-0 top-0 mt-[60px] mr-[10px] sm:mt-[70px] shadow-md flex flex-col items-center text-black   rounded-xl ">
          <div className="flex flex-row items-center py-[10px] px-[10px] h-[60px] w-full border-gray-300 ">
            <LogoutButton></LogoutButton>
          </div>
          <div className="flex flex-row items-center py-[10px] px-[10px] h-[60px] w-full border-gray-300 ">
            <p>Мой профиль</p>
          </div>
        </div>
      )}
    </main>
  );
}

export default ProfilePanel;
