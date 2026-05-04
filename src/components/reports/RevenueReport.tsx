import { useMemo, useState } from "react";
import type { PortfolioItem } from "@/lib/partners-store";
import type { PartnerRevenue } from "@/lib/partner-revenue";
import { fmtMoney } from "@/lib/partner-revenue";
import { ReportCard } from "./ReportCard";
import { CandyBarChart } from "@/components/ui/candy-charts";
import { pickRevenue, REVENUE_METRIC_LABEL, type RevenueMetric } from "@/lib/reports/aggregations";

interface Props {
  items: PortfolioItem[];
  revenueMap: Map<string, PartnerRevenue>;
  pdmName: (id: string) => string;
}

const TOP_N_OPTIONS = [5, 10, 20, 50];

export function RevenueReport({ items, revenueMap, pdmName }: Props) {
  const [metric, setMetric] = useState<RevenueMetric>("mrr");
  const [topN, setTopN] = useState(10);

  const ranked = useMemo(() => {
    return items
      .map((it) => ({
        partner: it.partner,
        value: pickRevenue(revenueMap.get(it.partner.id), metric),
        maturity: it.latest ? Number(it.latest.overall) : 0,
      }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [items, revenueMap, metric]);

  const top = ranked.slice(0, topN);

  const chartData = top.map((r) => ({
    label: r.partner.name.length > 14 ? r.partner.name.slice(0, 13) + "…" : r.partner.name,
    value: r.value,
    secondary: r.maturity > 0 ? { label: "Maturity", value: r.maturity.toFixed(1) } : undefined,
  }));

  return (
    <ReportCard
      title={`Top partners by ${REVENUE_METRIC_LABEL[metric]}`}
      description="Ranked from latest reported metric. Switch metric or Top N to reshape the view."
      controls={
        <div className="flex items-center gap-2">
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as RevenueMetric)}
            className="select-candy"
            aria-label="Metric"
          >
            {(Object.keys(REVENUE_METRIC_LABEL) as RevenueMetric[]).map((k) => (
              <option key={k} value={k}>{REVENUE_METRIC_LABEL[k]}</option>
            ))}
          </select>
          <select
            value={topN}
            onChange={(e) => setTopN(Number(e.target.value))}
            className="select-candy"
            aria-label="Top N"
          >
            {TOP_N_OPTIONS.map((n) => (
              <option key={n} value={n}>Top {n}</option>
            ))}
          </select>
        </div>
      }
      csvRows={() =>
        ranked.map((r) => ({
          partner: r.partner.name,
          company: r.partner.company ?? "",
          pdm: pdmName(r.partner.owner_id),
          type: r.partner.partner_type,
          tier: r.partner.tier,
          status: r.partner.status,
          metric: REVENUE_METRIC_LABEL[metric],
          value: r.value,
          maturity: r.maturity || "",
        }))
      }
    >
      <CandyBarChart
        data={chartData}
        height={300}
        valueFormatter={fmtMoney}
        variant="palette"
        emptyMessage={`No partners reporting ${REVENUE_METRIC_LABEL[metric]}.`}
      />

      {top.length > 0 && (
        <div className="mt-5 overflow-x-auto rounded-xl border border-border/60">
          <table className="w-full text-xs">
            <thead className="bg-surface/60 text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2 font-mono uppercase tracking-widest text-[10px]">Partner</th>
                <th className="text-left px-3 py-2 font-mono uppercase tracking-widest text-[10px]">PDM</th>
                <th className="text-left px-3 py-2 font-mono uppercase tracking-widest text-[10px]">Type</th>
                <th className="text-right px-3 py-2 font-mono uppercase tracking-widest text-[10px]">{REVENUE_METRIC_LABEL[metric]}</th>
                <th className="text-right px-3 py-2 font-mono uppercase tracking-widest text-[10px]">Maturity</th>
              </tr>
            </thead>
            <tbody>
              {top.map((r) => (
                <tr key={r.partner.id} className="border-t border-border/40">
                  <td className="px-3 py-2 text-foreground font-medium">{r.partner.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{pdmName(r.partner.owner_id)}</td>
                  <td className="px-3 py-2 text-muted-foreground capitalize">{r.partner.partner_type}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">{fmtMoney(r.value)}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">{r.maturity ? r.maturity.toFixed(1) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ReportCard>
  );
}