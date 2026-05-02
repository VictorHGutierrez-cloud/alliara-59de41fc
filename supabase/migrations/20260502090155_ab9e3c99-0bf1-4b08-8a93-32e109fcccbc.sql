-- partners: allow leadership/admin to update (including reassigning owner_id)
DROP POLICY IF EXISTS "PDMs update own partners" ON public.partners;

CREATE POLICY "PDMs update own or leadership updates all"
ON public.partners
FOR UPDATE
TO authenticated
USING (
  auth.uid() = owner_id
  OR private.has_role(auth.uid(), 'leadership'::app_role)
  OR private.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  auth.uid() = owner_id
  OR private.has_role(auth.uid(), 'leadership'::app_role)
  OR private.has_role(auth.uid(), 'admin'::app_role)
);

-- partner_leads: same pattern for leads
DROP POLICY IF EXISTS "Owners update own leads" ON public.partner_leads;

CREATE POLICY "Owners update own or leadership updates all"
ON public.partner_leads
FOR UPDATE
TO authenticated
USING (
  auth.uid() = owner_id
  OR private.has_role(auth.uid(), 'leadership'::app_role)
  OR private.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  auth.uid() = owner_id
  OR private.has_role(auth.uid(), 'leadership'::app_role)
  OR private.has_role(auth.uid(), 'admin'::app_role)
);