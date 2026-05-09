-- Run this once in Supabase → SQL Editor (as project owner) if the app shows:
-- PGRST205: Could not find the table 'public.partner_certification_sessions' in the schema cache
--
-- Safe to run more than once (idempotent policies / trigger).

CREATE TABLE IF NOT EXISTS public.partner_certification_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  session_number int NOT NULL CHECK (session_number BETWEEN 1 AND 5),
  completed_at timestamptz NOT NULL DEFAULT now(),
  completed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partner_id, session_number)
);

ALTER TABLE public.partner_certification_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View certification sessions for accessible partners" ON public.partner_certification_sessions;
DROP POLICY IF EXISTS "Insert certification sessions on own/leadership partners" ON public.partner_certification_sessions;
DROP POLICY IF EXISTS "Update certification sessions on own/leadership partners" ON public.partner_certification_sessions;
DROP POLICY IF EXISTS "Delete certification sessions on own/leadership partners" ON public.partner_certification_sessions;

CREATE POLICY "View certification sessions for accessible partners"
ON public.partner_certification_sessions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.partners p
  WHERE p.id = partner_certification_sessions.partner_id
    AND (
      p.owner_id = auth.uid()
      OR private.has_role(auth.uid(), 'leadership'::app_role)
      OR private.has_role(auth.uid(), 'admin'::app_role)
    )
));

CREATE POLICY "Insert certification sessions on own/leadership partners"
ON public.partner_certification_sessions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.partners p
    WHERE p.id = partner_certification_sessions.partner_id
      AND (
        p.owner_id = auth.uid()
        OR private.has_role(auth.uid(), 'leadership'::app_role)
        OR private.has_role(auth.uid(), 'admin'::app_role)
      )
  )
);

CREATE POLICY "Update certification sessions on own/leadership partners"
ON public.partner_certification_sessions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.partners p
    WHERE p.id = partner_certification_sessions.partner_id
      AND (
        p.owner_id = auth.uid()
        OR private.has_role(auth.uid(), 'leadership'::app_role)
        OR private.has_role(auth.uid(), 'admin'::app_role)
      )
  )
);

CREATE POLICY "Delete certification sessions on own/leadership partners"
ON public.partner_certification_sessions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.partners p
    WHERE p.id = partner_certification_sessions.partner_id
      AND (
        p.owner_id = auth.uid()
        OR private.has_role(auth.uid(), 'leadership'::app_role)
        OR private.has_role(auth.uid(), 'admin'::app_role)
      )
  )
);

DROP TRIGGER IF EXISTS set_updated_at_partner_certification_sessions ON public.partner_certification_sessions;
CREATE TRIGGER set_updated_at_partner_certification_sessions
BEFORE UPDATE ON public.partner_certification_sessions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Swap FK to profiles if an older version referenced auth.users only.
ALTER TABLE public.partner_certification_sessions
  DROP CONSTRAINT IF EXISTS partner_certification_sessions_completed_by_fkey;
ALTER TABLE public.partner_certification_sessions
  ADD CONSTRAINT partner_certification_sessions_completed_by_fkey
  FOREIGN KEY (completed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

NOTIFY pgrst, 'reload schema';
