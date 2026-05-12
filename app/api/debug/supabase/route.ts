// Diagnostic endpoint — visible only in development. Returns a safe summary
// of how the Supabase env vars look to the running process, WITHOUT exposing
// the actual secret values. Hit GET /api/debug/supabase in the browser.
//
// IMPORTANT: This route refuses to serve in production. Remove this file
// before public launch even though it's gated.

import { NextResponse } from "next/server";
import { checkSupabaseEnv } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fingerprint(v: string | undefined) {
  if (typeof v !== "string") return { present: false };
  const raw = v;
  const trimmed = v.trim();
  return {
    present: true,
    length: raw.length,
    trimmedLength: trimmed.length,
    hasSurroundingWhitespace: raw.length !== trimmed.length,
    hasSurroundingQuotes:
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")),
    // Reveal only the first few characters to confirm what was pasted.
    head: trimmed.slice(0, 8),
    tail: trimmed.slice(-4),
  };
}

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  const check = checkSupabaseEnv();
  return NextResponse.json({
    validation: check,
    url: fingerprint(process.env.NEXT_PUBLIC_SUPABASE_URL),
    anon: fingerprint(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    // Surface the other env keys we care about, presence only — no values.
    other: {
      ANTHROPIC_API_KEY: Boolean(process.env.ANTHROPIC_API_KEY),
      ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL ?? null,
      SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      GOOGLE_CLIENT_ID: Boolean(process.env.GOOGLE_CLIENT_ID),
      GOOGLE_CLIENT_SECRET: Boolean(process.env.GOOGLE_CLIENT_SECRET),
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? null,
      NODE_ENV: process.env.NODE_ENV,
    },
    nextStep:
      "If 'validation.ok' is false, the 'reason' explains why. " +
      "If env vars are absent here even though they're in .env.local, the dev server " +
      "didn't pick them up — restart with `npm run dev` from a fresh terminal.",
  });
}
