"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";
import { getSupabaseEnv, isSupabaseConfigured as _isConfigured, checkSupabaseEnv } from "./env";

let _client: ReturnType<typeof createBrowserClient<Database>> | null = null;
let _warned = false;

export function supabaseBrowser() {
  if (_client) return _client;
  const { url, anon } = getSupabaseEnv();
  _client = createBrowserClient<Database>(url, anon);
  return _client;
}

export function isSupabaseConfigured(): boolean {
  const ok = _isConfigured();
  // Surface a clear, one-time console warning if env vars exist but are
  // malformed (so "configured but failing" is debuggable from DevTools).
  if (!ok && typeof window !== "undefined" && !_warned) {
    const r = checkSupabaseEnv();
    const hasAny =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    if (hasAny) {
      // eslint-disable-next-line no-console
      console.warn("[supabase] disabled:", r.reason);
      _warned = true;
    }
  }
  return ok;
}
