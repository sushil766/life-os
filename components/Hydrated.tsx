"use client";
import { useEffect, useState, ReactNode } from "react";

// Tiny guard that delays rendering children until after client hydration
// so localStorage-backed Zustand stores show stable values immediately.
export function Hydrated({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const [ok, setOk] = useState(false);
  useEffect(() => setOk(true), []);
  return <>{ok ? children : fallback}</>;
}
