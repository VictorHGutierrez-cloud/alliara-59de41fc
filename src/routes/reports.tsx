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
import { Skeleton } from "@/components/ui/skeleton";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "revenue", label: "Revenue" },
  { key: "health", label: "Health" },
  { key: "maturity", label: "Maturity" },
  { key: "pipeline", label: "Pipeline" },
  { key: "mix", label: "Mix" },
] as const;
type TabKey = typeof TABS[number]["key"];

export const Route = createFileRoute("/reports")({
  validateSearch: (search: Record<string, unknown>) => {
    const raw = typeof search.tab === "string" ? search.tab : undefined;
    const valid = raw && TABS.some((t) => t.key === raw) ? (raw as TabKey) : undefined;
    const scope = search.scope === "all" ? "all" : search.scope === "mine" ? "mine" : undefined;
    const pdm = typeof search.pdm === "string" ? search.pdm : undefined;
    const status = typeof search.status === "string" ? search.status : undefined;
    const tier = typeof search.tier === "string" ? search.tier : undefined;
    const period = typeof search.period === "string" ? search.period : undefined;
    const type = typeof search.type === "string" ? search.type : undefined;
    return { tab: valid, scope, pdm, status, tier, period, type };
  },
  head: () => ({ meta: [{ title: "Reports — Alliara" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const { user, loading } = useAuth();
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const portfolio = usePortfolio(user?.id);
  const leads = useLeads(user?.id);
  const pdmRoster = usePdmRoster();
  const { filters, set, reset } = useReportFilters({
    scope: search.scope === "all" || search.scope === "mine" ? search.scope : (portfolio.isLeadership ? "all" : "mine"),
    pdmId: search.pdm ?? "all",
    status: (search.status as "all" | "active" | "nurturing" | "at_risk" | "paused" | "archived") ?? "all",
    tier: (search.tier as "all" | "strategic" | "core" | "emerging" | "long_tail") ?? "all",
    period: (search.period as "30d" | "90d" | "6m" | "12m" | "all") ?? "all",
    type: (search.type as "all" | "referral" | "reseller" | "expert") ?? "all",
  });
  const [tabFallback, setTabFallback] = useState<TabKey>("overview");
  const tab = search.tab ?? tabFallback;

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

  if (loading || !user || portfolio.loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8 space-y-5">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-10 w-96 rounded-xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (portfolio.error) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6">
          <h1 className="text-xl font-semibold text-foreground">Could not load reports data</h1>
          <p className="mt-2 text-sm text-muted-foreground">{portfolio.error}</p>
          <button onClick={() => void portfolio.retry()} className="mt-4 btn-candy">
            Retry
          </button>
        </div>
      </div>
    );
  }

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
        set={(k, v) => {
          set(k, v);
          void navigate({
            search: (prev) => ({
              ...prev,
              [k === "pdmId" ? "pdm" : k]: v,
            }),
          });
        }}
        reset={() => {
          reset();
          void navigate({
            search: (prev) => ({
              ...prev,
              scope: portfolio.isLeadership ? "all" : "mine",
              pdm: "all",
              type: "all",
              status: "all",
              tier: "all",
              period: "all",
            }),
          });
        }}
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
            onClick={() => {
              setTabFallback(t.key);
              void navigate({ search: (prev) => ({ ...prev, tab: t.key }) });
            }}
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