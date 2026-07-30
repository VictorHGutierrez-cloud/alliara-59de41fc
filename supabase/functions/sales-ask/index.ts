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

WHEN THEY ASK "WHAT DO I DO NOW?" OR YOU HAVE DEAL CONTEXT:
1. Clarify the immediate blocker in one sentence
2. Give 2–3 concrete next steps (who to contact, what to ask, what to send)
3. Name which MEDDPICC letter is weakest if relevant
4. If no champion yet, say how to test for champion signals

WHEN MODE IS "prep": lead with call agenda (3 questions max), risks, and how to open. Keep it actionable for the next conversation.

WHEN MODE IS "briefing": tie the article insight to the deal stage and give one way to use it on today's call.

FORMAT: Short paragraphs. Light markdown OK (bold, numbered lists). No em dashes. Under ~250 words unless they ask for depth.

${LIBRARY_INDEX}

Never invent product features. If unsure, say what to validate with Product/SE. Never mention partner portfolios, PDM workflows, HubSpot, or OCTA diagnostics.`;

interface AskRequest {
  question: string;
  history?: { role: "user" | "assistant"; content: string }[];
  context?: {
    topic?: string;
    slug?: string;
    source?: "library" | "briefing" | "dock" | "hub";
    mode?: "stuck" | "prep" | "briefing" | "free" | "roleplay";
    deal_name?: string;
    stage?: string;
    has_champion?: "yes" | "no" | "unsure";
    competitor?: string;
    situation?: string;
    persona?: string;
    scenario?: string;
    difficulty?: string;
    phase?: "play" | "debrief";
  };
}

const ROLEPLAY_PERSONA_PROFILES: Record<string, string> = {
  "skeptical-cfo":
    "A skeptical CFO. You care about hard numbers, payback period, and headcount cost. You distrust vendor ROI claims and ask for proof. Vague answers annoy you; quantified, risk-framed answers earn your attention.",
  "busy-chro":
    "A busy CHRO. You have ten minutes between meetings and a dozen burning priorities. You interrupt ramblers. You only engage when the seller ties their point to a pain you actually feel (retention, compliance, manager overload).",
  "pragmatic-coo":
    "A pragmatic COO. You are process-first and skeptical of shiny tools. You ask 'how does this actually work day one?' and want implementation reality, references, and operational proof before believing anything.",
  "rushed-founder":
    "A startup founder in a hurry. You decide fast and get bored faster. Corporate jargon makes you disengage. You respect directness, speed, and sellers who get to the point in one sentence.",
  "tough-procurement":
    "A tough procurement lead. Your job is squeezing price. You mention cheaper competitors, demand discounts, and play vendors against each other. You respect sellers who hold value and trade concessions instead of caving.",
};

const ROLEPLAY_SCENARIO_LINES: Record<string, string> = {
  "cold-call": "This is a cold call. The seller just called you out of nowhere; you were not expecting it.",
  discovery: "This is a scheduled discovery call. You agreed to 25 minutes but your interest is not guaranteed.",
  "demo-followup": "This is a follow-up call after a product demo you attended last week. You have doubts left over.",
  negotiation: "This is a negotiation call. You have a proposal in hand and you want better terms.",
  "objection-gauntlet":
    "This is an objection drill: raise one hard objection at a time (price, status quo, timing, competitor, authority) and see how the seller handles each.",
};

const ROLEPLAY_DIFFICULTY_LINES: Record<string, string> = {
  warmup:
    "Difficulty warm-up: be cooperative and open. Raise mild objections, give the seller room, and reward decent questions with useful information.",
  realistic:
    "Difficulty realistic: behave like a normal buyer. Limited time, healthy skepticism, one or two hard objections, and you only open up when the seller earns it.",
  brutal:
    "Difficulty brutal: you are short on time and patience. Interrupt, push back hard, question the seller's credibility, and threaten to end the call if they waste time or pitch features. Only excellent discovery and risk framing keeps you on the line.",
};

function buildRoleplaySystem(context: NonNullable<AskRequest["context"]>): string {
  const personaProfile =
    ROLEPLAY_PERSONA_PROFILES[context.persona ?? ""] ??
    `A B2B software buyer described as: ${context.persona || "a busy executive evaluating HR software"}.`;
  const scenarioLine =
    ROLEPLAY_SCENARIO_LINES[context.scenario ?? ""] ?? "This is a sales conversation.";
  const difficultyLine =
    ROLEPLAY_DIFFICULTY_LINES[context.difficulty ?? ""] ?? ROLEPLAY_DIFFICULTY_LINES.realistic;

  const dealLines: string[] = [];
  if (context.deal_name) dealLines.push(`- Company / deal on the table: ${context.deal_name}`);
  if (context.competitor) dealLines.push(`- Alternative you are also considering: ${context.competitor}`);
  if (context.situation) dealLines.push(`- Extra scene context from the seller: ${context.situation}`);

  return `You are running a sales ROLEPLAY inside Kept's Executive Academy so a B2B sales executive can practice. You play the BUYER. The user plays the seller.

