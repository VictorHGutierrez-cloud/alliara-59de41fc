import type { PortfolioItem } from "@/lib/partners-store";
import { ReportCard } from "./ReportCard";
import { CandyBarChart } from "@/components/ui/candy-charts";
import { axisAverages } from "@/lib/reports/aggregations";

export function MaturityReport({ items }: { items: PortfolioItem[] }) {
  const data = axisAverages(items);
  return (
    <ReportCard
      title="Maturity by OCTA dimension"
      description="Portfolio-wide average per axis. The shortest bar is your biggest unlock."
      csvRows={() => data.map((d) => ({ axis: d.axis, avg_maturity: d.avg.toFixed(2), partners_scored: d.n }))}
    >
      <CandyBarChart
        data={data.map((d) => ({
          label: d.axis,
          value: Number(d.avg.toFixed(2)),
          secondary: { label: "Scored", value: d.n },
        }))}
        height={280}
        valueFormatter={(v) => v.toFixed(1)}
        variant="palette"
        emptyMessage="No diagnosed partners in scope yet."
      />
    </ReportCard>
  );
}