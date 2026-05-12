import { NextResponse } from "next/server";
import { getProvider } from "@/lib/ai";
import type { AIRequest } from "@/lib/ai";
import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Period = "daily" | "weekly" | "monthly";

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 400 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    period?: Period;
    period_key?: string;
    context?: Record<string, unknown>;
  };
  const period: Period = (body.period as Period) ?? "daily";
  const period_key = body.period_key ?? new Date().toISOString().slice(0, 10);

  const supa = supabaseServer();
  const { data } = await supa.auth.getUser();
  const user = data.user;
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const kindMap: Record<Period, AIRequest["kind"]> = {
    daily: "plan_day",
    weekly: "weekly_review",
    monthly: "monthly_review",
  };

  try {
    const provider = getProvider();
    const result = await provider.complete({
      kind: kindMap[period],
      context: body.context ?? {},
    });

    const { error } = await supa
      .from("ai_summaries")
      .upsert(
        {
          user_id: user.id,
          period,
          period_key,
          summary: result.text,
          data: body.context ?? null,
        },
        { onConflict: "user_id,period,period_key" },
      );
    if (error) throw error;

    return NextResponse.json({ ...result, period, period_key });
  } catch (err: any) {
    return NextResponse.json(
      { error: String(err?.message ?? err) },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ summaries: [] });
  }
  const supa = supabaseServer();
  const { data } = await supa.auth.getUser();
  if (!data.user) return NextResponse.json({ summaries: [] });

  const url = new URL(req.url);
  const period = url.searchParams.get("period") as Period | null;

  let q = supa
    .from("ai_summaries")
    .select("period,period_key,summary,created_at")
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false })
    .limit(20);
  if (period) q = q.eq("period", period);

  const { data: rows } = await q;
  return NextResponse.json({ summaries: rows ?? [] });
}
