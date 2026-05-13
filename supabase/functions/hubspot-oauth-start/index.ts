// Returns HubSpot authorize URL after creating CSRF state for the signed-in user.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SCOPES = [
  "oauth",
  "crm.objects.companies.read",
  "crm.objects.deals.read",
  "crm.schemas.companies.read",
  "crm.schemas.deals.read",
  "crm.objects.owners.read",
  "crm.objects.tasks.write",
].join(" ");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST" && req.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const clientId = Deno.env.get("HUBSPOT_CLIENT_ID");
    const redirectUri = Deno.env.get("HUBSPOT_REDIRECT_URI");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey || !clientId || !redirectUri) {
      console.error("hubspot-oauth-start missing env");
      return json({ error: "Server misconfiguration" }, 500);
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser();
    if (userErr || !user) {
      return json({ error: "Unauthorized" }, 401);
    }

    const stateToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const admin = createClient(supabaseUrl, supabaseServiceKey);
    const { error: insErr } = await admin.from("hubspot_oauth_states").insert({
      user_id: user.id,
      state_token: stateToken,
      expires_at: expiresAt,
    });
    if (insErr) {
      console.error("oauth state insert", insErr);
      return json({ error: "Could not start OAuth" }, 500);
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: SCOPES,
      state: stateToken,
    });
    const authorizeUrl = `https://app.hubspot.com/oauth/authorize?${params.toString()}`;

    return json({ authorizeUrl, state: stateToken }, 200);
  } catch (e) {
    console.error("hubspot-oauth-start", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
