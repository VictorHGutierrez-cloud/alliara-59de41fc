// Kept Ask — open Q&A. Calls Lovable AI Gateway and returns a plain markdown-style answer.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are Kept, the friendly partner-success assistant inside Alliara.
You can answer ANY question the Partner Development Manager (PDM) asks — about partner strategy, channel maturity, deals, enablement, co-sell, operations, growth, success, or general work questions.
Tone: warm, clear, human. Short sentences. Plain words. No empty corporate jargon. No em dashes. Light markdown is OK (bold, lists). Always reply in English.
Never mention OCTA or internal model names. Refer to the product as Alliara when needed.

If the user asks about "my partners", a partner by name, the portfolio, a tier, or "who is at risk", USE the partner list provided in the user-context block below. Match names case-insensitively and tolerate small typos. If a partner is not in the list, say so plainly.`;

interface AskRequest {
  question: string;
  history?: { role: "user" | "assistant"; content: string }[];
  model?: string;
  context?: {
    partners?: Array<{
      name: string;
      company?: string | null;
      segment?: string | null;
      tier?: string | null;
      status?: string | null;
      partner_type?: string | null;
      health?: number | null;
      open_actions?: number | null;
      notes?: string | null;
    }>;
    pdmName?: string | null;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = (await req.json()) as AskRequest;
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");
    const question = (body.question ?? "").trim();
    if (!question) return json({ error: "Empty question" }, 400);

    const partners = body.context?.partners ?? [];
    const portfolioBlock = partners.length
      ? [
          `\n\n--- USER CONTEXT (${body.context?.pdmName ?? "PDM"}'s portfolio, ${partners.length} partner${partners.length === 1 ? "" : "s"}) ---`,
          ...partners.slice(0, 80).map((p) => {
            const parts = [
              `• ${p.name}${p.company ? ` (${p.company})` : ""}`,
              p.tier ? `tier=${p.tier}` : null,
              p.status ? `status=${p.status}` : null,
              p.partner_type ? `type=${p.partner_type}` : null,
              p.segment ? `segment=${p.segment}` : null,
              p.health != null ? `health=${p.health}` : null,
              p.open_actions != null ? `open_actions=${p.open_actions}` : null,
            ].filter(Boolean);
            const line = parts.join(" · ");
            return p.notes ? `${line}\n   notes: ${String(p.notes).slice(0, 180)}` : line;
          }),
          "--- END USER CONTEXT ---",
        ].join("\n")
      : "\n\n(No partners in this PDM's portfolio yet.)";

    const messages = [
      { role: "system", content: SYSTEM + portfolioBlock },
      ...(body.history ?? []).slice(-12),
      { role: "user", content: question },
    ];

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: body.model ?? "google/gemini-2.5-flash",
        temperature: 0.5,
        messages,
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("kept-ask gateway error", aiResp.status, t);
      if (aiResp.status === 429) return json({ error: "Rate limit, try again shortly." }, 429);
      if (aiResp.status === 402) return json({ error: "AI credits exhausted." }, 402);
      return json({ error: "AI gateway error" }, 500);
    }
    const data = await aiResp.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";
    return json({ ok: true, content }, 200);
  } catch (e) {
    console.error("kept-ask error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}