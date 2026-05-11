// partner-intel edge function — turns uploaded documents + quick metrics
// into structured insights for one specific partner using Lovable AI.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const INTEL_SYSTEM = `You are a B2B partnership intelligence analyst inside the Alliara product.

LANGUAGE: Every string you output in the tool JSON MUST be in European Portuguese (PT-PT).

TONE: Friendly, clear, efficient. You help a Partner Development Manager see what matters without fluff.

BRANDING: Never write OCTA, OCTO, OCTA OS, or similar. Say Alliara, portal, programa de parceiros, or maturidade do canal when needed.

FORMATTING IN PROSE FIELDS: Do not use the em dash character. Do not use markdown. Do not start lines with a hyphen as a bullet in user-facing text. If you need steps, use "1. 2. 3." on one line or short sentences.

TECHNICAL KEYS: axis_key values must stay exactly: strategy, offer, recruit, enable, cosell, operate, growth, success. Lowercase English only.

EVIDENCE: Be specific to THIS partner. Name the source briefly (filename, metrics, notes). If something is not in the inputs, say so plainly in observations and lower confidence. Do not invent numbers or commitments.

LENGTH: executive_summary 2 to 4 short sentences total. Each observations field: 1 to 2 short sentences, or one line stating no signal. red_flags evidence: one tight sentence tied to the source. Action titles: one line. Action descriptions: max 2 short sentences.`;

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

    const tool = {
      type: "function",
      function: {
        name: "deliver_partner_intel",
        description:
          "Return structured partner intelligence. All prose strings in European Portuguese, brief and friendly per system rules.",
        parameters: {
          type: "object",
          properties: {
            executive_summary: {
              type: "string",
              description:
                "European Portuguese. Total of 2 to 4 short sentences on partnership state from the inputs only.",
            },
            red_flags: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description: "European Portuguese. One short line naming the risk.",
                  },
                  evidence: {
                    type: "string",
                    description:
                      "European Portuguese. One concise sentence stating what in the inputs triggered this (cite source name: file, metrics, notes).",
                  },
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
              description:
                "Exactly one row per dimension. Keys: strategy, offer, recruit, enable, cosell, operate, growth, success.",
              items: {
                type: "object",
                properties: {
                  axis_key: { type: "string", enum: ["strategy", "offer", "recruit", "enable", "cosell", "operate", "growth", "success"] },
                  observations: {
                    type: "string",
                    description:
                      "European Portuguese. 1 to 2 short sentences. If no evidence, say so and keep confidence low.",
                  },
                  suggested_level: { type: "integer", minimum: 1, maximum: 5, description: "Best guess 1 to 5 from inputs." },
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
              description:
                "European Portuguese tasks grounded in the inputs. Same style as coach action items.",
              items: {
                type: "object",
                properties: {
                  axis_key: { type: "string", enum: ["strategy", "offer", "recruit", "enable", "cosell", "operate", "growth", "success"] },
                  title: { type: "string", description: "European Portuguese. One line." },
                  description: { type: "string", description: "European Portuguese. Max 2 short sentences." },
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
          { role: "system", content: INTEL_SYSTEM },
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
  lines.push("CONTEXT (read only; your tool output is entirely in European Portuguese):");
  lines.push("");
  lines.push("PARTNER:");
  lines.push(`Name: ${body.partner.name}`);
  if (body.partner.company) lines.push(`Company: ${body.partner.company}`);
  if (body.partner.segment) lines.push(`Segment: ${body.partner.segment}`);
  if (body.partner.tier) lines.push(`Tier: ${body.partner.tier}`);
  if (body.partner.status) lines.push(`Status: ${body.partner.status}`);
  if (body.partner.notes) lines.push(`PDM notes on file: ${body.partner.notes}`);
  lines.push("");
  lines.push("Current dimension scores (0 means not assessed). Keys in English:");
  for (const a of body.axes) lines.push(`${a.key} ${a.name}: ${a.current_score.toFixed(1)} / 5`);
  lines.push("");

  if (body.metrics.length) {
    lines.push("Quick metrics from PDM:");
    for (const m of body.metrics) {
      const parts: string[] = [];
      if (m.period) parts.push(`period=${m.period}`);
      if (m.revenue != null) parts.push(`revenue=${m.revenue}`);
      if (m.deals_open != null) parts.push(`deals_open=${m.deals_open}`);
      if (m.deals_won != null) parts.push(`deals_won=${m.deals_won}`);
      if (m.trained_people != null) parts.push(`trained_people=${m.trained_people}`);
      if (m.notes) parts.push(`notes="${m.notes}"`);
      lines.push(parts.join(" · "));
    }
    lines.push("");
  }

  if (body.documents.length) {
    lines.push("Documents uploaded for this partner:");
    for (const d of body.documents) {
      lines.push(`[${d.kind}] ${d.filename}${d.description ? ` | ${d.description}` : ""}`);
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
    lines.push("Additional free-text from PDM:");
    lines.push(body.freeText);
    lines.push("");
  }

  lines.push("TASK:");
  lines.push(
    "Produce via the tool: (1) executive_summary 2 to 4 short sentences; (2) red_flags with tight evidence citing filename, metrics, or notes; (3) signals_by_axis with all eight keys, low confidence and honest text when there is no proof; (4) three to six suggested_actions. Stay specific to this partner. All user-facing strings in the JSON must be European Portuguese, warm and brief. No OCTA branding. No em dash. No prose lines starting with hyphen bullets. Keep source citations short.",
  );
  return lines.join("\n");
}