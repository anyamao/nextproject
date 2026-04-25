// frontend/components/LogoutButton.tsx
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
      // 1. Очищаем localStorage
      authStorage.clear();

      // 2. Очищаем Zustand store
      logout();

      // 3. Перезагружаем страницу (или можно router.push('/') для редиректа)
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
