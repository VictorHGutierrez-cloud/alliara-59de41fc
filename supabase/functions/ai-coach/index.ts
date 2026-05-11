// AI Coach edge function — generates personalized recommendations for a partner using Lovable AI.
// Uses Gemini 2.5 Flash by default. Falls back to Pro if requested.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const COACH_SYSTEM = `You are an experienced B2B channel coach inside the Alliara product.

LANGUAGE: Every string you output in the tool JSON (summary, title, why, how, expected_outcome, action item titles and descriptions) MUST be in European Portuguese (PT-PT).

TONE: Friendly, clear, human. Write like a trusted colleague talking to a Partner Development Manager. Short sentences. Plain words. No empty corporate jargon.

BRANDING: Never write OCTA, OCTO, OCTA OS, or similar. Say programa de parceiros, portal Alliara, ou maturidade do canal / dimensões when needed.

FORMATTING IN PROSE FIELDS: Do not use the em dash character. Do not use markdown. Do not start lines with a hyphen as a bullet. For how only: at most two numbered steps on one line "1. ... 2. ..." OR two very short sentences. No third step.

TECHNICAL KEYS: The field axis_key must stay exactly one of: strategy, offer, recruit, enable, cosell, operate, growth, success. Only these keys, in English, lowercase.

VOLUME: Return 3 to 4 recommendations (never 5). Return 3 to 5 action items (cap 5), prefer fewer words over more.

LENGTH (strict): summary exactly one short sentence, max about 25 words. Each why: one short sentence only. Each how: max two short sentences OR one line with steps 1. and 2. only. Each expected_outcome: one short sentence, max about 15 words. Recommendation titles: one line under 12 words, punchy. Action item titles: one line under 12 words. Action item description: omit when possible; if needed max one short sentence.

Be extremely brief. Every word must earn its place.

