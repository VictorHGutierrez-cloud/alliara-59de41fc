-- Allow leadership/admin to read every profile (needed for owner chips/filters)
CREATE POLICY "Leadership and admin view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  private.has_role(auth.uid(), 'leadership'::app_role)
  OR private.has_role(auth.uid(), 'admin'::app_role)
);

-- Roster function: returns all users with role pdm/leadership/admin.
-- Restricted to callers who are themselves pdm/leadership/admin.
CREATE OR REPLACE FUNCTION public.list_pdm_roster()
RETURNS TABLE (id uuid, display_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT p.id, COALESCE(p.display_name, '')
  FROM public.profiles p
  WHERE EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p.id
      AND ur.role IN ('pdm'::app_role, 'leadership'::app_role, 'admin'::app_role)
  )
  AND (
    private.has_role(auth.uid(), 'pdm'::app_role)
    OR private.has_role(auth.uid(), 'leadership'::app_role)
    OR private.has_role(auth.uid(), 'admin'::app_role)
  )
  ORDER BY p.display_name NULLS LAST;
$$;

REVOKE ALL ON FUNCTION public.list_pdm_roster() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_pdm_roster() TO authenticated;
