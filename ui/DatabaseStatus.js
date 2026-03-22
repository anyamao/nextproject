"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase";

export default function DatabaseStatus() {
  const [status, setStatus] = useState("checking");
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkDatabase = async () => {
      const supabase = getSupabase();

      if (!supabase) {
        setStatus("not-configured");
        return;
      }

      try {
        const { error } = await supabase
          .from("_test")
          .select("count")
          .limit(1)
          .maybeSingle();

        if (error && error.code === "42P01") {
          setStatus("connected-no-tables");
        } else if (error) {
          setStatus("error");
          setError(error.message);
        } else {
          setStatus("connected");
        }
      } catch (err) {
        setStatus("error");
        setError(err.message);
      }
    };

    checkDatabase();
  }, []);

  return (
    <div style={{ fontSize: "12px", color: "#666", padding: "4px" }}>
      {status === "checking" && "📡 Checking database connection..."}
      {status === "not-configured" && "⚙️ Database not configured"}
      {status === "connected" && "✅ Database connected"}
      {status === "connected-no-tables" && "✅ Database ready (tables pending)"}
      {status === "error" && `⚠️ Database: ${error}`}
    </div>
  );
}
