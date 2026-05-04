import type { LeadRow } from "@/lib/leads-store";
import { ReportCard } from "./ReportCard";
import { CandyHorizontalStacked, CandyStackedArea } from "@/components/ui/candy-charts";
import {
  leadFunnel,
  LEAD_STAGE_LABEL,
  leadTrendByMonth,
  type LeadStageKey,
} from "@/lib/reports/aggregations";
import { KpiTile } from "./KpiTile";
import { Inbox, CheckCircle2, Clock, XCircle } from "lucide-react";

const STAGE_ORDER: LeadStageKey[] = ["new", "in_review", "approved", "rejected"];
const STAGE_COLOR: Record<LeadStageKey, string> = {
  new: "var(--secondary)",
  in_review: "var(--warning)",
  approved: "var(--success)",
  rejected: "var(--destructive)",
};

export function PipelineReport({ leads }: { leads: LeadRow[] }) {
  const f = leadFunnel(leads);
  const rows = STAGE_ORDER.map((s) => ({
    label: LEAD_STAGE_LABEL[s],
    total: f.counts[s],
    segments: [{ label: LEAD_STAGE_LABEL[s], value: f.counts[s], color: STAGE_COLOR[s] }],
  }));
  const trend = leadTrendByMonth(leads, 6);

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiTile
          label="Total leads"
          value={String(f.total)}
          hint={`${(f.approvedRate * 100).toFixed(0)}% approval rate`}
          icon={Inbox}
          accent="var(--secondary)"
          delay={0}
        />
        <KpiTile
          label="In review"
          value={String(f.counts.in_review)}
          hint={`avg ${f.avgDaysByStatus.in_review.toFixed(1)} days`}
          icon={Clock}
          accent="var(--warning)"
          delay={0.05}
        />
        <KpiTile
          label="Approved"
          value={String(f.counts.approved)}
          hint={`avg ${f.avgDaysByStatus.approved.toFixed(1)} days`}
          icon={CheckCircle2}
          accent="var(--success)"
          delay={0.1}
        />
        <KpiTile
          label="Rejected"
          value={String(f.counts.rejected)}
          hint={`avg ${f.avgDaysByStatus.rejected.toFixed(1)} days`}
          icon={XCircle}
          accent="var(--destructive)"
          delay={0.15}
        />
      </section>

      <ReportCard
        title="Lead inflow · last 6 months"
        description="Stacked monthly leads by status — spot pipeline acceleration or stalls."
        csvRows={() =>
          trend.map((m) => ({
            month: m.label,
            new: m.new,
            in_review: m.in_review,
            approved: m.approved,
            rejected: m.rejected,
          }))
        }
      >
        <CandyStackedArea
          data={trend}
          series={STAGE_ORDER.map((s) => ({
            key: s,
            label: LEAD_STAGE_LABEL[s],
            color: STAGE_COLOR[s],
          }))}
          height={240}
          emptyMessage="No leads created in the last 6 months."
        />
      </ReportCard>

      <ReportCard
      title="Lead qualification pipeline"
      description={`${f.total} leads · ${(f.approvedRate * 100).toFixed(0)}% approval rate`}
      csvRows={() =>
        STAGE_ORDER.map((s) => ({
          stage: LEAD_STAGE_LABEL[s],
          count: f.counts[s],
          avg_days_in_stage: f.avgDaysByStatus[s].toFixed(1),
        }))
      }
    >
      <CandyHorizontalStacked
        rows={rows}
        legend={STAGE_ORDER.map((s) => ({ label: LEAD_STAGE_LABEL[s], color: STAGE_COLOR[s] }))}
        labelWidth={110}
      />
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {STAGE_ORDER.map((s) => (
          <div key={s} className="rounded-xl border border-border/60 bg-surface/40 p-3">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{LEAD_STAGE_LABEL[s]}</div>
            <div className="mt-1 font-display font-bold text-lg">{f.counts[s]}</div>
            <div className="text-[10px] text-muted-foreground">avg {f.avgDaysByStatus[s].toFixed(1)}d</div>
          </div>
        ))}
      </div>
      </ReportCard>
    </div>
  );
}