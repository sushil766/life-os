import type { AIProvider, AIRequest, AIResult } from "./provider";

// Real Anthropic provider using the Messages API with prompt caching.
// The static SYSTEM prompt is cached (5-minute TTL) so subsequent requests
// don't re-bill the system tokens. Activates when ANTHROPIC_API_KEY is present.

const SYSTEM = `You are the in-app AI assistant for "Life OS" — a personal dashboard tracking habits,
school, fitness, spending, and weekly/monthly reviews. The user is the sole owner of the data.

Style: direct, motivating, specific. No fluff, no disclaimers. Use the structured context
(habits, tasks, events, spending) and any provided memory digest. Keep responses tight —
bullets + short lines. When asked to "plan my day", produce a concrete timeline anchored
to the user's existing events. When the user has memory (prior summaries, recent chats),
acknowledge it naturally — don't repeat what they already know.`;

function userPromptFor(req: AIRequest): string {
  const ctx = JSON.stringify(req.context ?? {}, null, 2);
  const map: Record<AIRequest["kind"], string> = {
    plan_day: "Plan my day. Use the context below to produce a concrete, time-anchored plan with priorities.",
    motivate: "Give me one short, sharp motivational message based on the context. 2-3 sentences max.",
    summarize_tasks: "Summarize my tasks. Highlight what's high priority.",
    analyze_habits: "Analyze my habit data. Call out strongest, weakest, and one specific recovery action.",
    recommend_schedule: "Suggest an ideal weekly schedule based on the context.",
    weekly_review: "Write a weekly review with sections: habits, fitness, school, spending, and next-week recommendations.",
    monthly_review: "Write a monthly review focusing on trends, goals, and 2-3 concrete improvements for next month.",
    study_plan: "Build a study plan for the upcoming assignments.",
    spending_summary: "Summarize spending and call out the single biggest lever to reduce next month.",
    chat: req.message ?? "Help me with my Life OS.",
  };
  const memDigest = req.memory?.digest
    ? `\n\n--- MEMORY DIGEST (long-term context) ---\n${req.memory.digest}`
    : "";
  return `${map[req.kind]}${memDigest}\n\n--- CURRENT CONTEXT ---\n${ctx}`;
}

export function makeAnthropicProvider(apiKey: string, model = "claude-sonnet-4-6"): AIProvider {
  return {
    async complete(req: AIRequest): Promise<AIResult> {
      // Build messages array — for "chat" kind, include recent turns so the
      // model has multi-turn continuity. Other kinds use a single shot.
      const messages: { role: "user" | "assistant"; content: string }[] = [];
      if (req.kind === "chat" && req.memory?.recent?.length) {
        for (const turn of req.memory.recent) {
          messages.push({ role: turn.role, content: turn.text });
        }
      }
      messages.push({ role: "user", content: userPromptFor(req) });

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model,
          max_tokens: 800,
          system: [
            {
              type: "text",
              text: SYSTEM,
              cache_control: { type: "ephemeral" },
            },
          ],
          messages,
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Anthropic ${res.status}: ${errText.slice(0, 200)}`);
      }
      const json = (await res.json()) as any;
      const text = json?.content?.[0]?.text ?? "";
      return { text, provider: "anthropic" };
    },
  };
}
