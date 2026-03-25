"use client";
import Link from "next/link";
import useContactStore from "@/store/states";
import { LogOut } from "lucide-react";
import LogoutButton from "../ui/LogoutButton";
function ProfilePanel() {
  const { profilenavigationState, toggleprofilenavigation } = useContactStore();

  return (
    <main>
      {profilenavigationState && (
        <div className="cursor-pointer p-[15px]  bg-white z-30 border-[1px] border-gray-300 w-[250px] h-[400px] absolute   right-0 top-0 mt-[60px] mr-[10px] sm:mt-[70px] shadow-md flex flex-col items-center text-black   rounded-xl ">
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
        </div>
      )}
    </main>
  );
}

export default ProfilePanel;
