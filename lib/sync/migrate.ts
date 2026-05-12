"use client";
// Local → Cloud migrator. Detects existing localStorage data, prompts via UI,
// runs every bulk push under a single orchestration with progress callbacks,
// keeps a backup, and marks completion so we don't re-prompt.

import { useHabitsStore } from "@/store/habitsStore";
import { useTasksStore } from "@/store/tasksStore";
import { useFitnessStore } from "@/store/fitnessStore";
import { useSpendingStore } from "@/store/spendingStore";
import { useCalendarStore } from "@/store/calendarStore";
import { useSchoolStore } from "@/store/schoolStore";
import { useUserStore } from "@/store/userStore";
import { useAssistantStore } from "@/store/assistantStore";
import { getSupabaseOrNull } from "./index";
import {
  pushHabits,
  pushHabitLogs,
  pushTasks,
  pushWorkouts,
  pushExpenses,
  pushBudget,
  pushCalendarEvents,
  pushSchoolClasses,
  pushAssignments,
  pushStudySessions,
  pushReflections,
  pushGoals,
  pushProfile,
  pushMessages,
  wipeUserData,
} from "./bulk";

const PERSIST_KEYS = [
  "lifeos:user:v2",
  "lifeos:habits:v2",
  "lifeos:tasks:v2",
  "lifeos:fitness:v2",
  "lifeos:spending:v2",
  "lifeos:calendar:v3",
  "lifeos:school:v3",
  "lifeos:assistant:v1",
] as const;

const MIGRATED_KEY = (userId: string) => `lifeos:migrated:${userId}`;
const BACKUP_KEY = (userId: string, ts: number) =>
  `lifeos:backup:${userId}:${ts}`;

export interface MigrationCounts {
  habits: number;
  habitLogs: number;
  tasks: number;
  workouts: number;
  expenses: number;
  events: number;
  classes: number;
  assignments: number;
  studySessions: number;
  reflections: number;
  goals: number;
  messages: number;
  total: number;
}

export interface CloudCounts {
  habits: number;
  habitLogs: number;
  tasks: number;
  workouts: number;
  expenses: number;
  events: number;
  classes: number;
  assignments: number;
  studySessions: number;
  reflections: number;
  goals: number;
  messages: number;
  total: number;
}

export interface MigrationProgress {
  step: string;
  done: number;
  total: number;
}

export type MigrationMode = "merge" | "replace";

// ── Detection ──────────────────────────────────────────────────────────────
function countHabitLogs(logs: Record<string, Record<string, boolean>>): number {
  let n = 0;
  for (const d of Object.keys(logs)) {
    const byHabit = logs[d] ?? {};
    for (const h of Object.keys(byHabit)) {
      if (typeof byHabit[h] === "boolean") n++;
    }
  }
  return n;
}

export function countLocalData(): MigrationCounts {
  const habits = useHabitsStore.getState().habits;
  const habitLogs = useHabitsStore.getState().logs;
  const tasks = useTasksStore.getState().tasks;
  const workouts = useFitnessStore.getState().workouts;
  const expenses = useSpendingStore.getState().expenses;
  const events = useCalendarStore.getState().events;
  const school = useSchoolStore.getState();
  const user = useUserStore.getState();
  const messages = useAssistantStore.getState().messages;

  const c: MigrationCounts = {
    habits: habits.length,
    habitLogs: countHabitLogs(habitLogs),
    tasks: tasks.length,
    workouts: workouts.length,
    expenses: expenses.length,
    events: events.length,
    classes: school.classes.length,
    assignments: school.assignments.length,
    studySessions: school.studySessions.length,
    reflections: user.reflections.length,
    goals: user.goals.length,
    messages: messages.length,
    total: 0,
  };
  c.total =
    c.habits +
    c.habitLogs +
    c.tasks +
    c.workouts +
    c.expenses +
    c.events +
    c.classes +
    c.assignments +
    c.studySessions +
    c.reflections +
    c.goals +
    c.messages;
  return c;
}

export function hasMigrated(userId: string): boolean {
  if (typeof window === "undefined") return true;
  return Boolean(localStorage.getItem(MIGRATED_KEY(userId)));
}

export function markMigrated(userId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MIGRATED_KEY(userId), new Date().toISOString());
}

