DROP POLICY IF EXISTS "PDMs insert own partners" ON public.partners;

CREATE POLICY "PDMs insert own or leadership inserts any"
ON public.partners
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = owner_id
  OR private.has_role(auth.uid(), 'leadership'::app_role)
  OR private.has_role(auth.uid(), 'admin'::app_role)
);