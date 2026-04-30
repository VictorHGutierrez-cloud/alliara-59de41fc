
# Landing redesign — "Calm Command"

The current landing is dark, generic, and gives the brain nothing to anchor on: a gradient title and two equal-weight buttons. We'll redesign `/` (the entry screen) using principles from cognitive load theory, Gestalt grouping, and Hick's law. The rest of the app stays dark — only the public landing changes, so the user reverts easily if they don't like it.

## Design hypothesis

Three anthropological / perceptual principles drive the redesign:

1. **Biophilic warmth → trust.** Warm off-whites and a single deep accent feel like paper and ink, not a dashboard. Lower cortisol on first contact = higher signup intent (Ulrich, restorative environments).
2. **One focal point → action.** Hick's law: every extra choice adds latency. We collapse to **one primary CTA** ("Sign in with Factorial") with the secondary path ("Create account") demoted to a text link below.
3. **Show the mental model, don't describe it.** Instead of marketing copy, render a small living **OCTA octagon** — 8 axis dots arranged radially, one labeled per side. The user *sees* the product's structure in 2 seconds (picture-superiority effect).

## What changes

### Only `/` (the public landing)
- Stays a single-screen entry; no scroll, no marketing fluff.
- The app screens (`/partners`, `/qualification`, etc.) keep their dark "operator" aesthetic — context shift between "public" and "inside" is intentional and reinforces the "you've entered the cockpit" feeling.

### New layout

```text
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   ●  OCTA OS                              for Factorial PDMs │
│                                                              │
│                                                              │
│        Orchestrate every partner                             │
│        like it's your only one.                              │
│                                                              │
│        One operating system to diagnose, plan,               │
│        and grow each partnership across 8 axes.              │
│                                                              │
│        [ Sign in with Factorial → ]                          │
│                                                              │
│        New here? Create your account                         │
│                                                              │
│                                          ┌────────────┐      │
│                                          │  S    O    │      │
│                                          │ X  ◉  R    │      │
│                                          │  G    E    │      │
│                                          │   T  C     │      │
│                                          └────────────┘      │
│                                            the OCTA model    │
└──────────────────────────────────────────────────────────────┘
```

Two-column on desktop (text left, octagon right), stacked on mobile with the octagon below the CTA.

### Palette (landing only)

| Token | Value | Role |
|---|---|---|
| Background | warm off-white `oklch(0.985 0.008 85)` | calm canvas |
| Ink | near-black slate `oklch(0.18 0.02 260)` | high-contrast type |
| Accent | one deep emerald `oklch(0.52 0.16 160)` | CTA + axis nodes |
| Muted | warm grey `oklch(0.55 0.01 80)` | secondary copy |
| Hairlines | `oklch(0.92 0.005 80)` | structure without noise |

Why this works: warm light backgrounds reduce perceived screen "alarm" vs. dark UI on first contact. The single saturated accent obeys the **60-30-10 rule** (60% canvas, 30% ink, 10% accent), so the eye lands on the CTA without thinking.

### Typography hierarchy

- **Headline** (Space Grotesk, 56px, -2% tracking, weight 600): "Orchestrate every partner like it's your only one."
- **Sub** (Inter, 17px, line-height 1.55, muted): one sentence, no jargon.
- **CTA** (Inter, 15px, semibold, ink-on-emerald, generous 14px×24px padding, soft 12px radius).
- **Secondary link** (Inter, 14px, underline-on-hover, muted).

### The OCTA octagon (the visual hook)

A small SVG octagon (~220px) with 8 dots positioned radially, each labeled with an axis letter (S O R E C T G X) using the existing axis colors from `src/content/octa.ts` and `--octa-1..8` tokens. A subtle pulse animation rotates a soft glow around the perimeter every 8 seconds — implies "always on, always orchestrating" without being distracting. Pure decorative SVG; no interactivity needed for v1.

### Microcopy rewrite

| Old | New | Rationale |
|---|---|---|
| "OCTA OS" (gradient) | "OCTA OS" + tagline "for Factorial PDMs" | Specificity beats grandeur. Reduces "is this for me?" friction. |
| "The command center for Partner Development Managers. Sign in to manage your portfolio." | "Orchestrate every partner like it's your only one." (headline) + "One operating system to diagnose, plan, and grow each partnership across 8 axes." (sub) | Concrete verb + emotional anchor. The sub tells you what the system actually does. |
| Two buttons same weight | One emerald CTA + tiny secondary link | Hick's law. |

### Header simplification on `/`

The current sticky `glass` header shows "Sign in / Get started" — duplicates the page CTA. On the landing route only, we'll hide those buttons (the page itself is the CTA), keeping just the OCTA wordmark. Less competing focal points = faster click.

## Technical details

- Edit `src/routes/index.tsx`: replace the entire component with the new two-column layout and inline the warm palette via a wrapping `<div>` that sets local CSS custom properties (no global token changes — the rest of the app stays dark).
- Inline SVG octagon component inside the same file (no new dependency); reuse axis letters/colors imported from `src/content/octa.ts` (`AXES`).
- Edit `src/routes/__root.tsx`: in `AppFrame`, when `path === "/"` and there is no user, render the header without the Sign in / Get started buttons (keep the wordmark only). No other route is affected.
- No database, RLS, edge function, or auth changes.
- No new packages.

## Out of scope (intentionally)

- App-internal screens stay dark. We're testing the hypothesis on the public landing first; if you love it, we replicate the warmth into `/login` and `/signup` next, then evaluate softening `/partners`.
- No marketing sections, testimonials, feature grids, or scroll. The landing is a door, not a brochure.

## Reversibility

One file change (`src/routes/index.tsx`) plus a 4-line conditional in `__root.tsx`. Reverting is one message: "undo landing redesign."
