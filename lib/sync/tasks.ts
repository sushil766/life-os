"use client";
import type { Task } from "@/lib/types";
import { getSupabaseOrNull, safeSync } from "./index";

export async function pullTasks(userId: string): Promise<Task[] | null> {
  const supa = getSupabaseOrNull();
  if (!supa) return null;
  const { data, error } = await supa
    .from("tasks")
    .select("id,title,date,done,category,priority,start_time,end_time")
    .eq("user_id", userId)
    .order("date", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    date: r.date,
    done: r.done,
    category: (r.category as Task["category"]) ?? undefined,
    priority: (r.priority as Task["priority"]) ?? undefined,
    startTime: r.start_time ?? undefined,
    endTime: r.end_time ?? undefined,
  }));
}

export async function upsertTask(userId: string, t: Task) {
  return safeSync(async () => {
    const supa = getSupabaseOrNull();
    if (!supa) return;
    const { error } = await supa.from("tasks").upsert({
      id: t.id,
      user_id: userId,
      title: t.title,
      date: t.date,
      done: t.done,
      category: t.category ?? null,
      priority: t.priority ?? null,
      start_time: t.startTime ?? null,
      end_time: t.endTime ?? null,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  });
}

export async function deleteTask(userId: string, id: string) {
  return safeSync(async () => {
    const supa = getSupabaseOrNull();
    if (!supa) return;
    const { error } = await supa.from("tasks").delete().eq("user_id", userId).eq("id", id);
    if (error) throw error;
  });
}
