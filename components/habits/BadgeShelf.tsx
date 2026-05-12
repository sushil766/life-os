"use client";
import { Card, CardHeader } from "@/components/ui/Card";
import { useHabitsStore } from "@/store/habitsStore";
import { BADGE_DEFS } from "@/lib/constants";
import { streakFor, overallDisciplineStreak, isFullDay, lastNDays, weekKeys } from "@/lib/scoring";

export function BadgeShelf() {
  const habits = useHabitsStore((s) => s.habits);
  const logs = useHabitsStore((s) => s.logs);
  const overall = overallDisciplineStreak(habits, logs);
  const waterStreak = streakFor(habits, logs, "water");
  const sleepStreak = streakFor(habits, logs, "sleep");

  // Perfect day: any day in last 14
  const perfectDay = lastNDays(14).some((k) => isFullDay(habits, logs, k));

  // Perfect week: 7 consecutive full days anywhere in last 30
  const perfectWeek = (() => {
    const days = lastNDays(30);
    let run = 0;
    for (const k of days) {
      if (isFullDay(habits, logs, k)) {
        run++;
        if (run >= 7) return true;
      } else run = 0;
    }
    return false;
  })();

  // Comeback: a 0-day followed by a 5+ run within last 30
  const comeback = (() => {
    const days = lastNDays(30);
    let lastZero = -1;
    for (let i = 0; i < days.length; i++) {
      const day = logs[days[i]] ?? {};
      const done = habits.reduce((acc, h) => acc + (day[h.id] ? 1 : 0), 0);
      if (done === 0) lastZero = i;
      if (lastZero >= 0 && i - lastZero >= 5) {
        // check the gap was all full habits? lighter rule: 5+ days after a 0-day with at least 50% each
        let ok = true;
        for (let j = lastZero + 1; j <= i; j++) {
          const d = logs[days[j]] ?? {};
          const pct = habits.reduce((acc, h) => acc + (d[h.id] ? 1 : 0), 0) / habits.length;
          if (pct < 0.5) { ok = false; break; }
        }
        if (ok) return true;
      }
    }
    return false;
  })();

  const earned: Record<string, boolean> = {
    "streak-3": overall >= 3,
    "streak-7": overall >= 7,
    "streak-14": overall >= 14,
    "streak-30": overall >= 30,
    "streak-100": overall >= 100,
    "perfect-day": perfectDay,
    "perfect-week": perfectWeek,
    "comeback": comeback,
    "hydrated": waterStreak >= 14,
    "rested": sleepStreak >= 7,
  };

  return (
    <Card>
      <CardHeader title="Badges" subtitle="Earned through consistency" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {BADGE_DEFS.map((b) => {
          const got = earned[b.id];
          return (
            <div
              key={b.id}
              className={`rounded-xl border p-3 text-center transition ${
                got ? "border-violet-400/40 bg-violet-500/10 shadow-glow" : "border-white/[0.06] bg-white/[0.02] opacity-50"
              }`}
            >
              <div className={`text-2xl ${got ? "" : "grayscale"}`}>{b.icon}</div>
              <div className="mt-1 text-[11px] font-semibold text-white">{b.name}</div>
              <div className="text-[10px] text-white/40">{b.desc}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
