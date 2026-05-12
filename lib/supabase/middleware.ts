import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./types";
import { checkSupabaseEnv } from "./env";

const PROTECTED_PREFIXES = ["/assistant", "/review"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const envCheck = checkSupabaseEnv();
  if (!envCheck.ok) {
    // Supabase not configured / malformed — local-only mode, no auth gating.
    // Log once per process so misconfig is surfaced in server logs.
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      // eslint-disable-next-line no-console
      console.warn("[supabase/middleware]", envCheck.reason);
    }
    return response;
  }
  const { url, anon } = envCheck.env!;

  const supabase = createServerClient<Database>(url, anon, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({ request });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: "", ...options });
        response = NextResponse.next({ request });
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && user) {
    const next = request.nextUrl.searchParams.get("next") || "/";
    const home = request.nextUrl.clone();
    home.pathname = next;
    home.search = "";
    return NextResponse.redirect(home);
  }

  return response;
}
