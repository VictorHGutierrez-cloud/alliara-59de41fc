# Partner Qualification Module

A new lightweight pipeline at `/qualification` to triage incoming leads with an Ideal Partner Profile (IPP) scorecard, then promote qualified leads into the existing `partners` table. Nothing in `/partners`, `/axes`, `/intel`, or `/plan` is touched.

## 1. Database (new migration)

New table `partner_leads`:

```text
id              uuid PK (default gen_random_uuid)
owner_id        uuid not null      -- auth.uid() of PDM
company_name    text not null
contact_person  text
website         text
status          enum partner_lead_status: 'new' | 'in_review' | 'approved' | 'rejected'
                default 'new'
sales_score     int  (1|2|3, nullable)
expertise_score int  (1|2|3, nullable)
fit_score       int  (1|2|3, nullable)
total_score     int  generated/derived (computed in app, also stored)
notes           text
promoted_partner_id uuid (nullable) -- set after conversion
created_at      timestamptz default now()
updated_at      timestamptz default now()
```

New enum `partner_lead_status` with the 4 statuses above.

RLS (mirrors `partners`):
- SELECT: `owner_id = auth.uid()` OR leadership/admin via `private.has_role`
- INSERT: `owner_id = auth.uid()`
- UPDATE: `owner_id = auth.uid()`
- DELETE: `owner_id = auth.uid()`

Trigger `set_updated_at` on update.

## 2. Routes & Files

New files:
- `src/routes/qualification.tsx` — pipeline view (Kanban with 4 columns) + "+ New Lead" button + lead detail side panel.
- `src/lib/leads-store.ts` — `useLeads(userId)` hook (list, create, update status, update scores, promote, delete) following the same pattern as `partners-store.ts`.

Edited files:
- `src/routes/__root.tsx` — add `<Link to="/qualification">Qualification</Link>` in the authenticated nav, between "Portfolio" and "My maturity".
- `src/integrations/supabase/types.ts` — auto-regenerated after the migration; not hand-edited.

No edits to `/partners`, `/axes`, `/intel`, `/plan`, or `partners-store.ts`.

## 3. UI Specification (`/qualification`)

### Pipeline view
Header identical in style to `/partners`:
- Eyebrow: "Qualification"
- H1: "Partner Lead Pipeline"
- Sub: "Qualify incoming leads against your Ideal Partner Profile before promoting them."
- Right side: `+ New Partner Lead` button.

KPI strip (4 cards): New Leads · In Review · Approved · Rejected (counts).

Kanban: 4 columns ("New Lead", "In Review", "Approved", "Rejected"). Each card shows company name, contact, website host, and a colored Fit Score chip if scored. Clicking a card opens the detail side panel. Status changes via a small dropdown on the card (no drag-and-drop required for v1 — keeps it lightweight per the brief).

### "+ New Partner Lead" modal
Fields: Company Name (required), Contact Person, Website. Reuses the same modal style as `NewPartnerDialog` in `/partners`.

### Lead detail side panel (slide-over from right, ~480px)
Sections:
1. **Lead info** — company, contact, website, status dropdown, delete button.
2. **IPP Scorecard** — 3 radio groups, each with Low (1) / Medium (2) / High (3):
   - Sales & Audience Capacity
   - Technical & Market Expertise
   - Strategic & Cultural Fit
3. **Fit Banner** (live, computed from sum 3-9):
   - 3-4 → red banner: "Low Fit: High risk of churn. Recommendation is to Reject."
   - 5-7 → yellow banner: "Moderate Fit: Review carefully before promoting."
   - 8-9 → green banner: "Strong Fit: Highly recommended to Promote."
   - Not yet fully scored → muted hint: "Answer all 3 questions to see the fit recommendation."
4. **Notes** — free text, autosaves on blur.
5. **Actions footer**:
   - Primary: `Promote to Official Partner` (disabled until all 3 scored).
   - Secondary: `Reject` (sets status to `rejected`).

Scores autosave on change; total is recalculated and the banner re-renders immediately (pure derived state — no extra hooks per render to avoid the earlier "Rendered more hooks" issue).

## 4. Promotion Flow

`Promote to Official Partner` handler:
1. Insert into `partners` with:
   - `owner_id = auth.uid()`
   - `name = lead.company_name`
   - `company = lead.company_name`
   - `tier = 'emerging'`
   - `status = 'active'`
   - `notes` = a generated string: `"Promoted from qualification. IPP scores — Sales: X, Expertise: Y, Fit: Z (Total N/9). " + lead.notes`
2. Update the lead: `status = 'approved'`, `promoted_partner_id = newPartner.id` (kept as an audit trail rather than hard-deleted, so leadership can see conversion history; the Kanban filters approved leads with a `promoted_partner_id` into a collapsed "Promoted" badge in the Approved column).
3. Toast: `${name} promoted to partner`.
4. Navigate to `/partner/$partnerId` with the new id.

`Reject` handler: just sets `status = 'rejected'`. Delete button hard-deletes the lead row (allowed by RLS).

## 5. Technical Notes

- All Supabase calls go through the browser client (`@/integrations/supabase/client`), matching the existing pattern in `partners-store.ts`. No edge functions, no server functions needed.
- Total score is derived in the component (`sales + expertise + fit` when all three are non-null) — not stored as a generated column to keep the migration simple. The `total_score` column is written as a denormalized convenience field for sorting/leadership analytics.
- The new nav link shows only when `user` is signed in (same condition as Portfolio link).
- Kanban uses CSS grid (`grid-cols-1 md:grid-cols-2 xl:grid-cols-4`), no dnd library.
- Side panel uses a fixed-position overlay matching the visual style of `NewPartnerDialog` (no new shadcn components required).

## 6. Out of Scope

- Drag-and-drop between Kanban columns (status change via dropdown is sufficient for v1).
- Bulk import of leads.
- AI scoring suggestions for the IPP (kept manual; can be added later).
- Editing company name / website after creation (user can delete + recreate if wrong).
