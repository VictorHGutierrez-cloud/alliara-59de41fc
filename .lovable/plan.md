## Goal

Rename the "My maturity" nav entry and turn `/dashboard` into a **PDM performance hub** that aggregates real activity across all the PDM's partners — not just the personal OCTA maturity score.

## Naming

Rename top-nav link from **"My maturity"** to **"My Performance"** (keeping the `/dashboard` route URL the same to avoid breaking links). The current maturity radar stays inside the page as one section, but no longer headlines the whole experience.

## New Dashboard Structure (`/dashboard`)

Built as a single page with four stacked sections:

### 1. KPI Tiles (top row)
Five compact cards aggregating across all partners owned by the current user:

- **Active partners** — count from `partners` where `owner_id = me` and `status = 'active'`.
- **Open deals** — sum of latest `partner_metrics.deals_open` per partner + total `deals_open_value` (€).
- **Won deals (YTD)** — sum of latest `deals_won` count + `deals_won_value` (€).
- **Total MRR** — sum of latest `partner_metrics.mrr` per partner.
- **Tasks done / open** — counts from `action_plans` (status `done` vs `todo` + `in_progress`) where `user_id = me`.

### 2. Activity & Tasks
Two side-by-side cards:

- **Tasks made in the platform**: total tasks created (count of `action_plans` rows for this PDM), broken down by status (todo / in_progress / done), with a 30-day "completed this month" number. Includes an "overdue" count (due_date < today and not done).
- **Lead pipeline**: counts from `partner_leads` by `status`, plus next 7-day `next_step_at` items.

### 3. Internal PDM KPIs
Card with role-specific KPIs:

- **Stakeholders mapped**: count of `partner_stakeholders` rows across my partners + % of partners with at least 1 stakeholder.
- **Diagnostics run**: count of `assessments` per partner (coverage = % of partners with a diagnostic).
- **Average partner maturity**: average of latest `assessments.overall` across owned partners.
- **Trained people**: sum of latest `partner_metrics.trained_people`.
- **Partners with documents**: count of partners having at least one `partner_documents` row.

### 4. Personal OCTA Maturity (collapsed/secondary)
Keep the existing radar + 8 axes block, but moved below the operational KPIs and visually de-emphasized — it's still useful, just no longer the headline.

## Technical Notes

- All queries through the existing browser `supabase` client; RLS already restricts to the PDM's own partners.
- "Latest metric per partner" handled client-side: fetch `partner_metrics` for owned partner ids ordered by `created_at desc`, then reduce to one row per `partner_id`.
- New helper file `src/lib/pdm-stats.ts` exposing one `usePdmStats(userId)` hook that returns `{ partners, deals, mrr, tasks, leads, stakeholders, assessments, loading }`. Keeps the route file clean.
- Update header link label only (route stays `/dashboard`):
  ```
  <Link to="/dashboard" ...>My Performance</Link>
  ```
- Page meta title updated to "My Performance — OCTA+".

## Out of Scope

- No schema changes (all data already exists in `partners`, `partner_metrics`, `action_plans`, `partner_leads`, `partner_stakeholders`, `assessments`, `partner_documents`).
- No charts beyond the existing radar (keeps the change focused; can add trend charts later if desired).
- No leadership/team-wide aggregates — this is the PDM's personal view.