"use client";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Hydrated } from "@/components/Hydrated";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAssistantStore } from "@/store/assistantStore";
import { useHabitsStore } from "@/store/habitsStore";
import { useTasksStore } from "@/store/tasksStore";
import { useCalendarStore } from "@/store/calendarStore";
import { useSchoolStore } from "@/store/schoolStore";
import { useSpendingStore } from "@/store/spendingStore";
import { useUserStore } from "@/store/userStore";
import { callAI } from "@/lib/aiClient";
import {
  bestAndWorstHabit, dailyScore, daysUntil, levelFromXp, overallDisciplineStreak,
  streakFor, weekCompletion,
} from "@/lib/scoring";
import { todayKey } from "@/lib/utils";
import { startOfMonth, parseISO, isAfter } from "date-fns";
import {
  Sparkles, Send, Eraser, CalendarClock, Brain, Wallet, Flame,
  BookOpen, LineChart as LineIcon, ListChecks,
} from "lucide-react";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import type { AIKind } from "@/lib/ai/provider";

export default function AssistantPage() {
  return (
    <Hydrated>
      <PageHeader title="AI assistant" subtitle="Your Life OS copilot. Ask anything, or hit a quick action below." />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-9"><ChatPanel /></div>
        <div className="col-span-12 lg:col-span-3"><Sidebar /></div>
      </div>
    </Hydrated>
  );
}

const ACTIONS: { kind: AIKind; label: string; icon: any }[] = [
  { kind: "plan_day", label: "Plan my day", icon: CalendarClock },
  { kind: "motivate", label: "Motivate me", icon: Flame },
  { kind: "summarize_tasks", label: "Summarize tasks", icon: ListChecks },
  { kind: "analyze_habits", label: "Analyze habits", icon: Brain },
  { kind: "study_plan", label: "Study plan", icon: BookOpen },
  { kind: "spending_summary", label: "Spending summary", icon: Wallet },
  { kind: "weekly_review", label: "Weekly review", icon: LineIcon },
  { kind: "monthly_review", label: "Monthly review", icon: LineIcon },
];

function ChatPanel() {
  const messages = useAssistantStore((s) => s.messages);
  const append = useAssistantStore((s) => s.append);
  const clear = useAssistantStore((s) => s.clear);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // pull live context
  const habits = useHabitsStore((s) => s.habits);
  const logs = useHabitsStore((s) => s.logs);
  const tasks = useTasksStore((s) => s.tasks);
  const events = useCalendarStore((s) => s.events);
  const assignments = useSchoolStore((s) => s.assignments);
  const classes = useSchoolStore((s) => s.classes);
  const expenses = useSpendingStore((s) => s.expenses);
  const budget = useSpendingStore((s) => s.budget);
  const xp = useUserStore((s) => s.xp);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const buildContext = (kind: AIKind) => {
    const today = todayKey();
    const lvl = levelFromXp(xp);
    const streak = overallDisciplineStreak(habits, logs);
    const score = dailyScore(habits, logs, today);
    const remainingHabits = habits.filter((h) => !logs[today]?.[h.id]).map((h) => h.name);
    const todayDow = new Date().getDay();
    const ev = events
      .filter((e) => e.date === today || (e.recurring === "weekly" && e.dayOfWeek === todayDow))
      .map((e) => ({ title: e.title, startTime: e.startTime, endTime: e.endTime, kind: e.kind }));
    const todayTasks = tasks.filter((t) => t.date === today).map((t) => ({ title: t.title, priority: t.priority, done: t.done }));

    const week = weekCompletion(habits, logs);
    const { best, worst } = bestAndWorstHabit(habits, logs);
    const streaks = habits.map((h) => ({ name: h.name, days: streakFor(habits, logs, h.id) }));

    const upcoming = assignments.filter((a) => !a.done)
      .map((a) => ({ title: a.title, daysLeft: daysUntil(a.due), classCode: classes.find((c) => c.id === a.classId)?.code }))
      .sort((a, b) => a.daysLeft - b.daysLeft);

    const monthExpenses = expenses.filter((e) => isAfter(parseISO(e.date), startOfMonth(new Date())));
    const monthTotal = monthExpenses.reduce((a, e) => a + e.amount, 0);
    const byCat = new Map<string, number>();
    for (const e of monthExpenses) byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount);
    const topCategories = Array.from(byCat.entries())
      .map(([category, amount]) => ({ category: EXPENSE_CATEGORIES.find((x) => x.id === category)?.label ?? category, amount }))
      .sort((a, b) => b.amount - a.amount);
    const topCategory = topCategories[0]?.category;

    return {
      score, level: lvl.level, streak, remainingHabits, events: ev, tasks: todayTasks,
      weekCompletion: week, best, worst, streaks,
      upcoming,
      monthTotal, cap: budget.monthly, topCategories, topCategory,
      spending: monthTotal,
      workouts: 0, // optional
      monthCompletion: week, xp,
    };
  };

  const runAction = async (kind: AIKind) => {
    setLoading(true);
    try {
      append("user", ACTIONS.find((a) => a.kind === kind)?.label ?? kind);
      const r = await callAI(kind, buildContext(kind));
      append("assistant", r.text);
    } finally { setLoading(false); }
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput("");
    append("user", msg);
    setLoading(true);
    try {
      const r = await callAI("chat", buildContext("chat"), msg);
      append("assistant", r.text);
    } finally { setLoading(false); }
  };

  return (
    <Card className="flex flex-col h-[640px]">
      <CardHeader
        title="Conversation"
        icon={<Sparkles size={16} className="text-violet-300" />}
        right={<Button size="sm" variant="ghost" onClick={clear} icon={<Eraser size={12} />}>Clear</Button>}
      />
      <div className="mb-3 flex flex-wrap gap-2">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.kind}
              onClick={() => runAction(a.kind)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-white/80 transition hover:bg-white/[0.07] disabled:opacity-40"
            >
              <Icon size={12} />{a.label}
            </button>
          );
        })}
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto pr-2">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${m.role === "user" ? "bg-violet-500/20 text-white" : "bg-white/[0.04] text-white/90"}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-white/[0.04] px-4 py-2.5 text-[13px] text-white/60">Thinking…</div>
          </div>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="mt-3 flex gap-2">
        <Input placeholder="Ask the assistant…" value={input} onChange={(e) => setInput(e.target.value)} />
        <Button type="submit" variant="primary" disabled={loading || !input.trim()} icon={<Send size={14} />}>Send</Button>
      </form>
    </Card>
  );
}

function Sidebar() {
  return (
    <Card>
      <CardHeader title="What can I do?" subtitle="Quick examples" />
      <ul className="space-y-2 text-[12.5px] text-white/70">
        <li>· "Plan my day — focus on school"</li>
        <li>· "Why am I slipping on stretching?"</li>
        <li>· "Summarize this week"</li>
        <li>· "Give me a sharper morning routine"</li>
        <li>· "Where can I cut $100 next month?"</li>
        <li>· "Study plan for the next 7 days"</li>
      </ul>
      <p className="mt-3 text-[10px] text-white/40">
        Responses are powered by a context-aware mock by default. Set
        <code className="mx-1 rounded bg-white/[0.06] px-1">ANTHROPIC_API_KEY</code>
        in <code className="rounded bg-white/[0.06] px-1">.env.local</code> to switch to real Claude.
      </p>
    </Card>
  );
}
