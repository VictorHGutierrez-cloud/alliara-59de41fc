-- Academy progress: completions, last study, study streak dates (per user).
create table if not exists public.academy_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  completed_slugs text[] not null default '{}',
  last_study jsonb,
  study_dates text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.academy_progress enable row level security;

create policy "Users read own academy progress"
  on public.academy_progress for select
  using (auth.uid() = user_id);

create policy "Users insert own academy progress"
  on public.academy_progress for insert
  with check (auth.uid() = user_id);

create policy "Users update own academy progress"
  on public.academy_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists academy_progress_updated_at_idx
  on public.academy_progress (updated_at desc);
