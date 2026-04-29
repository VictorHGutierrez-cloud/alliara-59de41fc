
-- 1. Roles system (separate table to avoid privilege escalation)
CREATE TYPE public.app_role AS ENUM ('pdm', 'leadership', 'admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Auto-assign 'pdm' role on signup
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'pdm')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_default_role();

-- Backfill role for existing users
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'pdm'::app_role FROM auth.users
ON CONFLICT DO NOTHING;

-- 2. Partners table
CREATE TYPE public.partner_tier AS ENUM ('strategic', 'core', 'emerging', 'long_tail');
CREATE TYPE public.partner_status AS ENUM ('active', 'nurturing', 'at_risk', 'paused', 'archived');

CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  segment TEXT,
  tier partner_tier NOT NULL DEFAULT 'emerging',
  status partner_status NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_partners_owner ON public.partners(owner_id);

CREATE POLICY "PDMs view own partners or leadership views all"
  ON public.partners FOR SELECT
  USING (
    auth.uid() = owner_id
    OR public.has_role(auth.uid(), 'leadership')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "PDMs insert own partners"
  ON public.partners FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "PDMs update own partners"
  ON public.partners FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "PDMs delete own partners"
  ON public.partners FOR DELETE
  USING (auth.uid() = owner_id);

CREATE TRIGGER set_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Add partner_id to assessments (nullable for legacy rows)
ALTER TABLE public.assessments
  ADD COLUMN partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE;

CREATE INDEX idx_assessments_partner ON public.assessments(partner_id);

-- Allow leadership to see all partner-scoped assessments
CREATE POLICY "Leadership views all partner assessments"
  ON public.assessments FOR SELECT
  USING (
    partner_id IS NOT NULL AND (
      public.has_role(auth.uid(), 'leadership')
      OR public.has_role(auth.uid(), 'admin')
    )
  );

-- 4. Action Plans
CREATE TYPE public.action_status AS ENUM ('todo', 'doing', 'done');
CREATE TYPE public.action_priority AS ENUM ('low', 'medium', 'high');

CREATE TABLE public.action_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  axis_key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status action_status NOT NULL DEFAULT 'todo',
  priority action_priority NOT NULL DEFAULT 'medium',
  target_level INTEGER CHECK (target_level BETWEEN 1 AND 5),
  due_date DATE,
  source TEXT NOT NULL DEFAULT 'manual', -- 'manual' | 'ai'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.action_plans ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_action_plans_partner ON public.action_plans(partner_id);
CREATE INDEX idx_action_plans_axis ON public.action_plans(partner_id, axis_key);

CREATE POLICY "View action plans for accessible partners"
  ON public.action_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.partners p
      WHERE p.id = action_plans.partner_id
        AND (
          p.owner_id = auth.uid()
          OR public.has_role(auth.uid(), 'leadership')
          OR public.has_role(auth.uid(), 'admin')
        )
    )
  );

CREATE POLICY "Insert action plans on own partners"
  ON public.action_plans FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.partners p
      WHERE p.id = partner_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Update action plans on own partners"
  ON public.action_plans FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.partners p
      WHERE p.id = action_plans.partner_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Delete action plans on own partners"
  ON public.action_plans FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.partners p
      WHERE p.id = action_plans.partner_id AND p.owner_id = auth.uid()
    )
  );

CREATE TRIGGER set_action_plans_updated_at
  BEFORE UPDATE ON public.action_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. AI Recommendations cache
CREATE TABLE public.ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  axis_key TEXT, -- nullable = overall recommendation
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE SET NULL,
  content JSONB NOT NULL,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_ai_rec_partner ON public.ai_recommendations(partner_id, axis_key);

CREATE POLICY "View recommendations for accessible partners"
  ON public.ai_recommendations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.partners p
      WHERE p.id = ai_recommendations.partner_id
        AND (
          p.owner_id = auth.uid()
          OR public.has_role(auth.uid(), 'leadership')
          OR public.has_role(auth.uid(), 'admin')
        )
    )
  );

CREATE POLICY "Insert recommendations on own partners"
  ON public.ai_recommendations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.partners p
      WHERE p.id = partner_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Delete recommendations on own partners"
  ON public.ai_recommendations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.partners p
      WHERE p.id = ai_recommendations.partner_id AND p.owner_id = auth.uid()
    )
  );