Stick to what the context shows. Do not invent facts about the partner.`;

interface AxisInput {
  key: string;
  name: string;
  score: number; // 0..5
  level: number; // 1..5 (or 0 if not assessed)
  mentalModel: string;
  commonMistakes: string[];
  levers: string[];
  nextLevelStep?: string;
}

interface CoachRequest {
  partner: {
    name: string;
    company?: string | null;
    segment?: string | null;
    tier?: string | null;
    status?: string | null;
    notes?: string | null;
  };
  overall: number;
  axes: AxisInput[];
  focusAxisKey?: string | null; // if set, focus on a specific axis
  /** PDM free-text instructions for this run only; may be any language; does not replace diagnostics. */
  sessionContext?: string | null;
  model?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as CoachRequest;
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const focus = body.focusAxisKey
      ? body.axes.find((a) => a.key === body.focusAxisKey)
      : null;

    const userPrompt = focus
      ? buildFocusPrompt(body, focus)
      : buildOverallPrompt(body);

    const tool = {
      type: "function",
      function: {
        name: "deliver_recommendations",
        description:
          "Return recommendations and action items for the PDM. European Portuguese only. Extremely brief strings per property descriptions.",
        parameters: {
          type: "object",
          properties: {
            summary: {
              type: "string",
              description:
                "European Portuguese. One sentence only, max ~25 words. Main shift for this partner now.",
            },
            recommendations: {
              type: "array",
              minItems: 3,
              maxItems: 4,
              items: {
                type: "object",
                properties: {
                  axis_key: {
                    type: "string",
                    description:
                      "One of: strategy, offer, recruit, enable, cosell, operate, growth, success. English key only.",
                  },
                  title: {
                    type: "string",
                    description: "European Portuguese. One line, under ~12 words, action-oriented.",
                  },
                  why: {
                    type: "string",
                    description: "European Portuguese. One short sentence only. Grounded in scores/context.",
                  },
                  how: {
                    type: "string",
                    description:
                      "European Portuguese. Max two short sentences OR one line with 1. and 2. only. Next weeks.",
                  },
                  expected_outcome: {
                    type: "string",
                    description: "European Portuguese. One short sentence, max ~15 words.",
                  },
                  priority: { type: "string", enum: ["low", "medium", "high"] },
                  target_level: { type: "integer", minimum: 1, maximum: 5 },
                },
                required: ["axis_key", "title", "why", "how", "expected_outcome", "priority", "target_level"],
                additionalProperties: false,
              },
            },
            action_items: {
              type: "array",
              minItems: 3,
              maxItems: 5,
              description:
                "European Portuguese. Three to five short tasks; prefer 3 or 4. Very tight wording.",
              items: {
                type: "object",
                properties: {
                  axis_key: { type: "string", description: "strategy, offer, recruit, enable, cosell, operate, growth, or success." },
                  title: { type: "string", description: "European Portuguese. One line, under ~12 words." },
                  description: {
                    type: "string",
                    description: "European Portuguese. Omit if title suffices; else one short sentence only.",
                  },
                  priority: { type: "string", enum: ["low", "medium", "high"] },
                  target_level: { type: "integer", minimum: 1, maximum: 5 },
                },
                required: ["axis_key", "title", "priority", "target_level"],
                additionalProperties: false,
              },
            },
          },
          required: ["summary", "recommendations", "action_items"],
          additionalProperties: false,
        },
      },
    };

    const model = body.model ?? "google/gemini-2.5-flash";

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: COACH_SYSTEM },
          { role: "user", content: userPrompt },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "deliver_recommendations" } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      if (aiResp.status === 429) {
        return json({ error: "Rate limit hit, please try again in a moment." }, 429);
      }
      if (aiResp.status === 402) {
        return json({ error: "AI credits exhausted. Add usage in workspace settings." }, 402);
      }
      return json({ error: "AI gateway error" }, 500);
    }

    const data = await aiResp.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = call?.function?.arguments;
    if (!argsStr) {
      console.error("No tool call in AI response", JSON.stringify(data));
      return json({ error: "AI returned no structured output" }, 500);
    }
    const parsed = JSON.parse(argsStr);

    return json({ ok: true, model, content: parsed }, 200);
  } catch (e) {
    console.error("ai-coach error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildOverallPrompt(body: CoachRequest): string {
  const lines: string[] = [];
  lines.push("CONTEXT (for reading only; your tool output is entirely in European Portuguese):");
  lines.push("");
  lines.push("PARTNER:");
  lines.push(`Name: ${body.partner.name}`);
  if (body.partner.company) lines.push(`Company: ${body.partner.company}`);
  if (body.partner.segment) lines.push(`Segment: ${body.partner.segment}`);
  if (body.partner.tier) lines.push(`Tier: ${body.partner.tier}`);
  if (body.partner.status) lines.push(`Status: ${body.partner.status}`);
  if (body.partner.notes) lines.push(`PDM notes: ${body.partner.notes}`);
  lines.push("");
  lines.push(`Overall channel maturity score: ${body.overall.toFixed(1)} / 5.0`);
  lines.push("");
  lines.push("Dimension scores (1 reactive, 5 compounding). Keys stay English:");
  for (const a of body.axes) {
    lines.push(`${a.key}: ${a.name} score ${a.score.toFixed(1)}, level ${a.level}`);
    lines.push(`  Mental model: ${a.mentalModel}`);
    if (a.nextLevelStep) lines.push(`  Suggested next step at this level: ${a.nextLevelStep}`);
  }
  const extra = body.sessionContext?.trim();
  if (extra) {
    lines.push("");
    lines.push("PDM instructions for this run only (may be in any language; use to tune emphasis, never to invent facts):");
    lines.push(extra);
  }
  lines.push("");
  lines.push("TASK:");
  lines.push(
    extra
      ? "Be extremely brief. Suggest 3 to 4 high impact recommendations only, plus 3 to 5 very short action items (cap 5). One sentence summary max ~25 words. Each recommendation: tight why, how with at most two steps, short outcome. Prioritise lower scores that unlock pipeline or trust. Reflect PDM run instructions when they do not conflict with data. Output JSON entirely in European Portuguese, friendly, no OCTA, no em dash, no hyphen bullets in prose. axis_key stays English as listed."
      : "Be extremely brief. Suggest 3 to 4 high impact recommendations only, plus 3 to 5 very short action items (cap 5). One sentence summary max ~25 words. Each recommendation: tight why, how with at most two steps, short outcome. Prioritise lower scores that unlock pipeline or trust. Output JSON entirely in European Portuguese, friendly, no OCTA, no em dash, no hyphen bullets in prose. axis_key stays English as listed.",
  );
  return lines.join("\n");
}

function buildFocusPrompt(body: CoachRequest, focus: AxisInput): string {
  const lines: string[] = [];
  lines.push("CONTEXT (for reading only; your tool output is entirely in European Portuguese):");
  lines.push("");
  lines.push(`Partner: ${body.partner.name}${body.partner.company ? `, ${body.partner.company}` : ""}`);
  if (body.partner.tier) lines.push(`Tier: ${body.partner.tier}, status: ${body.partner.status ?? "n/a"}`);
  if (body.partner.notes) lines.push(`PDM notes: ${body.partner.notes}`);
  lines.push("");
  lines.push(`Focus dimension key: ${focus.key} (${focus.name})`);
  lines.push(`Score ${focus.score.toFixed(1)}, level ${focus.level} / 5`);
  lines.push(`Mental model: ${focus.mentalModel}`);
  lines.push(`Common mistakes to avoid: ${focus.commonMistakes.join("; ")}`);
  lines.push(`Levers: ${focus.levers.join("; ")}`);
  if (focus.nextLevelStep) lines.push(`Suggested next step: ${focus.nextLevelStep}`);
  lines.push("");
  lines.push("Other dimensions (context only):");
  for (const a of body.axes.filter((x) => x.key !== focus.key)) {
    lines.push(`${a.key} ${a.name}: ${a.score.toFixed(1)}`);
  }
  const extraFocus = body.sessionContext?.trim();
  if (extraFocus) {
    lines.push("");
    lines.push("PDM instructions for this run only (may be in any language; use to tune emphasis, never to invent facts):");
    lines.push(extraFocus);
  }
  lines.push("");
  lines.push("TASK:");
  lines.push(
    extraFocus
      ? `Be extremely brief. Give 3 to 4 concrete recommendations centred on dimension ${focus.key} only, plus 3 to 5 very short action items (cap 5). One sentence summary max ~25 words. Tight fields per system LENGTH. Reflect PDM run instructions when they do not conflict with data. All tool output in European Portuguese, friendly, no OCTA, no em dash, no hyphen bullets in prose. axis_key values remain English.`
      : `Be extremely brief. Give 3 to 4 concrete recommendations centred on dimension ${focus.key} only, plus 3 to 5 very short action items (cap 5). One sentence summary max ~25 words. Tight fields per system LENGTH. All tool output in European Portuguese, friendly, no OCTA, no em dash, no hyphen bullets in prose. axis_key values remain English.`,
  );
  return lines.join("\n");
}
