// Per-user OAuth token store backed by the public.google_tokens table.
// The previous filesystem implementation (./data/google-token.json) doesn't
// work on Vercel because the runtime filesystem is read-only.
import { promises as fs } from "fs";
import path from "path";
import { supabaseServer } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

// Mirrors google-auth-library's Credentials so type-narrowing isn't fighting us.
export interface StoredToken {
  access_token?: string | null;
  refresh_token?: string | null;
  scope?: string;
  token_type?: string | null;
  expiry_date?: number | null;
  id_token?: string | null;
}

export class TokenStoreError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "TokenStoreError";
  }
}

const LEGACY_FILE = path.join(process.cwd(), "data", "google-token.json");

async function getCurrentUserId(): Promise<string> {
  if (!isSupabaseConfigured()) {
    throw new TokenStoreError(
      "Supabase isn't configured — sign-in is required to store Google tokens.",
    );
  }
  const sb = supabaseServer();
  const { data, error } = await sb.auth.getUser();
  if (error || !data?.user) {
    throw new TokenStoreError(
      "You need to sign in before connecting Google Calendar.",
    );
  }
  return data.user.id;
}

export async function readToken(): Promise<StoredToken | null> {
  const userId = await getCurrentUserId();
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("google_tokens")
    .select("access_token, refresh_token, scope, token_type, expiry_date, id_token")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    throw new TokenStoreError(`Couldn't read Google token: ${error.message}`);
  }
  if (data) return data as StoredToken;
  // One-time dev convenience: port any legacy file token into the user's row.
  return portLegacyFile(userId);
}

export async function writeToken(t: StoredToken): Promise<void> {
  const userId = await getCurrentUserId();
  const sb = supabaseServer();
  const row = {
    user_id: userId,
    access_token: t.access_token ?? null,
    refresh_token: t.refresh_token ?? null,
    scope: t.scope ?? null,
    token_type: t.token_type ?? null,
    expiry_date: t.expiry_date ?? null,
    id_token: t.id_token ?? null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await sb
    .from("google_tokens")
    .upsert(row, { onConflict: "user_id" });
  if (error) {
    throw new TokenStoreError(`Couldn't save Google token: ${error.message}`);
  }
}

export async function clearToken(): Promise<void> {
  const userId = await getCurrentUserId();
  const sb = supabaseServer();
  const { error } = await sb
    .from("google_tokens")
    .delete()
    .eq("user_id", userId);
  if (error) {
    throw new TokenStoreError(`Couldn't clear Google token: ${error.message}`);
  }
}

async function portLegacyFile(userId: string): Promise<StoredToken | null> {
  try {
    const buf = await fs.readFile(LEGACY_FILE, "utf8");
    const tok = JSON.parse(buf) as StoredToken;
    if (!tok?.refresh_token) return null;
    const sb = supabaseServer();
    await sb.from("google_tokens").upsert(
      {
        user_id: userId,
        access_token: tok.access_token ?? null,
        refresh_token: tok.refresh_token ?? null,
        scope: tok.scope ?? null,
        token_type: tok.token_type ?? null,
        expiry_date: tok.expiry_date ?? null,
        id_token: tok.id_token ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    try { await fs.unlink(LEGACY_FILE); } catch { /* noop */ }
    return tok;
  } catch {
    return null;
  }
}
