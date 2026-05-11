## Goals

1. Owners can fully edit any of their own tasks (title, description, axis, priority, due date, status) — not just cycle status / delete.
2. Remove all "level" references from task UI and creation flow (no `L1/L2/...` chips, no "Target level" selector, no `→ L{n}` in coach recommendations).

## Changes

### A. Add an "Edit task" dialog (frontend only)

In `src/components/ui/agent-plan.tsx`:
- Add an "Edit" button next to "Delete" on each `AgentTaskCard` (only when `canEdit` is true and a new optional `onEdit` callback is provided).
- Add a new prop `onEdit?: (taskId: string) => void` to both `AgentTaskCard` and `AgentPlan` and forward it through.
- Remove the `→ L{task.targetLevel}` chip from the card header.

In `src/routes/partner.$partnerId.plan.tsx`:
- Add a state `editingId` and an `EditActionDialog` component (mirrors `NewActionDialog` but pre-filled, **without** the "Target level" field).
- Pass `onEdit={(id) => setEditingId(id)}` to `<AgentPlan />`.
- On save, call `data.updateAction(id, { title, description, axis_key, priority, due_date, status })`.
- Remove the "Target level" `<Field>` and `targetLevel` state from `NewActionDialog` so new tasks no longer carry a level. Stop passing `targetLevel` in the `addAction` call.

### B. Strip "Level" from existing visible UI

- `src/components/ui/agent-plan.tsx`: remove the L-chip (lines ~194–196).
- `src/routes/partner.$partnerId.coach.tsx`: remove the `→ L{r.target_level}` span (lines 491–498) in the AI recommendations list.
- `src/routes/partner.$partnerId.plan.tsx`: remove the "Target level" field from `NewActionDialog`.

### C. What we keep (intentionally untouched)

- DB column `action_plans.target_level` and the `targetLevel` field in `addAction` / `actionRowToAgentTask` stay in place — they're just no longer surfaced or set from the UI. This keeps the door open to "depois a gente coloca" without a migration round-trip.
- `levelFromAvg` and the axis "Maturity Journey" panel on `partner.$partnerId.axes.tsx` are diagnostic/maturity concepts, not task levels — left as-is. (Confirm below.)
- Coach Q&A `next_moves` already passes `targetLevel: undefined` when out of range; no change needed there.

## Files touched

- `src/components/ui/agent-plan.tsx` — add Edit button + `onEdit` prop, remove L-chip.
- `src/routes/partner.$partnerId.plan.tsx` — add `EditActionDialog`, wire `onEdit`, drop "Target level" from `NewActionDialog`.
- `src/routes/partner.$partnerId.coach.tsx` — remove `→ L{r.target_level}` span.

## One clarifying question before I implement

**Maturity Journey panel** on the Axes page (the "Level 1 / Level 2 / ..." cards under each axis with `nextStep`) — this is the OCTA diagnostic maturity model, not task-level. Should I:
- **Leave it** (it's about diagnostic maturity, not tasks), or
- **Also remove all level UI everywhere**, including the Axes maturity ladder and the `levelFromAvg`-driven "Level X" badge on each axis?

I'll default to **leave it** unless you say otherwise.