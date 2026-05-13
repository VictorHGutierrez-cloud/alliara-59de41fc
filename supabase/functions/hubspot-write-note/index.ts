// Write a CRM note on a company (write-back loop).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  hs_company_id: number;
  body: string;
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
    const clientId = Deno.env.get("HUBSPOT_CLIENT_ID")!;
    const clientSecret = Deno.env.get("HUBSPOT_CLIENT_SECRET")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const payload = (await req.json()) as Body;
    const hsCompanyId = Number(payload.hs_company_id);
    const noteBody = (payload.body ?? "").trim();
    if (!Number.isFinite(hsCompanyId) || hsCompanyId <= 0 || !noteBody) {
      return json({ error: "hs_company_id and body required" }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: conn } = await admin
      .from("hubspot_connections")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!conn) return json({ error: "HubSpot not connected" }, 400);

    let accessToken = conn.access_token as string;
    let refreshToken = conn.refresh_token as string;
    const expiresAt = new Date(conn.expires_at as string);
    if (expiresAt < new Date(Date.now() + 90_000)) {
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
      if (!tr.ok) return json({ error: "Token refresh failed" }, 401);
      const tj = (await tr.json()) as { access_token: string; refresh_token: string; expires_in: number };
      accessToken = tj.access_token;
      refreshToken = tj.refresh_token;
      await admin
        .from("hubspot_connections")
        .update({
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: new Date(Date.now() + (tj.expires_in - 120) * 1000).toISOString(),
        })
        .eq("id", conn.id);
    }

    const createRes = await fetch("https://api.hubapi.com/crm/v3/objects/notes", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          hs_note_body: noteBody,
          hs_timestamp: new Date().toISOString(),
        },
        associations: [
          {
            to: { id: String(hsCompanyId) },
            types: [
              {
                associationCategory: "HUBSPOT_DEFINED",
                associationTypeId: 202,
              },
            ],
          },
        ],
      }),
    });

    if (!createRes.ok) {
      const t = await createRes.text();
      console.error("hubspot note create", createRes.status, t);
      return json({ error: "HubSpot note API error", detail: t.slice(0, 400) }, 502);
    }

    const created = (await createRes.json()) as { id?: string };
    return json({ ok: true, hs_note_id: created.id ?? null }, 200);
  } catch (e) {
    console.error("hubspot-write-note", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
