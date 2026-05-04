import type { PortfolioItem } from "@/lib/partners-store";
import { ReportCard } from "./ReportCard";
import { CandyHorizontalStacked } from "@/components/ui/candy-charts";
import { statusByPdm, STATUS_COLOR, STATUS_LABEL, type StatusKey } from "@/lib/reports/aggregations";

interface Props {
  items: PortfolioItem[];
  pdmName: (id: string) => string;
}

const STATUS_ORDER: StatusKey[] = ["active", "nurturing", "at_risk", "paused", "archived"];

export function HealthByPdmReport({ items, pdmName }: Props) {
  const rows = statusByPdm(items, pdmName);

  const stackedRows = rows.map((r) => ({
    label: r.name || "Unassigned",
    total: r.total,
    segments: STATUS_ORDER.map((k) => ({
      label: STATUS_LABEL[k],
      value: r.counts[k],
      color: STATUS_COLOR[k],
    })),
  }));

  return (
    <ReportCard
      title="Status mix per PDM"
      description="Spot concentration of churn risk or paused partners across the team."
      csvRows={() =>
        rows.map((r) => ({
          pdm: r.name,
          total: r.total,
          scaling: r.counts.active,
          developing: r.counts.nurturing,
          churn_risk: r.counts.at_risk,
          paused: r.counts.paused,
          archived: r.counts.archived,
        }))
      }
    >
      <CandyHorizontalStacked
        rows={stackedRows}
        legend={STATUS_ORDER.map((k) => ({ label: STATUS_LABEL[k], color: STATUS_COLOR[k] }))}
      />
    </ReportCard>
  );
}