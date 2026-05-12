import { NextResponse } from "next/server";
import {
  exchangeCodeForTokens,
  resolveAppOrigin,
  resolveRedirectUri,
} from "@/lib/integrations/googleCalendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const err = url.searchParams.get("error");
  const origin = resolveAppOrigin(req);
  const redirectUri = resolveRedirectUri(req);
  if (err) return NextResponse.redirect(`${origin}/calendar?google=denied`);
  if (!code) return NextResponse.redirect(`${origin}/calendar?google=missing_code`);
  try {
    await exchangeCodeForTokens(code, redirectUri);
    return NextResponse.redirect(`${origin}/calendar?google=connected`);
  } catch (e: any) {
    // Surface the redirect URI we used + last 6 of the client_id so the user
    // can compare against Google Cloud Console without leaking the secret.
    const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
    const idTail = clientId ? clientId.slice(-6) : "unset";
    const msg = `${String(e?.message ?? e)} | redirect_uri=${redirectUri} | client_id…${idTail}`;
    return NextResponse.redirect(`${origin}/calendar?google=error&msg=${encodeURIComponent(msg)}`);
  }
}
