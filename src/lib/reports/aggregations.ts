import type { PortfolioItem } from "@/lib/partners-store";
import type { PartnerRevenue } from "@/lib/partner-revenue";
import type { LeadRow } from "@/lib/leads-store";
import { AXES } from "@/content/octa";
import type { ReportFilters } from "./use-report-filters";
import { periodToCutoff } from "./use-report-filters";

/* ─────────── filtering ─────────── */

export function applyReportFilters(
  items: PortfolioItem[],
  filters: ReportFilters,
  currentUserId: string | undefined,
): PortfolioItem[] {
  const cutoff = periodToCutoff(filters.period);
  return items.filter((it) => {
    const p = it.partner;
    if (filters.scope === "mine" && currentUserId && p.owner_id !== currentUserId) return false;
    if (filters.pdmId !== "all" && p.owner_id !== filters.pdmId) return false;
    if (filters.type !== "all" && p.partner_type !== filters.type) return false;
    if (filters.status !== "all" && p.status !== filters.status) return false;
    if (filters.tier !== "all" && p.tier !== filters.tier) return false;
    if (cutoff && new Date(p.created_at) < cutoff) return false;
    return true;
  });
}

/* ─────────── revenue / KPI ─────────── */

export type RevenueMetric = "mrr" | "revenue" | "dealsWonValue" | "dealsOpenValue";

export const REVENUE_METRIC_LABEL: Record<RevenueMetric, string> = {
  mrr: "Open MRR",
  revenue: "Revenue (period)",
  dealsWonValue: "Won deals value",
  dealsOpenValue: "Open deals value",
};

export function pickRevenue(r: PartnerRevenue | undefined, metric: RevenueMetric): number {
  if (!r) return 0;
  return Number(r[metric] ?? 0);
}

export function totalRevenue(
  items: PortfolioItem[],
  revenueMap: Map<string, PartnerRevenue>,
  metric: RevenueMetric = "mrr",
): { total: number; reporting: number } {
  let total = 0;
  let reporting = 0;
  for (const it of items) {
    const v = pickRevenue(revenueMap.get(it.partner.id), metric);
    if (v > 0) reporting += 1;
    total += v;
  }
  return { total, reporting };
}

/* ─────────── status / tier / type counts ─────────── */

export type StatusKey = "active" | "nurturing" | "at_risk" | "paused" | "archived";

export function byStatus(items: PortfolioItem[]): Record<StatusKey, number> {
  const o: Record<StatusKey, number> = { active: 0, nurturing: 0, at_risk: 0, paused: 0, archived: 0 };
  for (const it of items) o[it.partner.status as StatusKey] += 1;
  return o;
}

export const STATUS_LABEL: Record<StatusKey, string> = {
  active: "Scaling",
  nurturing: "Developing",
  at_risk: "Churn Risk",
  paused: "Paused",
  archived: "Archived",
};

export const STATUS_COLOR: Record<StatusKey, string> = {
  active: "var(--success)",
  nurturing: "var(--warning)",
  at_risk: "var(--destructive)",
  paused: "var(--muted-foreground)",
  archived: "var(--muted)",
};

export function byType(items: PortfolioItem[]): Record<string, number> {
  const m: Record<string, number> = {};
  for (const it of items) m[it.partner.partner_type] = (m[it.partner.partner_type] ?? 0) + 1;
  return m;
}

export function byTier(items: PortfolioItem[]): Record<string, number> {
  const m: Record<string, number> = {};
  for (const it of items) m[it.partner.tier] = (m[it.partner.tier] ?? 0) + 1;
  return m;
}

/* ─────────── group by PDM ─────────── */

export function statusByPdm(
  items: PortfolioItem[],
  pdmName: (id: string) => string,
): { id: string; name: string; counts: Record<StatusKey, number>; total: number }[] {
  const buckets = new Map<string, Record<StatusKey, number>>();
  for (const it of items) {
    const key = it.partner.owner_id;
    let c = buckets.get(key);
    if (!c) {
      c = { active: 0, nurturing: 0, at_risk: 0, paused: 0, archived: 0 };
      buckets.set(key, c);
    }
    c[it.partner.status as StatusKey] += 1;
  }
  return Array.from(buckets.entries())
    .map(([id, counts]) => {
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      return { id, name: pdmName(id), counts, total };
    })
    .sort((a, b) => b.total - a.total);
}

/* ─────────── maturity averages per axis ─────────── */

export function axisAverages(items: PortfolioItem[]): { axis: string; key: string; avg: number; n: number }[] {
  return AXES.map((a) => {
    let sum = 0;
    let n = 0;
    for (const it of items) {
      const sc = it.latest?.scores as Record<string, number> | null | undefined;
      const v = sc?.[a.key];
      if (typeof v === "number" && !Number.isNaN(v)) {
        sum += v;
        n += 1;
      }
    }
    return { axis: a.letter + " · " + a.name.split(" ")[0], key: a.key, avg: n > 0 ? sum / n : 0, n };
  });
}

/* ─────────── partners created over time ─────────── */

export function partnersByMonth(items: PortfolioItem[], months = 6): { label: string; value: number }[] {
  const now = new Date();
  const buckets: { key: string; label: string; value: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString(undefined, { month: "short" });
    buckets.push({ key, label, value: 0 });
  }
  const map = new Map(buckets.map((b) => [b.key, b]));
  for (const it of items) {
    const d = new Date(it.partner.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const b = map.get(key);
    if (b) b.value += 1;
  }
  return buckets.map((b) => ({ label: b.label, value: b.value }));
}

/* ─────────── lead pipeline ─────────── */

export type LeadStageKey = "new" | "in_review" | "approved" | "rejected";

export const LEAD_STAGE_LABEL: Record<LeadStageKey, string> = {
  new: "New",
  in_review: "In Review",
  approved: "Approved",
  rejected: "Rejected",
};

export function leadFunnel(leads: LeadRow[]): {
  counts: Record<LeadStageKey, number>;
  total: number;
  approvedRate: number;
  avgDaysByStatus: Record<LeadStageKey, number>;
} {
  const counts: Record<LeadStageKey, number> = { new: 0, in_review: 0, approved: 0, rejected: 0 };
  const totals: Record<LeadStageKey, { sum: number; n: number }> = {
    new: { sum: 0, n: 0 },
    in_review: { sum: 0, n: 0 },
    approved: { sum: 0, n: 0 },
    rejected: { sum: 0, n: 0 },
  };
  for (const l of leads) {
    const s = l.status as LeadStageKey;
    if (!(s in counts)) continue;
    counts[s] += 1;
    const created = new Date(l.created_at).getTime();
    const updated = new Date(l.updated_at).getTime();
    const days = Math.max(0, (updated - created) / 86400_000);
    totals[s].sum += days;
    totals[s].n += 1;
  }
  const total = leads.length;
  const approvedRate = total > 0 ? counts.approved / total : 0;
  const avgDaysByStatus: Record<LeadStageKey, number> = {
    new: totals.new.n > 0 ? totals.new.sum / totals.new.n : 0,
    in_review: totals.in_review.n > 0 ? totals.in_review.sum / totals.in_review.n : 0,
    approved: totals.approved.n > 0 ? totals.approved.sum / totals.approved.n : 0,
    rejected: totals.rejected.n > 0 ? totals.rejected.sum / totals.rejected.n : 0,
  };
  return { counts, total, approvedRate, avgDaysByStatus };
}