DROP POLICY IF EXISTS "Delete recommendations on own partners" ON public.ai_recommendations;

CREATE POLICY "Delete recommendations on accessible partners"
ON public.ai_recommendations
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.partners p
    WHERE p.id = ai_recommendations.partner_id
      AND (
        p.owner_id = auth.uid()
        OR private.has_role(auth.uid(), 'leadership'::app_role)
        OR private.has_role(auth.uid(), 'admin'::app_role)
      )
  )
);