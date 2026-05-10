## Problem

The `partner_leads` table has check constraints from the old 3-level scorecard:

- `sales_score` BETWEEN 1 AND 3
- `expertise_score` BETWEEN 1 AND 3
- `fit_score` BETWEEN 1 AND 3

The app's current 5-dimension scorecard writes values 1–5 (`ScoreLevel = 1|2|3|4|5`). Any rating of 4 or 5 throws:

> new row for relation "partner_leads" violates check constraint "partner_leads_sales_score_check"

## Fix (migration only — no app code changes)

Drop the three old check constraints and recreate them with the 1–5 range:

```sql
alter table public.partner_leads
  drop constraint if exists partner_leads_sales_score_check,
  drop constraint if exists partner_leads_expertise_score_check,
  drop constraint if exists partner_leads_fit_score_check;

alter table public.partner_leads
  add constraint partner_leads_sales_score_check
    check (sales_score is null or (sales_score between 1 and 5)),
  add constraint partner_leads_expertise_score_check
    check (expertise_score is null or (expertise_score between 1 and 5)),
  add constraint partner_leads_fit_score_check
    check (fit_score is null or (fit_score between 1 and 5));
```

`total_score` (smallint) already fits the new max (5×5 = 25), so no change needed there. No frontend changes required — `setDimension` already sends 1–5.

## Verification

After the migration, rating any dimension as 4 or 5 in `/qualification` saves without error.