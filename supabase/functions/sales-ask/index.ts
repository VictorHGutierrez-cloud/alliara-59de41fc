// Sales coach — situational Q&A for enablement library (MEDDPICC, champion, demos, objections).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { chatCompletion, mapAiHttpError } from "../_shared/ai.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LIBRARY_INDEX = `
Available resources in the Academy library (point sellers to these by name when relevant):
- Sales psychology training (2026): risk-first selling, cognitive empathy, decision fatigue, Dark Funnel, buying committees
- Enterprise sales playbook: MEDDPICC scoring, SPIN, bundles, champion enablement
- SMB sales playbook: fast qualify, 20-min demo, land bundles
- The People Path: interactive lifecycle demo story (8 beats)
- US & Caribbean battle cards: HiBob, Personio, champion one-liners
`;

const SYSTEM = `You are the Executive Academy coach inside Kept — a practical coach for B2B sales executives and leaders.

Your job: answer situational sales questions with clear, actionable guidance. Sellers may be stuck mid-deal ("what do I do now?"), preparing a call, or learning methodology.

LANGUAGE: Reply in clear English. Keep tone warm, direct, like a senior peer — not corporate fluff.

FRAMEWORKS YOU KNOW:
- MEDDPICC (Metrics, Economic Buyer, Decision Criteria, Decision Process, Paper, Identify Pain, Champion, Competition)
- Champion = internal ally who sells for you when you leave the room — NOT the same as Economic Buyer
- SPIN (Situation, Problem, Implication, Need-payoff) — lead with Implication for urgency
- Loss aversion / risk-first framing beats feature tours
- Cognitive empathy (map buyer constraints) beats affective empathy (mirroring anxiety)
- Adaptive selling: strategic silence, objections-as-fear, shelf the expert
- Land narrow (Core + Time + Leave for SMB), expand later
- People Path demo story beats — never a 40-menu feature tour

WHEN THEY ASK "WHAT DO I DO NOW?":
1. Clarify the immediate blocker in one sentence
2. Give 2–3 concrete next steps (who to contact, what to ask, what to send)
3. Name which MEDDPICC letter is weakest if relevant
4. If no champion yet, say how to test for champion signals

FORMAT: Short paragraphs. Light markdown OK (bold, numbered lists). No em dashes. Under ~250 words unless they ask for depth.

${LIBRARY_INDEX}

Never invent product features. If unsure, say what to validate with Product/SE. Never mention partner portfolios, PDM workflows, HubSpot, or OCTA diagnostics.`;

interface AskRequest {
  question: string;
  history?: { role: "user" | "assistant"; content: string }[];
  context?: {
    topic?: string;
    slug?: string;
    source?: "library" | "briefing" | "dock";
  };
}

function buildSystem(context?: AskRequest["context"]): string {
  if (!context?.topic && !context?.slug && !context?.source) return SYSTEM;
  const lines = ["\n\nSESSION CONTEXT (use this to tailor your answer):"];
  if (context.topic) lines.push(`- Topic: ${context.topic}`);
  if (context.slug) lines.push(`- Academy material slug: ${context.slug}`);
  if (context.source) lines.push(`- User arrived from: ${context.source}`);
  lines.push("- Tie advice to this material or briefing when relevant.");
  return SYSTEM + lines.join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = (await req.json()) as AskRequest;
    const question = (body.question ?? "").trim();
    if (!question) return json({ error: "Empty question" }, 400);

    const messages = [
      { role: "system", content: buildSystem(body.context) },
      ...(body.history ?? []).slice(-12),
      { role: "user", content: question },
    ];

    const aiResp = await chatCompletion({
      temperature: 0.45,
      messages,
    });

    const aiError = await mapAiHttpError(aiResp, "sales-ask");
    if (aiError) {
      const headers = { ...corsHeaders, "Content-Type": "application/json" };
      return new Response(aiError.body, { status: aiError.status, headers });
    }

    const data = await aiResp.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";
    return json({ ok: true, content }, 200);
  } catch (e) {
    console.error("sales-ask error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
