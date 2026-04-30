import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PdmStats {
  loading: boolean;
  partners: { total: number; active: number; byTier: Record<string, number> };
  deals: {
    open_count: number;
    open_value: number;
    won_count: number;
    won_value: number;
  };
  mrr: number;
  trainedPeople: number;
  tasks: {
    total: number;
    todo: number;
    in_progress: number;
    done: number;
    overdue: number;
    completedLast30: number;
  };
  leads: { total: number; byStatus: Record<string, number>; nextWeek: number };
  stakeholders: { total: number; coverage: number };
  assessments: { total: number; coverage: number; avgOverall: number | null };
  documents: { partnersWithDocs: number };
}

const empty: PdmStats = {
  loading: true,
  partners: { total: 0, active: 0, byTier: {} },
  deals: { open_count: 0, open_value: 0, won_count: 0, won_value: 0 },
  mrr: 0,
  trainedPeople: 0,
  tasks: { total: 0, todo: 0, in_progress: 0, done: 0, overdue: 0, completedLast30: 0 },
  leads: { total: 0, byStatus: {}, nextWeek: 0 },
  stakeholders: { total: 0, coverage: 0 },
  assessments: { total: 0, coverage: 0, avgOverall: null },
  documents: { partnersWithDocs: 0 },
};

export function usePdmStats(userId: string | undefined) {
  const [stats, setStats] = useState<PdmStats>(empty);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setStats((s) => ({ ...s, loading: true }));

    // Partners owned by me
    const { data: partners } = await supabase
      .from("partners")
      .select("id, status, tier")
      .eq("owner_id", userId);
    const partnerIds = (partners ?? []).map((p) => p.id);
    const byTier: Record<string, number> = {};
    (partners ?? []).forEach((p) => {
      byTier[p.tier] = (byTier[p.tier] ?? 0) + 1;
    });

    if (partnerIds.length === 0) {
      setStats({ ...empty, loading: false, partners: { total: 0, active: 0, byTier: {} } });
      return;
    }

    const [
      { data: metrics },
      { data: tasks },
      { data: leads },
      { data: stakeholders },
      { data: assessments },
      { data: docs },
    ] = await Promise.all([
      supabase
        .from("partner_metrics")
        .select("partner_id, mrr, deals_open, deals_open_value, deals_won, deals_won_value, trained_people, created_at")
        .in("partner_id", partnerIds)
        .order("created_at", { ascending: false }),
      supabase
        .from("action_plans")
        .select("id, status, due_date, completed_at, created_at")
        .eq("user_id", userId),
      supabase
        .from("partner_leads")
        .select("id, status, next_step_at")
        .eq("owner_id", userId),
      supabase
        .from("partner_stakeholders")
        .select("id, partner_id")
        .in("partner_id", partnerIds),
      supabase
        .from("assessments")
        .select("id, partner_id, overall, created_at")
        .in("partner_id", partnerIds)
        .order("created_at", { ascending: false }),
      supabase
        .from("partner_documents")
        .select("partner_id")
        .in("partner_id", partnerIds),
    ]);

    // Latest metric per partner
    const latestByPartner = new Map<string, NonNullable<typeof metrics>[number]>();
    (metrics ?? []).forEach((m) => {
      if (!latestByPartner.has(m.partner_id)) latestByPartner.set(m.partner_id, m);
    });
    let open_count = 0, open_value = 0, won_count = 0, won_value = 0, mrr = 0, trainedPeople = 0;
    latestByPartner.forEach((m) => {
      open_count += m.deals_open ?? 0;
      open_value += Number(m.deals_open_value ?? 0);
      won_count += m.deals_won ?? 0;
      won_value += Number(m.deals_won_value ?? 0);
      mrr += Number(m.mrr ?? 0);
      trainedPeople += m.trained_people ?? 0;
    });

    // Tasks
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const thirtyAgo = new Date(); thirtyAgo.setDate(thirtyAgo.getDate() - 30);
    let todo = 0, in_progress = 0, done = 0, overdue = 0, completedLast30 = 0;
    (tasks ?? []).forEach((t) => {
      if (t.status === "todo") todo++;
      else if (t.status === "in_progress") in_progress++;
      else if (t.status === "done") done++;
      if (t.status !== "done" && t.due_date && new Date(t.due_date) < today) overdue++;
      if (t.status === "done" && t.completed_at && new Date(t.completed_at) >= thirtyAgo) completedLast30++;
    });

    // Leads
    const byStatus: Record<string, number> = {};
    let nextWeek = 0;
    const weekAhead = new Date(); weekAhead.setDate(weekAhead.getDate() + 7);
    (leads ?? []).forEach((l) => {
      byStatus[l.status] = (byStatus[l.status] ?? 0) + 1;
      if (l.next_step_at) {
        const d = new Date(l.next_step_at);
        if (d >= today && d <= weekAhead) nextWeek++;
      }
    });

    // Stakeholder coverage
    const partnersWithStake = new Set((stakeholders ?? []).map((s) => s.partner_id));
    const stakeCoverage = partnerIds.length ? Math.round((partnersWithStake.size / partnerIds.length) * 100) : 0;

    // Assessments — latest per partner
    const latestAssessByPartner = new Map<string, number>();
    (assessments ?? []).forEach((a) => {
      if (a.partner_id && !latestAssessByPartner.has(a.partner_id)) {
        latestAssessByPartner.set(a.partner_id, Number(a.overall));
      }
    });
    const assessCoverage = partnerIds.length ? Math.round((latestAssessByPartner.size / partnerIds.length) * 100) : 0;
    const avgOverall = latestAssessByPartner.size
      ? [...latestAssessByPartner.values()].reduce((s, v) => s + v, 0) / latestAssessByPartner.size
      : null;

    // Documents
    const partnersWithDocs = new Set((docs ?? []).map((d) => d.partner_id)).size;

    setStats({
      loading: false,
      partners: {
        total: partners?.length ?? 0,
        active: (partners ?? []).filter((p) => p.status === "active").length,
        byTier,
      },
      deals: { open_count, open_value, won_count, won_value },
      mrr,
      trainedPeople,
      tasks: { total: tasks?.length ?? 0, todo, in_progress, done, overdue, completedLast30 },
      leads: { total: leads?.length ?? 0, byStatus, nextWeek },
      stakeholders: { total: stakeholders?.length ?? 0, coverage: stakeCoverage },
      assessments: { total: assessments?.length ?? 0, coverage: assessCoverage, avgOverall },
      documents: { partnersWithDocs },
    });
  }, [userId]);

  useEffect(() => { void refresh(); }, [refresh]);

  return { ...stats, refresh };
}

export function fmtMoney(n: number) {
  if (!n) return "€0";
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `€${(n / 1_000).toFixed(1)}k`;
  return `€${n.toFixed(0)}`;
}