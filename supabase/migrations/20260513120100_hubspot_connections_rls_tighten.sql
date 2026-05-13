-- Tokens must only be written by Edge (service role), not by authenticated API clients.
DROP POLICY IF EXISTS "Users manage own HubSpot connection" ON public.hubspot_connections;

CREATE POLICY "Users read own HubSpot connection"
  ON public.hubspot_connections FOR SELECT
  USING (auth.uid() = user_id);
