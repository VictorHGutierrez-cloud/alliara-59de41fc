// partner-intel edge function — turns uploaded documents + quick metrics
// into structured insights for one specific partner using Lovable AI.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DocInput {
  filename: string;
  kind: string;
  description?: string | null;
  excerpt?: string | null; // pre-extracted text snippet
}

interface MetricInput {
  period?: string | null;
  revenue?: number | null;
  deals_open?: number | null;
  deals_won?: number | null;
  trained_people?: number | null;
  notes?: string | null;
}

interface AxisInput {
  key: string;
  name: string;
  current_score: number; // 0..5, 0 if not assessed
}

interface IntelRequest {
  partner: {
    name: string;
    company?: string | null;
    segment?: string | null;
    tier?: string | null;
    status?: string | null;
    notes?: string | null;
  };
  axes: AxisInput[];
  documents: DocInput[];
  metrics: MetricInput[];
  freeText?: string | null;
  model?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as IntelRequest;
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const system = `You are a senior B2B partnership intelligence analyst inside the OCTA OS platform.
You read raw inputs about ONE specific partner — uploaded documents (business plans, sales data, decks, notes), quick metrics, and free-form notes — and turn them into structured intelligence for the Partner Development Manager (PDM).
You map every signal to one of the 8 OCTA axes (strategy, offer, recruit, enable, cosell, operate, growth, success).
Be specific to THIS partner. Cite the source of each signal (filename or "metrics" or "notes"). Never invent data — if something isn't in the inputs, say so.`;

    const tool = {
      type: "function",
      function: {
        name: "deliver_partner_intel",
        description: "Return structured intelligence about this partner.",
        parameters: {
          type: "object",
          properties: {
            executive_summary: {
              type: "string",
              description: "3–5 sentences summarizing the state of this partnership based on the inputs.",
            },
            red_flags: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  evidence: { type: "string", description: "What in the inputs triggered this red flag." },
                  severity: { type: "string", enum: ["low", "medium", "high"] },
                },
                required: ["title", "evidence", "severity"],
                additionalProperties: false,
              },
            },
            signals_by_axis: {
              type: "array",
              minItems: 8,
              maxItems: 8,
              description: "One entry per OCTA axis. Use these axis keys exactly: strategy, offer, recruit, enable, cosell, operate, growth, success.",
              items: {
                type: "object",
                properties: {
                  axis_key: { type: "string", enum: ["strategy", "offer", "recruit", "enable", "cosell", "operate", "growth", "success"] },
                  observations: { type: "string", description: "Plain-English summary of what the inputs reveal about this axis for this partner." },
                  suggested_level: { type: "integer", minimum: 1, maximum: 5, description: "Best-guess maturity level 1..5 based on inputs." },
                  confidence: { type: "string", enum: ["low", "medium", "high"] },
                },
                required: ["axis_key", "observations", "suggested_level", "confidence"],
                additionalProperties: false,
              },
            },
            suggested_actions: {
              type: "array",
              minItems: 3,
              maxItems: 6,
              description: "Ready-to-add tasks for the partner action plan, derived from the inputs.",
              items: {
                type: "object",
                properties: {
                  axis_key: { type: "string", enum: ["strategy", "offer", "recruit", "enable", "cosell", "operate", "growth", "success"] },
                  title: { type: "string" },
                  description: { type: "string" },
                  priority: { type: "string", enum: ["low", "medium", "high"] },
                  target_level: { type: "integer", minimum: 1, maximum: 5 },
                },
                required: ["axis_key", "title", "description", "priority", "target_level"],
                additionalProperties: false,
              },
            },
          },
          required: ["executive_summary", "red_flags", "signals_by_axis", "suggested_actions"],
          additionalProperties: false,
        },
      },
    };

    const userPrompt = buildPrompt(body);
    const model = body.model ?? "google/gemini-2.5-flash";

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "deliver_partner_intel" } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      if (aiResp.status === 429) return json({ error: "Rate limit, try again shortly." }, 429);
      if (aiResp.status === 402) return json({ error: "AI credits exhausted." }, 402);
      return json({ error: "AI gateway error" }, 500);
    }

    const data = await aiResp.json();
    const argsStr = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!argsStr) {
      console.error("No tool call in AI response", JSON.stringify(data));
      return json({ error: "AI returned no structured output" }, 500);
    }
    const parsed = JSON.parse(argsStr);

    return json({ ok: true, model, content: parsed }, 200);
  } catch (e) {
    console.error("partner-intel error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildPrompt(body: IntelRequest): string {
  const lines: string[] = [];
  lines.push("PARTNER:");
  lines.push(`- Name: ${body.partner.name}`);
  if (body.partner.company) lines.push(`- Company: ${body.partner.company}`);
  if (body.partner.segment) lines.push(`- Segment: ${body.partner.segment}`);
  if (body.partner.tier) lines.push(`- Tier: ${body.partner.tier}`);
  if (body.partner.status) lines.push(`- Status: ${body.partner.status}`);
  if (body.partner.notes) lines.push(`- PDM notes on file: ${body.partner.notes}`);
  lines.push("");
  lines.push("CURRENT OCTA SCORES (0 = not assessed):");
  for (const a of body.axes) lines.push(`- ${a.name} (${a.key}): ${a.current_score.toFixed(1)} / 5`);
  lines.push("");

  if (body.metrics.length) {
    lines.push("QUICK METRICS PROVIDED BY PDM:");
    for (const m of body.metrics) {
      const parts: string[] = [];
      if (m.period) parts.push(`period=${m.period}`);
      if (m.revenue != null) parts.push(`revenue=${m.revenue}`);
      if (m.deals_open != null) parts.push(`deals_open=${m.deals_open}`);
      if (m.deals_won != null) parts.push(`deals_won=${m.deals_won}`);
      if (m.trained_people != null) parts.push(`trained_people=${m.trained_people}`);
      if (m.notes) parts.push(`notes="${m.notes}"`);
      lines.push(`- ${parts.join(" · ")}`);
    }
    lines.push("");
  }

  if (body.documents.length) {
    lines.push("DOCUMENTS UPLOADED FOR THIS PARTNER:");
    for (const d of body.documents) {
      lines.push(`- [${d.kind}] ${d.filename}${d.description ? ` — ${d.description}` : ""}`);
      if (d.excerpt) {
        const trimmed = d.excerpt.length > 6000 ? d.excerpt.slice(0, 6000) + "…[truncated]" : d.excerpt;
        lines.push(`  Content excerpt:\n  """\n  ${trimmed.replace(/\n/g, "\n  ")}\n  """`);
      } else {
        lines.push("  (no text excerpt available)");
      }
    }
    lines.push("");
  }

  if (body.freeText) {
    lines.push("ADDITIONAL FREE-TEXT CONTEXT FROM PDM:");
    lines.push(body.freeText);
    lines.push("");
  }

  lines.push("TASK:");
  lines.push("Analyze the inputs and return: (1) an executive summary, (2) red flags with evidence, (3) signals + suggested maturity level for each of the 8 OCTA axes (always include all 8 — if there is no evidence, set confidence to 'low' and say so in observations), (4) 3–6 ready-to-paste action items for the partner plan. Be ruthlessly specific to this partner. Cite which document or metric supports each signal.");
  return lines.join("\n");
}