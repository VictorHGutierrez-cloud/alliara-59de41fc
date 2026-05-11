// AI Coach edge function — generates personalized recommendations for a partner using Lovable AI.
// Uses Gemini 2.5 Flash by default. Falls back to Pro if requested.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const COACH_SYSTEM = `You are an experienced B2B channel coach inside the Alliara product.

LANGUAGE: Every string you output in the tool JSON (summary, title, why, how, expected_outcome, action item titles and descriptions) MUST be in English. Keep the same language even if the PDM typed run notes in another language.

TONE: Friendly, clear, human. Write like a trusted colleague talking to a Partner Development Manager. Short sentences. Plain words. No empty corporate jargon.

BRANDING: Never write OCTA, OCTO, OCTA OS, or similar. Say partner program, Alliara portal, or channel maturity / dimensions when needed.

FORMATTING IN PROSE FIELDS: Do not use the em dash character. Do not use markdown. Do not start lines with a hyphen as a bullet. For how only: at most two numbered steps on one line "1. ... 2. ..." OR two very short sentences. No third step.

TECHNICAL KEYS: The field axis_key must stay exactly one of: strategy, offer, recruit, enable, cosell, operate, growth, success. Only these keys, in English, lowercase.

VOLUME: Exact counts are enforced by the tool schema and the user TASK line. Default is 3 to 4 recommendations and 3 to 5 action items; a narrow run may require only 2 recommendations and 2 to 3 action items. Prefer fewer words over more.

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
  /** Compact self-reported pipeline/MRR lines from partner_metrics (optional). */
  metricsSummary?: string | null;
  model?: string;
}

function recommendationItemSchema() {
  return {
    type: "object",
    properties: {
      axis_key: {
        type: "string",
        description:
          "One of: strategy, offer, recruit, enable, cosell, operate, growth, success. English key only.",
      },
      title: {
        type: "string",
        description: "English. One line, under ~12 words, action-oriented.",
      },
      why: {
        type: "string",
        description: "English. One short sentence only. Grounded in scores/context.",
      },
      how: {
        type: "string",
        description:
          "English. Max two short sentences OR one line with 1. and 2. only. Next weeks.",
      },
      expected_outcome: {
        type: "string",
        description: "English. One short sentence, max ~15 words.",
      },
      priority: { type: "string", enum: ["low", "medium", "high"] },
      target_level: { type: "integer", minimum: 1, maximum: 5 },
    },
    required: ["axis_key", "title", "why", "how", "expected_outcome", "priority", "target_level"],
    additionalProperties: false,
  };
}

