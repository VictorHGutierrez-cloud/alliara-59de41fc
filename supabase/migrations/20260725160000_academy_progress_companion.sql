-- Sync study companion choice (Kept / Kepta) with academy progress.
alter table public.academy_progress
  add column if not exists companion text check (companion in ('kept', 'kepta'));

comment on column public.academy_progress.companion is
  'User-selected study companion: kept or kepta. NULL until chosen.';
