import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type LeadRow = Database["public"]["Tables"]["partner_leads"]["Row"];
export type LeadStatus = Database["public"]["Enums"]["partner_lead_status"];
export type PartnerType = Database["public"]["Enums"]["partner_type"];

export type LeadActivityKind = "task" | "call" | "email" | "meeting" | "note";
export type LeadActivityRow = {
  id: string;
  lead_id: string;
  owner_id: string;
  kind: LeadActivityKind;
  title: string;
  description: string | null;
  due_date: string | null;
  done: boolean;
  done_at: string | null;
  created_at: string;
  updated_at: string;
};

export const LEAD_SOURCES = [
  "Outbound",
  "Inbound",
  "Referral",
  "Event",
  "Partner network",
  "Other",
] as const;

export const LEAD_ACTIVITY_KINDS: { key: LeadActivityKind; label: string; icon: string }[] = [
  { key: "task", label: "Task", icon: "✓" },
  { key: "call", label: "Call", icon: "☎" },
  { key: "email", label: "Email", icon: "✉" },
  { key: "meeting", label: "Meeting", icon: "◧" },
  { key: "note", label: "Note", icon: "✎" },
];

export const LEAD_STATUSES: { key: LeadStatus; label: string }[] = [
  { key: "new", label: "New Lead" },
  { key: "in_review", label: "In Review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export function leadStatusLabel(s: LeadStatus): string {
  return LEAD_STATUSES.find((x) => x.key === s)?.label ?? s;
}

/* ───────────────── Alliara 5-Dimension Scorecard (1–5 per dimension, total 5–25) ───────────────── */

export type DimensionKey =
  | "icp_overlap"
  | "sales_capacity"
  | "delivery_muscle"
  | "business_commitment"
  | "strategic_alignment";

export type ScoreLevel = 1 | 2 | 3 | 4 | 5;

export type DimensionOption = { v: ScoreLevel; label: string; help: string };

export const SCORECARD_MAX_TOTAL = 25;

export const FACTORIAL_DIMENSIONS: {
  key: DimensionKey;
  label: string;
  description: string;
  options: readonly [
    DimensionOption,
    DimensionOption,
    DimensionOption,
    DimensionOption,
    DimensionOption,
  ];
}[] = [
  {
    key: "icp_overlap",
    label: "ICP overlap",
    description: "How well does the partner's customer base match your ideal customer profile?",
    options: [
      { v: 1, label: "1", help: "Wrong segments or company size; almost no addressable overlap." },
      { v: 2, label: "2", help: "Occasional overlap; many accounts are outside target." },
      { v: 3, label: "3", help: "Solid share in broad SMB or mid-market; workable fit." },
      { v: 4, label: "4", help: "Most prospects sit in core size bands and relevant verticals." },
      { v: 5, label: "5", help: "Primary ICP: right size, industry, and buyer you want most." },
    ],
  },
  {
    key: "sales_capacity",
    label: "Sales capacity",
    description: "How many people are dedicated to selling (and closing) deals like yours?",
    options: [
      { v: 1, label: "1", help: "No one dedicated; only ad-hoc mentions or passive inbound." },
      {
        v: 2,
        label: "2",
        help: "One person spends part-time on your category (< half their time).",
      },
      { v: 3, label: "3", help: "At least one seller largely focused on your offer." },
      { v: 4, label: "4", help: "Small team (about 2–4) actively prospecting and closing." },
      {
        v: 5,
        label: "5",
        help: "Larger pod (5+) or mature machine with quota on your product line.",
      },
    ],
  },
  {
    key: "delivery_muscle",
    label: "Delivery muscle",
    description:
      "Can the partner implement and support customers without you carrying every rollout?",
    options: [
      { v: 1, label: "1", help: "Expects you to own delivery end-to-end." },
      { v: 2, label: "2", help: "Light assist only; still leans on you for most rollouts." },
      { v: 3, label: "3", help: "Handles standard onboarding and first value with some guidance." },
      { v: 4, label: "4", help: "Runs most implementations independently; escalates edge cases." },
      { v: 5, label: "5", help: "Owns complex rollouts, adoption, and ongoing success playbooks." },
    ],
  },
  {
    key: "business_commitment",
    label: "Business commitment",
    description: "How serious is the partner about building revenue and joint plans with you?",
    options: [
      { v: 1, label: "1", help: "Opportunistic; no real time or targets." },
      { v: 2, label: "2", help: "Friendly but informal; no shared plan or metrics." },
      { v: 3, label: "3", help: "Active pipeline conversations and lightweight goals." },
      { v: 4, label: "4", help: "Named targets, regular QBRs, and sponsor on their side." },
      {
        v: 5,
        label: "5",
        help: "Executive-backed joint plan with clear revenue and milestone commitments.",
      },
    ],
  },
  {
    key: "strategic_alignment",
    label: "Strategic alignment",
    description: "How well does their positioning and GTM align with yours?",
    options: [
      { v: 1, label: "1", help: "Overlaps with competitors or conflicts with your story." },
      { v: 2, label: "2", help: "Neutral; unclear how you fit their narrative." },
      { v: 3, label: "3", help: "Compatible; they can attach your offer without friction." },
      { v: 4, label: "4", help: "Strong fit; your product is a natural upsell or bundle." },
      {
        v: 5,
        label: "5",
        help: "Strategic lane: ideal partners (e.g. MSP, HR advisory, vertical integrator).",
      },
    ],
  },
];

export function dimensionHelpForValue(key: DimensionKey, v: ScoreLevel | null): string {
  if (v === null) return "";
  const dim = FACTORIAL_DIMENSIONS.find((d) => d.key === key);
  return dim?.options.find((o) => o.v === v)?.help ?? "";
}

/* Storage mapping:
 *   icp_overlap          → sales_score
 *   sales_capacity       → expertise_score
 *   delivery_muscle      → fit_score
 *   business_commitment  → notes JSON block (key: commitment)
 *   strategic_alignment  → notes JSON block (key: alignment)
 */

export type ScorecardMeta = {
  commitment: ScoreLevel | null;
  alignment: ScoreLevel | null;
  rejection_reason: string | null;
};

const SCORECARD_RE = /^<!--FACTORIAL_SCORECARD:(\{[^}]*\})-->\n?/;

