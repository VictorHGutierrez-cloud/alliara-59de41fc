const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const MODEL_ALIASES: Record<string, string> = {
  "google/gemini-2.5-flash": "gpt-4o-mini",
  "google/gemini-2.5-pro": "gpt-4o",
};

export function resolveModel(requested?: string): string {
  const fallback = Deno.env.get("OPENAI_MODEL_DEFAULT") ?? "gpt-4o-mini";
  if (!requested) return fallback;
  return MODEL_ALIASES[requested] ?? requested;
}

export function getOpenAiApiKey(): string {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
  return apiKey;
}

export async function chatCompletion(params: {
  model?: string;
  messages: unknown[];
  tools?: unknown[];
  tool_choice?: unknown;
  temperature?: number;
}): Promise<Response> {
  const body: Record<string, unknown> = {
    model: resolveModel(params.model),
    messages: params.messages,
  };
  if (params.tools) body.tools = params.tools;
  if (params.tool_choice) body.tool_choice = params.tool_choice;
  if (params.temperature !== undefined) body.temperature = params.temperature;

  return fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getOpenAiApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export async function mapAiHttpError(resp: Response, label: string): Promise<Response | null> {
  if (resp.ok) return null;
  const text = await resp.text();
  console.error(`${label} error`, resp.status, text);
  if (resp.status === 429) {
    return new Response(JSON.stringify({ error: "Rate limit, try again shortly." }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (resp.status === 402) {
    return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
      status: 402,
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ error: "AI provider error" }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
