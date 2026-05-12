"use client";
import type { AIKind, AIResult } from "./ai/provider";

export async function callAI(kind: AIKind, context?: Record<string, unknown>, message?: string): Promise<AIResult> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ kind, context, message }),
  });
  if (!res.ok) throw new Error(`AI request failed (${res.status})`);
  return res.json();
}