export function parseScorecard(notes: string | null | undefined): {
  meta: ScorecardMeta;
  freeText: string;
} {
  const empty: ScorecardMeta = { commitment: null, alignment: null, rejection_reason: null };
  if (!notes) return { meta: empty, freeText: "" };
  const m = notes.match(SCORECARD_RE);
  if (!m) return { meta: empty, freeText: notes };
  try {
    const parsed = JSON.parse(m[1]) as Partial<ScorecardMeta>;
    return {
      meta: {
        commitment: (parsed.commitment as ScorecardMeta["commitment"]) ?? null,
        alignment: (parsed.alignment as ScorecardMeta["alignment"]) ?? null,
        rejection_reason: parsed.rejection_reason ?? null,
      },
      freeText: notes.replace(SCORECARD_RE, ""),
    };
  } catch {
    return { meta: empty, freeText: notes };
  }
}

export function serializeScorecard(meta: ScorecardMeta, freeText: string): string | null {
  const hasMeta = meta.commitment !== null || meta.alignment !== null || meta.rejection_reason;
  const trimmed = (freeText ?? "").trim();
  if (!hasMeta && !trimmed) return null;
  if (!hasMeta) return trimmed;
  const json = JSON.stringify({
    commitment: meta.commitment,
    alignment: meta.alignment,
    rejection_reason: meta.rejection_reason,
  });
  return `<!--FACTORIAL_SCORECARD:${json}-->\n${trimmed}`;
}

export function getDimensionValue(lead: LeadRow, key: DimensionKey): ScoreLevel | null {
  if (key === "icp_overlap") return (lead.sales_score as ScoreLevel | null) ?? null;
  if (key === "sales_capacity") return (lead.expertise_score as ScoreLevel | null) ?? null;
  if (key === "delivery_muscle") return (lead.fit_score as ScoreLevel | null) ?? null;
  const { meta } = parseScorecard(lead.notes);
  if (key === "business_commitment") return meta.commitment;
  return meta.alignment;
}

export function computeFactorialTotal(lead: LeadRow): number | null {
  const vals = FACTORIAL_DIMENSIONS.map((d) => getDimensionValue(lead, d.key));
  if (vals.some((v) => v === null)) return null;
  return vals.reduce<number>((s, v) => s + (v ?? 0), 0);
}

