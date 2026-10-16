import { createClient } from "@supabase/supabase-js";

// Keys come ONLY from environment variables (see .env, never committed).
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase =
  url && key ? createClient(url, key) : null;

export function requireDb() {
  if (!supabase) {
    throw new Error(
      "Koneksi Supabase belum dikonfigurasi. Periksa file .env (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY)."
    );
  }
  return supabase;
}
