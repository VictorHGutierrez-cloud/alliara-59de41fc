import { RotateCcw } from "lucide-react";
import type { ReportFilters } from "@/lib/reports/use-report-filters";
import type { PdmEntry } from "@/lib/use-pdm-roster";

interface Props {
  filters: ReportFilters;
  set: <K extends keyof ReportFilters>(k: K, v: ReportFilters[K]) => void;
  reset: () => void;
  pdms: PdmEntry[];
  isLeadership: boolean;
  count: number;
  total: number;
}

export function ReportFiltersBar({ filters, set, reset, pdms, isLeadership, count, total }: Props) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4 card-elev">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Global filters
        </p>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-muted-foreground">
            <span className="text-foreground font-semibold">{count}</span> of {total} partners shown
          </span>
          <button onClick={reset} className="btn-candy-ghost" title="Reset filters">
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {isLeadership && (
          <div className="seg-candy" role="group" aria-label="Scope">
            {(["mine", "all"] as const).map((s) => (
              <button
                key={s}
                className="seg-candy-item"
                data-active={filters.scope === s}
                onClick={() => set("scope", s)}
              >
                {s === "mine" ? "My partners" : "All partners"}
              </button>
            ))}
          </div>
        )}

        {isLeadership && filters.scope === "all" && pdms.length > 0 && (
          <select
            value={filters.pdmId}
            onChange={(e) => set("pdmId", e.target.value)}
            className="select-candy"
            aria-label="PDM"
          >
            <option value="all">PDM: All ({pdms.length})</option>
            {pdms.map((p) => (
              <option key={p.id} value={p.id}>PDM: {p.name}</option>
            ))}
          </select>
        )}

        <select
          value={filters.type}
          onChange={(e) => set("type", e.target.value as ReportFilters["type"])}
          className="select-candy"
          aria-label="Type"
        >
          <option value="all">Type: All</option>
          <option value="referral">Referral</option>
          <option value="reseller">Reseller</option>
          <option value="expert">Expert</option>
        </select>

        <select
          value={filters.status}
          onChange={(e) => set("status", e.target.value as ReportFilters["status"])}
          className="select-candy"
          aria-label="Status"
        >
          <option value="all">Status: All</option>
          <option value="active">Scaling</option>
          <option value="nurturing">Developing</option>
          <option value="at_risk">Churn Risk</option>
          <option value="paused">Paused</option>
          <option value="archived">Archived</option>
        </select>

        <select
          value={filters.tier}
          onChange={(e) => set("tier", e.target.value as ReportFilters["tier"])}
          className="select-candy"
          aria-label="Tier"
        >
          <option value="all">Tier: All</option>
          <option value="strategic">Strategic</option>
          <option value="core">Core</option>
          <option value="emerging">Emerging</option>
          <option value="long_tail">Long tail</option>
        </select>

        <select
          value={filters.period}
          onChange={(e) => set("period", e.target.value as ReportFilters["period"])}
          className="select-candy"
          aria-label="Period (created)"
        >
          <option value="all">Created: All time</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="6m">Last 6 months</option>
          <option value="12m">Last 12 months</option>
        </select>
      </div>
    </section>
  );
}