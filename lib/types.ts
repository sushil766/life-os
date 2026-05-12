// Core domain types for Life OS.
// ISO date string in YYYY-MM-DD form.
export type DateKey = string;

export type HabitId = string;

export interface Habit {
  id: HabitId;
  name: string;
  emoji: string;
  target?: string; // e.g. "3L", "8h", "10 pages"
  accent: "emerald" | "violet" | "sky" | "amber" | "rose" | "slate";
  core: boolean; // core habits ship by default
}

// logs[dateKey][habitId] = true|false
export type HabitLogs = Record<DateKey, Record<HabitId, boolean>>;

export interface Reflection {
  date: DateKey;
  mood: number; // 1-10
  energy: number; // 1-10
  productivity: number; // 1-10
  note?: string;
}

export interface UserState {
  name: string;
  xp: number;
  reflections: Reflection[];
  goals: Goal[];
  initializedAt: string;
}

export interface Goal {
  id: string;
  title: string;
  target: number;
  progress: number;
  unit?: string;
  due?: DateKey;
}

export interface Task {
  id: string;
  title: string;
  date: DateKey;
  done: boolean;
  category?: "school" | "work" | "fitness" | "personal" | "errand";
  priority?: "low" | "med" | "high";
  startTime?: string; // "08:30"
  endTime?: string;
}

export type EventKind = "class" | "assignment" | "exam" | "work" | "workout" | "routine" | "personal";

export interface CalendarEvent {
  id: string;
  title: string;
  date: DateKey;
  startTime?: string;
  endTime?: string;
  kind: EventKind;
  color?: string;
  classId?: string;
  notes?: string;
  recurring?: "weekly" | "daily" | "none";
  dayOfWeek?: number; // 0-6 when recurring weekly
  source?: "local" | "google";
  googleId?: string;
  htmlLink?: string;
}

export interface SchoolClass {
  id: string;
  code: string;
  name: string;
  color: string;
  instructor?: string;
  gradeTarget?: string;
}

export interface Assignment {
  id: string;
  classId: string;
  title: string;
  due: DateKey;
  done: boolean;
  weight?: number;
  notes?: string;
}

export interface StudySession {
  id: string;
  classId?: string;
  date: DateKey;
  minutes: number;
  topic?: string;
}

export interface Workout {
  id: string;
  date: DateKey;
  type: string; // "push", "pull", "legs", "cardio", "mobility"
  minutes: number;
  notes?: string;
  exercises?: { name: string; sets?: number; reps?: number; weight?: number }[];
}

export type ExpenseCategory =
  | "food"
  | "groceries"
  | "transport"
  | "rent"
  | "utilities"
  | "school"
  | "fitness"
  | "subscriptions"
  | "entertainment"
  | "shopping"
  | "other";

export interface Expense {
  id: string;
  date: DateKey;
  amount: number;
  category: ExpenseCategory;
  description?: string;
}

export interface BudgetMap {
  monthly: number; // overall cap
  perCategory: Partial<Record<ExpenseCategory, number>>;
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  at: number; // epoch ms
}
