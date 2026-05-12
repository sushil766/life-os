"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  CalendarDays,
  GraduationCap,
  Dumbbell,
  Wallet,
  Sparkles,
  BarChart3,
  TrendingUp,
  LogIn,
  LogOut,
  Cloud,
  CloudOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/userStore";
import { useHabitsStore } from "@/store/habitsStore";
import { levelFromXp, overallDisciplineStreak } from "@/lib/scoring";
import { ProgressBar } from "@/components/ui/Progress";
import { useAuth } from "@/components/auth/AuthProvider";

const nav = [
  { href: "/", label: "Daily", icon: LayoutDashboard },
  { href: "/habits", label: "Habits", icon: CheckSquare },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/school", label: "School", icon: GraduationCap },
  { href: "/fitness", label: "Fitness", icon: Dumbbell },
  { href: "/spending", label: "Spending", icon: Wallet },
  { href: "/assistant", label: "Assistant", icon: Sparkles },
  { href: "/review/weekly", label: "Weekly review", icon: BarChart3 },
  { href: "/review/monthly", label: "Monthly review", icon: TrendingUp },
];

export function Sidebar() {
  const pathname = usePathname();
  const xp = useUserStore((s) => s.xp);
  const name = useUserStore((s) => s.name);
  const habits = useHabitsStore((s) => s.habits);
  const logs = useHabitsStore((s) => s.logs);
  const lvl = levelFromXp(xp);
  const streak = overallDisciplineStreak(habits, logs);
  const { user, signOut, ready } = useAuth();

  return (
    <aside className="hidden md:flex md:w-64 lg:w-72 shrink-0 flex-col gap-4 border-r border-white/[0.06] bg-black/20 px-4 py-5">
      <div className="flex items-center gap-2 px-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-glow">
          <Sparkles size={16} />
        </div>
        <div>
          <div className="text-sm font-semibold tracking-tight text-white">Life OS</div>
          <div className="text-[10px] uppercase tracking-wider text-white/40">Personal dashboard</div>
        </div>
      </div>

      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between text-xs text-white/60">
          <span className="truncate">Hi, {user?.user_metadata?.full_name?.split(" ")[0] ?? name}</span>
          <span className="text-white/80 font-semibold">Lv {lvl.level}</span>
        </div>
        <div className="mt-2"><ProgressBar value={lvl.into} max={lvl.need} color="violet" /></div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-white/40">
          <span>{lvl.into} / {lvl.need} XP</span>
          <span>🔥 {streak}d streak</span>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {nav.map((n) => {
          const Icon = n.icon;
          const active = pathname === n.href || (n.href !== "/" && pathname.startsWith(n.href));
          return (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
                active
                  ? "bg-white/[0.07] text-white"
                  : "text-white/55 hover:bg-white/[0.04] hover:text-white",
              )}
            >
              <Icon size={16} className={active ? "text-violet-300" : ""} />
              {n.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2">
        {ready && (
          <div className="rounded-xl border border-white/[0.06] p-3">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] text-emerald-300">
                  <Cloud size={12} />
                  <span>Synced · {user.email}</span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] text-white/70 transition hover:bg-white/[0.05] hover:text-white"
                >
                  <LogOut size={12} /> Sign out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-2 text-[12px] font-medium text-white shadow-glow"
              >
                <LogIn size={12} /> Sign in to sync
              </Link>
            )}
            {!user && (
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-white/40">
                <CloudOff size={10} /> Local-only mode
              </div>
            )}
          </div>
        )}
        <div className="rounded-xl border border-white/[0.06] p-3 text-[10px] leading-relaxed text-white/40">
          Sign in to sync across iPhone & desktop. Without an account, data stays in this browser.
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.06] bg-black/80 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around">
        {nav.slice(0, 6).map((n) => {
          const Icon = n.icon;
          const active = pathname === n.href || (n.href !== "/" && pathname.startsWith(n.href));
          return (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-3 text-[10px] transition active:scale-95",
                active ? "text-violet-300" : "text-white/55",
              )}
            >
              <div className={cn("relative grid place-items-center", active && "after:absolute after:-top-2 after:h-1 after:w-6 after:rounded-full after:bg-violet-400")}>
                <Icon size={20} />
              </div>
              <span>{n.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
