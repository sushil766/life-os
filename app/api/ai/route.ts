import { NextResponse } from "next/server";
import { getProvider } from "@/lib/ai";
import type { AIRequest } from "@/lib/ai";
import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function buildMemory(userId: string) {
  const supa = supabaseServer();

  // Pull recent assistant messages (last 10 turns) for chat continuity.
  const recentRes = await supa
    .from("ai_messages")
    .select("role,text,at")
    .eq("user_id", userId)
    .order("at", { ascending: false })
    .limit(10);

  const recent = (recentRes.data ?? [])
    .reverse()
    .filter((r) => r.role === "user" || r.role === "assistant")
    .map((r) => ({ role: r.role as "user" | "assistant", text: r.text }));

  // Pull the most recent daily + weekly + monthly summaries for the digest.
  const summariesRes = await supa
    .from("ai_summaries")
    .select("period,period_key,summary")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(6);

  const summaries = summariesRes.data ?? [];
  const digest = summaries.length
    ? summaries
        .map((s) => `[${s.period} · ${s.period_key}]\n${s.summary}`)
        .join("\n\n")
    : undefined;

  return { recent, digest };
}

export async function POST(req: Request) {
  let body: AIRequest;
  try {
    body = (await req.json()) as AIRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body?.kind) {
    return NextResponse.json({ error: "Missing 'kind'" }, { status: 400 });
  }

  // If authenticated, enrich with per-user memory.
  let userId: string | null = null;
  if (isSupabaseConfigured()) {
    try {
      const supa = supabaseServer();
      const { data } = await supa.auth.getUser();
      userId = data.user?.id ?? null;
      if (userId) {
        body.memory = await buildMemory(userId);
      }
    } catch (err) {
      // Fall through with no memory.
      console.warn("[/api/ai] memory fetch failed:", err);
    }
  }

  try {
    const provider = getProvider();
    const result = await provider.complete(body);

    // Persist the turn for authed users.
    if (userId) {
      try {
        const supa = supabaseServer();
        const rows: any[] = [];
        if (body.kind === "chat" && body.message) {
          rows.push({ user_id: userId, role: "user", text: body.message, kind: "chat" });
        } else {
          rows.push({
            user_id: userId,
            role: "user",
            text: `[${body.kind}]`,
            kind: body.kind,
          });
        }
        rows.push({
          user_id: userId,
          role: "assistant",
          text: result.text,
          kind: body.kind,
        });
        await supa.from("ai_messages").insert(rows);
      } catch (err) {
        console.warn("[/api/ai] persist failed:", err);
      }
    }

    return NextResponse.json(result);
  } catch (err: any) {
    // Graceful fallback to mock if real provider failed.
    const { mockProvider } = await import("@/lib/ai/mock");
    const result = await mockProvider.complete(body);
    return NextResponse.json({ ...result, fallback: true, error: String(err?.message ?? err) });
  }
}
