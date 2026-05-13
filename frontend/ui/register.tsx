"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import useContactStore from "@/store/states";
import { LogIn, User, UserPen } from "lucide-react";
import LogoutButton from "./LogoutButton";

function Contactform() {
  const isAuthenticated = useContactStore((state) => state.isAuthenticated);
  const user = useContactStore((state) => state.user);
  const setUser = useContactStore((state) => state.setUser);
  const toggleRegister = useContactStore((state) => state.toggleRegister);
  const { profilenavigationState, toggleprofilenavigation } = useContactStore();

  const [mounted, setMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);

  const avatarUrl = user?.avatar_url || "default_cat.jpg";
  const userId = user?.id;

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

  // Handle animation on open/close
  useEffect(() => {
    if (profilenavigationState) {
      setShouldRender(true);
      setIsAnimatingOut(false);
      setTimeout(() => {
        setIsAnimatingIn(true);
      }, 10);
    } else if (shouldRender) {
      setIsAnimatingIn(false);
      setIsAnimatingOut(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsAnimatingOut(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [profilenavigationState, shouldRender]);

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

      {shouldRender && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`cursor-pointer p-[15px] absolute bg-white z-80 border-[1px] border-gray-300 w-[250px] h-[140px] right-0 top-0 mt-[-20px] mr-[-20px] sm:mt-[70px] shadow-md flex flex-col items-center text-black rounded-xl transition-all duration-300 origin-top ${
            isAnimatingOut
              ? "opacity-0 -translate-y-[20px] scale-95"
              : isAnimatingIn
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 -translate-y-[20px] scale-95"
          }`}
        >
          <div className="flex flex-row items-center hover:bg-purple-100 duration-300 rounded-lg py-[10px] px-[10px] h-[60px] w-full border-gray-300">
            <LogoutButton />
          </div>
          <Link
            href={`/profile/${userId}`}
            onClick={toggleprofilenavigation}
            className="flex flex-row text-xs hover:bg-purple-100 duration-300 rounded-lg items-center py-[10px] px-[10px] h-[60px] w-full border-gray-300 justify-start"
          >
            <User className="w-5 h-5 text-gray-500" />
            <p className="ml-[10px]">Мой профиль</p>
          </Link>
          <Link
            href="/profile-settings"
            onClick={toggleprofilenavigation}
            className="flex flex-row text-xs hover:bg-purple-100 duration-300 rounded-lg items-center py-[10px] px-[10px] h-[60px] w-full border-gray-300 justify-start"
          >
            <UserPen className="w-5 h-5 text-gray-500" />
            <p className="ml-[10px]">Настройки профиля</p>
          </Link>
        </div>
      )}
    </div>
  );
}

export default Contactform;
