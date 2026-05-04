import type { PortfolioItem } from "@/lib/partners-store";
import type { PartnerRevenue } from "@/lib/partner-revenue";
import { fmtMoney } from "@/lib/partner-revenue";
import { ReportCard } from "./ReportCard";
import { CandyBarChart, CandyComposition } from "@/components/ui/candy-charts";
import {
  byStatus,
  partnersByMonth,
  STATUS_COLOR,
  STATUS_LABEL,
  totalRevenue,
} from "@/lib/reports/aggregations";

interface Props {
  items: PortfolioItem[];
  revenueMap: Map<string, PartnerRevenue>;
}

export function OverviewReport({ items, revenueMap }: Props) {
  const status = byStatus(items);
  const activeTotal = status.active + status.nurturing + status.at_risk;
  const mrr = totalRevenue(items, revenueMap, "mrr");
  const scored = items.filter((i) => i.latest);
  const avgMaturity = scored.length
    ? scored.reduce((s, i) => s + Number(i.latest!.overall), 0) / scored.length
    : 0;

  const monthly = partnersByMonth(items, 6);

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Kpi label="Total Open MRR" value={mrr.total > 0 ? fmtMoney(mrr.total) : "—"} hint={`${mrr.reporting} reporting MRR`} accent="octa-4" />
        <Kpi label="Active partners" value={String(activeTotal)} hint={`${status.paused + status.archived} paused/archived`} accent="octa-5" />
        <Kpi label="Avg maturity" value={avgMaturity ? avgMaturity.toFixed(1) : "—"} hint={`${scored.length}/${items.length} diagnosed`} accent="octa-7" />
      </section>

      <ReportCard
        title="Portfolio status mix"
        description="Live composition across the active book."
        csvRows={() =>
          (Object.keys(status) as (keyof typeof status)[]).map((k) => ({
            status: STATUS_LABEL[k],
            count: status[k],
          }))
        }
      >
        <CandyComposition
          segments={[
            { label: "Scaling", value: status.active, color: STATUS_COLOR.active },
            { label: "Developing", value: status.nurturing, color: STATUS_COLOR.nurturing },
            { label: "Churn Risk", value: status.at_risk, color: STATUS_COLOR.at_risk },
            { label: "Paused", value: status.paused, color: STATUS_COLOR.paused },
            { label: "Archived", value: status.archived, color: STATUS_COLOR.archived },
          ]}
        />
      </ReportCard>

      <ReportCard
        title="Partners added · last 6 months"
        description="How fast the portfolio is growing month over month."
        csvRows={() => monthly.map((m) => ({ month: m.label, partners_added: m.value }))}
      >
        <CandyBarChart
          data={monthly.map((m) => ({ label: m.label, value: m.value }))}
          height={220}
          variant="primary"
          showLabels
          emptyMessage="No partners created in the last 6 months."
        />
      </ReportCard>
    </div>
  );
}

function Kpi({ label, value, hint, accent }: { label: string; value: string; hint: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 card-elev relative overflow-hidden">
      <div
        className="absolute top-0 left-0 h-1 w-full"
        style={{ background: `linear-gradient(90deg, var(--${accent}), transparent)` }}
      />
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-display font-bold text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}