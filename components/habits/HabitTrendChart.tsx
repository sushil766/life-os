"use client";
import { Card, CardHeader } from "@/components/ui/Card";
import { useHabitsStore } from "@/store/habitsStore";
import { lastNDays } from "@/lib/scoring";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { format, parseISO } from "date-fns";

export function HabitTrendChart({ days = 30 }: { days?: number }) {
  const habits = useHabitsStore((s) => s.habits);
  const logs = useHabitsStore((s) => s.logs);
  const keys = lastNDays(days);
  const data = keys.map((k) => {
    let done = 0;
    for (const h of habits) if (logs[k]?.[h.id]) done++;
    return { date: k, label: format(parseISO(k), "M/d"), pct: habits.length ? Math.round((done / habits.length) * 100) : 0 };
  });
  return (
    <Card>
      <CardHeader title="Completion trend" subtitle={`Last ${days} days`} />
      <div className="h-56 w-full">
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} interval={Math.floor(days / 8)} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ background: "#15151f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }}
              labelStyle={{ color: "rgba(255,255,255,0.7)" }}
            />
            <Area type="monotone" dataKey="pct" stroke="#a78bfa" strokeWidth={2} fill="url(#g1)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
