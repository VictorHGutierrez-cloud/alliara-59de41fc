import type { PortfolioItem } from "@/lib/partners-store";
import type { PartnerRevenue } from "@/lib/partner-revenue";
import { fmtMoney } from "@/lib/partner-revenue";
import { ReportCard } from "./ReportCard";
import { CandyComposition, CandyStackedArea } from "@/components/ui/candy-charts";
import { KpiTile } from "./KpiTile";
import { DollarSign, Users, Sparkles } from "lucide-react";
import {
  byStatus,
  statusTrendByMonth,
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

  const trend = statusTrendByMonth(items, 6);

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiTile
          label="Total Open MRR"
          value={mrr.total > 0 ? fmtMoney(mrr.total) : "—"}
          hint={`${mrr.reporting} reporting MRR`}
          icon={DollarSign}
          accent="var(--primary)"
          delay={0}
        />
        <KpiTile
          label="Active partners"
          value={String(activeTotal)}
          hint={`${status.paused + status.archived} paused/archived`}
          icon={Users}
          accent="var(--secondary)"
          delay={0.05}
        />
        <KpiTile
          label="Avg maturity"
          value={avgMaturity ? avgMaturity.toFixed(1) : "—"}
          hint={`${scored.length}/${items.length} diagnosed`}
          icon={Sparkles}
          accent="var(--octa-7)"
          delay={0.1}
        />
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
        title="Portfolio growth & health · last 6 months"
        description="Stacked view of partners added per month, split by current status."
        csvRows={() =>
          trend.map((m) => ({
            month: m.label,
            scaling: m.active,
            developing: m.nurturing,
            churn_risk: m.at_risk,
          }))
        }
      >
        <CandyStackedArea
          data={trend}
          series={[
            { key: "active", label: "Scaling", color: STATUS_COLOR.active },
            { key: "nurturing", label: "Developing", color: STATUS_COLOR.nurturing },
            { key: "at_risk", label: "Churn Risk", color: STATUS_COLOR.at_risk },
          ]}
          height={260}
          emptyMessage="No partners created in the last 6 months."
        />
      </ReportCard>
    </div>
  );
}