"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Hydrated } from "@/components/Hydrated";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/Progress";
import { useHabitsStore } from "@/store/habitsStore";
import { useFitnessStore } from "@/store/fitnessStore";
import { useSchoolStore } from "@/store/schoolStore";
import { useSpendingStore } from "@/store/spendingStore";
import { useUserStore } from "@/store/userStore";
import {
  bestAndWorstHabit, weekCompletion, weekKeys, streakFor, levelFromXp,
} from "@/lib/scoring";
import { ACCENT_HEX, EXPENSE_CATEGORIES } from "@/lib/constants";
import { callAI } from "@/lib/aiClient";
import { Sparkles } from "lucide-react";
import { currency } from "@/lib/utils";

export default function WeeklyReviewPage() {
  return (
    <Hydrated>
      <PageHeader title="Weekly review" subtitle="What happened, what's working, what to fix next week." />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-4"><HabitsBreakdown /></div>
        <div className="col-span-12 lg:col-span-4"><BestWorst /></div>
        <div className="col-span-12 lg:col-span-4"><FitnessSummary /></div>

        <div className="col-span-12 lg:col-span-6"><SchoolSummary /></div>
        <div className="col-span-12 lg:col-span-6"><SpendingSummary /></div>

        <div className="col-span-12"><AIWeekly /></div>
      </div>
    </Hydrated>
  );
}

