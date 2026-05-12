"use client";
import { Card, CardHeader } from "@/components/ui/Card";
import { useUserStore } from "@/store/userStore";
import { todayKey } from "@/lib/utils";
import { Smile, BatteryCharging, Target } from "lucide-react";

export function ReflectionCard() {
  const reflections = useUserStore((s) => s.reflections);
  const upsert = useUserStore((s) => s.upsertReflection);
  const today = todayKey();
  const r = reflections.find((x) => x.date === today) ?? { date: today, mood: 6, energy: 6, productivity: 6 };

  const set = (patch: Partial<typeof r>) => upsert({ ...r, ...patch });

  return (
    <Card>
      <CardHeader title="Quick reflection" subtitle="How are you doing today?" />
      <div className="space-y-3">
        <Slider label="Mood" value={r.mood} onChange={(v) => set({ mood: v })} icon={<Smile size={14} />} color="violet" />
        <Slider label="Energy" value={r.energy} onChange={(v) => set({ energy: v })} icon={<BatteryCharging size={14} />} color="emerald" />
        <Slider label="Productivity" value={r.productivity} onChange={(v) => set({ productivity: v })} icon={<Target size={14} />} color="amber" />
      </div>
    </Card>
  );
}

function Slider({
  label, value, onChange, icon, color,
}: { label: string; value: number; onChange: (v: number) => void; icon: React.ReactNode; color: "violet" | "emerald" | "amber" }) {
  const accent = color === "violet" ? "#a78bfa" : color === "emerald" ? "#34d399" : "#fbbf24";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-white/70">{icon}{label}</span>
        <span className="font-semibold" style={{ color: accent }}>{value}/10</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full accent-violet-400"
        style={{ accentColor: accent }}
      />
    </div>
  );
}
