"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import useContactStore from "@/store/states";
import { authStorage } from "@/lib/auth";

export default function LogoutButton() {
  const router = useRouter();
  const { logout } = useContactStore();

  const handleLogout = () => {
    try {
      authStorage.clear();

      logout();
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      useContactStore.getState().setTokenBalance(0); // ← Добавь это!

      window.location.reload();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <button onClick={handleLogout} className="flex items-center ">
      <LogOut className="w-[17px] h-[17px] text-red-600" />
      <span className="ml-[10px] smaller-text">Выйти</span>
    </button>
  );
}
