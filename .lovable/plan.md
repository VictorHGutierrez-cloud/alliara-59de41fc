## Problem

Right now the only way to add a partner from /qualification to the portfolio is to **drag a lead into the "Approved" column** and confirm a native `window.confirm()` popup. There is no visible button. If a user clicks on a lead, opens the side panel, or has a lead that is already in "Approved" but not yet promoted, there is no way to push it to the portfolio. That's why it feels like the feature disappeared.

The backend logic still works — `leadsStore.promoteLead(lead)` in `src/lib/leads-store.ts` creates the partner row and stamps `promoted_partner_id` on the lead. We just need to surface it in the UI.

## Plan

Add an explicit **"Promote to Partner"** action in two places, and keep the current drag-to-Approved behavior as a shortcut.

### 1. Lead detail panel (`LeadDetailPanel` in `src/routes/qualification.tsx`)

Just under the Status/Type row at the top of the side panel, render one of three states:

- **Not yet promoted** → a primary button **"Promote to Partner →"**.  
  - Disabled until the lead has `partner_type` set and a Factorial total ≥ a "Promote" verdict (we already compute `factorialVerdict(total)` — reuse it; if it is `red` we disable and show a hint "Score the lead first").
  - On click: confirm dialog → call `leadsStore.promoteLead(lead)` → toast → navigate to `/partner/$partnerId` using the returned id, so the user lands directly on the new partner workspace.
- **Already promoted** → show the existing green "Promoted" chip plus a small **"Open partner →"** link to `/partner/$promoted_partner_id`.
- **Rejected** → keep current behavior (no promote button).

### 2. Lead card (`LeadCard` in the same file)

On the Kanban card, in the footer row, add a tiny **"Promote →"** button visible only when:
- `lead.status === "approved"` AND
- `!lead.promoted_partner_id`

This catches the case where someone moved a lead to Approved but cancelled the confirm dialog. Clicking it stops propagation, runs the same promote flow, and shows a toast.

### 3. Keep drag-to-Approved as a shortcut

`moveLeadInQualificationKanban` stays as is — drag-to-Approved still offers the confirm-and-promote shortcut. We only **add** explicit buttons; we don't remove the existing path.

### 4. Empty-pipeline hint

In `EmptyState`, no change needed — it already nudges users to add a lead first.

## Technical notes

- Files touched: only `src/routes/qualification.tsx`. No schema changes, no new files, no new hooks.
- `promoteLead` already returns the new `partner_id` (string). Use it for navigation: `nav({ to: "/partner/$partnerId", params: { partnerId } })`.
- Reuse `PARTNER_TYPES` / `factorialVerdict` already imported at the top.
- Replace the native `window.confirm()` for promotion with the existing custom-styled confirm pattern if one exists; otherwise keep `confirm()` for now (out of scope to introduce a new modal component just for this).

## Out of scope

- Bulk-promote multiple approved leads at once.
- Auto-promote on reaching a high score (still requires explicit user action).
- Redesigning the Kanban or detail panel beyond adding the button.
