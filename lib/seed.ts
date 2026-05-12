import type {
  Habit,
  HabitLogs,
  Task,
  CalendarEvent,
  SchoolClass,
  Assignment,
  StudySession,
  Workout,
  Expense,
  Reflection,
  Goal,
} from "./types";
import { CORE_HABITS, CLASS_COLORS } from "./constants";
import { isoKey } from "./scoring";

interface SeedBundle {
  habits: Habit[];
  habitLogs: HabitLogs;
  tasks: Task[];
  events: CalendarEvent[];
  classes: SchoolClass[];
  assignments: Assignment[];
  studySessions: StudySession[];
  workouts: Workout[];
  expenses: Expense[];
  reflections: Reflection[];
  goals: Goal[];
  xp: number;
}

// Seed is intentionally structural-only: it ships your core habits, classes,
// weekly recurring schedule, a handful of upcoming assignments, today's tasks,
// and goal placeholders. No historical activity data (habit logs, workouts,
// expenses, study sessions, reflections) — you generate that as you live.
export function buildSeed(today: Date = new Date()): SeedBundle {
  const habits = CORE_HABITS;
  const habitLogs: HabitLogs = {};
  const todayKey = isoKey(today);

  // Classes
  const classes: SchoolClass[] = [
    { id: "cls_cs", code: "CS 311", name: "Data Structures", color: CLASS_COLORS[0], instructor: "Dr. Lewis", gradeTarget: "A" },
    { id: "cls_ma", code: "MATH 240", name: "Linear Algebra", color: CLASS_COLORS[1], instructor: "Prof. Tan", gradeTarget: "A-" },
    { id: "cls_ec", code: "ECON 201", name: "Microeconomics", color: CLASS_COLORS[2], instructor: "Dr. Patel", gradeTarget: "B+" },
    { id: "cls_en", code: "ENG 150", name: "Modern Lit", color: CLASS_COLORS[3], instructor: "Prof. Cole", gradeTarget: "A-" },
    { id: "cls_ph", code: "PHYS 130", name: "Physics II", color: CLASS_COLORS[4], instructor: "Dr. Reyes", gradeTarget: "B+" },
    { id: "cls_st", code: "STAT 220", name: "Statistics", color: CLASS_COLORS[5], instructor: "Prof. Kim", gradeTarget: "A" },
  ];

  // Calendar starts empty — add your own classes, work shifts, workouts, routines.
  const events: CalendarEvent[] = [];

  // Assignments start empty too — add real ones from the school page.
  const assignments: Assignment[] = [];

  // Today's tasks — three useful starters, all open. Delete as you like.
  const tasks: Task[] = [
    { id: "t1", title: "Review CS lecture notes", date: todayKey, done: false, category: "school", priority: "med", startTime: "08:00", endTime: "08:45" },
    { id: "t2", title: "Workout", date: todayKey, done: false, category: "fitness", priority: "med", startTime: "07:00", endTime: "08:00" },
    { id: "t3", title: "Read 10 pages", date: todayKey, done: false, category: "personal", priority: "low", startTime: "22:00", endTime: "22:20" },
  ];

  // Goals — placeholders at 0 progress; update as you go.
  const goals: Goal[] = [
    { id: "g1", title: "Hit 100-day workout streak", target: 100, progress: 0, unit: "days" },
    { id: "g2", title: "Read 12 books this semester", target: 12, progress: 0, unit: "books" },
    { id: "g3", title: "Save $1500 for summer", target: 1500, progress: 0, unit: "USD" },
    { id: "g4", title: "Average 8h sleep", target: 56, progress: 0, unit: "h/week" },
  ];

  return {
    habits,
    habitLogs,
    tasks,
    events,
    classes,
    assignments,
    studySessions: [],
    workouts: [],
    expenses: [],
    reflections: [],
    goals,
    xp: 0,
  };
}
