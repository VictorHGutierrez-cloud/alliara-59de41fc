import { useCallback, useEffect, useState } from "react";
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

/* ───────────────── Factorial 5-Dimension Scorecard ───────────────── */

export type DimensionKey =
  | "icp_overlap"
  | "sales_capacity"
  | "delivery_muscle"
  | "business_commitment"
  | "strategic_alignment";

export type DimensionOption = { v: 1 | 2 | 3; label: "Low" | "Medium" | "High"; help: string };

export const FACTORIAL_DIMENSIONS: {
  key: DimensionKey;
  label: string;
  description: string;
  options: [DimensionOption, DimensionOption, DimensionOption];
}[] = [
  {
    key: "icp_overlap",
    label: "ICP Overlap",
    description: "How well does the partner's customer base match Factorial's Ideal Customer Profile?",
    options: [
      { v: 1, label: "Low", help: "<20 or >3000 employees" },
      { v: 2, label: "Medium", help: "Broad SMBs" },
      { v: 3, label: "High", help: "50–500 employees in Hospitality, Tech, Construction, Pharma" },
    ],
  },
  {
    key: "sales_capacity",
    label: "Sales Capacity",
    description: "Does the partner have a real engine to source and close opportunities?",
    options: [
      { v: 1, label: "Low", help: "No sales team" },
      { v: 2, label: "Medium", help: "Reactive referrals" },
      { v: 3, label: "High", help: "Proactive sales machine targeting CEOs / HR Managers" },
    ],
  },
  {
    key: "delivery_muscle",
    label: "Delivery Muscle",
    description: "Can the partner deploy and support Factorial autonomously?",
    options: [
      { v: 1, label: "Low", help: "Needs Factorial to do onboarding" },
      { v: 2, label: "Medium", help: "Basic setup" },
      { v: 3, label: "High", help: "Autonomous — can deploy Performance or Factorial IT/MDM" },
    ],
  },
  {
    key: "business_commitment",
    label: "Business Commitment",
    description: "How serious is the partner about building a real business with Factorial?",
    options: [
      { v: 1, label: "Low", help: "Opportunistic" },
      { v: 2, label: "Medium", help: "Casual referrals" },
      { v: 3, label: "High", help: "Ready for a Joint Business Plan" },
    ],
  },
  {
    key: "strategic_alignment",
    label: "Strategic Alignment",
    description: "How well does the partner's positioning align with Factorial's GTM?",
    options: [
      { v: 1, label: "Low", help: "Competitor overlap" },
      { v: 2, label: "Medium", help: "Neutral" },
      { v: 3, label: "High", help: "Perfect synergy (e.g. HR Consultancies, IT MSPs)" },
    ],
  },
];

/* Storage mapping:
 *   icp_overlap          → sales_score
 *   sales_capacity       → expertise_score
 *   delivery_muscle      → fit_score
 *   business_commitment  → notes JSON block (key: commitment)
 *   strategic_alignment  → notes JSON block (key: alignment)
 */

export type ScorecardMeta = {
  commitment: 1 | 2 | 3 | null;
  alignment: 1 | 2 | 3 | null;
  rejection_reason: string | null;
};

const SCORECARD_RE = /^<!--FACTORIAL_SCORECARD:(\{[^}]*\})-->\n?/;

