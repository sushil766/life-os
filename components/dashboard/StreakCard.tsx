"use client";
import { Card } from "@/components/ui/Card";
import { useHabitsStore } from "@/store/habitsStore";
import { overallDisciplineStreak, streakFor } from "@/lib/scoring";
import { Flame } from "lucide-react";
import { ACCENT_HEX } from "@/lib/constants";

export function StreakCard() {
  const habits = useHabitsStore((s) => s.habits);
  const logs = useHabitsStore((s) => s.logs);
  const overall = overallDisciplineStreak(habits, logs);
  const top = habits
    .map((h) => ({ h, days: streakFor(habits, logs, h.id) }))
    .sort((a, b) => b.days - a.days)
    .slice(0, 4);

  return (
    <Card>
      <div className="mb-3 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/15 text-amber-300">
          <Flame size={18} />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-white/40">Discipline streak</div>
          <div className="text-2xl font-semibold tracking-tight text-white">
            {overall} <span className="text-sm font-normal text-white/40">days</span>
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        {top.map(({ h, days }) => (
          <div key={h.id} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-1.5 text-xs">
            <span className="flex items-center gap-2 text-white/80">
              <span>{h.emoji}</span>
              {h.name}
            </span>
            <span className="font-medium" style={{ color: ACCENT_HEX[h.accent] }}>{days}d</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
