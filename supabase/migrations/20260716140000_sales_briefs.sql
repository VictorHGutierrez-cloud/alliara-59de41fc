-- Sales briefing feed: curated external articles related to Academy materials.
create table if not exists public.sales_briefs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  source_name text not null default '',
  published_at timestamptz,
  summary text not null default '',
  topics text[] not null default '{}',
  related_slugs text[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint sales_briefs_url_unique unique (url)
);

create index if not exists sales_briefs_published_at_idx
  on public.sales_briefs (published_at desc nulls last);

create index if not exists sales_briefs_created_at_idx
  on public.sales_briefs (created_at desc);

alter table public.sales_briefs enable row level security;

-- Authenticated users can read briefs.
drop policy if exists "sales_briefs_select_authenticated" on public.sales_briefs;
create policy "sales_briefs_select_authenticated"
  on public.sales_briefs
  for select
  to authenticated
  using (true);

-- Writes come from the edge function (service role), which bypasses RLS.

comment on table public.sales_briefs is
  'Daily sales news briefs: external links + AI summary + related Academy library slugs.';
