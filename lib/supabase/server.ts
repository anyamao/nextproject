import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createClient(url?: string, anonKey?: string) {
  return createSupabaseClient(
    url || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
