import { NextResponse } from "next/server";
import { buildAuthUrl, resolveRedirectUri } from "@/lib/integrations/googleCalendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const redirectUri = resolveRedirectUri(req);
    const authUrl = buildAuthUrl(redirectUri);
    return NextResponse.redirect(authUrl);
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
