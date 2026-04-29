## Scope

Two changes, fully isolated from `/axes`, `/intel`, `/plan`, `/coach`:

1. **Portfolio (`/partners`)** — add per-card delete with confirmation.
2. **Qualification (`/qualification`)** — replace 3-axis IPP scorecard with Factorial's 5-Dimension scorecard (score 5–15), revamp banners, and add a "Reject Lead" flow with rejection reason.

No DB schema or RLS changes. We reuse the existing `partner_leads` columns (`sales_score`, `expertise_score`, `fit_score`, plus 2 more reused below) and store the extra dimensions inside the existing `notes` field as a structured JSON block, keeping the migration count at zero.

---

## 1) Delete partner from Portfolio

`src/routes/partners.tsx` — `PartnerCard`:

- Wrap card in a `relative` container; add a small "⋯" menu button (top-right corner, stops propagation) that opens a tiny popover with **Delete partner**.
- Click → `confirm("Delete {name}? This permanently removes the partner and all related diagnostics, plans, intel runs and documents.")`.
- On confirm, call `supabase.from("partners").delete().eq("id", id)` (RLS already restricts to owner; cascading rows are handled by existing app behavior — partners is the parent reference for assessments/action_plans/etc.).
- Toast success/error, then call `portfolio.refresh()`.

Implementation detail: expose `deletePartner(id)` from `usePortfolio` in `src/lib/partners-store.ts` (mirrors existing `createPartner`) so the route stays thin.

Keep the entire card still navigable via `<Link>`; the menu uses `e.preventDefault(); e.stopPropagation()` so clicking it doesn't navigate.

---

## 2) Factorial 5-Dimension Scorecard on `/qualification`

### Field mapping (no DB migration)

We have 3 numeric columns + `total_score` + `notes`. New mapping:

| Dimension | Stored in |
|---|---|
| 1. ICP Overlap | `sales_score` (renamed in UI only) |
| 2. Sales Capacity | `expertise_score` (renamed in UI only) |
| 3. Delivery Muscle | `fit_score` (renamed in UI only) |
| 4. Business Commitment | `notes` JSON block, key `commitment` |
| 5. Strategic Alignment | `notes` JSON block, key `alignment` |
| Total (5–15) | `total_score` |

The `notes` column will hold a structured prefix:

```text
<!--FACTORIAL_SCORECARD:{"commitment":2,"alignment":3,"rejection_reason":"..."}-->
free-text notes here…
```

A small parser/serializer in `src/lib/leads-store.ts` reads/writes that block transparently. Free-text notes the PDM types still work — only the hidden block is managed.

### `src/lib/leads-store.ts` updates

- Add `FACTORIAL_DIMENSIONS` constant (5 entries) with `key`, `label`, and the 3 option descriptors (Low/Medium/High copy from the request).
- Add helpers:
  - `parseScorecard(notes) → { commitment, alignment, rejection_reason, freeText }`
  - `serializeScorecard(meta, freeText) → string`
  - `computeTotal(lead, meta)` → sum of 5 numbers (null if any missing).
  - `factorialVerdict(total)`:
    - `5–8` red — "Low Fit: High risk of churn. Target company size or capacity is misaligned. Recommendation: Reject."
    - `9–12` yellow — "Moderate Fit: Potential synergy, but review implementation muscle and ICP overlap before promoting."
    - `13–15` green — "Strong Fit: Ideal partner for Factorial. Highly recommended to Promote."
- Replace the existing `fitVerdict` callers; keep export name or add new name and update imports.
- `setDimension(leadId, dimensionKey, value)`:
  - For dims 1–3 → update the matching column AND recompute `total_score`.
  - For dims 4–5 → update `notes` (re-serialized) AND recompute `total_score`.
- `rejectLead(leadId, reason)` → sets `status: "rejected"` and stores `rejection_reason` in the notes JSON block.
- `promoteLead` continues to work; update the notes prefix it writes onto the new partner record to list all 5 dimensions and the total/15 instead of /9.

### `src/routes/qualification.tsx` updates

- `LeadCard` chip: show `total/15 · verdict.label` using `factorialVerdict`.
- `LeadDetailPanel`:
  - Replace the 3-question IPP block with the 5-dimension list. Each dimension renders as a Low/Medium/High segmented control (same styling as today). Tooltip/help text shows the Factorial-specific copy from the prompt (e.g. "50–500 employees in Hospitality, Tech, Construction, Pharma").
  - Banner uses new thresholds and copy above.
  - Buttons row:
    - Primary: **Promote to Official Partner** — disabled until all 5 dimensions are scored (`total !== null`) and lead isn't already approved.
    - Secondary: **Reject Lead** — opens a small modal `RejectReasonDialog` with a `<select>` of preset reasons ("Below 20 employees", "Above 3000 employees", "Competitor overlap", "No sales capacity", "No delivery muscle", "Misaligned ICP", "Other") plus an optional free-text field. Submitting calls `rejectLead`.
  - The free-text notes textarea stays, but writes through the serializer so we don't clobber the hidden JSON block.

### Edge case handling

- Old leads scored on the previous 1–3 / total 3–9 scale: if `total_score` exists but is < 5, treat as "Not scored" until the PDM re-rates dims 4 & 5. The card simply shows "Not scored" until 5 dims are present.
- All UI tone classes (`red/yellow/green`) reuse existing `toneClass` / `bannerClass` helpers — no Tailwind additions.

---

## Files touched

- `src/lib/partners-store.ts` — add `deletePartner` to `usePortfolio`.
- `src/routes/partners.tsx` — add card-level delete menu + confirm.
- `src/lib/leads-store.ts` — Factorial dimensions, parser/serializer, new verdict, `rejectLead`, updated `promoteLead` notes.
- `src/routes/qualification.tsx` — 5-dimension scorecard UI, new banner, Reject modal.

No changes to: database schema, RLS, edge functions (`partner-intel`, `ai-coach`), other routes, or `octa.ts` content.