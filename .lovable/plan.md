## Goals

Three changes:

1. Replace the Joint Business Plan task cards with the new **agent-plan** layout (expandable tasks + subtasks, animated status icons).
2. Make the **OCTA+** header logo always go to `/` (the landing with the video) — even when signed in.
3. Clean up the landing hero copy: remove the "for Factorial PDMs" eyebrow chip and the description line, and change the primary CTA from "Sign in with Factorial" to just "Sign in".

---

## 1. New task card component — `src/components/ui/agent-plan.tsx`

Port the snippet you sent into a generic, controlled component (no `useState` of demo data — it consumes our real `ActionRow[]`).

Public API:

```ts
type AgentTask = {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "doing" | "done" | "need-help" | "failed";
  priority: "low" | "medium" | "high";
  axisKey?: string;        // for the axis chip
  dueDate?: string | null;
  targetLevel?: number | null;
  source?: string | null;  // "ai" → shows AI badge
  subtasks?: AgentSubtask[];
};
type AgentSubtask = {
  id: string;
  title: string;
  description?: string;
  status: AgentTask["status"];
};

<AgentPlan
  tasks={AgentTask[]}
  isOwner={boolean}
  onCycleStatus={(taskId) => void}      // todo → doing → done → todo
  onDelete={(taskId) => void}
  onEditSubtask={...}                   // optional — phase 2
/>
```

Visual spec (matches your snippet):

- Each task is an expandable row. Click the title area to expand subtasks; click the left status icon to cycle status.
- Status icons (lucide): `CheckCircle2` (done), `CircleDotDashed` (doing), `CircleAlert` (need-help), `CircleX` (failed), `Circle` (todo).
- Animated with `framer-motion` (`LayoutGroup`, `AnimatePresence`, spring transitions). Honors `prefers-reduced-motion`.
- Subtasks render in an indented column with a vertical connector line aligned to the parent's status icon.
- Right side of each row: axis chip (uses our existing `AXES` color tokens), priority chip, `→ L{targetLevel}` if set, status badge.

Styling uses existing tokens (`bg-card`, `border-border/60`, `text-muted-foreground`, `var(--octa-*)`) — no new CSS. Subtask details panel uses `subtaskDetailsVariants` from the snippet for the smooth height transition.

## 2. Wire it into `partner.$partnerId.plan.tsx`

Right now actions are split into 3 columns (Planned / In Motion / Delivered). Replace the columns layout with a **single vertical AgentPlan list**, grouping by status visually inside each card via the status icon (the agent-plan card already conveys status, so columns become redundant).

Mapping:

- `ActionRow.status: "todo" | "doing" | "done"` → agent-plan `"todo" | "doing" | "done"`.
- We don't have subtasks in the DB. **Phase 1**: render tasks with `subtasks: []` (no subtask UI). The expandable area instead shows the action's `description`, due date, and (eventually) AI rationale.
- Filter bar (axis filter + Add Growth Initiative button) and `NewActionDialog` stay as-is.
- Delete + status cycling wire to existing `data.updateAction` / `data.deleteAction`.

The `Column` helper and old card markup are removed.

If you later want real subtasks, we'd add an `action_subtasks` table. Out of scope here unless you say so.

## 3. Header logo always points to `/`

In `src/routes/__root.tsx`, change:

```tsx
<Link to={user ? "/partners" : "/"} ...>
```
to:
```tsx
<Link to="/" ...>
```

So OCTA+ in the header always opens the landing page with the video, even for signed-in users.

## 4. Landing page cleanup — `src/routes/index.tsx`

In `<PrismaHero>` props:

- Remove the eyebrow chip → pass `eyebrow={null}` and update `prisma-hero.tsx` to skip rendering when `eyebrow` is falsy.
- Remove the description line → pass `description={null}` and skip rendering when falsy.
- Change the primary CTA label from `Sign in with Factorial` to `Sign in` (keep the arrow, keep the link to `/login`).
- The "New here? Create your account" secondary link stays.

Small tweak in `prisma-hero.tsx`:

```tsx
{eyebrow && <div className="...eyebrow chip..."><span ...>{eyebrow}</span></div>}
{description && <p className="...">{description}</p>}
```

Type changes: `eyebrow?: string | null`, `description?: string | null`.

## Files

- **create** `src/components/ui/agent-plan.tsx`
- **edit** `src/routes/partner.$partnerId.plan.tsx` (swap kanban columns for `<AgentPlan />`)
- **edit** `src/routes/__root.tsx` (header link → `/`)
- **edit** `src/routes/index.tsx` (drop eyebrow/description, rename CTA)
- **edit** `src/components/ui/prisma-hero.tsx` (allow nullable eyebrow + description)

## Out of scope

- Adding real subtasks to actions in the DB (needs a new table — say the word and we'll do it).
- Changing the kanban behavior on any other route.
- Touching login/signup pages (they don't mention Factorial today; only the landing CTA did).
