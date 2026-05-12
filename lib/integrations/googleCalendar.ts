// Read-only Google Calendar integration.
// Flow:
//   1. /api/google/auth      → redirects to Google's consent screen
//   2. /api/google/callback  → exchanges ?code for tokens, persists refresh_token
//   3. /api/google/sync      → lists upcoming events from the primary calendar
//   4. /api/google/status    → boolean connected + last sync info
//   5. /api/google/disconnect → wipes the stored token
import { google, calendar_v3 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { readToken, writeToken } from "./googleTokenStore";

const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];

// Resolves the user-facing origin so the redirect URI we send to Google matches
// what the user has registered in Google Cloud Console. Order:
//   1. NEXT_PUBLIC_SITE_URL — explicit canonical override (set this on Vercel)
//   2. x-forwarded-host + x-forwarded-proto — proxy headers (Vercel populates these)
//   3. URL of the incoming request — fallback for plain `next dev`
export function resolveAppOrigin(req: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  const fwdHost = req.headers.get("x-forwarded-host");
  const fwdProto = req.headers.get("x-forwarded-proto") || "https";
  if (fwdHost) return `${fwdProto}://${fwdHost}`;
  const u = new URL(req.url);
  return `${u.protocol}//${u.host}`;
}

export function resolveRedirectUri(req: Request): string {
  return `${resolveAppOrigin(req)}/api/google/callback`;
}

export function buildOAuthClient(redirectUri?: string): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const resolvedRedirect =
    redirectUri ||
    process.env.GOOGLE_REDIRECT_URI ||
    "http://localhost:3000/api/google/callback";
  if (!clientId || !clientSecret) {
    throw new Error(
      "Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
    );
  }
  return new google.auth.OAuth2(clientId, clientSecret, resolvedRedirect);
}

export function buildAuthUrl(redirectUri?: string): string {
  const c = buildOAuthClient(redirectUri);
  return c.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // ensures we receive a refresh_token even on re-auth
    scope: SCOPES,
  });
}

export async function exchangeCodeForTokens(code: string, redirectUri?: string): Promise<void> {
  // CRITICAL: redirectUri here must match the one used in buildAuthUrl —
  // Google validates the redirect URI on the token-exchange request too.
  const c = buildOAuthClient(redirectUri);
  const { tokens } = await c.getToken(code);
  // Preserve existing refresh_token if Google omits it on subsequent grants.
  const prev = await readToken();
  await writeToken({
    ...prev,
    ...tokens,
    refresh_token: tokens.refresh_token || prev?.refresh_token,
  });
}

export async function getAuthedClient(): Promise<OAuth2Client | null> {
  const t = await readToken();
  if (!t?.refresh_token) return null;
  // Refresh flow doesn't need a redirect URI — Google only validates it on
  // the original consent + token exchange.
  const c = buildOAuthClient();
  c.setCredentials(t);
  // Persist auto-refreshes back to the Supabase row.
  c.on("tokens", (newTokens) => {
    void writeToken({ ...t, ...newTokens, refresh_token: newTokens.refresh_token || t.refresh_token });
  });
  return c;
}

export async function isConnected(): Promise<boolean> {
  try {
    const t = await readToken();
    return !!t?.refresh_token;
  } catch {
    return false;
  }
}

export interface GoogleEventLite {
  googleId: string;
  title: string;
  date: string;            // YYYY-MM-DD (start day)
  startTime?: string;      // HH:MM (local)
  endTime?: string;
  notes?: string;
  htmlLink?: string;
  calendarId?: string;
}

export async function listUpcoming(opts: { daysAhead?: number; daysBehind?: number } = {}): Promise<GoogleEventLite[]> {
  const c = await getAuthedClient();
  if (!c) throw new Error("Not connected to Google.");
  const cal = google.calendar({ version: "v3", auth: c });
  const now = new Date();
  const back = new Date(now.getTime() - (opts.daysBehind ?? 7) * 86400000);
  const fwd = new Date(now.getTime() + (opts.daysAhead ?? 60) * 86400000);
  const res = await cal.events.list({
    calendarId: "primary",
    timeMin: back.toISOString(),
    timeMax: fwd.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 500,
  });
  const items = res.data.items ?? [];
  return items.map((e: calendar_v3.Schema$Event) => toLite(e)).filter((x): x is GoogleEventLite => !!x);
}

function toLite(e: calendar_v3.Schema$Event): GoogleEventLite | null {
  const id = e.id;
  const title = e.summary || "(no title)";
  const start = e.start?.dateTime || e.start?.date;
  const end = e.end?.dateTime || e.end?.date;
  if (!id || !start) return null;
  const startD = new Date(start);
  const endD = end ? new Date(end) : null;
  const isoDate = `${startD.getFullYear()}-${pad(startD.getMonth() + 1)}-${pad(startD.getDate())}`;
  const hasTime = !!e.start?.dateTime;
  return {
    googleId: id,
    title,
    date: isoDate,
    startTime: hasTime ? `${pad(startD.getHours())}:${pad(startD.getMinutes())}` : undefined,
    endTime: hasTime && endD ? `${pad(endD.getHours())}:${pad(endD.getMinutes())}` : undefined,
    notes: e.description ?? undefined,
    htmlLink: e.htmlLink ?? undefined,
    calendarId: "primary",
  };
}

function pad(n: number) { return String(n).padStart(2, "0"); }
