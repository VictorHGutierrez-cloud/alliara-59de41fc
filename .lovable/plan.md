## Goals

Four changes:

1. **Rename the app** — drop "OCTA+" for something better (need your pick).
2. **Reuse the `AgentPlan` task layout on the landing page** — show a small live demo of the task system below the hero so visitors immediately see the product.
3. **Apply the "Candy" theme to `My Performance`** — pinks, sky blue, yellow accents, Poppins font, scoped to that route only (won't pollute the rest of the app).
4. **Add the `TiltCard` 3D hover effect to partner cards on `/partners`** — spotlight + tilt-on-hover wrapper around each `PartnerCard`.

---

## 1. App name

I want you to pick. A few options I'd suggest, all in a similar register (operator-y, partnership-flavored, short):

- **Conduit** — "the channel between you and every partner"
- **Lattice** — structural, 8-axes vibe
- **Prism** — the hero video already is one; ties branding to the asset
- **Orbit** — partners orbiting the PDM
- **Keystone** — the load-bearing piece of the partnership
- **Anchor / Tether / Beacon** — relationship-led
- **Polaris** — north-star for PDMs

I'll ask you to pick (or write your own) before applying. The rename touches: header logo text, page `<title>`s ("OCTA+", "OCTA OS"), 404 page, footer, og/twitter meta in `__root.tsx`.

## 2. Tasks on the landing page

Below the hero (after the video viewport), add a new section "See it in motion" that renders `<AgentPlan />` with **3 hard-coded sample tasks** (no DB, no auth needed) so unauthenticated visitors can see the live status-cycling + expandable subtasks behavior. Sample data:

- **Recruit 2 new ISVs in DACH** · axis Recruit · high · 2 subtasks · `doing`
- **Launch co-marketing webinar with Acme** · axis Co-sell · medium · 3 subtasks · `todo`
- **Close enablement gap on integration certification** · axis Enable · high · 2 subtasks · `done`

`onCycleStatus` will use local `useState` so visitors can click status icons and see the animation. No persistence.

Edit: `src/routes/index.tsx` only.

## 3. Candy theme on `My Performance`

Scope-limited so it doesn't break the rest of the app:

- Add a new CSS class `.theme-candy` in `src/styles.css` that overrides `--background`, `--card`, `--primary`, `--secondary`, `--accent`, `--border`, `--ring`, `--muted`, `--foreground`, `--card-foreground`, `--muted-foreground`, `--destructive`, chart colors, and `--radius` with the values from your snippet (light variant only — we don't ship dark mode yet).
- Load Poppins + Roboto Mono fonts in `__root.tsx` `head().links` (already loading Inter/Space Grotesk/JetBrains Mono — just append).
- In `src/routes/dashboard.tsx`, wrap the outermost `<div className="mx-auto max-w-7xl …">` in a parent `<div className="theme-candy min-h-screen" style={{ fontFamily: "Poppins, sans-serif" }}>` so the variables and font apply only inside My Performance.
- Update the page `<title>` to match the new app name from step 1.

Result: pastel pink primary buttons, sky-blue secondary, yellow accent, white cards, soft gray border — only on `/dashboard`. Rest of the app stays "Calm Command".

## 4. Tilt cards on `/partners`

- **Create** `src/components/ui/tilt-card.tsx` — port your snippet exactly. `"use client"` directive can stay (no-op in TanStack but harmless). Spotlight uses a CSS radial gradient overlay positioned by `--x` / `--y` CSS vars.
- In `src/routes/partners.tsx` around line 558, wrap each `<PartnerCard … />` inside the roster grid with `<TiltCard tiltLimit={8} scale={1.02} effect="evade" spotlight>`. Smaller tilt than the demo so the grid doesn't get nauseating with 12+ cards.
- The `PartnerCard` itself stays unchanged — `TiltCard` is a presentational wrapper.

## Files

- **edit** `src/routes/index.tsx` — sample tasks section
- **edit** `src/routes/dashboard.tsx` — wrap in `theme-candy`
- **edit** `src/routes/partners.tsx` — wrap cards in `<TiltCard>`
- **edit** `src/routes/__root.tsx` — rename, load Poppins
- **edit** `src/styles.css` — add `.theme-candy` block
- **create** `src/components/ui/tilt-card.tsx`
- **edit** any other file with the literal "OCTA+" / "OCTA OS" once name is chosen (head titles in route files)

## Out of scope

- Dark variant of the candy theme (no dark mode in the app today).
- Re-skinning `/partners`, `/qualification`, etc. with candy — only `My Performance` per your ask.
- Persisting status changes from the landing demo tasks.

---

## Need from you before I start

**Pick the new app name.** Once you say the word (or give me your own), I'll apply all 4 changes in one pass.
