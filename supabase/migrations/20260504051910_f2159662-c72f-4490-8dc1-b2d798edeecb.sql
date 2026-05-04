-- Promote Victor to admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('df86a49b-9a3c-4433-af5f-2f57c50c66f2', 'admin')
ON CONFLICT DO NOTHING;

-- Allow leadership/admin to insert assessments for any partner
DROP POLICY IF EXISTS "Users insert own assessments" ON public.assessments;
CREATE POLICY "Insert assessments (own or leadership)"
ON public.assessments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    partner_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.partners p
      WHERE p.id = assessments.partner_id
        AND (
          p.owner_id = auth.uid()
          OR private.has_role(auth.uid(), 'leadership'::app_role)
          OR private.has_role(auth.uid(), 'admin'::app_role)
        )
    )
  )
);

-- Allow leadership/admin to delete assessments for governance/cleanup
DROP POLICY IF EXISTS "Users delete own assessments" ON public.assessments;
CREATE POLICY "Delete assessments (own or leadership)"
ON public.assessments
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  OR (
    partner_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.partners p
      WHERE p.id = assessments.partner_id
        AND (
          private.has_role(auth.uid(), 'leadership'::app_role)
          OR private.has_role(auth.uid(), 'admin'::app_role)
        )
    )
  )
);