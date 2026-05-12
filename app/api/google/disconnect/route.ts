import { NextResponse } from "next/server";
import { clearToken } from "@/lib/integrations/googleTokenStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  await clearToken();
  return NextResponse.json({ ok: true });
}
