# Candy UI pass + Partners fixes

Five focused changes. The biggest one is making "Candy" the real button language across the product — not just a theme name in CSS.

---

## 1. PDM filter shows the full roster (not just PDMs with partners)

**Problem:** On `/partners`, the `PDM:` dropdown is built from `ownersInScope`, which only lists PDMs who already own at least one partner currently in view. So if Jack/Leon/Nicholas/Victor have no partners (or are filtered out), they disappear from the dropdown.

**Fix:** Source the dropdown from `usePdmRoster()` (already imported) instead of `ownersInScope`. Keep the count next to "All" honest:

```text
PDM: All (4)        ← all roster PDMs
PDM: Jack Carey     ← always shown, even if 0 partners
PDM: Leon Ribeiro Alves
PDM: Nicholas Mahon
PDM: Victor Gutierrez
```

Sort alphabetically, fall back to `ownersInScope` only if the roster RPC returns empty.

---

## 2. Candy button system (applied everywhere)

Create one shared button language so every control in the app feels the same. Add to `src/styles.css` under `@layer components`:

- `.btn-candy` — pastel pink primary CTA: `bg-[--primary]`, `text-[--primary-foreground]`, rounded-xl, soft pink shadow, `hover:-translate-y-0.5`, focus ring.
- `.btn-candy-secondary` — sky-blue secondary using `--secondary`.
- `.btn-candy-ghost` — transparent with pink hover bg, for low-emphasis actions.
- `.seg-candy` / `.seg-candy-item` — segmented-control pill (used for "My partners / All partners", "All types / Referral / Reseller / Expert"). Active item: white surface + soft pink ring; inactive: muted text.
- `.select-candy` — selects (PDM filter, Sort) restyled to match: rounded-xl, white surface, pink focus ring, custom chevron.

Then apply across the Partners page (`src/routes/partners.tsx`):

- **`+ Add partner`** → `.btn-candy`
- **My partners / All partners** toggle → `.seg-candy`
- **PDM: …** dropdown → `.select-candy`
- **All types / Referral / Reseller / Expert** (in `PartnerFilterBar`) → `.seg-candy`
- **Sort: …** select → `.select-candy`
- **Clear filter / quick action chips** at the top of Health Snapshot → `.btn-candy-ghost`
- **Bulk action bar** buttons (reassign, change tier, delete) → `.btn-candy-secondary` / destructive variant

Also retouch `src/components/PartnerFilterBar.tsx` to use the new classes (one source of truth for the filter row).

---

## 3. Hero CTAs in Candy format

In `src/routes/index.tsx` (`<PrismaHero>` block):

- **Sign in** primary button → `.btn-candy` (pastel pink, rounded-xl, glow). Keeps the arrow.
- **Create your account** secondary → `.btn-candy-secondary` so it's a real button, not a text link.
- Drop the white-on-white rectangle look; both buttons sit side-by-side at the bottom-left of the video.

Also apply the same Candy buttons to the **Final CTA** section so the homepage is consistent end-to-end.

---

## 4. KPI rename: "Partner-sourced pipeline" → "Total Open MRR"

In `src/routes/partners.tsx`:

- Replace the `sourcedPipeline` calculation with a real **open MRR** sum:
  - `total = Σ revenueMap.get(id).mrr` over visible partners
  - `withMetrics = count of partners where mrr > 0`
- Update the `KpiCard`:
  - **label**: `Total Open MRR`
  - **value**: `fmtMoney(totalOpenMrr)` (or `—` if 0)
  - **hint**: `${withMetrics} partner${s} reporting MRR` / `Add MRR on a partner page to populate`

---

## 5. "Status snapshot" → simpler language

In the Portfolio Health card:

- Eyebrow `Portfolio Health` → **`How your partners are doing`**
- Title `Status snapshot` → **`Right now`**
- (Optional) Tweak the three badges to match the simpler tone: `Scaling` / `Developing` / `Churn Risk` stay (already plain English).

---

## Files touched

- `src/styles.css` — add `.btn-candy`, `.btn-candy-secondary`, `.btn-candy-ghost`, `.seg-candy*`, `.select-candy`.
- `src/routes/partners.tsx` — PDM roster source, KPI swap, header copy, button classes.
- `src/components/PartnerFilterBar.tsx` — use `.seg-candy` / `.select-candy`.
- `src/routes/index.tsx` — hero + final CTA buttons in Candy.

No DB changes, no new dependencies.