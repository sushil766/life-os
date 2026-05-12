import { NextResponse } from "next/server";
import { listUpcoming } from "@/lib/integrations/googleCalendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { daysAhead?: number; daysBehind?: number } = {};
  try { body = await req.json(); } catch { /* allow empty body */ }
  try {
    const events = await listUpcoming({
      daysAhead: body.daysAhead ?? 60,
      daysBehind: body.daysBehind ?? 7,
    });
    return NextResponse.json({ events, syncedAt: new Date().toISOString() });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