// ── Cloud snapshot count (so we know if there's a conflict) ────────────────
export async function countCloudData(userId: string): Promise<CloudCounts | null> {
  const supa = getSupabaseOrNull();
  if (!supa) return null;
  const tables: { table: string; key: keyof CloudCounts }[] = [
    { table: "habits", key: "habits" },
    { table: "habit_logs", key: "habitLogs" },
    { table: "tasks", key: "tasks" },
    { table: "workouts", key: "workouts" },
    { table: "expenses", key: "expenses" },
    { table: "calendar_events", key: "events" },
    { table: "school_classes", key: "classes" },
    { table: "assignments", key: "assignments" },
    { table: "study_sessions", key: "studySessions" },
    { table: "reflections", key: "reflections" },
    { table: "goals", key: "goals" },
    { table: "ai_messages", key: "messages" },
  ];
  const counts: any = {};
  for (const { table, key } of tables) {
    const { count } = await (supa.from(table) as any)
      .select("*", { head: true, count: "exact" })
      .eq("user_id", userId);
    counts[key] = count ?? 0;
  }
  counts.total = tables.reduce((sum, { key }) => sum + (counts[key] ?? 0), 0);
  return counts as CloudCounts;
}

// ── Backup ─────────────────────────────────────────────────────────────────
export function backupLocalToStorage(userId: string): string {
  if (typeof window === "undefined") return "";
  const ts = Date.now();
  const snapshot: Record<string, string | null> = {};
  for (const k of PERSIST_KEYS) snapshot[k] = localStorage.getItem(k);
  const key = BACKUP_KEY(userId, ts);
  localStorage.setItem(
    key,
    JSON.stringify({ at: new Date(ts).toISOString(), snapshot }),
  );
  return key;
}

export function restoreBackup(backupKey: string): boolean {
  if (typeof window === "undefined") return false;
  const raw = localStorage.getItem(backupKey);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as {
      at: string;
      snapshot: Record<string, string | null>;
    };
    for (const [k, v] of Object.entries(parsed.snapshot)) {
      if (v == null) localStorage.removeItem(k);
      else localStorage.setItem(k, v);
    }
    return true;
  } catch {
    return false;
  }
}

export function listBackups(userId: string): string[] {
  if (typeof window === "undefined") return [];
  const out: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    if (k.startsWith(`lifeos:backup:${userId}:`)) out.push(k);
  }
  return out.sort().reverse();
}

// ── Run ────────────────────────────────────────────────────────────────────
export async function runMigration(
  userId: string,
  opts: {
    mode: MigrationMode;
    displayName?: string;
    onProgress?: (p: MigrationProgress) => void;
  },
): Promise<{ backupKey: string; counts: MigrationCounts }> {
  const counts = countLocalData();
  const backupKey = backupLocalToStorage(userId);
  const onProgress = opts.onProgress ?? (() => {});

  if (opts.mode === "replace") {
    onProgress({ step: "Wiping cloud data…", done: 0, total: 13 });
    await wipeUserData(userId);
  }

  const habits = useHabitsStore.getState().habits;
  const habitLogs = useHabitsStore.getState().logs;
  const tasks = useTasksStore.getState().tasks;
  const workouts = useFitnessStore.getState().workouts;
  const expenses = useSpendingStore.getState().expenses;
  const budget = useSpendingStore.getState().budget;
  const events = useCalendarStore.getState().events;
  const school = useSchoolStore.getState();
  const user = useUserStore.getState();
  const messages = useAssistantStore.getState().messages;

  const steps: { label: string; run: () => Promise<unknown> }[] = [
    {
      label: "Profile + XP",
      run: () => pushProfile(userId, opts.displayName ?? user.name, user.xp),
    },
    { label: "Habits", run: () => pushHabits(userId, habits) },
    { label: "Habit logs", run: () => pushHabitLogs(userId, habitLogs) },
    { label: "Tasks", run: () => pushTasks(userId, tasks) },
    { label: "Workouts", run: () => pushWorkouts(userId, workouts) },
    { label: "Expenses", run: () => pushExpenses(userId, expenses) },
    { label: "Budget", run: () => pushBudget(userId, budget) },
    { label: "Calendar events", run: () => pushCalendarEvents(userId, events) },
    { label: "Classes", run: () => pushSchoolClasses(userId, school.classes) },
    { label: "Assignments", run: () => pushAssignments(userId, school.assignments) },
    { label: "Study sessions", run: () => pushStudySessions(userId, school.studySessions) },
    { label: "Reflections", run: () => pushReflections(userId, user.reflections) },
    { label: "Goals", run: () => pushGoals(userId, user.goals) },
    { label: "Assistant messages", run: () => pushMessages(userId, messages) },
  ];

  for (let i = 0; i < steps.length; i++) {
    onProgress({ step: steps[i].label, done: i, total: steps.length });
    await steps[i].run();
  }
  onProgress({ step: "Done", done: steps.length, total: steps.length });

  markMigrated(userId);
  return { backupKey, counts };
}
