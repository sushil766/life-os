import { NextResponse } from "next/server";
import { buildAuthUrl } from "@/lib/integrations/googleCalendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // Derive the redirect URI from the actual request origin so the same
    // code works on localhost, LAN IPs, Cloudflare tunnels, and Vercel.
    // The matching URI must be added to Google Cloud Console's authorized
    // redirect URIs for this OAuth client.
    const url = new URL(req.url);
    const origin = `${url.protocol}//${url.host}`;
    const redirectUri = `${origin}/api/google/callback`;
    const authUrl = buildAuthUrl(redirectUri);
    return NextResponse.redirect(authUrl);
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
