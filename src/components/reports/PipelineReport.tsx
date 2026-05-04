import type { LeadRow } from "@/lib/leads-store";
import { ReportCard } from "./ReportCard";
import { CandyHorizontalStacked } from "@/components/ui/candy-charts";
import { leadFunnel, LEAD_STAGE_LABEL, type LeadStageKey } from "@/lib/reports/aggregations";

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

  return (
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
  );
}