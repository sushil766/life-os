"use client";
import { useMemo } from "react";
import { useHabitsStore } from "@/store/habitsStore";
import { Card, CardHeader } from "@/components/ui/Card";
import { isoKey } from "@/lib/scoring";
import { subDays, getDay, format } from "date-fns";

export function HabitHeatmap({ days = 182 }: { days?: number }) {
  const habits = useHabitsStore((s) => s.habits);
  const logs = useHabitsStore((s) => s.logs);

  // build columns of weeks
  const data = useMemo(() => {
    const today = new Date();
    // Align to the end of the week so the rightmost column is the current week.
    const cells: { date: string; pct: number; done: number; total: number; dow: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = subDays(today, i);
      const k = isoKey(d);
      const day = logs[k] ?? {};
      const total = habits.length;
      let done = 0;
      for (const h of habits) if (day[h.id]) done++;
      cells.push({ date: k, pct: total ? done / total : 0, done, total, dow: getDay(d) });
    }
    return cells;
  }, [habits, logs, days]);

  // Bucket cells into weeks (Sun-Sat columns)
  const weeks: typeof data[] = [];
  let curr: typeof data = [];
  // Pad first week's leading days
  const firstDow = data[0]?.dow ?? 0;
  for (let i = 0; i < firstDow; i++) curr.push({ date: "", pct: -1, done: 0, total: 0, dow: i });
  for (const c of data) {
    curr.push(c);
    if (c.dow === 6) { weeks.push(curr); curr = []; }
  }
  if (curr.length) {
    while (curr.length < 7) curr.push({ date: "", pct: -1, done: 0, total: 0, dow: curr.length });
    weeks.push(curr);
  }

  const color = (pct: number) => {
    if (pct < 0) return "rgba(255,255,255,0.02)";
    if (pct === 0) return "rgba(255,255,255,0.05)";
    if (pct < 0.34) return "rgba(167,139,250,0.25)";
    if (pct < 0.67) return "rgba(167,139,250,0.5)";
    if (pct < 1) return "rgba(167,139,250,0.75)";
    return "rgba(167,139,250,1)";
  };

  const monthsAxis = useMemo(() => {
    const out: { x: number; label: string }[] = [];
    let lastMonth = "";
    weeks.forEach((w, idx) => {
      const first = w.find((c) => c.date);
      if (!first) return;
      const m = format(new Date(first.date), "MMM");
      if (m !== lastMonth) { out.push({ x: idx, label: m }); lastMonth = m; }
    });
    return out;
  }, [weeks]);

  const cellSize = 12;
  const gap = 3;

  return (
    <Card>
      <CardHeader title="Consistency heatmap" subtitle="Last ~6 months · all habits combined" />
      <div className="overflow-x-auto no-scrollbar">
        <svg
          width={weeks.length * (cellSize + gap)}
          height={7 * (cellSize + gap) + 18}
        >
          {monthsAxis.map((m) => (
            <text key={m.x + m.label} x={m.x * (cellSize + gap)} y={10} fill="rgba(255,255,255,0.4)" fontSize="9">
              {m.label}
            </text>
          ))}
          <g transform="translate(0, 14)">
            {weeks.map((w, ci) =>
              w.map((c, ri) => (
                <rect
                  key={`${ci}-${ri}`}
                  x={ci * (cellSize + gap)}
                  y={ri * (cellSize + gap)}
                  width={cellSize}
                  height={cellSize}
                  rx={2}
                  ry={2}
                  fill={color(c.pct)}
                >
                  {c.date && <title>{`${c.date}: ${c.done}/${c.total}`}</title>}
                </rect>
              )),
            )}
          </g>
        </svg>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[10px] text-white/40">
        <span>Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((p) => (
          <span key={p} className="inline-block h-3 w-3 rounded" style={{ background: color(p) }} />
        ))}
        <span>More</span>
      </div>
    </Card>
  );
}
