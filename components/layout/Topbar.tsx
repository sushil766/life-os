"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Flame, Trophy, Calendar } from "lucide-react";
import { useUserStore } from "@/store/userStore";
import { useHabitsStore } from "@/store/habitsStore";
import { levelFromXp, overallDisciplineStreak } from "@/lib/scoring";

export function Topbar() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const xp = useUserStore((s) => s.xp);
  const habits = useHabitsStore((s) => s.habits);
  const logs = useHabitsStore((s) => s.logs);
  const lvl = levelFromXp(xp);
  const streak = overallDisciplineStreak(habits, logs);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/[0.06] bg-black/30 px-5 py-3 backdrop-blur md:px-8">
      <div className="flex items-center gap-2 text-xs text-white/60">
        <Calendar size={14} />
        <span>{now ? format(now, "EEEE, MMMM d, yyyy") : ""}</span>
      </div>
      <div className="flex items-center gap-2">
        <Pill icon={<Flame size={12} className="text-amber-400" />} label={`${streak}d`} sub="streak" />
        <Pill icon={<Trophy size={12} className="text-violet-300" />} label={`Lv ${lvl.level}`} sub={`${xp} xp`} />
      </div>
    </header>
  );
}

function Pill({ icon, label, sub }: { icon: React.ReactNode; label: string; sub: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px]">
      {icon}
      <span className="font-semibold text-white">{label}</span>
      <span className="text-white/40">{sub}</span>
    </div>
  );
}
