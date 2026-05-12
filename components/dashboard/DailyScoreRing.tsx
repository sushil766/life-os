"use client";
import { Card } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/Progress";
import { Badge } from "@/components/ui/Badge";
import { useHabitsStore } from "@/store/habitsStore";
import { dailyScore } from "@/lib/scoring";
import { todayKey } from "@/lib/utils";

export function DailyScoreRing() {
  const habits = useHabitsStore((s) => s.habits);
  const logs = useHabitsStore((s) => s.logs);
  const today = todayKey();
  const score = dailyScore(habits, logs, today);
  const doneCount = habits.filter((h) => logs[today]?.[h.id]).length;
  const tone = score >= 80 ? "emerald" : score >= 50 ? "violet" : score >= 25 ? "amber" : "rose";
  const color =
    tone === "emerald" ? "#34d399" :
    tone === "violet" ? "#a78bfa" :
    tone === "amber" ? "#fbbf24" : "#fb7185";

  return (
    <Card className="flex flex-col items-center justify-center text-center">
      <div className="text-[10px] uppercase tracking-wider text-white/40">Daily score</div>
      <div className="my-2">
        <ProgressRing value={score} max={100} label={`${score}`} sublabel="of 100" color={color} size={170} stroke={14} />
      </div>
      <Badge tone={tone as any}>
        {score >= 80 ? "Locked in" : score >= 50 ? "Solid day" : score >= 25 ? "Keep going" : "Reset & restart"}
      </Badge>
      <div className="mt-3 text-[11px] text-white/50">{doneCount} of {habits.length} habits done</div>
    </Card>
  );
}
