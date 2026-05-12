-- ============================================================================
-- Life OS — Supabase schema (v2 — text IDs for migration compatibility)
-- ----------------------------------------------------------------------------
-- Run this in Supabase SQL editor or via `supabase db push`.
-- Every table is scoped to the authenticated user via row-level security.
-- Auth is handled by Supabase Auth — user IDs reference auth.users(id) (uuid).
-- Entity primary keys are TEXT so client-generated IDs from the local Zustand
-- stores (lib/utils.ts → uid()) can be upserted directly during migration.
-- Defaults still use uuid_generate_v4() for cloud-only inserts.
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- profiles  (1:1 with auth.users — id stays uuid)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  xp integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile when a new auth user is added.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- habits + habit_logs
-- ---------------------------------------------------------------------------
create table if not exists public.habits (
  id text primary key default uuid_generate_v4()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  emoji text,
  target text,
  accent text not null default 'violet',
  is_core boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists habits_user_idx on public.habits(user_id);

create table if not exists public.habit_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id text not null references public.habits(id) on delete cascade,
  date date not null,
  completed boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (user_id, habit_id, date)
);
create index if not exists habit_logs_user_date_idx on public.habit_logs(user_id, date);

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------
create table if not exists public.tasks (
  id text primary key default uuid_generate_v4()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  date date not null,
  done boolean not null default false,
  category text,
  priority text,
  start_time text,
  end_time text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tasks_user_date_idx on public.tasks(user_id, date);

-- ---------------------------------------------------------------------------
-- calendar_events  (local + google-sourced)
-- ---------------------------------------------------------------------------
create table if not exists public.calendar_events (
  id text primary key default uuid_generate_v4()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  date date not null,
  start_time text,
  end_time text,
  kind text not null default 'personal',
  color text,
  class_id text,
  notes text,
  recurring text,
  day_of_week integer,
  source text not null default 'local',
  google_id text,
  html_link text,
  created_at timestamptz not null default now()
);
create index if not exists calendar_user_date_idx on public.calendar_events(user_id, date);
create unique index if not exists calendar_google_unique on public.calendar_events(user_id, google_id) where google_id is not null;

-- ---------------------------------------------------------------------------
-- school: classes, assignments, study_sessions
-- ---------------------------------------------------------------------------
create table if not exists public.school_classes (
  id text primary key default uuid_generate_v4()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  name text not null,
  color text not null default '#a78bfa',
  instructor text,
  grade_target text,
  created_at timestamptz not null default now()
);
create index if not exists school_classes_user_idx on public.school_classes(user_id);

create table if not exists public.assignments (
  id text primary key default uuid_generate_v4()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  class_id text references public.school_classes(id) on delete set null,
  title text not null,
  due date not null,
  done boolean not null default false,
  weight numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists assignments_user_due_idx on public.assignments(user_id, due);

create table if not exists public.study_sessions (
  id text primary key default uuid_generate_v4()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  class_id text references public.school_classes(id) on delete set null,
  date date not null,
  minutes integer not null,
  topic text,
  created_at timestamptz not null default now()
);
create index if not exists study_sessions_user_date_idx on public.study_sessions(user_id, date);

-- ---------------------------------------------------------------------------
-- workouts
-- ---------------------------------------------------------------------------
create table if not exists public.workouts (
  id text primary key default uuid_generate_v4()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  type text not null,
  minutes integer not null default 0,
  notes text,
  exercises jsonb,
  created_at timestamptz not null default now()
);
create index if not exists workouts_user_date_idx on public.workouts(user_id, date);

-- ---------------------------------------------------------------------------
-- spending: expenses + budgets
-- ---------------------------------------------------------------------------
create table if not exists public.expenses (
  id text primary key default uuid_generate_v4()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  amount numeric not null,
  category text not null,
  description text,
  created_at timestamptz not null default now()
);
create index if not exists expenses_user_date_idx on public.expenses(user_id, date);

create table if not exists public.budgets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  monthly numeric not null default 0,
  per_category jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- goals + reflections
-- ---------------------------------------------------------------------------
create table if not exists public.goals (
  id text primary key default uuid_generate_v4()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  target numeric not null default 0,
  progress numeric not null default 0,
  unit text,
  due date,
  created_at timestamptz not null default now()
);
create index if not exists goals_user_idx on public.goals(user_id);

create table if not exists public.reflections (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  mood integer not null,
  energy integer not null,
  productivity integer not null,
  note text,
  created_at timestamptz not null default now(),
  primary key (user_id, date)
);

-- ---------------------------------------------------------------------------
-- AI: messages + summaries
-- ---------------------------------------------------------------------------
create table if not exists public.ai_messages (
  id text primary key default uuid_generate_v4()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  text text not null,
  kind text,
  at timestamptz not null default now()
);
create index if not exists ai_messages_user_at_idx on public.ai_messages(user_id, at desc);

create table if not exists public.ai_summaries (
  id text primary key default uuid_generate_v4()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  period text not null check (period in ('daily', 'weekly', 'monthly')),
  period_key text not null,
  summary text not null,
  data jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, period, period_key)
);
create index if not exists ai_summaries_user_period_idx on public.ai_summaries(user_id, period, period_key desc);

-- ---------------------------------------------------------------------------
-- Google OAuth tokens (per-user, replaces ./data/google-token.json)
-- ---------------------------------------------------------------------------
create table if not exists public.google_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  access_token text,
  refresh_token text,
  scope text,
  token_type text,
  expiry_date bigint,
  id_token text,
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- ROW-LEVEL SECURITY
-- ============================================================================
alter table public.profiles         enable row level security;
alter table public.habits           enable row level security;
alter table public.habit_logs       enable row level security;
alter table public.tasks            enable row level security;
alter table public.calendar_events  enable row level security;
alter table public.school_classes   enable row level security;
alter table public.assignments      enable row level security;
alter table public.study_sessions   enable row level security;
alter table public.workouts         enable row level security;
alter table public.expenses         enable row level security;
alter table public.budgets          enable row level security;
alter table public.goals            enable row level security;
alter table public.reflections      enable row level security;
alter table public.ai_messages      enable row level security;
alter table public.ai_summaries     enable row level security;
alter table public.google_tokens    enable row level security;

-- Helper: drop & recreate "self-only" CRUD policies for each table.
do $$
declare
  t text;
  tables text[] := array[
    'profiles','habits','habit_logs','tasks','calendar_events',
    'school_classes','assignments','study_sessions','workouts',
    'expenses','budgets','goals','reflections','ai_messages',
    'ai_summaries','google_tokens'
  ];
  user_col text;
begin
  foreach t in array tables loop
    user_col := case when t = 'profiles' then 'id' else 'user_id' end;
    execute format('drop policy if exists "self_select" on public.%I', t);
    execute format('drop policy if exists "self_insert" on public.%I', t);
    execute format('drop policy if exists "self_update" on public.%I', t);
    execute format('drop policy if exists "self_delete" on public.%I', t);

    execute format('create policy "self_select" on public.%I for select using (auth.uid() = %I)', t, user_col);
    execute format('create policy "self_insert" on public.%I for insert with check (auth.uid() = %I)', t, user_col);
    execute format('create policy "self_update" on public.%I for update using (auth.uid() = %I) with check (auth.uid() = %I)', t, user_col, user_col);
    execute format('create policy "self_delete" on public.%I for delete using (auth.uid() = %I)', t, user_col);
  end loop;
end $$;
