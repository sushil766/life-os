"use client";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Hydrated } from "@/components/Hydrated";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/Progress";
import { useFitnessStore } from "@/store/fitnessStore";
import { useHabitsStore } from "@/store/habitsStore";
import { useUserStore } from "@/store/userStore";
import { lastNDays, streakFor, weekKeys } from "@/lib/scoring";
import { todayKey } from "@/lib/utils";
import { XP } from "@/lib/constants";
import { Plus, Trash2, Dumbbell, Droplets, Moon } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts";

export default function FitnessPage() {
  return (
    <Hydrated>
      <PageHeader title="Fitness" subtitle="Workouts, sleep, water — the foundation everything else compounds on." />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-4"><ConsistencyScore /></div>
        <div className="col-span-12 lg:col-span-4"><SleepWaterCard kind="water" /></div>
        <div className="col-span-12 lg:col-span-4"><SleepWaterCard kind="sleep" /></div>

        <div className="col-span-12 lg:col-span-7"><WorkoutChart /></div>
        <div className="col-span-12 lg:col-span-5"><StretchCard /></div>

        <div className="col-span-12"><WorkoutLog /></div>
      </div>
    </Hydrated>
  );
}

function ConsistencyScore() {
  const habits = useHabitsStore((s) => s.habits);
  const logs = useHabitsStore((s) => s.logs);
  const fitnessIds = ["workout", "stretch", "water", "sleep"];
  const days = weekKeys();
  let total = 0, done = 0;
  for (const d of days) for (const id of fitnessIds) { total++; if (logs[d]?.[id]) done++; }
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <Card>
      <CardHeader title="Weekly fitness consistency" subtitle="Workout + stretch + water + sleep" icon={<Dumbbell size={16} className="text-amber-300" />} />
      <div className="mb-1 flex items-end justify-between">
        <span className="text-4xl font-semibold text-white">{pct}<span className="text-lg text-white/40">%</span></span>
        <Badge tone={pct >= 80 ? "emerald" : pct >= 50 ? "amber" : "rose"}>{pct >= 80 ? "Dialed" : pct >= 50 ? "OK" : "Slipping"}</Badge>
      </div>
      <ProgressBar value={pct} color="amber" />
      <p className="mt-3 text-[11px] text-white/40">A high score here usually drags everything else upward.</p>
    </Card>
  );
}

function SleepWaterCard({ kind }: { kind: "water" | "sleep" }) {
  const habits = useHabitsStore((s) => s.habits);
  const logs = useHabitsStore((s) => s.logs);
  const toggle = useHabitsStore((s) => s.toggle);
  const addXp = useUserStore((s) => s.addXp);
  const today = todayKey();
  const done = !!logs[today]?.[kind];
  const streak = streakFor(habits, logs, kind);

  const days = lastNDays(14);
  const data = days.map((k) => ({ label: k.slice(5), v: logs[k]?.[kind] ? 1 : 0 }));

  const color = kind === "water" ? "#38bdf8" : "#a78bfa";

  return (
    <Card>
      <CardHeader
        title={kind === "water" ? "Water (3L)" : "Sleep (8h+)"}
        subtitle={`${streak}-day streak`}
        icon={kind === "water" ? <Droplets size={16} className="text-sky-300" /> : <Moon size={16} className="text-violet-300" />}
        right={
          <Button size="sm" variant={done ? "secondary" : "primary"} onClick={() => { const next = toggle(kind); addXp(next ? XP.perHabit : -XP.perHabit); }}>
            {done ? "Logged" : "Log today"}
          </Button>
        }
      />
      <div className="h-24 w-full">
        <ResponsiveContainer>
          <BarChart data={data}>
            <XAxis dataKey="label" hide />
            <YAxis hide />
            <Bar dataKey="v" fill={color} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function StretchCard() {
  const habits = useHabitsStore((s) => s.habits);
  const logs = useHabitsStore((s) => s.logs);
  const toggle = useHabitsStore((s) => s.toggle);
  const addXp = useUserStore((s) => s.addXp);
  const today = todayKey();
  const done = !!logs[today]?.stretch;
  const streak = streakFor(habits, logs, "stretch");
  return (
    <Card>
      <CardHeader title="Stretch / Foam roll" subtitle="Tiny daily input, huge long-term return." />
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-semibold text-white">{streak}<span className="ml-1 text-sm text-white/40">day streak</span></div>
          <div className="text-[11px] text-white/50">Aim for 10 min after every workout + 5 min before bed.</div>
        </div>
        <Button variant={done ? "secondary" : "primary"} onClick={() => { const next = toggle("stretch"); addXp(next ? XP.perHabit : -XP.perHabit); }}>
          {done ? "Done today" : "Log"}
        </Button>
      </div>
    </Card>
  );
}

function WorkoutChart() {
  const workouts = useFitnessStore((s) => s.workouts);
  const days = lastNDays(30);
  const data = days.map((k) => {
    const total = workouts.filter((w) => w.date === k).reduce((acc, w) => acc + w.minutes, 0);
    return { label: k.slice(5), minutes: total };
  });
  return (
    <Card>
      <CardHeader title="Workout volume" subtitle="Last 30 days · minutes logged" />
      <div className="h-56 w-full">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -25 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "#15151f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }} />
            <Line type="monotone" dataKey="minutes" stroke="#fbbf24" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function WorkoutLog() {
  const workouts = useFitnessStore((s) => s.workouts);
  const add = useFitnessStore((s) => s.addWorkout);
  const remove = useFitnessStore((s) => s.removeWorkout);
  const addXp = useUserStore((s) => s.addXp);
  const [type, setType] = useState("Upper");
  const [minutes, setMinutes] = useState(45);
  const [date, setDate] = useState(todayKey());

  const recent = [...workouts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);

  return (
    <Card>
      <CardHeader
        title="Workout log"
        subtitle="Log what you actually did. +25 XP per workout."
        right={
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              add({ date, type, minutes });
              addXp(XP.perWorkout);
            }}
          >
            <Select value={type} onChange={(e) => setType(e.target.value)} className="w-28">
              {["Upper","Lower","Full body","Rest","Run"].map((t) => <option key={t}>{t}</option>)}
            </Select>
            <Input type="number" value={minutes} onChange={(e) => setMinutes(parseInt(e.target.value || "0", 10))} className="w-24" />
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
            <Button type="submit" variant="primary" icon={<Plus size={14} />}>Log</Button>
          </form>
        }
      />
      <div className="space-y-1.5">
        {recent.map((w) => (
          <div key={w.id} className="group flex items-center gap-3 rounded-xl bg-white/[0.02] px-3 py-2">
            <Badge tone="amber">{w.type}</Badge>
            <div className="text-sm text-white/85">{w.minutes} min</div>
            <div className="ml-auto text-[11px] text-white/50">{w.date}</div>
            <button onClick={() => remove(w.id)} className="opacity-0 transition group-hover:opacity-100 text-white/30 hover:text-rose-300">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {recent.length === 0 && <p className="text-sm text-white/40">No workouts logged yet.</p>}
      </div>
    </Card>
  );
}
