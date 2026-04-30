CREATE TYPE public.stakeholder_role AS ENUM ('ceo', 'it', 'ae', 'marketing', 'other');

CREATE TABLE public.partner_stakeholders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  email text,
  position text,
  role public.stakeholder_role NOT NULL DEFAULT 'other',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_stakeholders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View stakeholders for accessible partners"
ON public.partner_stakeholders FOR SELECT
USING (EXISTS (SELECT 1 FROM partners p WHERE p.id = partner_stakeholders.partner_id
  AND (p.owner_id = auth.uid() OR private.has_role(auth.uid(), 'leadership'::app_role) OR private.has_role(auth.uid(), 'admin'::app_role))));

CREATE POLICY "Insert stakeholders on own partners"
ON public.partner_stakeholders FOR INSERT
WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM partners p WHERE p.id = partner_stakeholders.partner_id AND p.owner_id = auth.uid()));

CREATE POLICY "Update stakeholders on own partners"
ON public.partner_stakeholders FOR UPDATE
USING (EXISTS (SELECT 1 FROM partners p WHERE p.id = partner_stakeholders.partner_id AND p.owner_id = auth.uid()));

CREATE POLICY "Delete stakeholders on own partners"
ON public.partner_stakeholders FOR DELETE
USING (EXISTS (SELECT 1 FROM partners p WHERE p.id = partner_stakeholders.partner_id AND p.owner_id = auth.uid()));

CREATE TRIGGER set_updated_at_stakeholders
BEFORE UPDATE ON public.partner_stakeholders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.partner_metrics
  ADD COLUMN IF NOT EXISTS mrr numeric,
  ADD COLUMN IF NOT EXISTS deals_open_value numeric,
  ADD COLUMN IF NOT EXISTS deals_won_value numeric;