import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PartnerRevenue = { revenue: number; mrr: number; dealsWonValue: number; dealsOpenValue: number };

/**
 * Fetch latest metric row per partner and reduce to a small
 * revenue / MRR / won-deals-value summary used for sorting and KPIs.
 */
export function useLatestPartnerRevenue(partnerIds: string[]) {
  const [map, setMap] = useState<Map<string, PartnerRevenue>>(new Map());
  const [loading, setLoading] = useState(false);
  const key = partnerIds.slice().sort().join(",");

  useEffect(() => {
    let cancelled = false;
    if (partnerIds.length === 0) {
      setMap(new Map());
      return;
    }
    setLoading(true);
    void (async () => {
      const { data } = await supabase
        .from("partner_metrics")
        .select("partner_id, revenue, mrr, deals_won_value, deals_open_value, created_at")
        .in("partner_id", partnerIds)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      const m = new Map<string, PartnerRevenue>();
      for (const row of data ?? []) {
        const pid = (row as { partner_id: string }).partner_id;
        if (m.has(pid)) continue;
        m.set(pid, {
          revenue: Number((row as { revenue: number | null }).revenue ?? 0),
          mrr: Number((row as { mrr: number | null }).mrr ?? 0),
          dealsWonValue: Number((row as { deals_won_value: number | null }).deals_won_value ?? 0),
          dealsOpenValue: Number((row as { deals_open_value: number | null }).deals_open_value ?? 0),
        });
      }
      setMap(m);
      setLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { map, loading };
}

export function fmtMoney(n: number): string {
  if (!n) return "—";
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `€${Math.round(n / 1_000)}k`;
  return `€${Math.round(n)}`;
}
