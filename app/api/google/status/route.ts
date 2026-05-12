import { NextResponse } from "next/server";
import { isConnected } from "@/lib/integrations/googleCalendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const configured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  // isConnected swallows token-store errors (e.g. user not signed in) and
  // returns false — the client doesn't need to know the reason here.
  const connected = configured ? await isConnected() : false;
  return NextResponse.json({ configured, connected });
}
