import { NextResponse } from "next/server";
import { isConnected } from "@/lib/integrations/googleCalendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const configured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const connected = configured ? await isConnected() : false;
  return NextResponse.json({ configured, connected });
}
