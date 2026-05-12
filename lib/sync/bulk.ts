"use client";
// Bulk push helpers for each Zustand store → Supabase. All upserts are
// idempotent on the natural key, so re-running migration is safe.
//
// Each function returns the count of rows attempted. Errors are surfaced
// to the caller so the migrator can report per-entity failures.

import type {
  Habit,
  HabitLogs,
  Task,
  Workout,
  Expense,
  BudgetMap,
  CalendarEvent,
  SchoolClass,
  Assignment,
  StudySession,
  Reflection,
  Goal,
  AIMessage,
} from "@/lib/types";
import { getSupabaseOrNull } from "./index";

async function batchUpsert(
  table: string,
  rows: any[],
  options?: { onConflict?: string },
) {
  const supa = getSupabaseOrNull();
  if (!supa || rows.length === 0) return;
  // Supabase recommends ≤500 rows per upsert batch. Habit logs can blow past
  // that easily on a long-term user, so chunk it.
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const { error } = await (supa.from(table) as any).upsert(slice, options ?? {});
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

// ── Profile / XP ───────────────────────────────────────────────────────────
export async function pushProfile(userId: string, name: string, xp: number) {
  const supa = getSupabaseOrNull();
  if (!supa) return;
  const { error } = await (supa.from("profiles") as any)
    .update({ display_name: name, xp, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw new Error(`profiles: ${error.message}`);
}

// ── Habits + Logs ──────────────────────────────────────────────────────────
export async function pushHabits(userId: string, habits: Habit[]) {
  const rows = habits.map((h, i) => ({
    id: h.id,
    user_id: userId,
    name: h.name,
    emoji: h.emoji,
    target: h.target ?? null,
    accent: h.accent,
    is_core: h.core,
    sort_order: i,
  }));
  await batchUpsert("habits", rows, { onConflict: "id" });
  return rows.length;
}

export async function pushHabitLogs(userId: string, logs: HabitLogs) {
  const rows: any[] = [];
  for (const date of Object.keys(logs)) {
    const byHabit = logs[date] ?? {};
    for (const habitId of Object.keys(byHabit)) {
      const completed = byHabit[habitId];
      if (typeof completed !== "boolean") continue;
      rows.push({ user_id: userId, habit_id: habitId, date, completed });
    }
  }
  await batchUpsert("habit_logs", rows, { onConflict: "user_id,habit_id,date" });
  return rows.length;
}

// ── Tasks ──────────────────────────────────────────────────────────────────
export async function pushTasks(userId: string, tasks: Task[]) {
  const rows = tasks.map((t) => ({
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
  }));
  await batchUpsert("tasks", rows, { onConflict: "id" });
  return rows.length;
}

// ── Workouts ───────────────────────────────────────────────────────────────
export async function pushWorkouts(userId: string, workouts: Workout[]) {
  const rows = workouts.map((w) => ({
    id: w.id,
    user_id: userId,
    date: w.date,
    type: w.type,
    minutes: w.minutes,
    notes: w.notes ?? null,
    exercises: w.exercises ?? null,
  }));
  await batchUpsert("workouts", rows, { onConflict: "id" });
  return rows.length;
}

// ── Expenses + Budget ──────────────────────────────────────────────────────
export async function pushExpenses(userId: string, expenses: Expense[]) {
  const rows = expenses.map((e) => ({
    id: e.id,
    user_id: userId,
    date: e.date,
    amount: e.amount,
    category: e.category,
    description: e.description ?? null,
  }));
  await batchUpsert("expenses", rows, { onConflict: "id" });
  return rows.length;
}

export async function pushBudget(userId: string, budget: BudgetMap) {
  const supa = getSupabaseOrNull();
  if (!supa) return 0;
  const { error } = await (supa.from("budgets") as any).upsert(
    {
      user_id: userId,
      monthly: budget.monthly,
      per_category: budget.perCategory ?? {},
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(`budgets: ${error.message}`);
  return 1;
}

// ── Calendar ───────────────────────────────────────────────────────────────
export async function pushCalendarEvents(userId: string, events: CalendarEvent[]) {
  const rows = events.map((e) => ({
    id: e.id,
    user_id: userId,
    title: e.title,
    date: e.date,
    start_time: e.startTime ?? null,
    end_time: e.endTime ?? null,
    kind: e.kind,
    color: e.color ?? null,
    class_id: e.classId ?? null,
    notes: e.notes ?? null,
    recurring: e.recurring ?? null,
    day_of_week: e.dayOfWeek ?? null,
    source: e.source ?? "local",
    google_id: e.googleId ?? null,
    html_link: e.htmlLink ?? null,
  }));
  await batchUpsert("calendar_events", rows, { onConflict: "id" });
  return rows.length;
}

// ── School ─────────────────────────────────────────────────────────────────
export async function pushSchoolClasses(userId: string, classes: SchoolClass[]) {
  const rows = classes.map((c) => ({
    id: c.id,
    user_id: userId,
    code: c.code,
    name: c.name,
    color: c.color,
    instructor: c.instructor ?? null,
    grade_target: c.gradeTarget ?? null,
  }));
  await batchUpsert("school_classes", rows, { onConflict: "id" });
  return rows.length;
}

export async function pushAssignments(userId: string, assignments: Assignment[]) {
  const rows = assignments.map((a) => ({
    id: a.id,
    user_id: userId,
    class_id: a.classId ?? null,
    title: a.title,
    due: a.due,
    done: a.done,
    weight: a.weight ?? null,
    notes: a.notes ?? null,
    updated_at: new Date().toISOString(),
  }));
  await batchUpsert("assignments", rows, { onConflict: "id" });
  return rows.length;
}

export async function pushStudySessions(userId: string, sessions: StudySession[]) {
  const rows = sessions.map((s) => ({
    id: s.id,
    user_id: userId,
    class_id: s.classId ?? null,
    date: s.date,
    minutes: s.minutes,
    topic: s.topic ?? null,
  }));
  await batchUpsert("study_sessions", rows, { onConflict: "id" });
  return rows.length;
}

// ── Reflections + Goals ────────────────────────────────────────────────────
export async function pushReflections(userId: string, reflections: Reflection[]) {
  const rows = reflections.map((r) => ({
    user_id: userId,
    date: r.date,
    mood: r.mood,
    energy: r.energy,
    productivity: r.productivity,
    note: r.note ?? null,
  }));
  await batchUpsert("reflections", rows, { onConflict: "user_id,date" });
  return rows.length;
}

export async function pushGoals(userId: string, goals: Goal[]) {
  const rows = goals.map((g) => ({
    id: g.id,
    user_id: userId,
    title: g.title,
    target: g.target,
    progress: g.progress,
    unit: g.unit ?? null,
    due: g.due ?? null,
  }));
  await batchUpsert("goals", rows, { onConflict: "id" });
  return rows.length;
}

// ── Assistant messages ─────────────────────────────────────────────────────
export async function pushMessages(userId: string, messages: AIMessage[]) {
  const rows = messages.map((m) => ({
    id: m.id,
    user_id: userId,
    role: m.role,
    text: m.text,
    at: new Date(m.at).toISOString(),
  }));
  await batchUpsert("ai_messages", rows, { onConflict: "id" });
  return rows.length;
}

// ── Wipe (used by "replace cloud" mode) ────────────────────────────────────
export async function wipeUserData(userId: string) {
  const supa = getSupabaseOrNull();
  if (!supa) return;
  const tables = [
    "ai_messages",
    "ai_summaries",
    "habit_logs",
    "habits",
    "tasks",
    "calendar_events",
    "study_sessions",
    "assignments",
    "school_classes",
    "workouts",
    "expenses",
    "budgets",
    "goals",
    "reflections",
  ];
  for (const t of tables) {
    const { error } = await (supa.from(t) as any).delete().eq("user_id", userId);
    if (error) throw new Error(`wipe ${t}: ${error.message}`);
  }
}