export function factorialVerdict(total: number | null) {
  if (total === null || total < 5) return null;
  if (total <= 12)
    return {
      tone: "red" as const,
      label: "Low fit",
      message:
        "Signals are weak across ICP, capacity, or commitment. Recommendation: reject or keep in nurture.",
    };
  if (total <= 19)
    return {
      tone: "yellow" as const,
      label: "Moderate fit",
      message: "Worth a closer look. Clarify delivery, commitment, and alignment before promoting.",
    };
  return {
    tone: "green" as const,
    label: "Strong fit",
    message:
      "Strong match for Alliara. Good candidate to promote when the deal story is confirmed.",
  };
}

export type LeadsRefreshOpts = { silent?: boolean };

export function useLeads(userId: string | undefined) {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLeadership, setIsLeadership] = useState(false);
  const leadsRef = useRef<LeadRow[]>([]);
  leadsRef.current = leads;

  const refresh = useCallback(
    async (opts?: LeadsRefreshOpts) => {
      if (!userId) return;
      const silent = opts?.silent ?? false;
      if (!silent) setLoading(true);
      try {
        const [{ data: roles }, { data }] = await Promise.all([
          supabase.from("user_roles").select("role").eq("user_id", userId),
          supabase.from("partner_leads").select("*").order("created_at", { ascending: false }),
        ]);
        setIsLeadership((roles ?? []).some((r) => r.role === "leadership" || r.role === "admin"));
        let leadRows = (data ?? []) as LeadRow[];
        // Defensive: if any approved lead points to a partner that no longer exists,
        // the FK should NULL it out automatically — but we double-check on the
        // client to surface "Re-promote" UI instantly without waiting for a refresh.
        const promotedIds = leadRows
          .map((l) => l.promoted_partner_id)
          .filter((id): id is string => Boolean(id));
        if (promotedIds.length > 0) {
          const { data: existing } = await supabase
            .from("partners")
            .select("id")
            .in("id", promotedIds);
          const alive = new Set((existing ?? []).map((p) => (p as { id: string }).id));
          leadRows = leadRows.map((l) =>
            l.promoted_partner_id && !alive.has(l.promoted_partner_id)
              ? {
                  ...l,
                  promoted_partner_id: null,
                  status: l.status === "approved" ? "in_review" : l.status,
                }
              : l,
          );
        }
        setLeads(leadRows);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createLead = useCallback(
    async (input: {
      company_name: string;
      contact_person?: string;
      website?: string;
      partner_type?: PartnerType | null;
      firstTask?: { title: string; due_date?: string | null } | null;
    }) => {
      if (!userId) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("partner_leads")
        .insert({
          owner_id: userId,
          company_name: input.company_name,
          contact_person: input.contact_person ?? null,
          website: input.website ?? null,
          partner_type: input.partner_type ?? null,
        })
        .select("*")
        .single();
      if (error) throw error;
      // Optional: attach a first task in one go so something is always queued
      if (input.firstTask && input.firstTask.title.trim() && data) {
        await supabase.from("partner_lead_activities" as never).insert({
          lead_id: (data as LeadRow).id,
          owner_id: userId,
          kind: "task",
          title: input.firstTask.title.trim(),
          due_date: input.firstTask.due_date ?? null,
        } as never);
      }
      await refresh({ silent: true });
      return data as LeadRow;
    },
    [userId, refresh],
  );

  const updateLead = useCallback(
    async (id: string, patch: Partial<LeadRow>) => {
      const { error } = await supabase.from("partner_leads").update(patch).eq("id", id);
      if (error) throw error;
      await refresh({ silent: true });
    },
    [refresh],
  );

  const deleteLead = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("partner_leads").delete().eq("id", id);
      if (error) throw error;
      await refresh({ silent: true });
    },
    [refresh],
  );

  const setDimension = useCallback(
    async (lead: LeadRow, key: DimensionKey, value: ScoreLevel) => {
      const latest = leadsRef.current.find((l) => l.id === lead.id) ?? lead;
      const { meta, freeText } = parseScorecard(latest.notes);
      const next: LeadRow = { ...latest };
      const patch: Partial<LeadRow> = {};
      if (key === "icp_overlap") {
        next.sales_score = value;
        patch.sales_score = value;
      } else if (key === "sales_capacity") {
        next.expertise_score = value;
        patch.expertise_score = value;
      } else if (key === "delivery_muscle") {
        next.fit_score = value;
        patch.fit_score = value;
      } else {
        const nextMeta: ScorecardMeta = { ...meta };
        if (key === "business_commitment") nextMeta.commitment = value;
        else nextMeta.alignment = value;
        const newNotes = serializeScorecard(nextMeta, freeText);
        next.notes = newNotes;
        patch.notes = newNotes;
      }
      const total = computeFactorialTotal(next);
      patch.total_score = total;
      const { error } = await supabase.from("partner_leads").update(patch).eq("id", latest.id);
      if (error) throw error;
      await refresh({ silent: true });
    },
    [refresh],
  );

  const updateFreeNotes = useCallback(
    async (lead: LeadRow, freeText: string) => {
      const latest = leadsRef.current.find((l) => l.id === lead.id) ?? lead;
      const { meta } = parseScorecard(latest.notes);
      const newNotes = serializeScorecard(meta, freeText);
      const { error } = await supabase
        .from("partner_leads")
        .update({ notes: newNotes })
        .eq("id", latest.id);
      if (error) throw error;
      await refresh({ silent: true });
    },
    [refresh],
  );

  const rejectLead = useCallback(
    async (lead: LeadRow, reason: string) => {
      const latest = leadsRef.current.find((l) => l.id === lead.id) ?? lead;
      const { meta, freeText } = parseScorecard(latest.notes);
      const nextMeta: ScorecardMeta = { ...meta, rejection_reason: reason };
      const newNotes = serializeScorecard(nextMeta, freeText);
      const { error } = await supabase
        .from("partner_leads")
        .update({ status: "rejected", notes: newNotes })
        .eq("id", latest.id);
      if (error) throw error;
      await refresh({ silent: true });
    },
    [refresh],
  );

  const promoteLead = useCallback(
    async (lead: LeadRow, overrides?: { partner_type?: PartnerType }): Promise<string> => {
      if (!userId) throw new Error("Not signed in");
      const latest = leadsRef.current.find((l) => l.id === lead.id) ?? lead;
      const { freeText } = parseScorecard(latest.notes);
      const total = computeFactorialTotal(latest);
      const lines = FACTORIAL_DIMENSIONS.map((d) => {
        const v = getDimensionValue(latest, d.key);
        const hint = v !== null ? dimensionHelpForValue(d.key, v) : "";
        return `  • ${d.label}: ${v ?? "-"}${hint ? ` — ${hint}` : ""}`;
      });
      const promotedByLine =
        latest.owner_id !== userId ? `\n  • Promoted by leadership on behalf of lead owner` : "";
      const notesPrefix =
        `Promoted from qualification — Alliara 5-dimension scorecard (total ${total ?? "-"}/${SCORECARD_MAX_TOTAL}):\n` +
        lines.join("\n") +
        promotedByLine;
      const combinedNotes = freeText ? `${notesPrefix}\n\n${freeText}` : notesPrefix;

      const { data: partner, error: insErr } = await supabase
        .from("partners")
        .insert({
          // The partner lands in the lead owner's portfolio, not the promoter's.
          // RLS allows leadership/admin to insert with another owner_id.
          owner_id: latest.owner_id,
          name: latest.company_name,
          company: latest.company_name,
          tier: "emerging",
          status: "active",
          notes: combinedNotes,
          partner_type: overrides?.partner_type ?? latest.partner_type ?? "referral",
        })
        .select("*")
        .single();
      if (insErr) throw insErr;

      const { error: updErr } = await supabase
        .from("partner_leads")
        .update({ status: "approved", promoted_partner_id: partner.id })
        .eq("id", latest.id);
      if (updErr) throw updErr;

      await refresh({ silent: true });
      return partner.id as string;
    },
    [userId, refresh],
  );

  return {
    leads,
    loading,
    isLeadership,
    refresh,
    createLead,
    updateLead,
    deleteLead,
    setDimension,
    updateFreeNotes,
    rejectLead,
    promoteLead,
  };
}

