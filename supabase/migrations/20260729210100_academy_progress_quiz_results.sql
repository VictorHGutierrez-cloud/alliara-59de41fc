-- Quiz results per track on academy_progress.
alter table public.academy_progress
  add column if not exists quiz_results jsonb not null default '{}'::jsonb;

comment on column public.academy_progress.quiz_results is
  'Map of trackId -> { score, passed, at } for Academy track quizzes.';
