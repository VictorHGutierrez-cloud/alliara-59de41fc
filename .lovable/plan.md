## What you're describing

Two flows in `/qualification` should consistently funnel into the **Partner Acquisition Pipeline** (the `/partners` portfolio):

1. Clicking **"Promote to Official Partner"** should land the user on the pipeline (`/partners`) where the new partner is visible — not jump straight into the partner's deep detail page.
2. Setting a lead's **Status → Approved** (via the dropdown) should also create the partner and surface it in the portfolio. Today the dropdown just changes a label and does nothing else, so the partner never appears.

## Plan

### 1. `src/routes/qualification.tsx` — redirect Promote to the pipeline
- After a successful `promoteLead(active)`, replace `nav({ to: "/partner/$partnerId", ... })` with `nav({ to: "/partners" })`.
- Keep the success toast (`"X promoted to partner"`) and clear `setActiveId(null)` so the user lands on the pipeline with the new card visible.
- Optional polish: append `?highlight=<partnerId>` and have `/partners` briefly ring the matching card (nice-to-have, can skip if you want a minimal change).

### 2. `src/routes/qualification.tsx` — make the Status dropdown trigger promotion
When the user changes status to `approved`:
- If `lead.promoted_partner_id` is already set → just update status (no duplicate partner).
- Otherwise → call `leadsStore.promoteLead(active)` instead of a raw `onUpdate({ status })`. That helper already:
  - inserts a row in `partners` with the Factorial scorecard summary in `notes`
  - sets the lead's `status = "approved"` and stores `promoted_partner_id`
- Show a confirm dialog ("This will create an Official Partner in your pipeline. Continue?") to prevent accidental promotions from a casual dropdown click.
- On success: toast + redirect to `/partners` (same as button #1).

### 3. Guardrail for the "Rejected" path (small consistency fix)
- Selecting `rejected` from the same dropdown should open the existing `RejectReasonDialog` instead of silently flipping status, mirroring the symmetry with Approved. (Already partially done via the "Reject Lead" button — we'll route the dropdown through the same handler.)

### 4. Verify the portfolio side
No code change needed: `usePortfolio` in `src/lib/partners-store.ts` already lists every row in `partners` owned by the user, so a freshly-promoted lead will appear automatically in `/partners` once the insert lands. The portfolio refreshes on mount; arriving via `nav({ to: "/partners" })` will show it immediately.

## Files to edit
- `src/routes/qualification.tsx` — redirect target after promote, status-dropdown handler, confirmation dialog wiring.

## Out of scope
- No DB migration. The existing `partner_leads.promoted_partner_id` + `partners` insert path covers everything.
- No changes to `/partners` layout — just navigation target.
