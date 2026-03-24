"use client";

import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import useContactStore from "@/store/states";

export function useAuthListener(): void {
  const { setUser } = useContactStore();

  useEffect(() => {
    const checkSession = async (): Promise<void> => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Session check error:", error.message);
          return;
        }

        setUser(session?.user ?? null);
      } catch (err) {
        console.error("Unexpected session error:", err);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔐 Auth Event:", event);

      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser]);
}
