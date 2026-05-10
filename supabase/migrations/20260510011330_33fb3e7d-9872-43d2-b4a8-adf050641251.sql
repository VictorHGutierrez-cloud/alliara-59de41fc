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