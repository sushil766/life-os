import { NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/integrations/googleCalendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const err = url.searchParams.get("error");
  const origin = `${url.protocol}//${url.host}`;
  // Same redirect URI used at the auth step — Google validates this matches
  // exactly on token exchange.
  const redirectUri = `${origin}/api/google/callback`;
  if (err) return NextResponse.redirect(`${origin}/calendar?google=denied`);
  if (!code) return NextResponse.redirect(`${origin}/calendar?google=missing_code`);
  try {
    await exchangeCodeForTokens(code, redirectUri);
    return NextResponse.redirect(`${origin}/calendar?google=connected`);
  } catch (e: any) {
    return NextResponse.redirect(`${origin}/calendar?google=error&msg=${encodeURIComponent(String(e?.message ?? e))}`);
  }
}
