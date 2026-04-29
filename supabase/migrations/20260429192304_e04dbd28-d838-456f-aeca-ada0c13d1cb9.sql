-- Enum for lead status
CREATE TYPE public.partner_lead_status AS ENUM ('new', 'in_review', 'approved', 'rejected');

-- Table
CREATE TABLE public.partner_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  company_name text NOT NULL,
  contact_person text,
  website text,
  status public.partner_lead_status NOT NULL DEFAULT 'new',
  sales_score smallint CHECK (sales_score IS NULL OR sales_score BETWEEN 1 AND 3),
  expertise_score smallint CHECK (expertise_score IS NULL OR expertise_score BETWEEN 1 AND 3),
  fit_score smallint CHECK (fit_score IS NULL OR fit_score BETWEEN 1 AND 3),
  total_score smallint,
  notes text,
  promoted_partner_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own leads or leadership views all"
  ON public.partner_leads FOR SELECT
  USING (
    auth.uid() = owner_id
    OR private.has_role(auth.uid(), 'leadership'::app_role)
    OR private.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Owners insert own leads"
  ON public.partner_leads FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners update own leads"
  ON public.partner_leads FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners delete own leads"
  ON public.partner_leads FOR DELETE
  USING (auth.uid() = owner_id);

CREATE TRIGGER set_partner_leads_updated_at
  BEFORE UPDATE ON public.partner_leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_partner_leads_owner ON public.partner_leads(owner_id);
CREATE INDEX idx_partner_leads_status ON public.partner_leads(status);