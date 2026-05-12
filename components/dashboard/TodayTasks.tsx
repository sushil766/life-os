"use client";
import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useTasksStore } from "@/store/tasksStore";
import { useUserStore } from "@/store/userStore";
import { todayKey } from "@/lib/utils";
import { XP } from "@/lib/constants";
import { Plus, Trash2, Check } from "lucide-react";

export function TodayTasks() {
  const tasks = useTasksStore((s) => s.tasks);
  const add = useTasksStore((s) => s.add);
  const toggle = useTasksStore((s) => s.toggle);
  const remove = useTasksStore((s) => s.remove);
  const addXp = useUserStore((s) => s.addXp);
  const today = todayKey();

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "med" | "high">("med");

  const todayList = tasks.filter((t) => t.date === today)
    .sort((a, b) => Number(a.done) - Number(b.done) || (b.priority === "high" ? 1 : -1));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    add({ title: title.trim(), date: today, category: "personal", priority });
    setTitle("");
  };

  return (
    <Card>
      <CardHeader title="Today's tasks" subtitle={`${todayList.filter(t=>!t.done).length} open · ${todayList.filter(t=>t.done).length} done`} />
      <form onSubmit={submit} className="mb-3 flex gap-2">
        <Input placeholder="Add a task…" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Select value={priority} onChange={(e) => setPriority(e.target.value as any)} className="w-28">
          <option value="low">Low</option>
          <option value="med">Med</option>
          <option value="high">High</option>
        </Select>
        <Button type="submit" variant="primary" icon={<Plus size={14} />}>Add</Button>
      </form>
      <div className="space-y-1.5">
        {todayList.length === 0 && (
          <p className="rounded-xl bg-white/[0.02] p-3 text-sm text-white/40">No tasks yet. Add one above.</p>
        )}
        {todayList.map((t) => (
          <div key={t.id} className="group flex items-center gap-3 rounded-xl bg-white/[0.02] px-3 py-2">
            <button
              onClick={() => { const next = toggle(t.id); addXp(next ? XP.perTask : -XP.perTask); }}
              className={`grid h-5 w-5 place-items-center rounded-md border ${t.done ? "border-emerald-400 bg-emerald-400" : "border-white/20 hover:border-white/40"}`}
            >
              {t.done && <Check size={12} className="text-black" strokeWidth={3} />}
            </button>
            <div className="min-w-0 flex-1">
              <div className={`truncate text-sm ${t.done ? "text-white/40 line-through" : "text-white"}`}>{t.title}</div>
              {(t.startTime || t.priority) && (
                <div className="flex items-center gap-2 text-[10px] text-white/40">
                  {t.startTime && <span>{t.startTime}{t.endTime ? `–${t.endTime}` : ""}</span>}
                  {t.priority === "high" && <Badge tone="rose">high</Badge>}
                </div>
              )}
            </div>
            <button onClick={() => remove(t.id)} className="opacity-0 transition group-hover:opacity-100 text-white/30 hover:text-rose-300">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}
