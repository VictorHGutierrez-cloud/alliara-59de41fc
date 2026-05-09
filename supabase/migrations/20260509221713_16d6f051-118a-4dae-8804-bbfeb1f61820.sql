-- 1. Enum for access status
DO $$ BEGIN
  CREATE TYPE public.access_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Column on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS access_status public.access_status NOT NULL DEFAULT 'pending';

-- 3. Backfill existing users as approved (don't lock anyone out)
UPDATE public.profiles SET access_status = 'approved' WHERE access_status = 'pending';

-- 4. Helper function
CREATE OR REPLACE FUNCTION public.is_approved(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND access_status = 'approved'
  )
$$;

-- 5. handle_new_user keeps creating the profile; default 'pending' applies automatically
-- (no change needed since column has default)

-- 6. Admin RLS for profiles (view + update any profile to approve/reject)
DROP POLICY IF EXISTS "Admins view all profiles for approval" ON public.profiles;
CREATE POLICY "Admins view all profiles for approval"
  ON public.profiles FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins update any profile" ON public.profiles;
CREATE POLICY "Admins update any profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
