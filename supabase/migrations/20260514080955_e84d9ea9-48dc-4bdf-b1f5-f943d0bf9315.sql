
-- Add HubSpot company link to partners
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS hubspot_company_id BIGINT;

CREATE INDEX IF NOT EXISTS idx_partners_hubspot_company
  ON public.partners(owner_id, hubspot_company_id)
  WHERE hubspot_company_id IS NOT NULL;

-- Connection (one per user; Private App or OAuth)
CREATE TABLE IF NOT EXISTS public.hubspot_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  portal_id BIGINT NOT NULL DEFAULT 0,
  hub_domain TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL DEFAULT 'private-app',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '365 days'),
  scopes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.hubspot_connections ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_hubspot_connections_user ON public.hubspot_connections(user_id);

DROP POLICY IF EXISTS "Users read own HubSpot connection" ON public.hubspot_connections;
CREATE POLICY "Users read own HubSpot connection"
  ON public.hubspot_connections FOR SELECT
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS set_hubspot_connections_updated_at ON public.hubspot_connections;
CREATE TRIGGER set_hubspot_connections_updated_at
  BEFORE UPDATE ON public.hubspot_connections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- OAuth CSRF state (kept for OAuth path; harmless under Private App)
CREATE TABLE IF NOT EXISTS public.hubspot_oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hubspot_oauth_states ENABLE ROW LEVEL SECURITY;

-- Cached CRM companies
CREATE TABLE IF NOT EXISTS public.hubspot_company_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.hubspot_connections(id) ON DELETE CASCADE,
  hs_object_id BIGINT NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at_hs TIMESTAMPTZ,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (connection_id, hs_object_id)
);

ALTER TABLE public.hubspot_company_cache ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_hs_company_conn ON public.hubspot_company_cache(connection_id);
CREATE INDEX IF NOT EXISTS idx_hs_company_hs_id ON public.hubspot_company_cache(hs_object_id);

DROP POLICY IF EXISTS "Users read company cache for own connection" ON public.hubspot_company_cache;
CREATE POLICY "Users read company cache for own connection"
  ON public.hubspot_company_cache FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.hubspot_connections c
      WHERE c.id = hubspot_company_cache.connection_id
        AND c.user_id = auth.uid()
    )
  );

-- Cached CRM deals
CREATE TABLE IF NOT EXISTS public.hubspot_deal_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.hubspot_connections(id) ON DELETE CASCADE,
  hs_object_id BIGINT NOT NULL,
  company_hs_id BIGINT,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at_hs TIMESTAMPTZ,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (connection_id, hs_object_id)
);

ALTER TABLE public.hubspot_deal_cache ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_hs_deal_conn ON public.hubspot_deal_cache(connection_id);
CREATE INDEX IF NOT EXISTS idx_hs_deal_company ON public.hubspot_deal_cache(connection_id, company_hs_id);

DROP POLICY IF EXISTS "Users read deal cache for own connection" ON public.hubspot_deal_cache;
CREATE POLICY "Users read deal cache for own connection"
  ON public.hubspot_deal_cache FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.hubspot_connections c
      WHERE c.id = hubspot_deal_cache.connection_id
        AND c.user_id = auth.uid()
    )
  );

-- Sync bookkeeping
CREATE TABLE IF NOT EXISTS public.hubspot_sync_state (
  connection_id UUID PRIMARY KEY REFERENCES public.hubspot_connections(id) ON DELETE CASCADE,
  last_companies_sync_at TIMESTAMPTZ,
  last_deals_sync_at TIMESTAMPTZ,
  last_error TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hubspot_sync_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read sync state for own connection" ON public.hubspot_sync_state;
CREATE POLICY "Users read sync state for own connection"
  ON public.hubspot_sync_state FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.hubspot_connections c
      WHERE c.id = hubspot_sync_state.connection_id
        AND c.user_id = auth.uid()
    )
  );

-- Digest history
CREATE TABLE IF NOT EXISTS public.hubspot_digest_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
  hs_company_id BIGINT,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hubspot_digest_snapshots ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_digest_user_created ON public.hubspot_digest_snapshots(user_id, created_at DESC);

DROP POLICY IF EXISTS "Users read own digest snapshots" ON public.hubspot_digest_snapshots;
CREATE POLICY "Users read own digest snapshots"
  ON public.hubspot_digest_snapshots FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own digest snapshots" ON public.hubspot_digest_snapshots;
CREATE POLICY "Users insert own digest snapshots"
  ON public.hubspot_digest_snapshots FOR INSERT
  WITH CHECK (auth.uid() = user_id);
