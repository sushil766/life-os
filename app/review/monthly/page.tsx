"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Hydrated } from "@/components/Hydrated";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/Progress";
import { useHabitsStore } from "@/store/habitsStore";
import { useSpendingStore } from "@/store/spendingStore";
import { useUserStore } from "@/store/userStore";
import { Sparkles } from "lucide-react";
import { callAI } from "@/lib/aiClient";
import { lastNDays, levelFromXp } from "@/lib/scoring";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { startOfMonth, parseISO, isAfter, format } from "date-fns";
import { currency } from "@/lib/utils";

export default function MonthlyReviewPage() {
  return (
    <Hydrated>
      <PageHeader title="Monthly review" subtitle="Zoom out. Trends matter more than any single day." />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8"><HabitTrend30 /></div>
        <div className="col-span-12 lg:col-span-4"><Goals /></div>

        <div className="col-span-12 lg:col-span-7"><SpendingTrend30 /></div>
        <div className="col-span-12 lg:col-span-5"><LevelSummary /></div>

        <div className="col-span-12"><AIMonthly /></div>
      </div>
    </Hydrated>
  );
}

function HabitTrend30() {
  const habits = useHabitsStore((s) => s.habits);
  const logs = useHabitsStore((s) => s.logs);
  const days = lastNDays(30);
  const data = days.map((k) => {
    let done = 0;
    for (const h of habits) if (logs[k]?.[h.id]) done++;
    return { label: format(parseISO(k), "M/d"), pct: habits.length ? Math.round((done / habits.length) * 100) : 0 };
  });
  return (
    <Card>
      <CardHeader title="Habit completion trend" subtitle="Last 30 days" />
      <div className="h-64 w-full">
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="mt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip contentStyle={{ background: "#15151f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }} />
            <Area type="monotone" dataKey="pct" stroke="#34d399" strokeWidth={2} fill="url(#mt)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function Goals() {
  const goals = useUserStore((s) => s.goals);
  const update = useUserStore((s) => s.updateGoal);
  return (
    <Card>
      <CardHeader title="Goal progress" subtitle="Tap to adjust" />
      <div className="space-y-3">
        {goals.map((g) => {
          const pct = g.target ? Math.min(100, (g.progress / g.target) * 100) : 0;
          return (
            <div key={g.id}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-white/85">{g.title}</span>
                <span className="text-white/50">{g.progress} / {g.target} {g.unit ?? ""}</span>
              </div>
              <ProgressBar value={pct} color="violet" />
              <div className="mt-1 flex gap-1">
                <button onClick={() => update(g.id, { progress: Math.max(0, g.progress - 1) })} className="rounded bg-white/[0.04] px-1.5 text-[10px] text-white/60 hover:bg-white/[0.08]">-</button>
                <button onClick={() => update(g.id, { progress: g.progress + 1 })} className="rounded bg-white/[0.04] px-1.5 text-[10px] text-white/60 hover:bg-white/[0.08]">+</button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function SpendingTrend30() {
  const expenses = useSpendingStore((s) => s.expenses);
  const days = lastNDays(30);
  const byCat = new Map<string, number>();
  const thisMonth = expenses.filter((e) => isAfter(parseISO(e.date), startOfMonth(new Date())));
  for (const e of thisMonth) byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount);
  const data = EXPENSE_CATEGORIES.map((c) => ({ label: c.label, amount: +(byCat.get(c.id) ?? 0).toFixed(2), color: c.color }))
    .filter((x) => x.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  return (
    <Card>
      <CardHeader title="Spending by category (this month)" />
      <div className="h-60 w-full">
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 10 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
            <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="label" tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 10 }} width={100} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "#15151f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }} formatter={(v: any) => currency(v)} />
            <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
              {data.map((d, i) => <rect key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function LevelSummary() {
  const xp = useUserStore((s) => s.xp);
  const lvl = levelFromXp(xp);
  return (
    <Card>
      <CardHeader title="Progress" subtitle="Cumulative experience" />
      <div className="text-4xl font-semibold text-white">Level {lvl.level}</div>
      <div className="mt-1 text-[11px] text-white/50">{xp.toLocaleString()} XP total · {lvl.into} / {lvl.need} into next level</div>
      <div className="mt-3"><ProgressBar value={lvl.into} max={lvl.need} color="violet" /></div>
    </Card>
  );
}

function AIMonthly() {
  const habits = useHabitsStore((s) => s.habits);
  const logs = useHabitsStore((s) => s.logs);
  const xp = useUserStore((s) => s.xp);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const days = lastNDays(30);
      let done = 0; let total = 0;
      for (const k of days) for (const h of habits) { total++; if (logs[k]?.[h.id]) done++; }
      const month = total ? Math.round((done / total) * 100) : 0;
      const r = await callAI("monthly_review", { monthCompletion: month, xp, level: levelFromXp(xp).level });
      setText(r.text);
    } finally { setLoading(false); }
  };

  useEffect(() => { run(); /* eslint-disable-next-line */ }, []);

  return (
    <Card>
      <CardHeader
        title="AI monthly summary"
        icon={<Sparkles size={16} className="text-violet-300" />}
        right={<Button size="sm" onClick={run} disabled={loading}>{loading ? "Thinking…" : "Regenerate"}</Button>}
      />
      <pre className="whitespace-pre-wrap text-[13px] leading-relaxed text-white/85">{text || "Generating…"}</pre>
    </Card>
  );
}
