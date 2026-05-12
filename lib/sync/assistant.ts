"use client";
import type { AIMessage } from "@/lib/types";
import { getSupabaseOrNull, safeSync } from "./index";

export async function pullMessages(userId: string, limit = 200): Promise<AIMessage[] | null> {
  const supa = getSupabaseOrNull();
  if (!supa) return null;
  const { data, error } = await supa
    .from("ai_messages")
    .select("id,role,text,at")
    .eq("user_id", userId)
    .order("at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    role: r.role as AIMessage["role"],
    text: r.text,
    at: new Date(r.at).getTime(),
  }));
}

export async function appendMessage(
  userId: string,
  m: { role: AIMessage["role"]; text: string; kind?: string },
) {
  return safeSync(async () => {
    const supa = getSupabaseOrNull();
    if (!supa) return;
    const { error } = await supa.from("ai_messages").insert({
      user_id: userId,
      role: m.role,
      text: m.text,
      kind: m.kind ?? null,
    });
    if (error) throw error;
  });
}

export async function clearMessages(userId: string) {
  return safeSync(async () => {
    const supa = getSupabaseOrNull();
    if (!supa) return;
    const { error } = await supa.from("ai_messages").delete().eq("user_id", userId);
    if (error) throw error;
  });
}
