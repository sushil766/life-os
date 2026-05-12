import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function todayKey(d: Date = new Date()): string {
  // Local-time YYYY-MM-DD (avoids UTC drift on toISOString).
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function dateKey(d: Date): string {
  return todayKey(d);
}

export function fromKey(key: string): Date {
  return parseISO(key);
}

export function prettyDate(key: string): string {
  return format(parseISO(key), "EEE, MMM d");
}

export function currency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function currencyPrecise(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}
