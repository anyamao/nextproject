"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function DatabaseStatus() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function check() {
      // Try to fetch from profiles table
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .limit(1);

      if (error) {
        setMessage(error.message);
      } else {
        setMessage(`Success! Found ${data?.length} row(s)`);
      }
    }
    check();
  }, []);

  if (process.env.NEXT_PUBLIC_DEBUG_MODE !== "true") return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 10,
        right: 10,
        padding: 10,
        background: status === "error" ? "#fee" : "#efe",
        border: "1px solid #ccc",
        fontSize: 12,
        zIndex: 9999,
      }}
    >
      <strong>DB Status:</strong> {status} <br />
      {message}
    </div>
  );
}