/* ───────────────── Lead activities (mini-CRM) ───────────────── */

export function useLeadActivities(leadId: string | undefined, userId: string | undefined) {
  const [activities, setActivities] = useState<LeadActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!leadId) {
      setActivities([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("partner_lead_activities" as never)
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });
    setActivities((data as unknown as LeadActivityRow[]) ?? []);
    setLoading(false);
  }, [leadId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(
    async (input: {
      kind: LeadActivityKind;
      title: string;
      description?: string;
      due_date?: string | null;
    }) => {
      if (!userId || !leadId) throw new Error("Not signed in");
      const { error } = await supabase.from("partner_lead_activities" as never).insert({
        lead_id: leadId,
        owner_id: userId,
        kind: input.kind,
        title: input.title,
        description: input.description ?? null,
        due_date: input.due_date ?? null,
      } as never);
      if (error) throw error;
      await refresh();
    },
    [leadId, userId, refresh],
  );

  const toggleDone = useCallback(
    async (a: LeadActivityRow) => {
      const next = !a.done;
      const { error } = await supabase
        .from("partner_lead_activities" as never)
        .update({ done: next, done_at: next ? new Date().toISOString() : null } as never)
        .eq("id", a.id);
      if (error) throw error;
      await refresh();
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("partner_lead_activities" as never)
        .delete()
        .eq("id", id);
      if (error) throw error;
      await refresh();
    },
    [refresh],
  );

  return { activities, loading, refresh, create, toggleDone, remove };
}

