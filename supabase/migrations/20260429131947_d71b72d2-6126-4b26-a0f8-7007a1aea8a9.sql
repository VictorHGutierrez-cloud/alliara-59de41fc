CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated;

CREATE OR REPLACE FUNCTION private.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(_user_id = auth.uid(), false)
    AND EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id
        AND role = _role
    )
$$;

GRANT EXECUTE ON FUNCTION private.has_role(UUID, public.app_role) TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM anon, authenticated, PUBLIC;

ALTER POLICY "Users view own roles"
  ON public.user_roles
  USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "PDMs view own partners or leadership views all"
  ON public.partners
  USING (
    auth.uid() = owner_id
    OR private.has_role(auth.uid(), 'leadership'::public.app_role)
    OR private.has_role(auth.uid(), 'admin'::public.app_role)
  );

ALTER POLICY "Leadership views all partner assessments"
  ON public.assessments
  USING (
    partner_id IS NOT NULL AND (
      private.has_role(auth.uid(), 'leadership'::public.app_role)
      OR private.has_role(auth.uid(), 'admin'::public.app_role)
    )
  );

ALTER POLICY "View action plans for accessible partners"
  ON public.action_plans
  USING (
    EXISTS (
      SELECT 1 FROM public.partners p
      WHERE p.id = action_plans.partner_id
        AND (
          p.owner_id = auth.uid()
          OR private.has_role(auth.uid(), 'leadership'::public.app_role)
          OR private.has_role(auth.uid(), 'admin'::public.app_role)
        )
    )
  );

ALTER POLICY "View recommendations for accessible partners"
  ON public.ai_recommendations
  USING (
    EXISTS (
      SELECT 1 FROM public.partners p
      WHERE p.id = ai_recommendations.partner_id
        AND (
          p.owner_id = auth.uid()
          OR private.has_role(auth.uid(), 'leadership'::public.app_role)
          OR private.has_role(auth.uid(), 'admin'::public.app_role)
        )
    )
  );

NOTIFY pgrst, 'reload schema';