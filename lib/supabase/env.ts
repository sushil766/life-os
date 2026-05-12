// Centralized Supabase env loader + validator. Imported by every client
// (browser / server / middleware) so the same rules apply everywhere.
//
// SECURITY: This module only reads NEXT_PUBLIC_* vars. The service-role key
// must never be loaded here — it's only valid for server-side admin code
// outside the request lifecycle and should live in its own module if/when
// it's introduced.

const URL_NAME = "NEXT_PUBLIC_SUPABASE_URL";
const ANON_NAME = "NEXT_PUBLIC_SUPABASE_ANON_KEY";

export interface SupabaseEnv {
  url: string;
  anon: string;
}

interface EnvCheck {
  ok: boolean;
  env?: SupabaseEnv;
  reason?: string;
}

function clean(v: string | undefined): string {
  if (typeof v !== "string") return "";
  // Strip surrounding whitespace AND surrounding quotes if a user pasted
  // their key as `NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."`.
  let s = v.trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

function looksLikeJwt(s: string): boolean {
  // Supabase anon keys are JWTs that always start with `eyJ` (base64 of `{"`).
  return /^eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}$/.test(s);
}

function looksLikeSupabaseUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "https:" && /\.supabase\.(co|in)$/.test(u.hostname);
  } catch {
    return false;
  }
}

export function checkSupabaseEnv(): EnvCheck {
  const url = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anon = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url && !anon) {
    return { ok: false, reason: `Missing ${URL_NAME} and ${ANON_NAME}.` };
  }
  if (!url) return { ok: false, reason: `Missing ${URL_NAME}.` };
  if (!anon) return { ok: false, reason: `Missing ${ANON_NAME}.` };

  if (!looksLikeSupabaseUrl(url)) {
    return {
      ok: false,
      reason: `${URL_NAME} doesn't look like a Supabase URL (got "${url}"). Expected something like https://xxxx.supabase.co`,
    };
  }
  if (!looksLikeJwt(anon)) {
    return {
      ok: false,
      reason: `${ANON_NAME} doesn't look like a JWT (anon keys start with "eyJ" and have three dot-separated parts). Did you accidentally use the project URL or service role key?`,
    };
  }

  return { ok: true, env: { url, anon } };
}

export function getSupabaseEnv(): SupabaseEnv {
  const r = checkSupabaseEnv();
  if (!r.ok) {
    throw new Error(
      `[supabase] ${r.reason}\n` +
        `Set both vars in .env.local (or your hosting env) and restart the dev server.\n` +
        `Values: ${URL_NAME}=${process.env.NEXT_PUBLIC_SUPABASE_URL ? "(set)" : "(unset)"}, ` +
        `${ANON_NAME}=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "(set)" : "(unset)"}`,
    );
  }
  return r.env!;
}

export function isSupabaseConfigured(): boolean {
  return checkSupabaseEnv().ok;
}
