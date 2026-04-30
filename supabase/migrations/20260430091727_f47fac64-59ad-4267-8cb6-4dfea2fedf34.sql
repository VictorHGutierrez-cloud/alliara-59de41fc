-- 1) Add CRM fields to partner_leads
ALTER TABLE public.partner_leads
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS contact_role text,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS next_step_at date;

-- 2) Activity kind enum
DO $$ BEGIN
  CREATE TYPE public.lead_activity_kind AS ENUM ('task','call','email','meeting','note');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) partner_lead_activities table
CREATE TABLE IF NOT EXISTS public.partner_lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.partner_leads(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  kind public.lead_activity_kind NOT NULL DEFAULT 'task',
  title text NOT NULL,
  description text,
  due_date date,
  done boolean NOT NULL DEFAULT false,
  done_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_created
  ON public.partner_lead_activities (lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_activities_open_due
  ON public.partner_lead_activities (lead_id, done, due_date);

ALTER TABLE public.partner_lead_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners view own lead activities" ON public.partner_lead_activities;
CREATE POLICY "Owners view own lead activities"
  ON public.partner_lead_activities FOR SELECT
  USING (
    auth.uid() = owner_id
    OR private.has_role(auth.uid(), 'leadership'::app_role)
    OR private.has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Owners insert own lead activities" ON public.partner_lead_activities;
CREATE POLICY "Owners insert own lead activities"
  ON public.partner_lead_activities FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM public.partner_leads l
      WHERE l.id = partner_lead_activities.lead_id AND l.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners update own lead activities" ON public.partner_lead_activities;
CREATE POLICY "Owners update own lead activities"
  ON public.partner_lead_activities FOR UPDATE
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners delete own lead activities" ON public.partner_lead_activities;
CREATE POLICY "Owners delete own lead activities"
  ON public.partner_lead_activities FOR DELETE
  USING (auth.uid() = owner_id);

DROP TRIGGER IF EXISTS trg_lead_activities_updated_at ON public.partner_lead_activities;
CREATE TRIGGER trg_lead_activities_updated_at
  BEFORE UPDATE ON public.partner_lead_activities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4) Restrict signup to @factorial.co — defense in depth via handle_new_user trigger.
-- Raising here aborts the INSERT into auth.users in the same transaction.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  if lower(coalesce(new.email, '')) not like '%@factorial.co' then
    raise exception 'Only @factorial.co email addresses are allowed.'
      using errcode = '22023';
  end if;

  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$function$;