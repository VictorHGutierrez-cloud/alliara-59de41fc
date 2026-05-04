import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { usePortfolio } from "@/lib/partners-store";
import { useLeads } from "@/lib/leads-store";
import { useLatestPartnerRevenue } from "@/lib/partner-revenue";
import { usePdmRoster } from "@/lib/use-pdm-roster";
import { useReportFilters } from "@/lib/reports/use-report-filters";
import { applyReportFilters } from "@/lib/reports/aggregations";
import { ReportFiltersBar } from "@/components/reports/ReportFiltersBar";
import { OverviewReport } from "@/components/reports/OverviewReport";
import { RevenueReport } from "@/components/reports/RevenueReport";
import { HealthByPdmReport } from "@/components/reports/HealthByPdmReport";
import { MaturityReport } from "@/components/reports/MaturityReport";
import { PipelineReport } from "@/components/reports/PipelineReport";
import { MixReport } from "@/components/reports/MixReport";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — Alliara" }] }),
  component: ReportsPage,
});

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "revenue", label: "Revenue" },
  { key: "health", label: "Health" },
  { key: "maturity", label: "Maturity" },
  { key: "pipeline", label: "Pipeline" },
  { key: "mix", label: "Mix" },
] as const;
type TabKey = typeof TABS[number]["key"];

function ReportsPage() {
  const { user, loading } = useAuth();
  const portfolio = usePortfolio(user?.id);
  const leads = useLeads(user?.id);
  const pdmRoster = usePdmRoster();
  const { filters, set, reset } = useReportFilters({
    scope: portfolio.isLeadership ? "all" : "mine",
  });
  const [tab, setTab] = useState<TabKey>("overview");

  const scoped = useMemo(
    () => applyReportFilters(portfolio.items, filters, user?.id),
    [portfolio.items, filters, user?.id],
  );
  const partnerIds = scoped.map((it) => it.partner.id);
  const { map: revenueMap } = useLatestPartnerRevenue(partnerIds);

  const pdmName = useMemo(() => {
    const m = new Map(pdmRoster.pdms.map((p) => [p.id, p.name]));
    return (id: string) => m.get(id) ?? (id ? id.slice(0, 8) : "Unassigned");
  }, [pdmRoster.pdms]);

  if (loading || !user) return <div className="p-10 text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 space-y-5">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Analytics</p>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Filter your portfolio, switch between report types, and export anything to CSV or PNG.
          </p>
        </div>
        <span className="btn-candy-ghost cursor-not-allowed opacity-70" title="Coming soon">
          + Custom report (soon)
        </span>
      </header>

      <ReportFiltersBar
        filters={filters}
        set={set}
        reset={reset}
        pdms={pdmRoster.pdms}
        isLeadership={portfolio.isLeadership}
        count={scoped.length}
        total={portfolio.items.length}
      />

      <div className="seg-candy w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            className="seg-candy-item"
            data-active={tab === t.key}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {tab === "overview" && <OverviewReport items={scoped} revenueMap={revenueMap} />}
        {tab === "revenue" && <RevenueReport items={scoped} revenueMap={revenueMap} pdmName={pdmName} />}
        {tab === "health" && <HealthByPdmReport items={scoped} pdmName={pdmName} />}
        {tab === "maturity" && <MaturityReport items={scoped} />}
        {tab === "pipeline" && <PipelineReport leads={leads.leads} />}
        {tab === "mix" && <MixReport items={scoped} />}
      </div>
    </div>
  );
}