export function activitySummary(activities: LeadActivityRow[]): {
  openTasks: number;
  overdue: number;
  nextDue: string | null;
} {
  const today = new Date().toISOString().slice(0, 10);
  let openTasks = 0;
  let overdue = 0;
  let nextDue: string | null = null;
  for (const a of activities) {
    if (a.kind !== "task" || a.done) continue;
    openTasks++;
    if (a.due_date) {
      if (a.due_date < today) overdue++;
      if (!nextDue || a.due_date < nextDue) nextDue = a.due_date;
    }
  }
  return { openTasks, overdue, nextDue };
}

/* ───────────── Aggregated lead tasks across the qualification pipe ───────────── */

export type LeadTaskRow = LeadActivityRow & { lead_company: string; lead_status: LeadStatus };

/** Which lead tasks to load in the qualification “Next moves” list. */
export type LeadTaskListFilter = "open" | "done" | "all";

export function useAllLeadTasks(
  userId: string | undefined,
  leads: LeadRow[],
  filter: LeadTaskListFilter = "open",
) {
  const [tasks, setTasks] = useState<LeadTaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const leadKey = leads
    .map((l) => l.id)
    .sort()
    .join(",");

  const refresh = useCallback(async () => {
    if (!userId || leads.length === 0) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ids = leads.map((l) => l.id);
    let q = supabase
      .from("partner_lead_activities" as never)
      .select("*")
      .in("lead_id", ids)
      .eq("kind", "task");
    if (filter === "open") {
      q = q.eq("done", false);
    } else if (filter === "done") {
      q = q.eq("done", true);
    }
    if (filter === "done") {
      q = q.order("done_at", { ascending: false, nullsFirst: false });
    } else {
      q = q
        .order("done", { ascending: true })
        .order("due_date", { ascending: true, nullsFirst: false });
    }
    const { data, error } = await q;
    if (error) {
      console.error("[useAllLeadTasks - refresh]:", error);
      setTasks([]);
      setLoading(false);
      return;
    }
    const meta = new Map(leads.map((l) => [l.id, { name: l.company_name, status: l.status }]));
    const enriched = ((data as unknown as LeadActivityRow[] | null) ?? []).map((a) => ({
      ...a,
      lead_company: meta.get(a.lead_id)?.name ?? "—",
      lead_status: meta.get(a.lead_id)?.status ?? ("new" as LeadStatus),
    }));
    setTasks(enriched);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, leadKey, filter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setTaskDone = useCallback(
    async (taskId: string, done: boolean) => {
      const { error } = await supabase
        .from("partner_lead_activities" as never)
        .update({ done, done_at: done ? new Date().toISOString() : null } as never)
        .eq("id", taskId);
      if (error) throw error;
      await refresh();
    },
    [refresh],
  );

  const completeTask = useCallback(
    async (taskId: string) => setTaskDone(taskId, true),
    [setTaskDone],
  );

  const today = new Date().toISOString().slice(0, 10);
  const overdue = tasks.filter((t) => !t.done && t.due_date && t.due_date < today);

  return { tasks, loading, overdue, refresh, completeTask, setTaskDone };
}
