-- Create partner_type enum and add to partners + partner_leads
CREATE TYPE public.partner_type AS ENUM ('referral', 'reseller', 'expert');

ALTER TABLE public.partners
  ADD COLUMN partner_type public.partner_type NOT NULL DEFAULT 'referral';

ALTER TABLE public.partner_leads
  ADD COLUMN partner_type public.partner_type;