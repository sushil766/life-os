"use client";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/Progress";
import { useUserStore } from "@/store/userStore";
import { levelFromXp } from "@/lib/scoring";
import { Trophy } from "lucide-react";

export function XPBar() {
  const xp = useUserStore((s) => s.xp);
  const lvl = levelFromXp(xp);
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/15 text-violet-300">
          <Trophy size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-semibold text-white">Level {lvl.level}</span>
            <span className="text-[11px] text-white/40">{lvl.into} / {lvl.need} XP</span>
          </div>
          <div className="mt-2"><ProgressBar value={lvl.into} max={lvl.need} color="violet" /></div>
          <div className="mt-1.5 text-[10px] text-white/40">Total XP: {xp.toLocaleString()}</div>
        </div>
      </div>
    </Card>
  );
}
