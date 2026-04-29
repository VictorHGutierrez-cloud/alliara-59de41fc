import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type LeadRow = Database["public"]["Tables"]["partner_leads"]["Row"];
export type LeadStatus = Database["public"]["Enums"]["partner_lead_status"];

export const LEAD_STATUSES: { key: LeadStatus; label: string }[] = [
  { key: "new", label: "New Lead" },
  { key: "in_review", label: "In Review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export function leadStatusLabel(s: LeadStatus): string {
  return LEAD_STATUSES.find((x) => x.key === s)?.label ?? s;
}

export function fitVerdict(total: number | null) {
  if (total === null) return null;
  if (total <= 4) return { tone: "red" as const, label: "Low Fit", message: "High risk of churn. Recommendation is to Reject." };
  if (total <= 7) return { tone: "yellow" as const, label: "Moderate Fit", message: "Review carefully before promoting." };
  return { tone: "green" as const, label: "Strong Fit", message: "Highly recommended to Promote." };
}

export function useLeads(userId: string | undefined) {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from("partner_leads")
      .select("*")
      .order("created_at", { ascending: false });
    setLeads((data ?? []) as LeadRow[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const createLead = useCallback(async (input: {
    company_name: string; contact_person?: string; website?: string;
  }) => {
    if (!userId) throw new Error("Not signed in");
    const { data, error } = await supabase.from("partner_leads").insert({
      owner_id: userId,
      company_name: input.company_name,
      contact_person: input.contact_person ?? null,
      website: input.website ?? null,
    }).select("*").single();
    if (error) throw error;
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

  const promoteLead = useCallback(async (lead: LeadRow): Promise<string> => {
    if (!userId) throw new Error("Not signed in");
    const total =
      (lead.sales_score ?? 0) + (lead.expertise_score ?? 0) + (lead.fit_score ?? 0);
    const notesPrefix =
      `Promoted from qualification. IPP scores — Sales: ${lead.sales_score ?? "-"}, ` +
      `Expertise: ${lead.expertise_score ?? "-"}, Fit: ${lead.fit_score ?? "-"} (Total ${total}/9).`;
    const combinedNotes = lead.notes ? `${notesPrefix}\n\n${lead.notes}` : notesPrefix;

    const { data: partner, error: insErr } = await supabase
      .from("partners")
      .insert({
        owner_id: userId,
        name: lead.company_name,
        company: lead.company_name,
        tier: "emerging",
        status: "active",
        notes: combinedNotes,
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

  return { leads, loading, refresh, createLead, updateLead, deleteLead, promoteLead };
}