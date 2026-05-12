# Life OS

A polished, dark-mode, gamified personal life dashboard built as a **PWA** with **cloud sync** and a **persistent AI assistant**.

Tracks habits, school, fitness, spending, and weekly/monthly reviews. Installable on iPhone/Android/desktop, syncs across devices via Supabase, and ships with a Claude-powered assistant that remembers your context. Works fully offline and signed-out — sign in to sync.

## Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **Supabase** (Postgres + Auth + RLS) — optional, gated by env vars
- **Zustand** for client state (localStorage offline, Supabase cloud when signed in)
- **PWA** via `@ducanh2912/next-pwa` (manifest, service worker, offline shell)
- **Anthropic Claude** for AI assistant (prompt cached) with mock fallback
- **Framer Motion**, **Recharts**, **lucide-react**, **sonner**

## Quick start (local-only)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No env vars required — the app runs in local-only mode with seeded demo data and the mock AI.

## Full setup (cloud sync + auth + real AI)

### 1. Environment variables

Copy `.env.example` to `.env.local` and fill in the keys you have:

```bash
# Public site URL — used for OAuth callbacks and metadata
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase (https://supabase.com → Project settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # server-only

# Anthropic — leave blank to use the mock
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-6

# Google OAuth (Calendar sync — optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback
```

The app **degrades gracefully**: missing Supabase keys → local-only mode; missing Anthropic key → mock assistant; missing Google keys → calendar still works locally.

### 2. Supabase setup

1. Create a free project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, paste the contents of [`supabase/schema.sql`](./supabase/schema.sql) and run it. This creates every table, RLS policy, and the auto-profile trigger.
3. In **Authentication → Providers**, enable **Google**. Use the same Google OAuth client you'd use for Calendar (or create a new one). Add the Supabase callback URL it shows you to that OAuth client's authorized redirects.
4. In **Authentication → URL Configuration**, set Site URL to `http://localhost:3000` and add `https://your-domain.com/auth/callback` for prod.

### 3. Run

```bash
npm run dev
```

Sign in with Google at `/login`. Your data starts syncing immediately.

## Deploy to Vercel

1. Push the repo to GitHub.
2. [Import the repo](https://vercel.com/new) into Vercel.
3. Set every env var from your `.env.local` in **Project Settings → Environment Variables**. Set `NEXT_PUBLIC_SITE_URL` to your production URL.
4. In Supabase → Authentication → URL Configuration, add `https://your-domain.vercel.app/auth/callback` to redirect URLs.
5. In Google Cloud Console, add `https://<project-ref>.supabase.co/auth/v1/callback` to authorized OAuth redirects.
6. Deploy. Vercel runs `next build`, which generates the service worker into `public/sw.js`.

## Install on iPhone

1. Open the deployed app in **Safari** (not Chrome — iOS requires Safari for PWA install).
2. Tap the **Share** button → **Add to Home Screen**.
3. Launch from the home screen — runs full-screen, dark theme, with the bottom-nav.

The manifest uses dynamically-generated icons via Next 14's `app/icon.tsx` and `app/apple-icon.tsx`, so no static PNG assets need shipping.

## Architecture

```
app/
  layout.tsx              # Root layout: providers, viewport, PWA meta
  manifest.ts             # PWA manifest (typed)
  icon.tsx                # Dynamic 512px icon (PWA)
  apple-icon.tsx          # Dynamic 180px icon (iOS)
  icon-maskable/          # Maskable variant
  login/                  # Google sign-in page
  auth/callback/          # OAuth code → session
  api/ai/                 # /api/ai (chat) + /api/ai/summarize
  api/google/             # Existing Google Calendar OAuth
  (feature pages...)
components/
  AppProviders.tsx        # ErrorBoundary + AuthProvider + Toaster + CloudSyncBridge
  auth/AuthProvider.tsx   # useAuth() — user, session, signIn/Out
  ErrorBoundary.tsx
  ui/Skeleton.tsx         # Loading shimmer primitives
  layout/Sidebar.tsx      # Desktop sidebar + safe-area MobileNav
lib/
  supabase/
    browser.ts            # createBrowserClient (client side)
    server.ts             # createServerClient (RSC + route handlers)
    middleware.ts         # Session refresh + protected-route guard
    types.ts              # Database types
  sync/
    index.ts              # safeSync helper
    tasks.ts              # Push/pull Task rows
    assistant.ts          # Push/pull ai_messages
    useCloudSync.ts       # Hydrate Zustand from Supabase on sign-in
  ai/
    provider.ts           # AIRequest with memory injection
    anthropic.ts          # Claude with prompt caching
    mock.ts               # Context-aware fallback
middleware.ts             # Wires Supabase session refresh on every request
supabase/
  schema.sql              # Full schema + RLS policies
```

### Data flow

- **Signed out**: Zustand → localStorage. The app is fully usable, with seed data.
- **Signed in**: Same Zustand stores, but `useCloudSync` pulls cloud state on sign-in, and `lib/sync/*` push helpers mirror writes back to Supabase. RLS guarantees a user can only see/write their own rows.
- **Offline**: Service worker caches the app shell + API responses. Edits queue in localStorage and replay when the user returns online (handled implicitly by Zustand's `persist`).

### AI memory

The `/api/ai` route runs server-side. For authenticated users it:

1. Pulls the 10 most recent `ai_messages` rows → injects them as multi-turn chat history.
2. Pulls the 6 most recent `ai_summaries` (daily/weekly/monthly) → joins them into a memory digest passed to the prompt.
3. Persists the user turn + assistant turn back to `ai_messages` after the response.

`/api/ai/summarize` generates and upserts a `daily`/`weekly`/`monthly` summary into `ai_summaries`, keyed by period (e.g. `2026-W19`). The system prompt is sent with `cache_control: ephemeral`, so subsequent requests hit Claude's 5-minute prompt cache.

### Auth

`middleware.ts` (root) calls `updateSession()` on every request. This refreshes the Supabase session cookie, then protects `/assistant` and `/review` behind auth (redirects to `/login?next=…`). Other pages stay open so the app works without signing in.

## Scripts

```bash
npm run dev      # dev server (PWA disabled, hot reload)
npm run build    # production build + service worker generation
npm run start    # serve the production build
npm run lint     # ESLint
```

## Future scalability

- **Realtime**: Wire Supabase `subscribe()` channels into the Zustand stores for sub-second cross-device updates.
- **Per-store sync**: This release wires sync for `tasks` and `ai_messages`. Add `lib/sync/{habits,workouts,expenses,calendar,school}.ts` modeled on `tasks.ts` to migrate the remaining stores.
- **Image assets**: Replace dynamic icons with sharper PNGs in `public/` if you want App Store-quality polish.
- **Notifications**: Add Web Push via Vapid + a `notifications` table for deadlines and habit reminders.
- **Background summaries**: A Vercel Cron job hitting `/api/ai/summarize` nightly creates daily summaries automatically.
- **Migrations**: Schema lives in `supabase/schema.sql`. For long-term, adopt the Supabase CLI (`supabase migration new …`) and check migrations into Git.

## Gamification

- **+10 XP** per habit · **+5 XP** per task · **+25 XP** per workout
- `level = floor(sqrt(xp / 50))`
- Per-habit streaks + an overall "discipline streak" (every habit done that day)
- Badge shelf in `/habits`

## License

Personal project. Use freely.
