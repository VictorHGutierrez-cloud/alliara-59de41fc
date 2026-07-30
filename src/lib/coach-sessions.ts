import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type CoachSessionMode = "stuck" | "prep" | "briefing" | "free" | "roleplay";
export type ChampionStatus = "yes" | "no" | "unsure";

export const ROLEPLAY_PERSONAS = [
  {
    value: "skeptical-cfo",
    label: "Skeptical CFO",
    description: "Wants numbers, hates fluff, questions every ROI claim.",
  },
  {
    value: "busy-chro",
    label: "Busy CHRO",
    description: "Ten minutes max, drowning in priorities, needs a reason to care.",
  },
  {
    value: "pragmatic-coo",
    label: "Pragmatic COO",
    description: "Process-first, wants proof it works before believing anything.",
  },
  {
    value: "rushed-founder",
    label: "Founder in a hurry",
    description: "Decides fast, gets bored faster, allergic to corporate talk.",
  },
  {
    value: "tough-procurement",
    label: "Tough procurement",
    description: "Discount hunter who plays vendors against each other.",
  },
] as const;

export const ROLEPLAY_SCENARIOS = [
  { value: "cold-call", label: "Cold call" },
  { value: "discovery", label: "Discovery call" },
  { value: "demo-followup", label: "Post-demo follow-up" },
  { value: "negotiation", label: "Negotiation / discount ask" },
  { value: "objection-gauntlet", label: "Objection gauntlet" },
] as const;

export const ROLEPLAY_DIFFICULTIES = [
  { value: "warmup", label: "Warm-up" },
  { value: "realistic", label: "Realistic" },
  { value: "brutal", label: "Brutal" },
] as const;

export function roleplayPersonaLabel(value: string | null): string | null {
  if (!value) return null;
  return ROLEPLAY_PERSONAS.find((p) => p.value === value)?.label ?? value;
}

export function roleplayScenarioLabel(value: string | null): string | null {
  if (!value) return null;
  return ROLEPLAY_SCENARIOS.find((s) => s.value === value)?.label ?? value;
}

export function roleplayDifficultyLabel(value: string | null): string | null {
  if (!value) return null;
  return ROLEPLAY_DIFFICULTIES.find((d) => d.value === value)?.label ?? value;
}

export type CoachChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type CoachSession = {
  id: string;
  user_id: string;
  mode: CoachSessionMode;
  title: string;
  deal_name: string | null;
  stage: string | null;
  has_champion: ChampionStatus | null;
  competitor: string | null;
  situation: string;
  source: string | null;
  slug: string | null;
  persona: string | null;
  scenario: string | null;
  difficulty: string | null;
  messages: CoachChatMessage[];
  created_at: string;
  updated_at: string;
};

export type CreateCoachSessionInput = {
  mode: CoachSessionMode;
  title: string;
  deal_name?: string | null;
  stage?: string | null;
  has_champion?: ChampionStatus | null;
  competitor?: string | null;
  situation?: string;
  source?: string | null;
  slug?: string | null;
  persona?: string | null;
  scenario?: string | null;
  difficulty?: string | null;
  messages?: CoachChatMessage[];
};

export const DEAL_STAGES = [
  { value: "discovery", label: "Discovery" },
  { value: "demo", label: "Demo" },
  { value: "evaluation", label: "Evaluation / POC" },
  { value: "proposal", label: "Proposal" },
  { value: "negotiation", label: "Negotiation" },
  { value: "closed-won", label: "Closed won" },
  { value: "closed-lost", label: "Closed lost" },
  { value: "other", label: "Other" },
] as const;

function parseMessages(raw: unknown): CoachChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (m): m is CoachChatMessage =>
        !!m &&
        typeof m === "object" &&
        (m as CoachChatMessage).role !== undefined &&
        ((m as CoachChatMessage).role === "user" ||
          (m as CoachChatMessage).role === "assistant") &&
        typeof (m as CoachChatMessage).content === "string",
    )
    .map((m) => ({ role: m.role, content: m.content }));
}

