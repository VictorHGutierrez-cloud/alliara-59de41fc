## Goal

Reposition OCTA OS from a generic "audit/task" tool to a strategic "Partner Revenue Orchestration" platform — purely through copy and content payload changes. **No** changes to layout, Tailwind classes, DB schema, RLS, or Edge Function logic.

---

## 1. UI label renames (frontend only)

### `src/routes/partner.$partnerId.tsx`
- Tab label `"Diagnostic"` / `"Re-diagnose"` → `"Readiness Assessment"` / `"Re-run Assessment"`
- Tab label `"Action plan (n)"` → `"JBP (n)"`
- Tab label `"AI coach"` → `"Ecosystem Copilot"`
- Overview empty-state heading `"Run the OCTA diagnostic"` → `"Run the Partner Readiness Assessment"`; CTA `"Start diagnostic →"` → `"Run Readiness Assessment →"`
- Overview card heading `"Action plan"` → `"Joint Business Plan (JBP)"`; link `"Open plan →"` → `"Open JBP →"`
- Overview card heading `"Highest leverage moves"` → `"High-Impact Growth Levers"`; sublink `"AI coach →"` → `"Ecosystem Copilot →"`
- `"Diagnostic history"` heading → `"Assessment History"`; "n run(s)" → "n assessment(s)"; "Delete this diagnostic?" confirm → "Delete this assessment?"; toast `"Diagnostic deleted"` → `"Assessment deleted"`

### `src/routes/partner.$partnerId.diagnostic.tsx`
- Route head title → `"Readiness Assessment — OCTA OS"`
- Read-only message: replace "run a diagnostic" with "run a readiness assessment"
- Submit button `"Save diagnostic"` → `"Save Readiness Assessment"`; toast `"Diagnostic saved · maturity updated"` → `"Readiness Assessment saved · partner maturity updated"`

### `src/routes/partner.$partnerId.plan.tsx`
- Route head title → `"Joint Business Plan — OCTA OS"`
- Empty-state heading `"No actions yet"` → `"No growth initiatives yet"`; copy mentions "action plan" / "tasks" → "Joint Business Plan" / "growth initiatives"
- Button `"+ Add action"` → `"+ Add Growth Initiative"`; dialog title `"New action"` → `"New Growth Initiative"`; final CTA `"Add action"` → `"Add Initiative"`; toast `"Action added"` → `"Growth Initiative added"`
- Column titles: `"To do"` / `"Doing"` / `"Done"` → `"Planned"` / `"In Motion"` / `"Delivered"` (keeps the same `todo|doing|done` enum values in the select options' `value`; only display labels change)

### `src/routes/partner.$partnerId.intel.tsx`
- Generate button `"Generate insights"` / `"Analyzing…"` → `"Decode Partner Signals"` / `"Decoding signals…"`
- Right-column card heading `"AI insights"` → `"Decoded Partner Signals"`; subcopy "Every generation is saved as a run." → "Each decode is saved to the partner's signal history."
- `RunCard`: section heading `"Suggested actions"` → `"High-Impact Initiatives"`; `"Signals by axis"` → `"Signals by Growth Axis"`; the `executive_summary` is rendered as a plain paragraph today — add a small label above it: `"Ecosystem Executive Vision"` (in the existing `text-xs font-mono uppercase tracking-widest` style), no layout change

### `src/routes/partner.$partnerId.coach.tsx`
- Route head title + heading `"AI Coach"` → `"Ecosystem Copilot"`; subcopy mentions "AI coach" → "Ecosystem Copilot"
- `"No recommendations yet"` heading kept; subcopy refers to "coaching" → "copilot guidance"
- Toast `"AI coach generated new recommendations"` → `"Ecosystem Copilot delivered new guidance"`

### `src/routes/partner.$partnerId.axes.tsx` (Section headers in `AxisDetail`)
- `"Mental model"` → `"Ecosystem Mindset"`
- `"Common mistakes"` → `"Frictions & Blind Spots"`
- `"Examples"` → `"Real-World Plays"` (kept consistent with the new tone; minor)
- `"Maturity ladder"` → `"Maturity Journey"`
- `"Action plan"` side-card → `"Joint Business Plan"`; subcopy "Open the plan to add or update tasks →" → "Open the JBP to add or update growth initiatives →"
- `ListSection` titles passed in: `"Objectives"` → `"Expansion Goals"`, `"Key levers"` → `"Traction Levers"`, `"Metrics that matter"` → `"Impact KPIs"`

### `src/lib/partners-store.ts` — `statusLabel()` (display only, enum values untouched)
- `active` → `"Scaling"`
- `nurturing` → `"Developing"`
- `at_risk` → `"Churn Risk"`
- `paused` → `"Paused"` (kept)
- `archived` → `"Archived"` (kept)

The Edit Partner dialog `<select>` option labels in `partner.$partnerId.tsx` updated to match (Active→Scaling, Nurturing→Developing, At risk→Churn Risk). The `value=` attributes stay as `active|nurturing|at_risk|...` so the DB enum is unchanged.

---

## 2. `src/content/octa.ts` — full axis content rewrite

Rewrite the 8 `AXES` entries so every field evaluates the **partner's** capabilities (not the orchestrator's program). Keep the existing TypeScript shape, the existing `key` / `letter` / `color` / `icon` slots so radar, colors, and routing keep working without touching any other file.