function HabitsBreakdown() {
  const habits = useHabitsStore((s) => s.habits);
  const logs = useHabitsStore((s) => s.logs);
  const days = weekKeys();
  const pct = weekCompletion(habits, logs);
  return (
    <Card>
      <CardHeader title="Habits this week" subtitle={`${days.length}-day window`} />
      <div className="text-4xl font-semibold text-white">{pct}<span className="text-lg text-white/40">%</span></div>
      <div className="mt-2"><ProgressBar value={pct} color={pct >= 80 ? "emerald" : pct >= 50 ? "violet" : "rose"} /></div>
      <div className="mt-3 space-y-1">
        {habits.map((h) => {
          let done = 0;
          for (const k of days) if (logs[k]?.[h.id]) done++;
          const p = Math.round((done / days.length) * 100);
          return (
            <div key={h.id} className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1 text-white/70">{h.emoji} {h.name}</span>
              <span style={{ color: ACCENT_HEX[h.accent] }}>{p}%</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function BestWorst() {
  const habits = useHabitsStore((s) => s.habits);
  const logs = useHabitsStore((s) => s.logs);
  const { best, worst, all } = bestAndWorstHabit(habits, logs);
  return (
    <Card>
      <CardHeader title="Best & worst" subtitle="Habit-by-habit comparison" />
      <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-3">
        <div className="text-[10px] uppercase tracking-wider text-emerald-300/80">Best</div>
        <div className="text-sm text-white">{best?.habit.emoji} {best?.habit.name}</div>
        <div className="text-[11px] text-white/50">{best?.pct}% completion</div>
      </div>
      <div className="mt-2 rounded-xl bg-rose-500/10 border border-rose-500/25 p-3">
        <div className="text-[10px] uppercase tracking-wider text-rose-300/80">Worst</div>
        <div className="text-sm text-white">{worst?.habit.emoji} {worst?.habit.name}</div>
        <div className="text-[11px] text-white/50">{worst?.pct}% completion</div>
      </div>
    </Card>
  );
}

function FitnessSummary() {
  const workouts = useFitnessStore((s) => s.workouts);
  const habits = useHabitsStore((s) => s.habits);
  const logs = useHabitsStore((s) => s.logs);
  const days = weekKeys();
  const weekWorkouts = workouts.filter((w) => days.includes(w.date));
  const totalMin = weekWorkouts.reduce((a, w) => a + w.minutes, 0);
  const sleepDays = days.filter((d) => logs[d]?.sleep).length;
  const waterDays = days.filter((d) => logs[d]?.water).length;
  return (
    <Card>
      <CardHeader title="Fitness summary" />
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Workouts" value={`${weekWorkouts.length}`} />
        <Stat label="Minutes" value={`${totalMin}`} />
        <Stat label="Sleep nights" value={`${sleepDays}/7`} />
      </div>
      <div className="mt-3 text-[11px] text-white/50">
        Water hit on {waterDays}/7 days. Stretch streak: {streakFor(habits, logs, "stretch")}d.
      </div>
    </Card>
  );
}

function SchoolSummary() {
  const assignments = useSchoolStore((s) => s.assignments);
  const sessions = useSchoolStore((s) => s.studySessions);
  const days = weekKeys();
  const closed = assignments.filter((a) => a.done && days.includes(a.due)).length;
  const openSoon = assignments.filter((a) => !a.done && days.includes(a.due)).length;
  const studyMin = sessions.filter((s) => days.includes(s.date)).reduce((acc, s) => acc + s.minutes, 0);
  return (
    <Card>
      <CardHeader title="School summary" />
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Assignments closed" value={`${closed}`} />
        <Stat label="Due this week" value={`${openSoon}`} />
        <Stat label="Study minutes" value={`${studyMin}`} />
      </div>
    </Card>
  );
}

function SpendingSummary() {
  const expenses = useSpendingStore((s) => s.expenses);
  const budget = useSpendingStore((s) => s.budget);
  const days = weekKeys();
  const wk = expenses.filter((e) => days.includes(e.date));
  const total = wk.reduce((a, e) => a + e.amount, 0);
  const byCat = new Map<string, number>();
  for (const e of wk) byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount);
  const top = Array.from(byCat.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);
  return (
    <Card>
      <CardHeader title="Spending summary" />
      <div className="grid grid-cols-2 gap-2">
        <Stat label="This week" value={currency(total)} />
        <Stat label="Monthly cap" value={currency(budget.monthly)} />
      </div>
      <div className="mt-3 space-y-1">
        {top.map(([cat, amt]) => (
          <div key={cat} className="flex items-center justify-between text-[11px]">
            <span className="text-white/70">{EXPENSE_CATEGORIES.find((c) => c.id === cat)?.label ?? cat}</span>
            <span className="text-white/80">{currency(amt)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.02] p-3">
      <div className="text-2xl font-semibold text-white">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
    </div>
  );
}

function AIWeekly() {
  const habits = useHabitsStore((s) => s.habits);
  const logs = useHabitsStore((s) => s.logs);
  const workouts = useFitnessStore((s) => s.workouts);
  const expenses = useSpendingStore((s) => s.expenses);
  const xp = useUserStore((s) => s.xp);
  const days = weekKeys();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const { best, worst } = bestAndWorstHabit(habits, logs);
      const week = weekCompletion(habits, logs);
      const weekWorkouts = workouts.filter((w) => days.includes(w.date)).length;
      const wk = expenses.filter((e) => days.includes(e.date));
      const spending = wk.reduce((a, e) => a + e.amount, 0);
      const byCat = new Map<string, number>();
      for (const e of wk) byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount);
      const topCategory = Array.from(byCat.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
      const r = await callAI("weekly_review", {
        weekCompletion: week, best, worst,
        workouts: weekWorkouts, spending, topCategory,
        level: levelFromXp(xp).level,
      });
      setText(r.text);
    } finally { setLoading(false); }
  };

  useEffect(() => { run(); /* eslint-disable-next-line */ }, []);

  return (
    <Card>
      <CardHeader
        title="AI weekly reflection"
        icon={<Sparkles size={16} className="text-violet-300" />}
        right={<Button size="sm" onClick={run} disabled={loading}>{loading ? "Thinking…" : "Regenerate"}</Button>}
      />
      <pre className="whitespace-pre-wrap text-[13px] leading-relaxed text-white/85">{text || "Generating…"}</pre>
    </Card>
  );
}
