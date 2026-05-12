"use client";
import { Card, CardHeader } from "@/components/ui/Card";
import { useHabitsStore } from "@/store/habitsStore";
import { lastNDays, streakFor } from "@/lib/scoring";
import { ACCENT_HEX } from "@/lib/constants";
import { format, parseISO } from "date-fns";

export function HabitGrid({ days = 14 }: { days?: number }) {
  const habits = useHabitsStore((s) => s.habits);
  const logs = useHabitsStore((s) => s.logs);
  const setLog = useHabitsStore((s) => s.setLog);
  const keys = lastNDays(days);

  return (
    <Card>
      <CardHeader title="Per-habit log" subtitle={`Last ${days} days · click any cell to flip`} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-xs">
          <thead>
            <tr>
              <th className="py-2 text-left font-medium text-white/40">Habit</th>
              {keys.map((k) => (
                <th key={k} className="px-1 py-2 text-center font-medium text-white/40">
                  {format(parseISO(k), "d")}
                </th>
              ))}
              <th className="pl-3 text-right font-medium text-white/40">Streak</th>
            </tr>
          </thead>
          <tbody>
            {habits.map((h) => {
              const s = streakFor(habits, logs, h.id);
              return (
                <tr key={h.id} className="border-t border-white/[0.04]">
                  <td className="py-2 text-white/85">
                    <span className="mr-2">{h.emoji}</span>
                    {h.name}
                  </td>
                  {keys.map((k) => {
                    const done = !!logs[k]?.[h.id];
                    return (
                      <td key={k} className="px-1 py-1.5 text-center">
                        <button
                          onClick={() => setLog(h.id, k, !done)}
                          className="grid h-6 w-6 place-items-center rounded transition hover:scale-110"
                          style={{
                            background: done ? ACCENT_HEX[h.accent] : "rgba(255,255,255,0.04)",
                            border: `1px solid ${done ? ACCENT_HEX[h.accent] : "rgba(255,255,255,0.08)"}`,
                          }}
                          title={`${k} · ${done ? "done" : "missed"}`}
                        />
                      </td>
                    );
                  })}
                  <td className="pl-3 text-right text-white/80">
                    <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-amber-300">{s}d</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
