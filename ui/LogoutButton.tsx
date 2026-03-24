"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react"; // Optional icon

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

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
