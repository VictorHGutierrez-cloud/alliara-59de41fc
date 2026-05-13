// HubSpot redirects here with ?code=&state= — exchanges tokens and stores connection.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const err = url.searchParams.get("error");
    const appUrl =
      Deno.env.get("APP_SITE_URL")?.replace(/\/$/, "") ??
      Deno.env.get("VITE_APP_URL")?.replace(/\/$/, "") ??
      "http://127.0.0.1:5173";

    if (err) {
      return Response.redirect(`${appUrl}/settings?hubspot=error&message=${encodeURIComponent(err)}`, 302);
    }
    if (!code || !state) {
      return Response.redirect(`${appUrl}/settings?hubspot=error&message=missing_code`, 302);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const clientId = Deno.env.get("HUBSPOT_CLIENT_ID");
    const clientSecret = Deno.env.get("HUBSPOT_CLIENT_SECRET");
    const redirectUri = Deno.env.get("HUBSPOT_REDIRECT_URI");

    if (!supabaseUrl || !serviceKey || !clientId || !clientSecret || !redirectUri) {
      return Response.redirect(`${appUrl}/settings?hubspot=error&message=config`, 302);
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: stateRow, error: stateErr } = await admin
      .from("hubspot_oauth_states")
      .select("id, user_id, expires_at")
      .eq("state_token", state)
      .maybeSingle();

    if (stateErr || !stateRow || new Date(stateRow.expires_at) < new Date()) {
      await admin.from("hubspot_oauth_states").delete().eq("state_token", state);
      return Response.redirect(`${appUrl}/settings?hubspot=error&message=invalid_state`, 302);
    }

    const tokenRes = await fetch("https://api.hubapi.com/oauth/v1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      }),
    });

    if (!tokenRes.ok) {
      const t = await tokenRes.text();
      console.error("HubSpot token exchange failed", tokenRes.status, t);
      await admin.from("hubspot_oauth_states").delete().eq("id", stateRow.id);
      return Response.redirect(`${appUrl}/settings?hubspot=error&message=token_exchange`, 302);
    }

    const tokenJson = (await tokenRes.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      scope?: string;
      hub_domain?: string;
      hub_id?: number;
      user?: string;
    };

    let portalId = Number(tokenJson.hub_id ?? 0);
    if (!Number.isFinite(portalId) || portalId <= 0) {
      const meRes = await fetch("https://api.hubapi.com/integrations/v1/me", {
        headers: { Authorization: `Bearer ${tokenJson.access_token}` },
      });
      if (meRes.ok) {
        const me = (await meRes.json()) as { portalId?: number; hubId?: number };
        portalId = Number(me.portalId ?? me.hubId ?? 0);
      }
    }
    const safePortal = Number.isFinite(portalId) && portalId > 0 ? portalId : 0;
    const expiresAt = new Date(Date.now() + (tokenJson.expires_in - 120) * 1000).toISOString();

    if (!safePortal) {
      console.error("Could not resolve portal id from HubSpot");
    }

    const { error: upsertErr } = await admin.from("hubspot_connections").upsert(
      {
        user_id: stateRow.user_id,
        portal_id: safePortal > 0 ? safePortal : 0,
        hub_domain: tokenJson.hub_domain ?? null,
        access_token: tokenJson.access_token,
        refresh_token: tokenJson.refresh_token,
        expires_at: expiresAt,
        scopes: tokenJson.scope ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (upsertErr) {
      console.error("hubspot_connections upsert", upsertErr);
      await admin.from("hubspot_oauth_states").delete().eq("id", stateRow.id);
      return Response.redirect(`${appUrl}/settings?hubspot=error&message=db`, 302);
    }

    await admin.from("hubspot_oauth_states").delete().eq("id", stateRow.id);

    const { data: conn } = await admin
      .from("hubspot_connections")
      .select("id")
      .eq("user_id", stateRow.user_id)
      .maybeSingle();

    if (conn?.id) {
      await admin.from("hubspot_sync_state").upsert({ connection_id: conn.id }, { onConflict: "connection_id" });
    }

    return Response.redirect(`${appUrl}/settings?hubspot=connected`, 302);
  } catch (e) {
    console.error("hubspot-oauth-callback", e);
    const appUrl = Deno.env.get("APP_SITE_URL")?.replace(/\/$/, "") ?? "http://127.0.0.1:5173";
    return Response.redirect(`${appUrl}/settings?hubspot=error&message=exception`, 302);
  }
});
