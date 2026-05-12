"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";

function LoginInner() {
  const { signInWithGoogle, configured } = useAuth();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    try {
      await signInWithGoogle(next);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-[100dvh] place-items-center px-6">
      <div className="w-full max-w-sm rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8 shadow-card">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-glow">
          <Sparkles size={22} />
        </div>
        <h1 className="mt-5 text-center text-xl font-semibold tracking-tight text-white">
          Welcome to Life OS
        </h1>
        <p className="mt-1 text-center text-sm text-white/55">
          Sign in to sync across your iPhone, iPad, and desktop.
        </p>

        <div className="mt-6 space-y-3">
          <Button
            variant="primary"
            className="w-full h-12 text-sm"
            onClick={handle}
            disabled={loading || !configured}
            icon={loading ? <Loader2 size={16} className="animate-spin" /> : <GoogleMark />}
          >
            {loading ? "Redirecting…" : "Continue with Google"}
          </Button>
          {!configured && (
            <p className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-3 text-[11px] text-amber-200/80">
              Supabase isn't configured yet. Add{" "}
              <code className="rounded bg-white/[0.06] px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code className="rounded bg-white/[0.06] px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
              <code className="rounded bg-white/[0.06] px-1">.env.local</code>. See the README.
            </p>
          )}
          <a
            href="/"
            className="block text-center text-[12px] text-white/40 transition hover:text-white/70"
          >
            Continue without an account →
          </a>
        </div>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
      <path
        fill="#FFFFFF"
        d="M21.35 11.1H12v3.2h5.35c-.23 1.5-1.7 4.4-5.35 4.4-3.2 0-5.8-2.7-5.8-6s2.6-6 5.8-6c1.8 0 3 .8 3.7 1.45l2.5-2.4C16.7 4.1 14.55 3 12 3 6.95 3 3 6.95 3 12s3.95 9 9 9c5.2 0 8.65-3.65 8.65-8.8 0-.6-.05-1-.3-1.1Z"
      />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="grid min-h-[100dvh] place-items-center text-white/40">Loading…</div>}>
      <LoginInner />
    </Suspense>
  );
}
