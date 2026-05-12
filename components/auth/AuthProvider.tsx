"use client";
import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { isSupabaseConfigured, supabaseBrowser } from "@/lib/supabase/browser";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  ready: boolean;
  configured: boolean;
  signInWithGoogle: (nextPath?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const configured = isSupabaseConfigured();
  const router = useRouter();

  useEffect(() => {
    if (!configured) {
      setReady(true);
      return;
    }
    const supabase = supabaseBrowser();
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      if (!mounted) return;
      setSession(sess);
      setUser(sess?.user ?? null);
      if (event === "SIGNED_IN") {
        toast.success("Signed in — syncing across devices");
        router.refresh();
      } else if (event === "SIGNED_OUT") {
        toast.success("Signed out");
        router.refresh();
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [configured, router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      ready,
      configured,
      async signInWithGoogle(nextPath = "/") {
        if (!configured) {
          toast.error("Supabase not configured. Add env vars + run the schema.");
          return;
        }
        const supabase = supabaseBrowser();
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
            queryParams: { access_type: "offline", prompt: "consent" },
          },
        });
        if (error) toast.error(error.message);
      },
      async signOut() {
        if (!configured) return;
        const supabase = supabaseBrowser();
        await supabase.auth.signOut();
        router.push("/");
      },
    }),
    [user, session, ready, configured, router],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Allow components rendered outside the provider (rare) to fall through
    // gracefully rather than crashing the whole tree.
    return {
      user: null,
      session: null,
      ready: true,
      configured: false,
      signInWithGoogle: async () => {},
      signOut: async () => {},
    };
  }
  return ctx;
}
