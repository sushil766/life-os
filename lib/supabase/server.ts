import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";
import { getSupabaseEnv, isSupabaseConfigured as _isConfigured } from "./env";

export function supabaseServer() {
  const cookieStore = cookies();
  const { url, anon } = getSupabaseEnv();
  return createServerClient<Database>(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Called from a Server Component — middleware will refresh on next request.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Called from a Server Component.
        }
      },
    },
  });
}

export function isSupabaseConfigured(): boolean {
  return _isConfigured();
}
