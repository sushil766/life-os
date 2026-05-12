import type { AIProvider, AIRequest, AIResult } from "./provider";

// Context-aware mock provider — reads structured context from the request
// and produces specific, personalized text. Feels intelligent without a key.

type Ctx = Record<string, any>;

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function dayHash() {
  const d = new Date();
  return d.getFullYear() * 1000 + d.getMonth() * 31 + d.getDate();
}

function planDay(ctx: Ctx): { text: string; data: any } {
  const remaining: string[] = ctx.remainingHabits ?? [];
  const tasks: { title: string; priority?: string }[] = ctx.tasks ?? [];
  const events: { title: string; startTime?: string; endTime?: string; kind?: string }[] = ctx.events ?? [];
  const score: number = ctx.score ?? 0;

  // Build a timeline.
  const lines: string[] = [];
  lines.push(`Here's a focused plan to push your day past ${score >= 50 ? score : 60}/100:`);
  lines.push("");

  if (events.length) {
    lines.push("Fixed blocks today");
    for (const e of events.slice(0, 6)) {
      lines.push(`• ${e.startTime ?? "—"}–${e.endTime ?? "—"} · ${e.title}`);
    }
    lines.push("");
  }

  if (tasks.length) {
    lines.push("Top priorities");
    const sorted = [...tasks].sort((a, b) => (a.priority === "high" ? -1 : 1));
    for (const t of sorted.slice(0, 4)) {
      lines.push(`• ${t.title}${t.priority === "high" ? "  · do this first" : ""}`);
    }
    lines.push("");
  }

  if (remaining.length) {
    lines.push("Habits still open");
    for (const h of remaining) lines.push(`• ${h}`);
    lines.push("");
    lines.push("Anchor them to existing blocks: water bottle by your laptop, stretch after dinner, vitamins next to your toothbrush.");
  } else {
    lines.push("All habits checked — protect the streak. Use the freed time on deep work.");
  }

  return {
    text: lines.join("\n"),
    data: { kind: "plan_day", remaining, tasks: tasks.slice(0, 4) },
  };
}

function motivate(ctx: Ctx): string {
  const streak: number = ctx.streak ?? 0;
  const level: number = ctx.level ?? 1;
  const remaining: string[] = ctx.remainingHabits ?? [];
  const score: number = ctx.score ?? 0;
  const seed = dayHash();

  const lines: string[] = [];

  if (score >= 80) {
    lines.push(pick([
      `Lv ${level}. ${score}/100 already — this is what discipline looks like. Hold the line.`,
      `Today is essentially won (${score}/100). Don't waste the momentum on filler.`,
      `${streak}-day streak, ${score}/100 today. Show up tomorrow even when no one's watching.`,
    ], seed));
  } else if (score >= 40) {
    lines.push(pick([
      `Halfway there — ${score}/100. Stack one more habit before you scroll.`,
      `You're moving. ${remaining.length} habits left. Don't negotiate with the version of you that wants to quit.`,
      `${score}/100 is fine, but you didn't come this far to settle for fine.`,
    ], seed));
  } else {
    lines.push(pick([
      `${score}/100. The first 30 minutes of effort buys the rest of the day. Start with water + one habit.`,
      `Bad days happen. Don't make it a bad week — pick the easiest habit and check it now.`,
      `Discipline is what you do when motivation is gone. Move.`,
    ], seed));
  }

  if (streak >= 7) lines.push(`🔥 ${streak}-day streak. That's not luck.`);
  if (remaining.includes("Workout") && score < 60) lines.push("If you do only one thing today — train.");
  if (remaining.includes("Sleep 8h+")) lines.push("Lights out earlier. Sleep is the multiplier on everything else.");

  return lines.join(" ");
}

function summarizeTasks(ctx: Ctx): string {
  const tasks: { title: string; done: boolean; priority?: string }[] = ctx.tasks ?? [];
  const todo = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);
  const high = todo.filter((t) => t.priority === "high");

  const parts = [
    `${tasks.length} tasks queued — ${done.length} done, ${todo.length} open.`,
  ];
  if (high.length) parts.push(`${high.length} high priority: ${high.map((t) => t.title).join(", ")}.`);
  if (!todo.length) parts.push("Inbox zero. Use the slack to plan tomorrow or take an actual break.");
  return parts.join(" ");
}

function analyzeHabits(ctx: Ctx): string {
  const week = ctx.weekCompletion ?? 0;
  const best = ctx.best;
  const worst = ctx.worst;
  const streaks: { name: string; days: number }[] = ctx.streaks ?? [];
  const top = streaks.sort((a, b) => b.days - a.days)[0];

  const lines: string[] = [];
  lines.push(`Week consistency: ${week}%.`);
  if (best && worst && best.habit?.id !== worst.habit?.id) {
    lines.push(`Strongest: ${best.habit.name} (${best.pct}%). Weakest: ${worst.habit.name} (${worst.pct}%).`);
    if (worst.pct < 50) lines.push(`${worst.habit.name} is dragging the score. Pick a fixed time and habit-stack it onto something you never miss.`);
  }
  if (top) lines.push(`Longest active streak: ${top.name} at ${top.days} days. Protect it.`);
  if (week >= 80) lines.push("Trend is excellent — consider adding a stretch habit (meditation, cold shower) without sacrificing the core 8.");
  if (week < 60) lines.push("Recovery move: drop to your 3 must-do habits this week, then expand once you're back.");
  return lines.join(" ");
}

