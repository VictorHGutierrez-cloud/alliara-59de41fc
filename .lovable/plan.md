## Goal

Two things the user asked for:

1. **Consistent filters & sorting across the platform** — alphabetical, by partnership **type** (Referral / Reseller / Expert), and by **revenue** they brought in. Apply to Portfolio, Qualification, and the Dashboard's partner lists.
2. **Tasks attached to leads entering the pipe** — leads already have an activities table (`partner_lead_activities`) but tasks are buried inside the lead detail panel. We need them surfaced and aggregated like partner Growth Initiatives are.

## 1. New field: Partnership Type (Referral / Reseller / Expert)

Today `partners.tier` = `strategic | core | emerging | long_tail` — that's a maturity/value tier, not the **commercial relationship**. We need a separate field.

### Schema
- New enum `partner_type` with values: `referral`, `reseller`, `expert`.
- New column `partners.partner_type partner_type not null default 'referral'`.
- New column `partner_leads.partner_type partner_type` (nullable while qualifying — set on promotion).
- Backfill all current partners to `referral` (most common starting point); user can re-classify in bulk later from the portfolio table.

### UI
- Add type selector to:
  - New partner dialog (`partners.tsx` → `New partner` modal)
  - Partner header on `/partner/$partnerId`
  - New lead dialog + lead detail panel on `/qualification`
  - When a lead is promoted (`promoteLead`), copy `partner_type` from lead to partner.
- Render a small colored chip everywhere a partner card shows tier (Referral = blue, Reseller = violet, Expert = amber).

## 2. Shared Filter / Sort Bar

Build one reusable component `src/components/PartnerFilterBar.tsx`:

```
[Search…] [Type ▾ All|Referral|Reseller|Expert] [Status ▾ …] [Sort ▾ A-Z | Z-A | Revenue ↓ | Recently added | Maturity]
```

- State held in URL search params via TanStack zod adapter so filters survive refresh and are shareable. Schema: `{ q, type, status, sort }` with `fallback()` defaults.
- Sort options:
  - `name_asc` (alphabetical, default), `name_desc`
  - `revenue_desc` — sums latest `partner_metrics.revenue + deals_won_value` per partner
  - `mrr_desc` — latest `partner_metrics.mrr`
  - `created_desc` — recently added
  - `maturity_desc` — `assessments.overall`

### Where it goes
- **`/partners`** (Portfolio) — replaces the current ad-hoc search box and adds Type + Sort. The existing Health-status badges keep working (they sync with the same `status` URL param).
- **`/qualification`** — adds the same bar above the Kanban so PDMs can filter leads by Type, sort by score or alphabetically, and search.
- **`/dashboard`** — small read-only "Top partners" list that respects the same sort.

### Reusable hook
`src/lib/partner-revenue.ts` exposing `useLatestPartnerRevenue(partnerIds[])` → returns `Map<partnerId, { revenue, mrr, dealsWonValue }>` from `partner_metrics`. Used by sort logic and by KPIs that already exist on the dashboard so we don't duplicate queries.

## 3. Tasks for Leads in the Pipe

Lead activities (`partner_lead_activities`) already exist and store `kind, title, due_date, done`. Today they only appear inside the lead detail panel. We'll surface them like partner Growth Initiatives.

### Changes
- **Aggregate hook** `useAllLeadTasks(userId)` in `src/lib/leads-store.ts`: fetches all open `task` activities across the user's leads, joined with `lead.company_name`. Returns `{ tasks, overdueCount, dueThisWeek }`.
- **Qualification page** (`/qualification`):
  - New section above the Kanban: **"Lead tasks · Next moves"** showing the next 5 open tasks across all leads, sorted by due date (overdue first, then this week). Each row: lead name · task title · due date · "Mark done" button.
  - On every Kanban `LeadCard`, the existing "X open · Y overdue" footer becomes clickable → opens lead panel pre-filtered to the CRM tab.
- **Dashboard** (`/dashboard`):
  - Add a "Lead tasks" tile to the existing **Activity & Tasks** section, mirroring the partner action_plans tile (open / overdue / done this week).
  - Add to **Briefing copy** on `/partners`: "X overdue lead tasks" call-to-action chip linking to `/qualification#lead-tasks`.
- **New-lead dialog**: optional "First next step" field (kind=task, title, due_date) — if filled, creates a `partner_lead_activities` row right after the lead is inserted. Removes friction so a task is always attached when a lead enters the pipe.

## 4. Technical Notes

- **Schema migration** (one migration):
  - `create type partner_type as enum ('referral','reseller','expert');`
  - `alter table partners add column partner_type partner_type not null default 'referral';`
  - `alter table partner_leads add column partner_type partner_type;`
- **No RLS changes** — both columns inherit existing partner/lead policies.
- **TypeScript** — `src/integrations/supabase/types.ts` regenerates automatically; `partners-store.ts` and `leads-store.ts` will pick up the new field with no manual edits beyond creating helpers.
- **URL search params** use `zodValidator` + `fallback()` per the TanStack pattern; sort/filter state survives navigation between Portfolio ↔ Partner detail ↔ back.
- **Sort by revenue** is computed client-side after fetching latest metrics per partner (same "reduce by partner_id" pattern already used by `usePdmStats`).

## 5. Out of Scope

- Bulk-edit UI for re-classifying many partners at once (can be added later — for now individual edit on each partner page is enough).
- Saved filter presets per user.
- Team-wide leaderboard sorted by revenue (this plan is the PDM's own view).

## Files touched

- New: `supabase` migration · `src/components/PartnerFilterBar.tsx` · `src/lib/partner-revenue.ts`
- Edited: `src/routes/partners.tsx` · `src/routes/qualification.tsx` · `src/routes/dashboard.tsx` · `src/routes/partner.$partnerId.tsx` · `src/lib/leads-store.ts` · `src/lib/partners-store.ts`
