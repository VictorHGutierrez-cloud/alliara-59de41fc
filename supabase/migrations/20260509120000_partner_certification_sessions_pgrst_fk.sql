-- Reload PostgREST schema cache so partner_certification_sessions is visible to the API
-- (avoids "Could not find the table ... in the schema cache" after the first migration).
NOTIFY pgrst, 'reload schema';

-- completed_by: reference public.profiles(id) like other app-facing user FKs
-- (profiles are created on signup; matches auth user id).
ALTER TABLE public.partner_certification_sessions
  DROP CONSTRAINT IF EXISTS partner_certification_sessions_completed_by_fkey;

ALTER TABLE public.partner_certification_sessions
  ADD CONSTRAINT partner_certification_sessions_completed_by_fkey
  FOREIGN KEY (completed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