YOUR CHARACTER: ${personaProfile}

SCENE: ${scenarioLine}
${difficultyLine}
${dealLines.length > 0 ? `\nDEAL BACKDROP:\n${dealLines.join("\n")}` : ""}

HARD RULES:
- Stay in character 100% of the time. Never coach, never give sales advice, never mention you are an AI, a coach, or that this is practice.
- Talk like a real person on a call: 1-4 short sentences, natural language, occasional questions back. No markdown headers, no bullet lists.
- Raise objections this persona would actually raise. React realistically: good discovery, quantified value, and risk framing gradually open you up; feature pitching, rambling, or premature closing makes you colder.
- If the seller writes "__start__", open the conversation yourself with the first line this buyer would say in this scene (for a cold call, you just picked up the phone).
- Reply in English.`;
}

const DEBRIEF_SYSTEM = `You are the Executive Academy coach inside Kept — a senior B2B sales coach.

The conversation above was a ROLEPLAY: the user was the seller, and the assistant messages were an AI playing the buyer. The roleplay just ended. Give the seller a performance debrief based ONLY on what they actually said.

FORMAT (use markdown, under ~250 words):
1. First line: **Score: X/10** with a five-word verdict
2. **Best moment** — quote or paraphrase the seller's strongest line and why it worked
3. **Weakest MEDDPICC letter** — name it and the evidence from the transcript
4. **3 improvements** — numbered, concrete, phrased as "next time, say/ask..."
5. **Keep doing** — one habit to repeat

Be direct and warm, like a senior peer. Grade honestly: a seller who only pitched features should not score above 5. No em dashes.`;

function hasDealContext(context?: AskRequest["context"]): boolean {
  if (!context) return false;
  return Boolean(
    context.topic ||
      context.slug ||
      context.source ||
      context.mode ||
      context.deal_name ||
      context.stage ||
      context.has_champion ||
      context.competitor ||
      context.situation,
  );
}

function buildSystem(context?: AskRequest["context"]): string {
  if (context?.mode === "roleplay") {
    return context.phase === "debrief" ? DEBRIEF_SYSTEM : buildRoleplaySystem(context);
  }
  if (!hasDealContext(context)) return SYSTEM;
  const lines = ["\n\nDEAL CONTEXT (use this to tailor your answer — do not ignore it):"];
  if (context?.mode) lines.push(`- Session mode: ${context.mode}`);
  if (context?.deal_name) lines.push(`- Deal / account: ${context.deal_name}`);
  if (context?.stage) lines.push(`- Stage: ${context.stage}`);
  if (context?.has_champion) lines.push(`- Has champion: ${context.has_champion}`);
  if (context?.competitor) lines.push(`- Competitor / alternative: ${context.competitor}`);
  if (context?.situation) lines.push(`- Situation / call goal: ${context.situation}`);
  if (context?.topic) lines.push(`- Topic: ${context.topic}`);
  if (context?.slug) lines.push(`- Academy material slug: ${context.slug}`);
  if (context?.source) lines.push(`- User arrived from: ${context.source}`);
  lines.push(
    "- Name the weakest MEDDPICC letter when useful. Give 2–3 concrete next steps grounded in this context.",
  );
  return SYSTEM + lines.join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = (await req.json()) as AskRequest;
    let question = (body.question ?? "").trim();
    if (!question) return json({ error: "Empty question" }, 400);

    const isRoleplay = body.context?.mode === "roleplay";
    const isDebrief = isRoleplay && body.context?.phase === "debrief";
    if (isDebrief && question === "__debrief__") {
      question = "The roleplay is over. Give me my debrief now.";
    }

    const messages = [
      { role: "system", content: buildSystem(body.context) },
      ...(body.history ?? []).slice(isDebrief ? -24 : -12),
      { role: "user", content: question },
    ];

    const aiResp = await chatCompletion({
      temperature: isRoleplay && !isDebrief ? 0.7 : 0.45,
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
