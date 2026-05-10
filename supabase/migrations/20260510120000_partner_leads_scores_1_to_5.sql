-- Allow scorecard values 1–5 per dimension (was 1–3). Max total 25 for five dimensions.

ALTER TABLE public.partner_leads
  DROP CONSTRAINT IF EXISTS partner_leads_sales_score_check,
  DROP CONSTRAINT IF EXISTS partner_leads_expertise_score_check,
  DROP CONSTRAINT IF EXISTS partner_leads_fit_score_check;

ALTER TABLE public.partner_leads
  ADD CONSTRAINT partner_leads_sales_score_check
    CHECK (sales_score IS NULL OR sales_score BETWEEN 1 AND 5);

ALTER TABLE public.partner_leads
  ADD CONSTRAINT partner_leads_expertise_score_check
    CHECK (expertise_score IS NULL OR expertise_score BETWEEN 1 AND 5);

ALTER TABLE public.partner_leads
  ADD CONSTRAINT partner_leads_fit_score_check
    CHECK (fit_score IS NULL OR fit_score BETWEEN 1 AND 5);
