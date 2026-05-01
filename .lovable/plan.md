## Goal

Replace the current landing (`/`) with the **Prisma Hero** animated background, keeping the OCTA copy and CTAs in English. Remove the component's internal navbar (we already have a global header). Make the background gracefully degrade when no video URL is provided.

## What gets built

### 1. New component — `src/components/ui/prisma-hero.tsx`

Faithful port of the 21st.dev `prisma-hero` snippet, with two changes:

- **Navbar removed** — we already have the global `OCTA+` header in `__root.tsx`. Duplicating navigation is bad UX.
- **Video source is a prop with a CSS fallback** — Google Drive share URLs cannot be used as `<video src>` (Drive serves an HTML viewer, not the MP4, and blocks hotlinking). The component will accept an optional `videoSrc` prop. When omitted, it renders an animated **conic-gradient prismatic background** in pure CSS (no extra deps), so it never shows a black screen.

Exports kept identical to the source so the snippet stays compatible:
- `WordsPullUp`
- `WordsPullUpMultiStyle`
- `PrismaHero` (now accepts `{ videoSrc?, eyebrow?, headlineSegments?, description?, ctaLabel?, ctaHref? }`)

### 2. New dependency

- `framer-motion` — required by the snippet for the `WordsPullUp` animations.

### 3. Updated landing — `src/routes/index.tsx`

Render `<PrismaHero />` with OCTA-specific content (English, as requested):

- **Eyebrow chip**: `for Factorial PDMs`
- **Headline (multi-style, word-by-word pull-up)**:
  - "Orchestrate every partner" — light foreground
  - "like it's your only one." — accent (uses `--primary`)
- **Description**: "One operating system to diagnose, plan, and grow each partnership across 8 axes."
- **Primary CTA**: `Sign in with Factorial →` → `/login`
- **Secondary link below**: `New here? Create your account` → `/signup`

Both CTAs use TanStack `<Link>` (not raw `<a>`).

### 4. Layout adjustments

- The hero is full-bleed (`h-screen`, `w-screen`) and rendered under the sticky global header. We negate the header offset with `-mt-14` (already used in current index) so the prism fills the viewport behind the translucent `glass` header.
- `__root.tsx` already keeps the header transparent on `/` when signed-out (`isLanding && !user`), which is exactly what we want — no edits needed there.
- Footer is already hidden on `/` via `!isLanding` check — no edits needed.

### 5. Background behavior

Layered (back → front):
1. Animated conic-gradient base (always on) — uses OCTA palette tokens (`--octa-1` … `--octa-5`) rotating slowly via CSS `@keyframes`. Lives in `prisma-hero.tsx` as a styled div with inline `style` — no `styles.css` edits needed (uses Tailwind arbitrary values + a tiny inline `<style>` tag inside the component for the keyframe).
2. Optional `<video>` (only if `videoSrc` prop given) — `autoplay muted loop playsinline`, `object-cover`.
3. Noise overlay — SVG data-URI, `mix-blend-overlay`, ~6% opacity.
4. Gradient vignette — radial dark fade from edges so text stays readable.

### 6. Video URL (Drive caveat)

The Drive link you sent (`drive.google.com/file/d/1_ASoxBPm…/view`) won't play in a `<video>` tag. To plug in a real video later, host the MP4 on one of:
- Supabase Storage (already wired in this project)
- Cloudflare R2
- Cloudinary

Then pass it: `<PrismaHero videoSrc="https://…/prisma.mp4" />`. Until then, the CSS prism fallback renders.

## Files

- **create** `src/components/ui/prisma-hero.tsx`
- **edit** `src/routes/index.tsx` (replace current `Landing` body with `<PrismaHero …/>`; remove the `OctaMark` octagon and `AXES` import since the prism replaces the right-side visual)
- **dependency** `bun add framer-motion`

## Out of scope

- Hosting/uploading the MP4 (need a public URL; Drive won't work).
- Touching auth, partners, qualification, or any other route.
- Changing the global header or footer.
