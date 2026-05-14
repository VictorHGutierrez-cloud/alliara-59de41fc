// Single AI surface: synthesize partner state from HubSpot cache + optional write-back cue.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are Alliara HubSpot digest. CRM data from HubSpot is the source of truth.

Output MUST be valid JSON for the tool only. English only.

Rules:
- Every claim must reference hs_company_id, hs_deal_id, or say "unknown" if missing from input.
- One primary next step for the partner motion; add up to two alternates.
- Risk label: stall | ghosting | pipeline_gap | healthy | unknown
- Do not invent revenue or dates not present in input snapshot.
- No em dash character in prose fields.`;

interface SynthesizeRequest {
  partner_id?: string | null;
  hs_company_id?: number | null;
  model?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI not configured" }, 500);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = (await req.json()) as SynthesizeRequest;
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: conn } = await admin
      .from("hubspot_connections")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!conn) return json({ error: "Connect HubSpot in Settings and run Sync first." }, 400);

    const connectionId = conn.id as string;

    let partnerRow: { id: string; name: string; hubspot_company_id: number | null } | null = null;
    let companyId: number | null = body.hs_company_id ?? null;

    if (body.partner_id) {
      const { data: p } = await admin
        .from("partners")
        .select("id, name, hubspot_company_id")
        .eq("id", body.partner_id)
        .eq("owner_id", user.id)
        .maybeSingle();
      partnerRow = p as typeof partnerRow;
      if (!partnerRow) return json({ error: "Partner not found" }, 404);
      companyId = partnerRow.hubspot_company_id ?? companyId;
    }

    if (!companyId) {
      return json(
        {
          error:
            "Missing HubSpot company link. Set partners.hubspot_company_id or pass hs_company_id.",
        },
        400,
      );
    }

    const { data: companyRow } = await admin
      .from("hubspot_company_cache")
      .select("*")
      .eq("connection_id", connectionId)
      .eq("hs_object_id", companyId)
      .maybeSingle();

    const { data: dealRows } = await admin
      .from("hubspot_deal_cache")
      .select("*")
      .eq("connection_id", connectionId)
      .eq("company_hs_id", companyId);

    const snapshot = {
      partner_name: partnerRow?.name ?? null,
      hs_company_id: companyId,
      company: companyRow?.properties ?? null,
      deals: (dealRows ?? []).map((d) => ({
        hs_deal_id: d.hs_object_id,
        properties: d.properties,
      })),
    };

    if (!companyRow && (dealRows ?? []).length === 0) {
      return json(
        {
          error: `Partner is linked to HubSpot company ${companyId}, but no cached data was found for that id. Run Sync in Settings, or verify the hubspot_company_id on this partner is correct.`,
        },
        400,
      );
    }

    const tool = {
      type: "function",
      function: {
        name: "deliver_partner_digest",
        description: "Structured weekly-style digest for one partner account in HubSpot.",
        parameters: {
          type: "object",
          additionalProperties: false,
          properties: {
            executive_summary: { type: "string" },
            bullets: {
              type: "array",
              items: { type: "string" },
              maxItems: 8,
            },
            risk: { type: "string", enum: ["stall", "ghosting", "pipeline_gap", "healthy", "unknown"] },
            next_steps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  detail: { type: "string" },
                  hs_citation: { type: "string", description: "Deal or company id cited from input" },
                },
                required: ["title", "detail"],
              },
              minItems: 1,
              maxItems: 3,
            },
          },
          required: ["executive_summary", "bullets", "risk", "next_steps"],
        },
      },
    };

    const userPrompt = `HubSpot snapshot (JSON):\n${JSON.stringify(snapshot).slice(0, 24000)}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: body.model ?? "google/gemini-2.5-flash",
        temperature: 0.25,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userPrompt },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "deliver_partner_digest" } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("synthesize gateway", aiResp.status, t);
      return json({ error: "AI gateway error" }, 500);
    }

    const data = await aiResp.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    const rawArgs = call?.function?.arguments;
    if (!rawArgs) return json({ error: "No structured output from model" }, 500);

    const parsed = JSON.parse(rawArgs as string) as Record<string, unknown>;
    const modelName = (data as { model?: string }).model ?? body.model ?? "google/gemini-2.5-flash";

    await admin.from("hubspot_digest_snapshots").insert({
      user_id: user.id,
      partner_id: partnerRow?.id ?? null,
      hs_company_id: companyId,
      summary: parsed,
      model: modelName,
    });

    return json({ ok: true, digest: parsed, hs_company_id: companyId }, 200);
  } catch (e) {
    console.error("hubspot-synthesize", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
