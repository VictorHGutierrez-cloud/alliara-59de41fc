-- Roleplay mode for coach sessions: new mode value + persona/scenario/difficulty columns.
alter table public.coach_sessions
  drop constraint if exists coach_sessions_mode_check;

alter table public.coach_sessions
  add constraint coach_sessions_mode_check
  check (mode in ('stuck', 'prep', 'briefing', 'free', 'roleplay'));

alter table public.coach_sessions
  add column if not exists persona text,
  add column if not exists scenario text,
  add column if not exists difficulty text;
