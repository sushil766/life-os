// Sync helpers that mirror local Zustand state to Supabase when a user is
// authenticated. Each entity registers a `pull` (server → local) and a `push`
// (local → server) operation. When signed out, the app stays purely local.
//
// IMPORTANT: This module is intentionally tolerant of failure. Network errors
// during sync should never break the offline experience.

import { supabaseBrowser } from "@/lib/supabase/browser";

export type SyncDirection = "pull" | "push";

export interface SyncResult {
  ok: boolean;
  error?: string;
}

export async function safeSync(fn: () => Promise<void>): Promise<SyncResult> {
  try {
    await fn();
    return { ok: true };
  } catch (err: any) {
    if (typeof window !== "undefined") {
      console.warn("[sync] failed:", err?.message ?? err);
    }
    return { ok: false, error: String(err?.message ?? err) };
  }
}

export function getSupabaseOrNull() {
  try {
    return supabaseBrowser();
  } catch {
    return null;
  }
}
