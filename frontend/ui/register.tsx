"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import useContactStore from "@/store/states";
import { LogIn, User } from "lucide-react";
import LogoutButton from "./LogoutButton";

function Contactform() {
  const isAuthenticated = useContactStore((state) => state.isAuthenticated);
  const user = useContactStore((state) => state.user);
  const setUser = useContactStore((state) => state.setUser);
  const toggleRegister = useContactStore((state) => state.toggleRegister);
  const { profilenavigationState, toggleprofilenavigation } = useContactStore();

  const [mounted, setMounted] = useState(false);
  const avatarUrl = user?.avatar_url || "default_cat.jpg";

  useEffect(() => {
    setMounted(true);

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);

        if (!parsedUser.avatar_url) {
          parsedUser.avatar_url = "default_cat.jpg";
        }

        setUser(parsedUser);
      } catch (err) {
        localStorage.removeItem("user");
      }
    }
  }, [setUser]);

  if (!mounted) {
    return (
      <div className="w-[35px] h-[35px] rounded-full bg-gray-200 animate-pulse" />
    );
  }

  return (
    <div className="cursor-pointer relative">
      {!isAuthenticated && (
        <LogIn onClick={toggleRegister} className="text-gray-700 w-[20px]" />
      )}

      {isAuthenticated && user && (
        <div onClick={toggleprofilenavigation} className="relative group">
          <div className="w-[35px] h-[35px] rounded-full overflow-hidden shadow-sm bg-gray-100">
            <img
              key={avatarUrl}
              src={`/avatars/${avatarUrl}`}
              alt={user?.username || "Avatar"}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
              onError={(e) => {
                console.error("❌ Failed to load avatar:", avatarUrl);
                (e.target as HTMLImageElement).src = "/avatars/default_cat.jpg";
              }}
            />
          </div>
        </div>
      )}

      {profilenavigationState && (
        <div className="cursor-pointer p-[15px] absolute bg-white z-80 border-[1px] border-gray-300 w-[250px] h-[100px] right-0 top-0 mt-[-20px] mr-[-20px] sm:mt-[70px] shadow-md flex flex-col items-center text-black rounded-xl">
          <div className="flex flex-row items-center hover:bg-purple-100 duration-300 rounded-lg py-[10px] px-[10px] h-[60px] w-full border-gray-300">
            <LogoutButton />
          </div>
          <Link
            href="/profile-settings"
            className="flex flex-row text-xs hover:bg-purple-100 duration-300 rounded-lg items-center py-[10px] px-[10px] h-[60px] w-full border-gray-300 justify-start"
          >
            <User className="w-5 h-5 text-gray-500" />
            <p className="ml-[10px]">Мой профиль</p>
          </Link>
        </div>
      )}
    </div>
  );
}

export default Contactform;