function buildDeliverRecommendationsTool(narrowSession: boolean) {
  const recMin = narrowSession ? 2 : 3;
  const recMax = narrowSession ? 2 : 4;
  const actMin = narrowSession ? 2 : 3;
  const actMax = narrowSession ? 3 : 5;
  return {
    type: "function" as const,
    function: {
      name: "deliver_recommendations",
      description: narrowSession
        ? "Return a tight set of recommendations and tasks. English only. The PDM run question is the priority."
        : "Return recommendations and action items for the PDM. English only. Extremely brief strings per property descriptions.",
      parameters: {
        type: "object",
        properties: {
          summary: {
            type: "string",
            description:
              "English. One sentence only, max ~25 words. Main shift for this partner now.",
          },
          recommendations: {
            type: "array",
            minItems: recMin,
            maxItems: recMax,
            items: recommendationItemSchema(),
          },
          action_items: {
            type: "array",
            minItems: actMin,
            maxItems: actMax,
            description: narrowSession
              ? "English. Two or three very short tasks tied to the PDM question."
              : "English. Three to five short tasks; prefer 3 or 4. Very tight wording.",
            items: {
              type: "object",
              properties: {
                axis_key: {
                  type: "string",
                  description: "strategy, offer, recruit, enable, cosell, operate, growth, or success.",
                },
                title: { type: "string", description: "English. One line, under ~12 words." },
                description: {
                  type: "string",
                  description: "English. Omit if title suffices; else one short sentence only.",
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

    const narrowSession = Boolean(body.sessionContext?.trim());
    const tool = buildDeliverRecommendationsTool(narrowSession);

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

function appendMetricsSummary(lines: string[], body: CoachRequest) {
  const m = body.metricsSummary?.trim();
  if (!m) return;
  lines.push("");
  lines.push("PARTNER METRICS (self-reported snapshots; do not invent numbers or facts beyond these lines):");
  lines.push(m);
}

function appendNarrowSessionPriority(lines: string[]) {
  lines.push("");
  lines.push("PRIORITY FOR THIS RUN:");
  lines.push(
    "The PDM instructions block above is the main deliverable. Both recommendations must answer it directly with small concrete steps (owner on the partner side, cadence, agenda, time-box, async fallback if they miss the meeting).",
  );
  lines.push(
    "Do not propose parallel mega-initiatives (hiring waves, MDF programs, full JBP rewrites, certification roadmaps) unless the PDM instructions explicitly ask for them.",
  );
  lines.push("Ground statements in diagnostic scores and metrics lines only.");
}

function buildOverallPrompt(body: CoachRequest): string {
  const lines: string[] = [];
  const narrow = Boolean(body.sessionContext?.trim());
  lines.push("CONTEXT (for reading only; your tool output is entirely in English):");
  lines.push("");
  lines.push("PARTNER:");
  lines.push(`Name: ${body.partner.name}`);
  if (body.partner.company) lines.push(`Company: ${body.partner.company}`);
  if (body.partner.segment) lines.push(`Segment: ${body.partner.segment}`);
  if (body.partner.tier) lines.push(`Tier: ${body.partner.tier}`);
  if (body.partner.status) lines.push(`Status: ${body.partner.status}`);
  if (body.partner.notes) lines.push(`PDM notes: ${body.partner.notes}`);
  appendMetricsSummary(lines, body);
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
    appendNarrowSessionPriority(lines);
  }
  lines.push("");
  lines.push("TASK:");
  if (narrow) {
    lines.push(
      "Be extremely brief. Exactly 2 recommendations and 2 to 3 action items only (tool schema enforces this). One sentence summary max ~22 words. Each recommendation: tight why, how with at most two steps, short outcome. Tie every item to the PDM question first; use scores only as support. Output JSON entirely in English, friendly, no OCTA, no em dash, no hyphen bullets in prose. axis_key stays English as listed.",
    );
  } else {
    lines.push(
      "Be extremely brief. Suggest 3 to 4 high impact recommendations only, plus 3 to 5 very short action items (cap 5). One sentence summary max ~25 words. Each recommendation: tight why, how with at most two steps, short outcome. Prioritize lower scores that unlock pipeline or trust. Output JSON entirely in English, friendly, no OCTA, no em dash, no hyphen bullets in prose. axis_key stays English as listed.",
    );
  }
  return lines.join("\n");
}

function buildFocusPrompt(body: CoachRequest, focus: AxisInput): string {
  const lines: string[] = [];
  const narrow = Boolean(body.sessionContext?.trim());
  lines.push("CONTEXT (for reading only; your tool output is entirely in English):");
  lines.push("");
  lines.push(`Partner: ${body.partner.name}${body.partner.company ? `, ${body.partner.company}` : ""}`);
  if (body.partner.tier) lines.push(`Tier: ${body.partner.tier}, status: ${body.partner.status ?? "n/a"}`);
  if (body.partner.notes) lines.push(`PDM notes: ${body.partner.notes}`);
  appendMetricsSummary(lines, body);
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
    appendNarrowSessionPriority(lines);
  }
  lines.push("");
  lines.push("TASK:");
  if (narrow) {
    lines.push(
      `Be extremely brief. Exactly 2 recommendations centered on dimension ${focus.key} only, plus 2 to 3 very short action items. One sentence summary max ~22 words. Tight fields per system LENGTH. Tie every item to the PDM question first while staying in this dimension when possible. All tool output in English, friendly, no OCTA, no em dash, no hyphen bullets in prose. axis_key values remain English.`,
    );
  } else {
    lines.push(
      `Be extremely brief. Give 3 to 4 concrete recommendations centered on dimension ${focus.key} only, plus 3 to 5 very short action items (cap 5). One sentence summary max ~25 words. Tight fields per system LENGTH. All tool output in English, friendly, no OCTA, no em dash, no hyphen bullets in prose. axis_key values remain English.`,
    );
  }
  return lines.join("\n");
}
