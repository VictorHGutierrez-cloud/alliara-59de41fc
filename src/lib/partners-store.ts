import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { AXES, type Level } from "../content/octa";
import { COPY } from "@/lib/copy";

export type PartnerRow = Database["public"]["Tables"]["partners"]["Row"];
export type ActionRow = Database["public"]["Tables"]["action_plans"]["Row"];
export type AssessmentRow = Database["public"]["Tables"]["assessments"]["Row"];
export type AiRecRow = Database["public"]["Tables"]["ai_recommendations"]["Row"];
export type ScoreMap = Record<string, number>;

export function levelFromAvg(avg: number): Level {
  return Math.max(1, Math.min(5, Math.round(avg))) as Level;
}

export function tierColor(tier: PartnerRow["tier"]): string {
  switch (tier) {
    case "strategic": return "octa-1";
    case "core": return "octa-4";
    case "emerging": return "octa-5";
    case "long_tail": return "octa-7";
  }
}

export function statusLabel(s: PartnerRow["status"]): string {
  return COPY.status[s];
}

/* ─────────────────────── Portfolio (list of partners) ─────────────────────── */

export interface PortfolioItem {
  partner: PartnerRow;
  latest: AssessmentRow | null;
  isLeadershipView: boolean;
}

export function usePortfolio(userId: string | undefined) {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [isLeadership, setIsLeadership] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setItems([]);
      setIsLeadership(false);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [{ data: roles, error: rolesError }, { data: partners, error: partnersError }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase.from("partners").select("*").order("created_at", { ascending: false }),
      ]);
      if (rolesError) throw rolesError;
      if (partnersError) throw partnersError;

      const lead = (roles ?? []).some((r) => r.role === "leadership" || r.role === "admin");
      setIsLeadership(lead);

      const partnerRows = (partners ?? []) as PartnerRow[];
      const ids = partnerRows.map((p) => p.id);
      const latestByPartner = new Map<string, AssessmentRow>();
      if (ids.length) {
        const { data: ass, error: assError } = await supabase
          .from("assessments")
          .select("*")
          .in("partner_id", ids)
          .order("created_at", { ascending: false });
        if (assError) throw assError;
        for (const a of (ass ?? []) as AssessmentRow[]) {
          if (a.partner_id && !latestByPartner.has(a.partner_id)) latestByPartner.set(a.partner_id, a);
        }
      }

      setItems(partnerRows.map((p) => ({
        partner: p,
        latest: latestByPartner.get(p.id) ?? null,
        isLeadershipView: lead && p.owner_id !== userId,
      })));
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load portfolio";
      setError(message);
      setItems([]);
      setIsLeadership(false);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const createPartner = useCallback(async (input: {
    name: string; company?: string; segment?: string;
    tier?: PartnerRow["tier"]; status?: PartnerRow["status"]; notes?: string;
    partner_type?: PartnerRow["partner_type"];
  }) => {
    if (!userId) throw new Error("Not signed in");
    const { data, error } = await supabase.from("partners").insert({
      owner_id: userId,
      name: input.name,
      company: input.company ?? null,
      segment: input.segment ?? null,
      tier: input.tier ?? "emerging",
      status: input.status ?? "active",
      notes: input.notes ?? null,
      partner_type: input.partner_type ?? "referral",
    }).select("*").single();
    if (error) throw error;
    await refresh();
    return data as PartnerRow;
  }, [userId, refresh]);

  const deletePartner = useCallback(async (id: string) => {
    const { error } = await supabase.from("partners").delete().eq("id", id);
    if (error) throw error;
    await refresh();
  }, [refresh]);

  return { items, isLeadership, loading, error, refresh, retry: refresh, createPartner, deletePartner };
}

/* ─────────────────────── Single Partner workspace ─────────────────────── */