function mapRow(row: Record<string, unknown>): CoachSession {
  const mode = row.mode as CoachSessionMode;
  const champion = row.has_champion;
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    mode:
      mode === "stuck" ||
      mode === "prep" ||
      mode === "briefing" ||
      mode === "free" ||
      mode === "roleplay"
        ? mode
        : "free",
    title: (row.title as string) ?? "",
    deal_name: (row.deal_name as string | null) ?? null,
    stage: (row.stage as string | null) ?? null,
    has_champion:
      champion === "yes" || champion === "no" || champion === "unsure" ? champion : null,
    competitor: (row.competitor as string | null) ?? null,
    situation: (row.situation as string) ?? "",
    source: (row.source as string | null) ?? null,
    slug: (row.slug as string | null) ?? null,
    persona: (row.persona as string | null) ?? null,
    scenario: (row.scenario as string | null) ?? null,
    difficulty: (row.difficulty as string | null) ?? null,
    messages: parseMessages(row.messages),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function createSession(
  userId: string,
  input: CreateCoachSessionInput,
): Promise<{ session: CoachSession | null; error?: string }> {
  const { data, error } = await supabase
    .from("coach_sessions")
    .insert({
      user_id: userId,
      mode: input.mode,
      title: input.title.trim() || "Untitled session",
      deal_name: input.deal_name?.trim() || null,
      stage: input.stage?.trim() || null,
      has_champion: input.has_champion ?? null,
      competitor: input.competitor?.trim() || null,
      situation: input.situation?.trim() || "",
      source: input.source ?? null,
      slug: input.slug ?? null,
      persona: input.persona ?? null,
      scenario: input.scenario ?? null,
      difficulty: input.difficulty ?? null,
      messages: (input.messages ?? []) as Json,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    console.error("[createSession]:", error);
    return { session: null, error: error.message };
  }
  return { session: mapRow(data as Record<string, unknown>) };
}

export async function listRecentSessions(
  userId: string,
  limit = 5,
): Promise<CoachSession[]> {
  const { data, error } = await supabase
    .from("coach_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[listRecentSessions]:", error);
    return [];
  }
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function loadSession(
  userId: string,
  sessionId: string,
): Promise<CoachSession | null> {
  const { data, error } = await supabase
    .from("coach_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("id", sessionId)
    .maybeSingle();

  if (error) {
    console.error("[loadSession]:", error);
    return null;
  }
  if (!data) return null;
  return mapRow(data as Record<string, unknown>);
}

export async function saveSessionMessages(
  sessionId: string,
  messages: CoachChatMessage[],
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("coach_sessions")
    .update({
      messages: messages as Json,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  if (error) {
    console.error("[saveSessionMessages]:", error);
    return { error: error.message };
  }
  return {};
}

export function sessionBannerLabel(session: CoachSession): string {
  if (session.mode === "roleplay") {
    const parts = [
      "Roleplay",
      roleplayPersonaLabel(session.persona),
      roleplayScenarioLabel(session.scenario),
      roleplayDifficultyLabel(session.difficulty),
    ].filter(Boolean);
    if (session.deal_name) parts.push(session.deal_name);
    return parts.join(" · ");
  }
  const parts: string[] = [];
  if (session.deal_name) parts.push(session.deal_name);
  else if (session.title) parts.push(session.title);
  if (session.stage) {
    const stageLabel = DEAL_STAGES.find((s) => s.value === session.stage)?.label ?? session.stage;
    parts.push(stageLabel);
  }
  if (session.has_champion) {
    parts.push(
      session.has_champion === "yes"
        ? "Champion: yes"
        : session.has_champion === "no"
          ? "Champion: no"
          : "Champion: unsure",
    );
  }
  if (session.competitor) parts.push(`vs ${session.competitor}`);
  return parts.join(" · ") || session.title || "Coach session";
}

export function sessionToAskContext(session: CoachSession) {
  return {
    topic: session.title || session.deal_name || undefined,
    slug: session.slug || undefined,
    source:
      session.source === "library" ||
      session.source === "briefing" ||
      session.source === "dock" ||
      session.source === "hub"
        ? session.source
        : undefined,
    mode: session.mode,
    deal_name: session.deal_name || undefined,
    stage: session.stage || undefined,
    has_champion: session.has_champion || undefined,
    competitor: session.competitor || undefined,
    situation: session.situation || undefined,
    persona: session.persona || undefined,
    scenario: session.scenario || undefined,
    difficulty: session.difficulty || undefined,
  };
}
