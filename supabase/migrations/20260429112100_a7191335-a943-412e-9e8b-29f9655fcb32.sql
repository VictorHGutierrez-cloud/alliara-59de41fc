
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  company text,
  total_xp integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Assessments (diagnostic submissions)
create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scores jsonb not null, -- {"strategy": 3, "offer": 2, ...}
  overall numeric(3,2) not null,
  created_at timestamptz not null default now()
);
alter table public.assessments enable row level security;

create policy "Users view own assessments" on public.assessments for select using (auth.uid() = user_id);
create policy "Users insert own assessments" on public.assessments for insert with check (auth.uid() = user_id);
create policy "Users delete own assessments" on public.assessments for delete using (auth.uid() = user_id);

create index assessments_user_created_idx on public.assessments(user_id, created_at desc);

-- Lesson completions
create table public.lesson_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  axis_key text not null,
  lesson_key text not null,
  xp_awarded integer not null default 10,
  completed_at timestamptz not null default now(),
  unique(user_id, axis_key, lesson_key)
);
alter table public.lesson_completions enable row level security;

create policy "Users view own completions" on public.lesson_completions for select using (auth.uid() = user_id);
create policy "Users insert own completions" on public.lesson_completions for insert with check (auth.uid() = user_id);
create policy "Users delete own completions" on public.lesson_completions for delete using (auth.uid() = user_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

-- Auto create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
