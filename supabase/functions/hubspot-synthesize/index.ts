// Single AI surface: synthesize partner state from local Alliara data
// (partners, metrics, stakeholders, action_plans, assessments) plus optional
// HubSpot CRM enrichment when a connection + cache exist.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are Alliara partner digest. The input snapshot is the only source of truth.

The snapshot may include:
- partner: local Alliara record (name, company, segment, tier, partner_type, status, notes)
- metrics: recent partner_metrics rows
- stakeholders: known contacts
- action_plans: open initiatives
- assessment: latest maturity scores
- hubspot (optional): company + deals from CRM cache

Output MUST be valid JSON for the tool only. English only.

Rules:
- Ground every claim in the snapshot. If a section is missing, say so plainly instead of inventing.
- When HubSpot data is present, prefer it for pipeline/deal claims and cite hs_company_id or hs_deal_id in hs_citation.
- When HubSpot data is absent, use local Alliara fields and leave hs_citation empty or write "local".
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

    const connectionId = (conn?.id as string | undefined) ?? null;

    type PartnerRow = {
      id: string;
      name: string;
      company: string | null;
      segment: string | null;
      tier: string | null;
      partner_type: string | null;
      status: string | null;
      notes: string | null;
      hubspot_company_id: number | null;
    };

    let partnerRow: PartnerRow | null = null;
    let companyId: number | null = body.hs_company_id ?? null;

    if (body.partner_id) {
      const { data: p } = await admin
        .from("partners")
        .select(
          "id, name, company, segment, tier, partner_type, status, notes, hubspot_company_id",
        )
        .eq("id", body.partner_id)
        .eq("owner_id", user.id)
        .maybeSingle();
      partnerRow = (p as PartnerRow | null) ?? null;
      if (!partnerRow) return json({ error: "Partner not found" }, 404);
      companyId = partnerRow.hubspot_company_id ?? companyId;
    }

    if (!partnerRow && !companyId) {
      return json({ error: "Provide partner_id or hs_company_id." }, 400);
    }

    // Local Alliara context
    const partnerId = partnerRow?.id ?? null;
    let metrics: unknown[] = [];
    let stakeholders: unknown[] = [];
    let actionPlans: unknown[] = [];
    let assessment: unknown = null;

    if (partnerId) {
      const [m, s, a, asmt] = await Promise.all([
        admin
          .from("partner_metrics")
          .select(
            "period, revenue, mrr, deals_open, deals_open_value, deals_won, deals_won_value, trained_people, notes",
          )
          .eq("partner_id", partnerId)
          .order("created_at", { ascending: false })
          .limit(6),
        admin
          .from("partner_stakeholders")
          .select("name, role, position, email, notes")
          .eq("partner_id", partnerId)
          .limit(20),
        admin
          .from("action_plans")
          .select("title, description, axis_key, priority, status, due_date")
          .eq("partner_id", partnerId)
          .neq("status", "done")
          .limit(20),
        admin
          .from("assessments")
          .select("scores, overall, created_at")
          .eq("partner_id", partnerId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      metrics = m.data ?? [];
      stakeholders = s.data ?? [];
      actionPlans = a.data ?? [];
      assessment = asmt.data ?? null;
    }

    // Optional HubSpot enrichment
    let companyProps: unknown = null;
    let dealRows: Array<{ hs_object_id: number; properties: unknown }> = [];
    if (connectionId && companyId) {
      const { data: cRow } = await admin
        .from("hubspot_company_cache")
        .select("properties")
        .eq("connection_id", connectionId)
        .eq("hs_object_id", companyId)
        .maybeSingle();
      companyProps = (cRow as { properties: unknown } | null)?.properties ?? null;
      const { data: dRows } = await admin
        .from("hubspot_deal_cache")
        .select("hs_object_id, properties")
        .eq("connection_id", connectionId)
        .eq("company_hs_id", companyId);
      dealRows = (dRows as Array<{ hs_object_id: number; properties: unknown }>) ?? [];
    }

    const snapshot = {
      partner: partnerRow
        ? {
            name: partnerRow.name,
            company: partnerRow.company,
            segment: partnerRow.segment,
            tier: partnerRow.tier,
            partner_type: partnerRow.partner_type,
            status: partnerRow.status,
            notes: partnerRow.notes,
          }
        : null,
      hs_company_id: companyId,
      metrics,
      stakeholders,
      action_plans: actionPlans,
      assessment,
      hubspot:
        companyProps || dealRows.length
          ? {
              company: companyProps,
              deals: dealRows.map((d) => ({
                hs_deal_id: d.hs_object_id,
                properties: d.properties,
              })),
            }
          : null,
    };

    const tool = {
      type: "function",
      function: {
        name: "deliver_partner_digest",
        description: "Structured weekly-style digest for one partner account.",
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
            risk: {
              type: "string",
              enum: ["stall", "ghosting", "pipeline_gap", "healthy", "unknown"],
            },
            next_steps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  detail: { type: "string" },
                  hs_citation: {
                    type: "string",
                    description:
                      "Deal/company id from HubSpot input, or 'local' when grounded in Alliara data.",
                  },
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

    const userPrompt = `Partner snapshot (JSON):\n${JSON.stringify(snapshot).slice(0, 24000)}`;

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

    return json({ ok: true, digest: parsed, hs_company_id: companyId ?? 0 }, 200);
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