export function usePartner(partnerId: string | undefined) {
  const [partner, setPartner] = useState<PartnerRow | null>(null);
  const [latest, setLatest] = useState<AssessmentRow | null>(null);
  const [history, setHistory] = useState<AssessmentRow[]>([]);
  const [actions, setActions] = useState<ActionRow[]>([]);
  const [recs, setRecs] = useState<AiRecRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (opts?: { silent?: boolean }) => {
    if (!partnerId) return;
    if (!opts?.silent) setLoading(true);
    const [{ data: p }, { data: ass }, { data: acts }, { data: r }] = await Promise.all([
      supabase.from("partners").select("*").eq("id", partnerId).maybeSingle(),
      supabase.from("assessments").select("*").eq("partner_id", partnerId).order("created_at", { ascending: false }),
      supabase.from("action_plans").select("*").eq("partner_id", partnerId).order("created_at", { ascending: false }),
      supabase.from("ai_recommendations").select("*").eq("partner_id", partnerId).order("created_at", { ascending: false }),
    ]);
    setPartner((p as PartnerRow | null) ?? null);
    const arows = (ass ?? []) as AssessmentRow[];
    setHistory(arows);
    setLatest(arows[0] ?? null);
    setActions((acts ?? []) as ActionRow[]);
    setRecs((r ?? []) as AiRecRow[]);
    setLoading(false);
  }, [partnerId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const saveAssessment = useCallback(async (scores: ScoreMap, userId: string) => {
    if (!partnerId) throw new Error("Missing partner");
    const vals = Object.values(scores);
    const overall = vals.reduce((a, b) => a + b, 0) / vals.length;
    const { data, error } = await supabase.from("assessments").insert({
      partner_id: partnerId,
      user_id: userId,
      scores,
      overall: Number(overall.toFixed(2)),
    }).select("*").single();
    if (error) throw error;
    await refresh();
    return data as AssessmentRow;
  }, [partnerId, refresh]);

  const addAction = useCallback(async (input: {
    userId: string; axisKey: string; title: string; description?: string;
    priority?: ActionRow["priority"]; targetLevel?: number; dueDate?: string; source?: string;
  }) => {
    if (!partnerId) throw new Error("Missing partner");
    const { error } = await supabase.from("action_plans").insert({
      partner_id: partnerId,
      user_id: input.userId,
      axis_key: input.axisKey,
      title: input.title,
      description: input.description ?? null,
      priority: input.priority ?? "medium",
      target_level: input.targetLevel ?? null,
      due_date: input.dueDate ?? null,
      source: input.source ?? "manual",
    });
    if (error) throw error;
    await refresh();
  }, [partnerId, refresh]);

  const updateAction = useCallback(async (id: string, patch: Partial<ActionRow>) => {
    const { error } = await supabase.from("action_plans").update(patch).eq("id", id);
    if (error) throw error;
    await refresh();
  }, [refresh]);

  const deleteAction = useCallback(async (id: string) => {
    const { error } = await supabase.from("action_plans").delete().eq("id", id);
    if (error) throw error;
    await refresh();
  }, [refresh]);

  const updatePartner = useCallback(async (patch: Partial<PartnerRow>) => {
    if (!partnerId) return;
    const { error } = await supabase.from("partners").update(patch).eq("id", partnerId);
    if (error) throw error;
    await refresh();
  }, [partnerId, refresh]);

  const deletePartner = useCallback(async () => {
    if (!partnerId) return;
    const { error } = await supabase.from("partners").delete().eq("id", partnerId);
    if (error) throw error;
  }, [partnerId]);

  const deleteAssessment = useCallback(async (assessmentId: string) => {
    const { error } = await supabase.from("assessments").delete().eq("id", assessmentId);
    if (error) throw error;
    await refresh();
  }, [refresh]);

  const saveRecommendation = useCallback(async (axisKey: string | null, content: unknown, model: string) => {
    if (!partnerId) throw new Error("Missing partner");
    const { error } = await supabase.from("ai_recommendations").insert({
      partner_id: partnerId,
      axis_key: axisKey,
      content: content as never,
      model,
      assessment_id: latest?.id ?? null,
    });
    if (error) throw error;
    await refresh();
  }, [partnerId, latest, refresh]);

  const axisScore = (axisKey: string): number => (latest?.scores as ScoreMap | null)?.[axisKey] ?? 0;

  const actionsByAxis = (axisKey: string) => actions.filter((a) => a.axis_key === axisKey);
  const openActions = actions.filter((a) => a.status !== "done");
  const doneActions = actions.filter((a) => a.status === "done");

  // Diagnostic question count for progress display
  const totalDiagnosticQs = AXES.reduce((s, a) => s + a.diagnostic.length, 0);

  return {
    partner, latest, history, actions, recs, loading,
    refresh, saveAssessment, addAction, updateAction, deleteAction,
    updatePartner, deletePartner, deleteAssessment, saveRecommendation,
    axisScore, actionsByAxis, openActions, doneActions, totalDiagnosticQs,
  };
}