"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Flame, Trophy, Calendar, LogIn, LogOut, Cloud, CloudOff, User } from "lucide-react";
import { useUserStore } from "@/store/userStore";
import { useHabitsStore } from "@/store/habitsStore";
import { levelFromXp, overallDisciplineStreak } from "@/lib/scoring";
import { useAuth } from "@/components/auth/AuthProvider";

export function Topbar() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const xp = useUserStore((s) => s.xp);
  const habits = useHabitsStore((s) => s.habits);
  const logs = useHabitsStore((s) => s.logs);
  const lvl = levelFromXp(xp);
  const streak = overallDisciplineStreak(habits, logs);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/[0.06] bg-black/30 px-5 py-3 backdrop-blur md:px-8">
      <div className="flex items-center gap-2 text-xs text-white/60">
        <Calendar size={14} />
        <span className="hidden sm:inline">{now ? format(now, "EEEE, MMMM d, yyyy") : ""}</span>
        <span className="sm:hidden">{now ? format(now, "EEE, MMM d") : ""}</span>
      </div>
      <div className="flex items-center gap-2">
        <Pill icon={<Flame size={12} className="text-amber-400" />} label={`${streak}d`} sub="streak" />
        <Pill icon={<Trophy size={12} className="text-violet-300" />} label={`Lv ${lvl.level}`} sub={`${xp} xp`} />
        {/* Mobile-only auth control — desktop uses the sidebar version. */}
        <AuthPill />
      </div>
    </header>
  );
}

function AuthPill() {
  const { user, ready, configured, signOut } = useAuth();
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenu) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [openMenu]);

  if (!ready) return null;
  // Hide on desktop — sidebar shows the full control there.
  const wrapper = "md:hidden";

  if (!user) {
    return (
      <Link
        href="/login"
        className={`${wrapper} flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-glow active:scale-95`}
      >
        <LogIn size={12} />
        Sign in
      </Link>
    );
  }

  const avatar = user.user_metadata?.avatar_url as string | undefined;
  const name = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "";
  const initial = (name?.[0] ?? "?").toUpperCase();

  return (
    <div ref={menuRef} className={`${wrapper} relative`}>
      <button
        onClick={() => setOpenMenu((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[11px] active:scale-95"
      >
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" className="h-6 w-6 rounded-full" />
        ) : (
          <span className="grid h-6 w-6 place-items-center rounded-full bg-violet-500/30 text-[10px] font-semibold text-white">
            {initial}
          </span>
        )}
        <span className="max-w-[80px] truncate text-white/80">
          {(name as string).split(" ")[0]}
        </span>
      </button>
      {openMenu && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/10 bg-[#11111a] p-2 shadow-2xl">
          <div className="flex items-center gap-2 rounded-lg px-2 py-2">
            <Cloud size={12} className="text-emerald-300" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11px] font-medium text-white">Signed in</div>
              <div className="truncate text-[10px] text-white/50">{user.email}</div>
            </div>
          </div>
          <div className="my-1 border-t border-white/[0.06]" />
          <button
            onClick={() => {
              setOpenMenu(false);
              signOut();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-[12px] text-white/80 transition hover:bg-white/[0.05] hover:text-white"
          >
            <LogOut size={12} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function Pill({ icon, label, sub }: { icon: React.ReactNode; label: string; sub: string }) {
  return (
    <div className="hidden sm:flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px]">
      {icon}
      <span className="font-semibold text-white">{label}</span>
      <span className="text-white/40">{sub}</span>
    </div>
  );
}