function recommendSchedule(ctx: Ctx): string {
  return [
    "Try this week:",
    "• 6:30–7:00 — wake + water + vitamins (anchored)",
    "• 7:00–8:00 — gym (push / pull / legs / mobility split)",
    "• 8:30–11:30 — deep work block #1 (phone in another room)",
    "• 12:00–13:00 — meal + 10 min walk",
    "• 13:00–16:30 — classes / studying",
    "• 17:00–18:30 — flex / shift / errands",
    "• 19:00–20:00 — meal + 10 pages reading",
    "• 21:30–22:30 — wind-down: stretch, journal, lights down",
    "• 22:30 — phone off, charge across the room",
    "",
    "Non-negotiables: water bottle always within arm's reach, no scrolling in bed.",
  ].join("\n");
}

function weeklyReview(ctx: Ctx): string {
  const week = ctx.weekCompletion ?? 0;
  const best = ctx.best;
  const worst = ctx.worst;
  const workouts = ctx.workouts ?? 0;
  const spending = ctx.spending ?? 0;
  const topCategory = ctx.topCategory ?? "—";

  return [
    `Weekly review`,
    ``,
    `Habit completion: ${week}%`,
    best ? `Best habit: ${best.habit.name} (${best.pct}%)` : "",
    worst ? `Worst habit: ${worst.habit.name} (${worst.pct}%)` : "",
    ``,
    `Fitness: ${workouts} workouts logged.`,
    `Spending: $${spending.toFixed(0)} this week, mostly ${topCategory}.`,
    ``,
    `Next week`,
    `• Cap entertainment + shopping at last week's value`,
    `• Protect sleep — lights out by 22:30`,
    `• Stretch immediately after every workout (don't leave the gym otherwise)`,
  ].filter(Boolean).join("\n");
}

function monthlyReview(ctx: Ctx): string {
  const month = ctx.monthCompletion ?? 0;
  const xp = ctx.xp ?? 0;
  const lvl = ctx.level ?? 1;
  return [
    `Monthly review`,
    ``,
    `Habit consistency: ${month}%`,
    `XP gained: ${xp} · level ${lvl}`,
    ``,
    `Trend`,
    `• Sleep + water are clearly compounding`,
    `• Reading + stretching are the leverage points — they are easy to do and high signal of "good day"`,
    ``,
    `Goal for next month`,
    `• Push workouts from 4×/week → 5×/week`,
    `• Cut food-delivery by 30%`,
    `• One full digital sabbath day`,
  ].join("\n");
}

function studyPlan(ctx: Ctx): string {
  const upcoming: { title: string; daysLeft: number; classCode?: string }[] = ctx.upcoming ?? [];
  if (!upcoming.length) return "No assignments in the next two weeks. Use the slack for review packets and getting ahead.";
  const lines = ["Suggested study plan for this week:"];
  for (const a of upcoming.slice(0, 6)) {
    const block = a.daysLeft <= 2 ? "Today + tomorrow" : a.daysLeft <= 5 ? "Front-load next 3 days" : "Spread across the week";
    lines.push(`• ${a.classCode ?? ""} ${a.title} — due in ${a.daysLeft}d · ${block}`);
  }
  lines.push("");
  lines.push("Use 45/15 blocks. Phone in another room. No music with lyrics during deep work.");
  return lines.join("\n");
}

function spendingSummary(ctx: Ctx): string {
  const total = ctx.monthTotal ?? 0;
  const cap = ctx.cap ?? 0;
  const top: { category: string; amount: number }[] = ctx.topCategories ?? [];
  const lines = [
    `Spent $${total.toFixed(0)} this month${cap ? ` of $${cap} cap` : ""}.`,
  ];
  if (top.length) {
    lines.push("Top categories:");
    for (const c of top.slice(0, 3)) lines.push(`• ${c.category}: $${c.amount.toFixed(0)}`);
  }
  if (cap && total > cap * 0.8) lines.push("You're past 80% of your monthly cap. Pause non-essentials for the rest of the month.");
  if (top[0]?.category === "food") lines.push("Food spend is the lever — cook 4 dinners this week and you'll claw back $80–$120.");
  return lines.join("\n");
}

function chat(req: AIRequest): string {
  const msg = (req.message ?? "").toLowerCase();
  if (msg.includes("plan") && msg.includes("day")) return planDay(req.context ?? {}).text;
  if (msg.includes("motivat")) return motivate(req.context ?? {});
  if (msg.includes("habit")) return analyzeHabits(req.context ?? {});
  if (msg.includes("schedule")) return recommendSchedule(req.context ?? {});
  if (msg.includes("week")) return weeklyReview(req.context ?? {});
  if (msg.includes("month")) return monthlyReview(req.context ?? {});
  if (msg.includes("spend") || msg.includes("money")) return spendingSummary(req.context ?? {});
  if (msg.includes("study") || msg.includes("school")) return studyPlan(req.context ?? {});
  return `Got it. I can plan your day, analyze habits, build a schedule, summarize tasks, run a weekly/monthly review, or break down spending. What do you want to focus on?`;
}

export const mockProvider: AIProvider = {
  async complete(req: AIRequest): Promise<AIResult> {
    const ctx = req.context ?? {};
    let text = "";
    let data: any = undefined;
    switch (req.kind) {
      case "plan_day": { const r = planDay(ctx); text = r.text; data = r.data; break; }
      case "motivate": text = motivate(ctx); break;
      case "summarize_tasks": text = summarizeTasks(ctx); break;
      case "analyze_habits": text = analyzeHabits(ctx); break;
      case "recommend_schedule": text = recommendSchedule(ctx); break;
      case "weekly_review": text = weeklyReview(ctx); break;
      case "monthly_review": text = monthlyReview(ctx); break;
      case "study_plan": text = studyPlan(ctx); break;
      case "spending_summary": text = spendingSummary(ctx); break;
      case "chat": text = chat(req); break;
    }
    return { text, data, provider: "mock" };
  },
};
