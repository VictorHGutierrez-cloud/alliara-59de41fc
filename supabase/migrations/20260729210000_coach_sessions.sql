-- Coach sessions: deal/situation context + chat history per user.
create table if not exists public.coach_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mode text not null check (mode in ('stuck', 'prep', 'briefing', 'free')),
  title text not null default '',
  deal_name text,
  stage text,
  has_champion text check (has_champion is null or has_champion in ('yes', 'no', 'unsure')),
  competitor text,
  situation text not null default '',
  source text,
  slug text,
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists coach_sessions_user_updated_idx
  on public.coach_sessions (user_id, updated_at desc);

alter table public.coach_sessions enable row level security;

create policy "Users read own coach sessions"
  on public.coach_sessions for select
  using (auth.uid() = user_id);

create policy "Users insert own coach sessions"
  on public.coach_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users update own coach sessions"
  on public.coach_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own coach sessions"
  on public.coach_sessions for delete
  using (auth.uid() = user_id);

create trigger set_updated_at_coach_sessions
  before update on public.coach_sessions
  for each row execute function public.set_updated_at();
