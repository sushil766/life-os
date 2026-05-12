"use client";
import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import {
  Cloud,
  CloudUpload,
  Loader2,
  Database,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  countLocalData,
  countCloudData,
  hasMigrated,
  markMigrated,
  runMigration,
  type CloudCounts,
  type MigrationCounts,
  type MigrationMode,
  type MigrationProgress,
} from "@/lib/sync/migrate";

interface State {
  phase: "idle" | "checking" | "prompt" | "running" | "done" | "error";
  local: MigrationCounts | null;
  cloud: CloudCounts | null;
  progress: MigrationProgress | null;
  backupKey: string | null;
  error: string | null;
}

const initialState: State = {
  phase: "idle",
  local: null,
  cloud: null,
  progress: null,
  backupKey: null,
  error: null,
};

export function MigrationDialog() {
  const { user, ready, configured } = useAuth();
  const [state, setState] = useState<State>(initialState);
  const [open, setOpen] = useState(false);

  // Run detection once per sign-in.
  useEffect(() => {
    if (!ready || !user || !configured) return;
    if (hasMigrated(user.id)) return;
    let cancelled = false;

    (async () => {
      setState((s) => ({ ...s, phase: "checking" }));
      const local = countLocalData();
      // Skip entirely if there's effectively nothing local (just seed defaults
      // shouldn't trigger a migration prompt — but we have no clean way to
      // tell seed from real data, so any non-empty data triggers the prompt).
      if (local.total === 0) {
        markMigrated(user.id);
        return;
      }
      try {
        const cloud = await countCloudData(user.id);
        if (cancelled) return;
        setState({ ...initialState, phase: "prompt", local, cloud });
        setOpen(true);
      } catch (err: any) {
        if (cancelled) return;
        setState({
          ...initialState,
          phase: "error",
          local,
          error: err?.message ?? "Couldn't read cloud data — sign in again?",
        });
        setOpen(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, ready, configured]);

  const handleRun = async (mode: MigrationMode) => {
    if (!user) return;
    setState((s) => ({ ...s, phase: "running", progress: { step: "Starting", done: 0, total: 14 }, error: null }));
    try {
      const { backupKey } = await runMigration(user.id, {
        mode,
        displayName: user.user_metadata?.full_name ?? undefined,
        onProgress: (p) => setState((s) => ({ ...s, progress: p })),
      });
      setState((s) => ({ ...s, phase: "done", backupKey }));
      toast.success(
        mode === "replace" ? "Cloud data replaced with local copy" : "Local data merged into your cloud account",
      );
    } catch (err: any) {
      setState((s) => ({ ...s, phase: "error", error: err?.message ?? "Migration failed" }));
      toast.error(`Migration failed: ${err?.message ?? "unknown error"}`);
    }
  };

  const handleSkip = () => {
    if (user) markMigrated(user.id);
    setOpen(false);
    toast("Skipped. You can run it later from settings if needed.");
  };

  const close = () => {
    setOpen(false);
    setState(initialState);
  };

  if (!open) return null;
  const c = state.local;
  const cloud = state.cloud;
  const hasCloudData = (cloud?.total ?? 0) > 0;

  return (
    <Dialog open={open} onClose={state.phase === "running" ? () => {} : close} title="Import local data?" maxWidth="max-w-md">
      {state.phase === "prompt" && c && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl bg-violet-500/[0.08] border border-violet-500/20 p-3">
            <Database size={18} className="mt-0.5 text-violet-300" />
            <div className="min-w-0">
              <div className="text-sm font-medium text-white">We found data in this browser</div>
              <div className="mt-1 text-[12px] text-white/60">
                Import it into your Life OS account so it follows you across devices.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[12px]">
            <Stat label="Habits" v={c.habits} />
            <Stat label="Habit logs" v={c.habitLogs} />
            <Stat label="Tasks" v={c.tasks} />
            <Stat label="Workouts" v={c.workouts} />
            <Stat label="Expenses" v={c.expenses} />
            <Stat label="Calendar events" v={c.events} />
            <Stat label="Classes" v={c.classes} />
            <Stat label="Assignments" v={c.assignments} />
            <Stat label="Study sessions" v={c.studySessions} />
            <Stat label="Reflections" v={c.reflections} />
            <Stat label="Goals" v={c.goals} />
            <Stat label="Assistant messages" v={c.messages} />
          </div>

          {hasCloudData && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-3 text-[11.5px] text-amber-100/85">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <div>
                Your cloud account already has {cloud!.total} items. <strong>Merge</strong> keeps both; <strong>Replace cloud</strong> deletes the cloud copy and uses local instead.
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-[11.5px] text-white/55">
            <ShieldCheck size={14} className="shrink-0 text-emerald-400/80" />
            A local backup is saved before any change. You can roll back from settings.
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <Button variant="primary" className="h-11" icon={<CloudUpload size={14} />} onClick={() => handleRun("merge")}>
              {hasCloudData ? "Merge into cloud" : "Import to cloud"}
            </Button>
            {hasCloudData && (
              <Button variant="danger" className="h-10" onClick={() => handleRun("replace")}>
                Replace cloud with local (destructive)
              </Button>
            )}
            <Button variant="ghost" className="h-10" onClick={handleSkip}>
              Skip — keep local-only data here
            </Button>
          </div>
        </div>
      )}

      {state.phase === "running" && state.progress && (
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-3">
            <Loader2 size={18} className="animate-spin text-violet-300" />
            <div className="text-sm text-white">{state.progress.step}…</div>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.05]">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all"
              style={{ width: `${(state.progress.done / state.progress.total) * 100}%` }}
            />
          </div>
          <div className="text-[11px] text-white/40">
            Step {state.progress.done} / {state.progress.total}
          </div>
        </div>
      )}

      {state.phase === "done" && (
        <div className="space-y-4 py-2">
          <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-3">
            <Cloud size={18} className="mt-0.5 text-emerald-300" />
            <div>
              <div className="text-sm font-medium text-white">Data synced to your account</div>
              <div className="mt-0.5 text-[12px] text-white/60">
                Backup saved in this browser: <code className="rounded bg-white/[0.06] px-1">{state.backupKey}</code>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="primary" onClick={close}>Done</Button>
          </div>
        </div>
      )}

      {state.phase === "error" && (
        <div className="space-y-4 py-2">
          <div className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/[0.05] p-3">
            <AlertTriangle size={18} className="mt-0.5 text-rose-300" />
            <div>
              <div className="text-sm font-medium text-white">Migration failed</div>
              <div className="mt-0.5 text-[12px] text-white/60 break-all">{state.error}</div>
            </div>
          </div>
          <div className="flex justify-between gap-2">
            <Button variant="ghost" onClick={handleSkip} icon={<RotateCcw size={14} />}>
              Skip for now
            </Button>
            <Button variant="primary" onClick={() => handleRun("merge")}>
              Try again
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

function Stat({ label, v }: { label: string; v: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white/[0.025] px-3 py-2">
      <span className="text-white/55">{label}</span>
      <span className={`tabular-nums ${v > 0 ? "text-white font-medium" : "text-white/30"}`}>{v}</span>
    </div>
  );
}
