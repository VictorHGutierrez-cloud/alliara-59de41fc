// Pull companies + deals into cache for the user HubSpot connection (JWT required).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COMPANY_PROPS = [
  "name",
  "domain",
  "hs_lastmodifieddate",
  "hs_object_id",
  "hubspot_owner_id",
  "hs_num_associated_deals",
].join(",");

const DEAL_PROPS = [
  "dealname",
  "amount",
  "dealstage",
  "pipeline",
  "closedate",
  "hs_lastmodifieddate",
  "hs_object_id",
  "hubspot_owner_id",
].join(",");

interface HsPaging {
  next?: { after?: string };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const clientId = Deno.env.get("HUBSPOT_CLIENT_ID") ?? "";
    const clientSecret = Deno.env.get("HUBSPOT_CLIENT_SECRET") ?? "";
    const privateAppToken = Deno.env.get("HUBSPOT_ACCESS_TOKEN") ?? "";

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);

    let { data: conn, error: cErr } = await admin
      .from("hubspot_connections")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (cErr) return json({ error: "Database error" }, 500);

    // Private App mode: auto-provision a connection row using the workspace token
    if (!conn && privateAppToken) {
      const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const { data: created, error: createErr } = await admin
        .from("hubspot_connections")
        .upsert(
          {
            user_id: user.id,
            portal_id: 0,
            hub_domain: "private-app",
            access_token: privateAppToken,
            refresh_token: "private-app",
            expires_at: farFuture,
            scopes: "private-app",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        )
        .select("*")
        .maybeSingle();
      if (createErr || !created) return json({ error: "Could not initialize connection" }, 500);
      conn = created;
      await admin.from("hubspot_sync_state").upsert({ connection_id: created.id }, { onConflict: "connection_id" });
    }

    if (!conn) return json({ error: "HubSpot not connected. Connect under Settings." }, 400);

    // Always prefer the Private App token from env when available
    let accessToken = privateAppToken || (conn.access_token as string);
    let refreshToken = conn.refresh_token as string;
    const expiresAt = new Date(conn.expires_at as string);
    if (!privateAppToken && expiresAt < new Date(Date.now() + 90_000)) {
      const tr = await fetch("https://api.hubapi.com/oauth/v1/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
        }),
      });
      if (!tr.ok) {
        const te = await tr.text();
        console.error("refresh failed", te);
        return json({ error: "Token refresh failed — reconnect HubSpot in Settings." }, 401);
      }
      const tj = (await tr.json()) as {
        access_token: string;
        refresh_token: string;
        expires_in: number;
      };
      accessToken = tj.access_token;
      refreshToken = tj.refresh_token;
      const nextExp = new Date(Date.now() + (tj.expires_in - 120) * 1000).toISOString();
      await admin
        .from("hubspot_connections")
        .update({
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: nextExp,
          updated_at: new Date().toISOString(),
        })
        .eq("id", conn.id);
    }

    const connectionId = conn.id as string;

    let companies = 0;
    let after: string | undefined;
    for (let page = 0; page < 40; page++) {
      const u = new URL("https://api.hubapi.com/crm/v3/objects/companies");
      u.searchParams.set("limit", "100");
      u.searchParams.set("properties", COMPANY_PROPS);
      if (after) u.searchParams.set("after", after);
      const res = await fetch(u.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const t = await res.text();
        await admin.from("hubspot_sync_state").upsert({
          connection_id: connectionId,
          last_error: `companies ${res.status}: ${t.slice(0, 500)}`,
          updated_at: new Date().toISOString(),
        });
        return json({ error: "HubSpot companies API error", detail: t.slice(0, 200) }, 502);
      }
      const body = (await res.json()) as {
        results: Array<{
          id: string;
          properties: Record<string, string | null>;
          updatedAt?: string;
        }>;
        paging?: HsPaging;
      };
      const rows = body.results ?? [];
      for (const r of rows) {
        const hsId = Number(r.id);
        const updatedAt = r.updatedAt ? new Date(r.updatedAt).toISOString() : null;
        await admin.from("hubspot_company_cache").upsert(
          {
            connection_id: connectionId,
            hs_object_id: hsId,
            properties: r.properties as unknown as Record<string, unknown>,
            updated_at_hs: updatedAt,
            synced_at: new Date().toISOString(),
          },
          { onConflict: "connection_id,hs_object_id" },
        );
        companies++;
      }
      after = body.paging?.next?.after;
      if (!after) break;
    }

    let deals = 0;
    after = undefined;
    const dealIdList: string[] = [];
    for (let page = 0; page < 40; page++) {
      const u = new URL("https://api.hubapi.com/crm/v3/objects/deals");
      u.searchParams.set("limit", "100");
      u.searchParams.set("properties", DEAL_PROPS);
      if (after) u.searchParams.set("after", after);
      const res = await fetch(u.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const t = await res.text();
        await admin.from("hubspot_sync_state").upsert({
          connection_id: connectionId,
          last_error: `deals ${res.status}: ${t.slice(0, 500)}`,
          updated_at: new Date().toISOString(),
        });
        return json({ error: "HubSpot deals API error", detail: t.slice(0, 200) }, 502);
      }
      const body = (await res.json()) as {
        results: Array<{
          id: string;
          properties: Record<string, string | null>;
          updatedAt?: string;
        }>;
        paging?: HsPaging;
      };
      for (const r of body.results ?? []) {
        dealIdList.push(r.id);
        const hsId = Number(r.id);
        const updatedAt = r.updatedAt ? new Date(r.updatedAt).toISOString() : null;
        await admin.from("hubspot_deal_cache").upsert(
          {
            connection_id: connectionId,
            hs_object_id: hsId,
            company_hs_id: null,
            properties: r.properties as unknown as Record<string, unknown>,
            updated_at_hs: updatedAt,
            synced_at: new Date().toISOString(),
          },
          { onConflict: "connection_id,hs_object_id" },
        );
        deals++;
      }
      after = body.paging?.next?.after;
      if (!after) break;
    }

    // Associate deals -> primary company (batch)
    const chunkSize = 100;
    for (let i = 0; i < dealIdList.length; i += chunkSize) {
      const chunk = dealIdList.slice(i, i + chunkSize);
      const batchRes = await fetch("https://api.hubapi.com/crm/v4/associations/deals/companies/batch/read", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: chunk.map((id) => ({ id })),
        }),
      });
      if (!batchRes.ok) {
        console.warn("association batch failed", await batchRes.text());
        continue;
      }
      const batchJson = (await batchRes.json()) as {
        results: Array<{ from: { id: string }; to: Array<{ toObjectId: number }> }>;
      };
      for (const row of batchJson.results ?? []) {
        const companyId = row.to?.[0]?.toObjectId;
        if (!companyId) continue;
        await admin
          .from("hubspot_deal_cache")
          .update({ company_hs_id: companyId })
          .eq("connection_id", connectionId)
          .eq("hs_object_id", Number(row.from.id));
      }
    }

    const now = new Date().toISOString();
    await admin.from("hubspot_sync_state").upsert({
      connection_id: connectionId,
      last_companies_sync_at: now,
      last_deals_sync_at: now,
      last_error: null,
      updated_at: now,
    });

    return json({ ok: true, companies, deals }, 200);
  } catch (e) {
    console.error("hubspot-sync", e);
    return json({ error: e instanceof Error ? e.message : "Sync failed" }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
