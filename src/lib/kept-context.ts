import { supabase } from "@/integrations/supabase/client";

export interface KeptPartnerSummary {
  name: string;
  company: string | null;
  segment: string | null;
  tier: string | null;
  status: string | null;
  partner_type: string | null;
  notes: string | null;
  health: number | null;
  open_actions: number;
}

export interface KeptContext {
  pdmName: string | null;
  partners: KeptPartnerSummary[];
}

/** Compact portfolio snapshot Kept can read when answering questions. */
export async function buildKeptContext(userId: string): Promise<KeptContext> {
  const [{ data: partners }, { data: profile }] = await Promise.all([
    supabase
      .from("partners")
      .select("id, name, company, segment, tier, status, partner_type, notes")
      .eq("owner_id", userId)
      .order("updated_at", { ascending: false })
      .limit(80),
    supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
  ]);

  const ids = (partners ?? []).map((p) => p.id);
  let latestByPartner = new Map<string, number>();
  let openByPartner = new Map<string, number>();

  if (ids.length) {
    const [{ data: ass }, { data: acts }] = await Promise.all([
      supabase
        .from("assessments")
        .select("partner_id, overall, created_at")
        .in("partner_id", ids)
        .order("created_at", { ascending: false }),
      supabase
        .from("action_plans")
        .select("partner_id, status")
        .in("partner_id", ids)
        .neq("status", "done"),
    ]);
    for (const a of (ass ?? []) as Array<{ partner_id: string; overall: number }>) {
      if (a.partner_id && !latestByPartner.has(a.partner_id)) {
        latestByPartner.set(a.partner_id, Number(a.overall));
      }
    }
    for (const a of (acts ?? []) as Array<{ partner_id: string }>) {
      openByPartner.set(a.partner_id, (openByPartner.get(a.partner_id) ?? 0) + 1);
    }
  }

  return {
    pdmName: profile?.display_name ?? null,
    partners: (partners ?? []).map((p) => ({
      name: p.name,
      company: p.company,
      segment: p.segment,
      tier: p.tier,
      status: p.status,
      partner_type: p.partner_type,
      notes: p.notes,
      health: latestByPartner.get(p.id) ?? null,
      open_actions: openByPartner.get(p.id) ?? 0,
    })),
  };
}

/* ─── Local conversation store (single conversation, this browser) ─── */

export type KeptMsg = { role: "user" | "assistant"; content: string };
const STORAGE_KEY = "alliara-kept-chat-v1";
const EVENT = "alliara-kept-chat-changed";

export function loadKeptMessages(): KeptMsg[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m): m is KeptMsg =>
        m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string",
    );
  } catch {
    return [];
  }
}

export function saveKeptMessages(msgs: KeptMsg[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    /* ignore */
  }
}

export function clearKeptMessages(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    /* ignore */
  }
}

/** Subscribe to changes to the local Kept conversation (cross-tab + intra-tab). */
export function subscribeKeptMessages(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}