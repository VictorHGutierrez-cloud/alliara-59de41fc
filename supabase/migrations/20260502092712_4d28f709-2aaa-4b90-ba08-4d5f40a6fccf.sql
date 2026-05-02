-- 1. Heal orphaned references
UPDATE public.partner_leads
SET promoted_partner_id = NULL,
    status = CASE WHEN status = 'approved' THEN 'in_review'::partner_lead_status ELSE status END
WHERE promoted_partner_id IS NOT NULL
  AND promoted_partner_id NOT IN (SELECT id FROM public.partners);

-- 2. Add FK with ON DELETE SET NULL to prevent recurrence
ALTER TABLE public.partner_leads
  ADD CONSTRAINT partner_leads_promoted_partner_id_fkey
  FOREIGN KEY (promoted_partner_id)
  REFERENCES public.partners(id)
  ON DELETE SET NULL;