export function parseScorecard(notes: string | null | undefined): { meta: ScorecardMeta; freeText: string } {
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

export function getDimensionValue(lead: LeadRow, key: DimensionKey): 1 | 2 | 3 | null {
  if (key === "icp_overlap") return (lead.sales_score as 1 | 2 | 3 | null) ?? null;
  if (key === "sales_capacity") return (lead.expertise_score as 1 | 2 | 3 | null) ?? null;
  if (key === "delivery_muscle") return (lead.fit_score as 1 | 2 | 3 | null) ?? null;
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
  if (total <= 8) return {
    tone: "red" as const, label: "Low Fit",
    message: "High risk of churn. Target company size or capacity is misaligned. Recommendation: Reject.",
  };
  if (total <= 12) return {
    tone: "yellow" as const, label: "Moderate Fit",
    message: "Potential synergy, but review implementation muscle and ICP overlap before promoting.",
  };
  return {
    tone: "green" as const, label: "Strong Fit",
    message: "Ideal partner for Factorial. Highly recommended to Promote.",
  };
}

export function useLeads(userId: string | undefined) {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLeadership, setIsLeadership] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const [{ data: roles }, { data }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("partner_leads").select("*").order("created_at", { ascending: false }),
    ]);
    setIsLeadership((roles ?? []).some((r) => r.role === "leadership" || r.role === "admin"));
    setLeads((data ?? []) as LeadRow[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const createLead = useCallback(async (input: {
    company_name: string; contact_person?: string; website?: string;
    partner_type?: PartnerType | null;
    firstTask?: { title: string; due_date?: string | null } | null;
  }) => {
    if (!userId) throw new Error("Not signed in");
    const { data, error } = await supabase.from("partner_leads").insert({
      owner_id: userId,
      company_name: input.company_name,
      contact_person: input.contact_person ?? null,
      website: input.website ?? null,
      partner_type: input.partner_type ?? null,
    }).select("*").single();
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
    await refresh();
    return data as LeadRow;
  }, [userId, refresh]);

  const updateLead = useCallback(async (id: string, patch: Partial<LeadRow>) => {
    const { error } = await supabase.from("partner_leads").update(patch).eq("id", id);
    if (error) throw error;
    await refresh();
  }, [refresh]);

  const deleteLead = useCallback(async (id: string) => {
    const { error } = await supabase.from("partner_leads").delete().eq("id", id);
    if (error) throw error;
    await refresh();
  }, [refresh]);

  const setDimension = useCallback(async (lead: LeadRow, key: DimensionKey, value: 1 | 2 | 3) => {
    const { meta, freeText } = parseScorecard(lead.notes);
    const next: LeadRow = { ...lead };
    const patch: Partial<LeadRow> = {};
    if (key === "icp_overlap") { next.sales_score = value; patch.sales_score = value; }
    else if (key === "sales_capacity") { next.expertise_score = value; patch.expertise_score = value; }
    else if (key === "delivery_muscle") { next.fit_score = value; patch.fit_score = value; }
    else {
      const nextMeta: ScorecardMeta = { ...meta };
      if (key === "business_commitment") nextMeta.commitment = value;
      else nextMeta.alignment = value;
      const newNotes = serializeScorecard(nextMeta, freeText);
      next.notes = newNotes;
      patch.notes = newNotes;
    }
    const total = computeFactorialTotal(next);
    patch.total_score = total;
    const { error } = await supabase.from("partner_leads").update(patch).eq("id", lead.id);
    if (error) throw error;
    await refresh();
  }, [refresh]);

  const updateFreeNotes = useCallback(async (lead: LeadRow, freeText: string) => {
    const { meta } = parseScorecard(lead.notes);
    const newNotes = serializeScorecard(meta, freeText);
    const { error } = await supabase.from("partner_leads").update({ notes: newNotes }).eq("id", lead.id);
    if (error) throw error;
    await refresh();
  }, [refresh]);

  const rejectLead = useCallback(async (lead: LeadRow, reason: string) => {
    const { meta, freeText } = parseScorecard(lead.notes);
    const nextMeta: ScorecardMeta = { ...meta, rejection_reason: reason };
    const newNotes = serializeScorecard(nextMeta, freeText);
    const { error } = await supabase.from("partner_leads")
      .update({ status: "rejected", notes: newNotes })
      .eq("id", lead.id);
    if (error) throw error;
    await refresh();
  }, [refresh]);

  const promoteLead = useCallback(async (lead: LeadRow): Promise<string> => {
    if (!userId) throw new Error("Not signed in");
    const { freeText } = parseScorecard(lead.notes);
    const total = computeFactorialTotal(lead);
    const lines = FACTORIAL_DIMENSIONS.map((d) => {
      const v = getDimensionValue(lead, d.key);
      return `  • ${d.label}: ${v ?? "-"}`;
    });
    const notesPrefix =
      `Promoted from qualification — Factorial 5-Dimension Scorecard (Total ${total ?? "-"}/15):\n` +
      lines.join("\n");
    const combinedNotes = freeText ? `${notesPrefix}\n\n${freeText}` : notesPrefix;

    const { data: partner, error: insErr } = await supabase
      .from("partners")
      .insert({
        owner_id: userId,
        name: lead.company_name,
        company: lead.company_name,
        tier: "emerging",
        status: "active",
        notes: combinedNotes,
        partner_type: lead.partner_type ?? "referral",
      })
      .select("*")
      .single();
    if (insErr) throw insErr;

    const { error: updErr } = await supabase
      .from("partner_leads")
      .update({ status: "approved", promoted_partner_id: partner.id })
      .eq("id", lead.id);
    if (updErr) throw updErr;

    await refresh();
    return partner.id as string;
  }, [userId, refresh]);

  return {
    leads, loading, isLeadership, refresh,
    createLead, updateLead, deleteLead,
    setDimension, updateFreeNotes, rejectLead, promoteLead,
  };
}

/* ───────────────── Lead activities (mini-CRM) ───────────────── */

export function useLeadActivities(leadId: string | undefined, userId: string | undefined) {
  const [activities, setActivities] = useState<LeadActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!leadId) { setActivities([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("partner_lead_activities" as never)
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });
    setActivities(((data as unknown) as LeadActivityRow[]) ?? []);
    setLoading(false);
  }, [leadId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const create = useCallback(async (input: {
    kind: LeadActivityKind;
    title: string;
    description?: string;
    due_date?: string | null;
  }) => {
    if (!userId || !leadId) throw new Error("Not signed in");
    const { error } = await supabase
      .from("partner_lead_activities" as never)
      .insert({
        lead_id: leadId,
        owner_id: userId,
        kind: input.kind,
        title: input.title,
        description: input.description ?? null,
        due_date: input.due_date ?? null,
      } as never);
    if (error) throw error;
    await refresh();
  }, [leadId, userId, refresh]);

  const toggleDone = useCallback(async (a: LeadActivityRow) => {
    const next = !a.done;
    const { error } = await supabase
      .from("partner_lead_activities" as never)
      .update({ done: next, done_at: next ? new Date().toISOString() : null } as never)
      .eq("id", a.id);
    if (error) throw error;
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("partner_lead_activities" as never)
      .delete()
      .eq("id", id);
    if (error) throw error;
    await refresh();
  }, [refresh]);

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

/* ───────────── Aggregated open lead tasks across the whole pipe ───────────── */

export type LeadTaskRow = LeadActivityRow & { lead_company: string; lead_status: LeadStatus };

export function useAllLeadTasks(userId: string | undefined, leads: LeadRow[]) {
  const [tasks, setTasks] = useState<LeadTaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const leadKey = leads.map((l) => l.id).sort().join(",");

  const refresh = useCallback(async () => {
    if (!userId || leads.length === 0) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ids = leads.map((l) => l.id);
    const { data } = await supabase
      .from("partner_lead_activities" as never)
      .select("*")
      .in("lead_id", ids)
      .eq("kind", "task")
      .eq("done", false)
      .order("due_date", { ascending: true, nullsFirst: false });
    const meta = new Map(leads.map((l) => [l.id, { name: l.company_name, status: l.status }]));
    const enriched = ((data as unknown) as LeadActivityRow[] | null ?? []).map((a) => ({
      ...a,
      lead_company: meta.get(a.lead_id)?.name ?? "—",
      lead_status: meta.get(a.lead_id)?.status ?? ("new" as LeadStatus),
    }));
    setTasks(enriched);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, leadKey]);

  useEffect(() => { void refresh(); }, [refresh]);

  const completeTask = useCallback(async (taskId: string) => {
    const { error } = await supabase
      .from("partner_lead_activities" as never)
      .update({ done: true, done_at: new Date().toISOString() } as never)
      .eq("id", taskId);
    if (error) throw error;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const overdue = tasks.filter((t) => t.due_date && t.due_date < today);

  return { tasks, loading, overdue, refresh, completeTask };
}