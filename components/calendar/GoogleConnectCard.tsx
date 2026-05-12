"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useCalendarStore } from "@/store/calendarStore";
import { format, parseISO } from "date-fns";
import { CalendarPlus, RefreshCw, Plug, Unplug, CheckCircle2, AlertTriangle } from "lucide-react";

interface Status { configured: boolean; connected: boolean }

export function GoogleConnectCard() {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const upsert = useCalendarStore((s) => s.upsertGoogleEvents);
  const removeGoogle = useCalendarStore((s) => s.removeGoogleEvents);
  const lastSync = useCalendarStore((s) => s.lastGoogleSync);
  const googleCount = useCalendarStore((s) => s.events.filter((e) => e.googleId).length);

  const search = useSearchParams();
  const router = useRouter();

  const loadStatus = async () => {
    const r = await fetch("/api/google/status", { cache: "no-store" });
    setStatus(await r.json());
  };

  useEffect(() => { loadStatus(); }, []);

  // Handle OAuth callback redirect query params
  useEffect(() => {
    const flag = search.get("google");
    if (!flag) return;
    if (flag === "connected") {
      setNotice("Connected to Google Calendar.");
      loadStatus();
    } else if (flag === "denied") {
      setError("Authorization denied.");
    } else if (flag === "error") {
      setError(decodeURIComponent(search.get("msg") || "Connection failed."));
    } else if (flag === "missing_code") {
      setError("Missing auth code from Google.");
    }
    // clean URL
    router.replace("/calendar");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connect = () => {
    setError(null);
    window.location.href = "/api/google/auth";
  };

  const sync = async () => {
    setBusy(true); setError(null); setNotice(null);
    try {
      const r = await fetch("/api/google/sync", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ daysAhead: 60, daysBehind: 7 }) });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || "Sync failed");
      const incoming = (json.events as any[]).map((e) => ({
        title: e.title,
        date: e.date,
        startTime: e.startTime,
        endTime: e.endTime,
        kind: "personal" as const,
        color: "#60a5fa",
        notes: e.notes,
        googleId: e.googleId,
        htmlLink: e.htmlLink,
        source: "google" as const,
      }));
      const n = upsert(incoming, json.syncedAt);
      setNotice(`Synced ${n} Google event${n === 1 ? "" : "s"}.`);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    try {
      await fetch("/api/google/disconnect", { method: "POST" });
      const removed = removeGoogle();
      setNotice(`Disconnected. Removed ${removed} imported event${removed === 1 ? "" : "s"}.`);
      await loadStatus();
    } finally { setBusy(false); }
  };

  if (status === null) {
    return (
      <Card>
        <CardHeader title="Google Calendar" subtitle="Checking connection…" icon={<CalendarPlus size={16} className="text-sky-300" />} />
      </Card>
    );
  }

  if (!status.configured) {
    return (
      <Card>
        <CardHeader
          title="Google Calendar"
          subtitle="OAuth credentials not set"
          icon={<CalendarPlus size={16} className="text-sky-300" />}
          right={<Badge tone="default">Not configured</Badge>}
        />
        <p className="text-[12.5px] leading-relaxed text-white/65">
          To enable, set <code className="rounded bg-white/[0.06] px-1">GOOGLE_CLIENT_ID</code>,
          <code className="mx-1 rounded bg-white/[0.06] px-1">GOOGLE_CLIENT_SECRET</code> and
          <code className="ml-1 rounded bg-white/[0.06] px-1">GOOGLE_REDIRECT_URI</code> in <code className="rounded bg-white/[0.06] px-1">.env.local</code>, then restart <code className="rounded bg-white/[0.06] px-1">npm run dev</code>.
        </p>
        <p className="mt-2 text-[11px] text-white/45">
          Authorized redirect URI in Google Cloud Console must be exactly:
          <code className="mx-1 rounded bg-white/[0.06] px-1">http://localhost:3000/api/google/callback</code>
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Google Calendar"
        subtitle={status.connected
          ? lastSync ? `Last synced ${format(parseISO(lastSync), "MMM d, h:mma")}` : "Connected — ready to sync"
          : "OAuth configured · connect to start syncing"}
        icon={<CalendarPlus size={16} className="text-sky-300" />}
        right={
          <Badge tone={status.connected ? "emerald" : "amber"}>
            {status.connected ? "Connected" : "Not connected"}
          </Badge>
        }
      />

      {notice && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-200">
          <CheckCircle2 size={14} /> {notice}
        </div>
      )}
      {error && (
        <div className="mb-3 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-200">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1 break-all font-mono text-[11px] leading-relaxed">{error}</div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {!status.connected && <Button variant="primary" onClick={connect} icon={<Plug size={14} />}>Connect Google</Button>}
        {status.connected && (
          <>
            <Button variant="primary" onClick={sync} disabled={busy} icon={<RefreshCw size={14} className={busy ? "animate-spin" : ""} />}>
              {busy ? "Syncing…" : "Sync now"}
            </Button>
            <Button variant="outline" onClick={disconnect} disabled={busy} icon={<Unplug size={14} />}>Disconnect</Button>
            <span className="text-[11px] text-white/45">{googleCount} imported events</span>
          </>
        )}
      </div>

      <p className="mt-3 text-[11px] text-white/45">
        Read-only: pulls events from your primary calendar into Life OS. Nothing is written back to Google.
      </p>
    </Card>
  );
}
