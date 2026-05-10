// AI Coach edge function — generates personalized recommendations for a partner using Lovable AI.
// Uses Gemini 2.5 Flash by default. Falls back to Pro if requested.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

    const system = `You are a senior B2B partnership operating coach inside the Alliara platform.
You advise Partner Development Managers (PDMs) on how to develop channel maturity with a specific partner across 8 dimensions (keys: strategy, offer, recruit, enable, cosell, operate, growth, success — see product methodology for what each covers).
You write directly to the PDM. Be concrete, specific to this partner, and prescriptive. No fluff. No generic advice.`;

    const userPrompt = focus
      ? buildFocusPrompt(body, focus)
      : buildOverallPrompt(body);

    const tool = {
      type: "function",
      function: {
        name: "deliver_recommendations",
        description: "Return prescriptive recommendations and ready-to-use action items for the PDM.",
        parameters: {
          type: "object",
          properties: {
            summary: {
              type: "string",
              description: "2-3 sentences naming the single most important shift this PDM should drive with this partner right now.",
            },
            recommendations: {
              type: "array",
              minItems: 3,
              maxItems: 5,
              items: {
                type: "object",
                properties: {
                  axis_key: { type: "string", description: "Dimension key the recommendation addresses (strategy, offer, recruit, enable, cosell, operate, growth, success)." },
                  title: { type: "string", description: "Sharp, action-oriented headline." },
                  why: { type: "string", description: "Why this matters specifically for this partner given their score and context." },
                  how: { type: "string", description: "Concrete step-by-step the PDM takes in the next 2-4 weeks." },
                  expected_outcome: { type: "string", description: "What changes if this is executed well." },
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
              maxItems: 8,
              description: "Ready-to-add tasks for the partner action plan.",
              items: {
                type: "object",
                properties: {
                  axis_key: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
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
          { role: "system", content: system },
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
  lines.push(`PARTNER:`);
  lines.push(`- Name: ${body.partner.name}`);
  if (body.partner.company) lines.push(`- Company: ${body.partner.company}`);
  if (body.partner.segment) lines.push(`- Segment: ${body.partner.segment}`);
  if (body.partner.tier) lines.push(`- Tier: ${body.partner.tier}`);
  if (body.partner.status) lines.push(`- Status: ${body.partner.status}`);
  if (body.partner.notes) lines.push(`- PDM notes: ${body.partner.notes}`);
  lines.push(``);
  lines.push(`OVERALL CHANNEL MATURITY: ${body.overall.toFixed(1)} / 5.0`);
  lines.push(``);
  lines.push(`DIMENSION SCORES (1=reactive, 5=compounding):`);
  for (const a of body.axes) {
    lines.push(`- ${a.name} (${a.key}): ${a.score.toFixed(1)} → level ${a.level}`);
    lines.push(`  · mental model: ${a.mentalModel}`);
    if (a.nextLevelStep) lines.push(`  · canonical next step at this level: ${a.nextLevelStep}`);
  }
  lines.push(``);
  lines.push(`TASK:`);
  lines.push(`Identify the 3-5 highest-leverage moves this PDM should make in the next 30-60 days to strengthen this channel relationship. Prioritize the lowest-scoring dimensions that unlock the most pipeline. Each recommendation must be concrete to this partner — never generic.`);
  return lines.join("\n");
}

function buildFocusPrompt(body: CoachRequest, focus: AxisInput): string {
  const lines: string[] = [];
  lines.push(`PARTNER: ${body.partner.name}${body.partner.company ? ` (${body.partner.company})` : ""}`);
  if (body.partner.tier) lines.push(`Tier: ${body.partner.tier} · Status: ${body.partner.status ?? "n/a"}`);
  if (body.partner.notes) lines.push(`PDM notes: ${body.partner.notes}`);
  lines.push(``);
  lines.push(`FOCUS DIMENSION: ${focus.name} (${focus.key})`);
  lines.push(`Current score: ${focus.score.toFixed(1)} → level ${focus.level} / 5`);
  lines.push(`Mental model: ${focus.mentalModel}`);
  lines.push(`Common mistakes to avoid: ${focus.commonMistakes.join("; ")}`);
  lines.push(`Available levers: ${focus.levers.join("; ")}`);
  if (focus.nextLevelStep) lines.push(`Canonical next step: ${focus.nextLevelStep}`);
  lines.push(``);
  lines.push(`OTHER DIMENSIONS (for context):`);
  for (const a of body.axes.filter((x) => x.key !== focus.key)) {
    lines.push(`- ${a.name}: ${a.score.toFixed(1)}`);
  }
  lines.push(``);
  lines.push(`TASK:`);
  lines.push(`Generate 3-5 prescriptive recommendations focused on the ${focus.name} dimension specifically for this partner. Translate every recommendation into ready-to-use action items the PDM can paste straight into the partner action plan.`);
  return lines.join("\n");
}