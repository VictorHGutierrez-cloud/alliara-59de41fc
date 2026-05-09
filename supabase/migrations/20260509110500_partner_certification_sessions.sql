-- Per-partner Expert program session checklist (1..5).
-- One row per session number once the PDM marks it complete.

CREATE TABLE public.partner_certification_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  session_number int NOT NULL CHECK (session_number BETWEEN 1 AND 5),
  completed_at timestamptz NOT NULL DEFAULT now(),
  completed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partner_id, session_number)
);

ALTER TABLE public.partner_certification_sessions ENABLE ROW LEVEL SECURITY;

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

CREATE TRIGGER set_updated_at_partner_certification_sessions
BEFORE UPDATE ON public.partner_certification_sessions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Ask PostgREST to pick up this table immediately (avoids PGRST205 schema cache errors).
NOTIFY pgrst, 'reload schema';
