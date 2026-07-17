-- Interview Copilot — Supabase schema
-- Run this in the Supabase SQL editor after creating a project.
-- The app runs fully on localStorage without this; these tables let you sync
-- progress and store an AI-parsed resume in the cloud later.

-- 1. Resume snapshot (one row per user, editable structured JSON)
create table if not exists public.resumes (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- 2. Practice progress (which questions practiced + confidence)
create table if not exists public.progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id text not null,
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

-- 3. Mock interview sessions
create table if not exists public.mock_sessions (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  score int not null,
  created_at timestamptz not null default now()
);

-- 4. AI-generated questions saved by the user
create table if not exists public.saved_questions (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null,
  difficulty text not null,
  question text not null,
  answer text not null,
  tags text[] default '{}',
  created_at timestamptz not null default now()
);

-- Row Level Security: users only see their own rows
alter table public.resumes enable row level security;
alter table public.progress enable row level security;
alter table public.mock_sessions enable row level security;
alter table public.saved_questions enable row level security;

do $$
begin
  perform 1;
  -- resumes
  if not exists (select 1 from pg_policies where tablename = 'resumes' and policyname = 'own_resume') then
    create policy own_resume on public.resumes
      for all using (auth.uid () = user_id) with check (auth.uid () = user_id);
  end if;
  -- progress
  if not exists (select 1 from pg_policies where tablename = 'progress' and policyname = 'own_progress') then
    create policy own_progress on public.progress
      for all using (auth.uid () = user_id) with check (auth.uid () = user_id);
  end if;
  -- mock_sessions
  if not exists (select 1 from pg_policies where tablename = 'mock_sessions' and policyname = 'own_mock') then
    create policy own_mock on public.mock_sessions
      for all using (auth.uid () = user_id) with check (auth.uid () = user_id);
  end if;
  -- saved_questions
  if not exists (select 1 from pg_policies where tablename = 'saved_questions' and policyname = 'own_saved') then
    create policy own_saved on public.saved_questions
      for all using (auth.uid () = user_id) with check (auth.uid () = user_id);
  end if;
end $$;