| # | New axis (key / letter unchanged) | Old → New name |
|---|---|---|
| 1 | `strategy` / S | Strategy & Vision → **Strategic Alignment (Fit)** |
| 2 | `offer` / O | Offer & Value Proposition → **Commercial & Operational Capacity** |
| 3 | `recruit` / R | Recruitment & Targeting → **Solution Mastery (Enablement)** |
| 4 | `enable` / E | Enablement & Certification → **Go-to-Market Strength (Pipeline)** |
| 5 | `cosell` / C | Co-sell & Pipeline → **Delivery Quality & Value** |
| 6 | `operate` / T | Tech & Operations → **Program Engagement** |
| 7 | `growth` / G | Growth & Marketing → **Collaboration & Relationship** |
| 8 | `success` / X | Success & Lifecycle → **Customer Success & Impact** |

For each axis, fully rewrite:
- `name`, `tagline`, `mentalModel` (now framed as "How to evaluate this in the partner")
- `objectives` → renamed mentally as Expansion Goals (3 items, partner-focused)
- `levers` → Traction Levers (3 items the PDM can pull on the partner side)
- `metrics` → Impact KPIs (3, observable on the partner)
- `commonMistakes` → Frictions & Blind Spots (3, things partners typically get wrong)
- `examples` (2, real B2B partner archetypes)
- `levels[1..5]` (5 maturity steps describing the **partner's** evolution: e.g. for Strategic Alignment: 1 "Misaligned" → 5 "Strategic Twin")
- `lessons` (3, kept — these now coach the PDM on how to grow the partner on this axis)
- `diagnostic` (3 questions, see §3) — written from the PDM's perspective evaluating the partner

`CENTRAL_MENTAL_MODEL` and `OCTA_FULL_NAME` are slightly reworded to emphasize "evaluating each partner individually" rather than "the ecosystem program".

`overallLevelLabel` / `overallLevelDescription` are reworded (still 5 buckets) to describe the partner's maturity ("Misaligned → Emerging → Productive → Strategic → Compounding"), not the program's.

---

## 3. Diagnostic questions — 24 partner-centric prompts

Each new axis gets exactly 3 questions (3 × 8 = 24), all phrased to evaluate the partner. Examples (full set in the implementation):

- **Strategic Alignment (Fit)** — fit_icp, fit_values, fit_ambition
- **Commercial & Operational Capacity** — sales_team_size, sales_structure, delivery_capacity
- **Solution Mastery (Enablement)** — certifications, independent_pitch, technical_depth
- **Go-to-Market Strength (Pipeline)** — eql_generation, comarketing_activity, pipeline_predictability
- **Delivery Quality & Value** — implementation_quality, services_packaging, csat_on_delivery
- **Program Engagement** — portal_usage, mdf_uptake, tier_progression
- **Collaboration & Relationship** — proactivity, pipeline_transparency, comms_quality
- **Customer Success & Impact** — end_customer_churn, end_customer_nps, expansion_within_base

Each question has 5 options mapped to maturity 1→5, mirroring the existing pattern, so the wizard, scoring math (`reduce/avg`), assessment storage, and radar all keep working without code changes.

---

## 4. Safety check (no logic changes required)

- **Wizard** auto-builds from `AXES.flatMap(a => a.diagnostic.map(...))` — new questions appear automatically.
- **Scoring** uses averages over a's `diagnostic`, then keys by `a.key`. We keep all 8 `key` slots unchanged → existing `assessments.scores` (jsonb) rows still match the AXES list; old historical runs still render under their original keys (with the new axis name shown).
- **Edge functions** (`partner-intel`, `ai-coach`) receive `axes: [{ key, name, ... }]` from the client and reference them by `key`/`name` only (verified). The new partner-centric names actually *improve* the prompt context. No edge function code changes.
- **DB enums** (`partner_status`, action `status`, etc.) are untouched — only display labels change.
- **routeTree.gen.ts**, Supabase types, and storage paths are untouched.

---

## Files touched

- `src/content/octa.ts` (full content rewrite within existing types)
- `src/lib/partners-store.ts` (only `statusLabel` body)
- `src/routes/partner.$partnerId.tsx`
- `src/routes/partner.$partnerId.diagnostic.tsx`
- `src/routes/partner.$partnerId.plan.tsx`
- `src/routes/partner.$partnerId.intel.tsx`
- `src/routes/partner.$partnerId.coach.tsx`
- `src/routes/partner.$partnerId.axes.tsx`

No migrations, no edge function edits, no schema changes, no Tailwind changes.