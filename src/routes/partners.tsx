import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  usePortfolio,
  statusLabel,
  tierColor,
  type PortfolioItem,
  type ActionRow,
} from "../lib/partners-store";
import { useLeads } from "../lib/leads-store";
import { AXES, type Axis } from "../content/octa";
import { toast } from "sonner";
import { Check, Focus, X as XIcon, Target } from "lucide-react";
import { PARTNER_TYPES, type PartnerType, type SortKey } from "@/lib/partner-types";
import { PartnerFilterBar, PartnerTypeChip } from "@/components/PartnerFilterBar";
import { useLatestPartnerRevenue, fmtMoney } from "@/lib/partner-revenue";
import { useOwnerScope } from "@/lib/use-owner-scope";
import { usePdmRoster, type PdmEntry } from "@/lib/use-pdm-roster";
import {
  BulkReassignDialog,
  type ReassignAssignment,
  type ReassignItem,
} from "@/components/BulkReassignDialog";
import { CandyBarChart, CandyComposition, type BarDatum } from "@/components/ui/candy-charts";
import {
  CandyDataTable,
  CandyAvatar,
  StatusPill,
  type StatusTone,
  type CandyColumn,
} from "@/components/ui/candy-data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { COPY, buildPortfolioBriefingText } from "@/lib/copy";
import { EmptyPortfolioOnboarding } from "@/components/onboarding/EmptyPortfolioOnboarding";
import { TeamPulse } from "@/components/leadership/TeamPulse";
import { useConfirmDialog } from "@/components/ui/confirm-provider";

export const Route = createFileRoute("/partners")({
  head: () => ({ meta: [{ title: COPY.portfolio.pageMetaTitle }] }),
  component: PartnersPage,
});

type StatusFilter = "all" | "active" | "nurturing" | "at_risk";
type EnrichedAction = ActionRow & { partner_name: string };

function PartnersPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const portfolio = usePortfolio(user?.id);
  const leads = useLeads(user?.id);
  const [showNew, setShowNew] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<PartnerType | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("name_asc");
  const [openActions, setOpenActions] = useState<(ActionRow & { partner_name: string })[]>([]);
  const [actionsLoading, setActionsLoading] = useState(true);
  const [axisFilter, setAxisFilter] = useState<string | "all">("all");
  const [focusMode, setFocusMode] = useState(false);
  const [selectedAction, setSelectedAction] = useState<EnrichedAction | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [selectedForReassign, setSelectedForReassign] = useState<string[]>([]);
  const confirmDialog = useConfirmDialog();

  const ownerScope = useOwnerScope({
    items: portfolio.items,
    getOwnerId: (it) => it.partner.owner_id,
    isLeadership: portfolio.isLeadership,
    currentUserId: user?.id,
  });
  const {
    scope: scopeFilter,
    setScope: setScopeFilter,
    ownerFilter,
    setOwnerFilter,
    ownersInScope,
    ownerNames,
  } = ownerScope;
  const pdmRoster = usePdmRoster();

  const reassignPartner = async (partnerId: string, newOwnerId: string, newOwnerName: string) => {
    try {
      const { error } = await supabase
        .from("partners")
        .update({ owner_id: newOwnerId })
        .eq("id", partnerId);
      if (error) throw error;
      toast.success(COPY.toast.reassignedPartner({ name: newOwnerName }));
      await portfolio.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const bulkReassign = async (assignments: ReassignAssignment[]) => {
    if (assignments.length === 0) {
      setReassignOpen(false);
      return;
    }
    setBulkBusy(true);
    try {
      // Group by target owner so we can do one update per target.
      const byOwner = new Map<string, string[]>();
      for (const a of assignments) {
        const arr = byOwner.get(a.newOwnerId) ?? [];
        arr.push(a.id);
        byOwner.set(a.newOwnerId, arr);
      }
      let total = 0;
      for (const [ownerId, ids] of byOwner) {
        const { error, count } = await supabase
          .from("partners")
          .update({ owner_id: ownerId } as never, { count: "exact" })
          .in("id", ids);
        if (error) throw error;
        total += count ?? ids.length;
      }
      toast.success(COPY.toast.bulkReassignedPartners({ n: total }));
      setReassignOpen(false);
      setSelectedForReassign([]);
      await portfolio.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBulkBusy(false);
    }
  };

  const bulkUpdate = async (
    ids: string[],
    patch: { status?: string; tier?: string; partner_type?: string; owner_id?: string },
    label: string,
  ) => {
    if (ids.length === 0) return;
    setBulkBusy(true);
    try {
      const { error, count } = await supabase
        .from("partners")
        .update(patch as never, { count: "exact" })
        .in("id", ids);
      if (error) throw error;
      toast.success(COPY.toast.partnersUpdated({ count: count ?? ids.length, label }));
      await portfolio.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBulkBusy(false);
    }
  };

  const bulkDelete = async (ids: string[]) => {
    if (ids.length === 0) return;
    const names = portfolio.items
      .filter((it) => ids.includes(it.partner.id))
      .map((it) => it.partner.name);
    const ok = await confirmDialog({
      title: `Delete ${ids.length} partner${ids.length === 1 ? "" : "s"}?`,
      description: `${names.join(", ")}\n\nThis permanently removes diagnostics, plans, intel runs and documents.`,
      actionLabel: "Delete",
    });
    if (!ok) return;
    setBulkBusy(true);
    try {
      const { error, count } = await supabase
        .from("partners")
        .delete({ count: "exact" })
        .in("id", ids);
      if (error) throw error;
      toast.success(COPY.toast.partnersDeleted({ count: count ?? ids.length }));
      await portfolio.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBulkBusy(false);
    }
  };

  const completeAction = async (a: EnrichedAction) => {
    setCompleting(a.id);
    try {
      const { error } = await supabase
        .from("action_plans")
        .update({ status: "done", completed_at: new Date().toISOString() })
        .eq("id", a.id);
      if (error) throw error;
      setOpenActions((prev) => prev.filter((x) => x.id !== a.id));
      if (selectedAction?.id === a.id) setSelectedAction(null);
      toast.success(COPY.toast.moveMarkedDone({ title: a.title }));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCompleting(null);
    }
  };

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  // Aggregate open growth initiatives across all visible partners
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!user || portfolio.loading) return;
      setActionsLoading(true);
      const ownPartners = portfolio.items.filter((it) => it.partner.owner_id === user.id);
      const ids = ownPartners.map((p) => p.partner.id);
      if (ids.length === 0) {
        if (!cancelled) {
          setOpenActions([]);
          setActionsLoading(false);
        }
        return;
      }
      const { data } = await supabase
        .from("action_plans")
        .select("*")
        .in("partner_id", ids)
        .neq("status", "done")
        .order("due_date", { ascending: true, nullsFirst: false });
      if (cancelled) return;
      const nameMap = new Map(ownPartners.map((p) => [p.partner.id, p.partner.name]));
      const enriched = (data ?? []).map((a) => ({
        ...(a as ActionRow),
        partner_name: nameMap.get((a as ActionRow).partner_id) ?? "—",
      }));
      setOpenActions(enriched);
      setActionsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, portfolio.items, portfolio.loading]);

  const scoped = useMemo(() => {
    if (!user || portfolio.loading || portfolio.error) return [] as PortfolioItem[];
    return portfolio.items.filter(ownerScope.applyFilter);
  }, [user, portfolio.items, portfolio.loading, portfolio.error, ownerScope]);

  const partnerIds = useMemo(() => scoped.map((it) => it.partner.id), [scoped]);

  const { map: revenueMap } = useLatestPartnerRevenue(partnerIds);

  const statusCounts = useMemo(
    () => ({
      active: scoped.filter((i) => i.partner.status === "active").length,
      nurturing: scoped.filter((i) => i.partner.status === "nurturing").length,
      at_risk: scoped.filter((i) => i.partner.status === "at_risk").length,
      paused: scoped.filter((i) => i.partner.status === "paused").length,
      archived: scoped.filter((i) => i.partner.status === "archived").length,
    }),
    [scoped],
  );

  const activeTotal = statusCounts.active + statusCounts.nurturing + statusCounts.at_risk;

  const sourcedPipeline = useMemo(() => {
    let total = 0;
    let withMetrics = 0;
    for (const id of partnerIds) {
      const r = revenueMap.get(id);
      if (!r) continue;
      const v = r.mrr ?? 0;
      if (v > 0) withMetrics += 1;
      total += v;
    }
    return { total, withMetrics };
  }, [partnerIds, revenueMap]);

  const filtered = useMemo(() => {
    return scoped.filter((it) => {
      if (statusFilter !== "all" && it.partner.status !== statusFilter) return false;
      if (typeFilter !== "all" && it.partner.partner_type !== typeFilter) return false;
      if (
        query &&
        !`${it.partner.name} ${it.partner.company ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [scoped, statusFilter, typeFilter, query]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const ra = revenueMap.get(a.partner.id);
      const rb = revenueMap.get(b.partner.id);
      switch (sortKey) {
        case "name_asc":
          return a.partner.name.localeCompare(b.partner.name);
        case "name_desc":
          return b.partner.name.localeCompare(a.partner.name);
        case "revenue_desc": {
          const va = (ra?.revenue ?? 0) + (ra?.dealsWonValue ?? 0);
          const vb = (rb?.revenue ?? 0) + (rb?.dealsWonValue ?? 0);
          return vb - va;
        }
        case "mrr_desc":
          return (rb?.mrr ?? 0) - (ra?.mrr ?? 0);
        case "created_desc":
          return (
            new Date(b.partner.created_at).getTime() - new Date(a.partner.created_at).getTime()
          );
        case "maturity_desc":
          return Number(b.latest?.overall ?? 0) - Number(a.latest?.overall ?? 0);
      }
    });
    return arr;
  }, [filtered, sortKey, revenueMap]);

  const aggregate = useMemo(() => {
    const scored = filtered.filter((i) => i.latest);
    const avg = scored.length
      ? scored.reduce((s, i) => s + Number(i.latest!.overall), 0) / scored.length
      : 0;
    return { count: filtered.length, scored: scored.length, avg };
  }, [filtered]);

  const topMrrData = useMemo<BarDatum[]>(() => {
    const rows = scoped
      .map((it) => {
        const r = revenueMap.get(it.partner.id);
        return {
          name: it.partner.name,
          mrr: r?.mrr ?? 0,
          maturity: it.latest ? Number(it.latest.overall) : 0,
        };
      })
      .filter((r) => r.mrr > 0)
      .sort((a, b) => b.mrr - a.mrr)
      .slice(0, 8);
    return rows.map((r) => ({
      label: r.name.length > 14 ? r.name.slice(0, 13) + "…" : r.name,
      value: r.mrr,
      secondary: r.maturity > 0 ? { label: "Maturity", value: r.maturity.toFixed(1) } : undefined,
    }));
  }, [scoped, revenueMap]);

  const pendingLeads = leads.leads.filter((l) => l.status === "new" || l.status === "in_review");
  const overdueActions = openActions.filter((a) => isOverdue(a.due_date));
  const highPriorityOpen = openActions.filter((a) => a.priority === "high");

  const visibleActions = useMemo(() => {
    const base =
      axisFilter === "all" ? openActions : openActions.filter((a) => a.axis_key === axisFilter);
    return sortActions(base);
  }, [openActions, axisFilter]);
  const focusActions = visibleActions.slice(0, 3);

  const axisCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of openActions) m.set(a.axis_key, (m.get(a.axis_key) ?? 0) + 1);
    return m;
  }, [openActions]);

  const briefing = buildPortfolioBriefingText({
    atRisk: statusCounts.at_risk,
    overdue: overdueActions.length,
    leads: pendingLeads.length,
    highPriority: highPriorityOpen.length,
    scope: scopeFilter === "all" ? "all" : "mine",
    ownerLabel:
      ownerFilter === "all"
        ? "your Partner Development team"
        : (ownerNames.get(ownerFilter) ?? "the selected teammate"),
  });

  const displayName =
    (user?.user_metadata as { display_name?: string } | null)?.display_name ??
    user?.email?.split("@")[0] ??
    "operator";

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8 space-y-5">
        <Skeleton className="h-7 w-72" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (portfolio.error) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6">
          <h1 className="text-xl font-semibold text-foreground">{COPY.portfolio.loadErrorTitle}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{portfolio.error}</p>
          <button onClick={() => void portfolio.retry()} className="mt-4 btn-candy min-h-11 px-6">
            {COPY.portfolio.retry}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* 1. Compact header */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            {scopeFilter === "all"
              ? COPY.portfolio.kickerAllPartners
              : COPY.portfolio.kickerPortfolioMine}{" "}
            · {greeting()}
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
          {greeting()}, {displayName}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">{briefing}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {statusCounts.at_risk > 0 && (
            <button
              onClick={() => setStatusFilter("at_risk")}
              className="inline-flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20 transition"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
              {COPY.portfolio.churnAlert({ n: statusCounts.at_risk })}
            </button>
          )}
          {pendingLeads.length > 0 && (
            <Link
              to="/qualification"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:bg-surface-2 transition"
            >
              {COPY.portfolio.qualifyLeadsChip({ n: pendingLeads.length })}
            </Link>
          )}
          {overdueActions.length > 0 && (
            <a
              href="#growth-initiatives"
              className="inline-flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-1.5 text-xs font-medium text-warning hover:bg-warning/15 transition"
            >
              {COPY.portfolio.overdueNudge({ n: overdueActions.length })}
            </a>
          )}
        </div>
      </section>

      {/* Global scope + PDM filter — drives KPIs and roster */}
      {portfolio.isLeadership && (
        <section className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-surface/40 p-2">
          <span className="px-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            View
          </span>
          <div className="seg-candy">
            {(["mine", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setScopeFilter(f)}
                className="seg-candy-item"
                data-active={scopeFilter === f}
              >
                {f === "mine" ? "My partners" : "All partners"}
              </button>
            ))}
          </div>
          {scopeFilter === "all" && (pdmRoster.pdms.length > 0 || ownersInScope.length > 1) && (
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="select-candy"
              title="Filter by PDM"
            >
              {(() => {
                const roster: PdmEntry[] =
                  pdmRoster.pdms.length > 0 ? pdmRoster.pdms : ownersInScope;
                return (
                  <>
                    <option value="all">PDM: All ({roster.length})</option>
                    {roster.map((o) => (
                      <option key={o.id} value={o.id}>
                        PDM: {o.name}
                      </option>
                    ))}
                  </>
                );
              })()}
            </select>
          )}
          <span className="ml-auto px-2 text-[11px] text-muted-foreground">
            {scopeFilter === "mine"
              ? "Showing your portfolio"
              : ownerFilter === "all"
                ? `Showing all PDMs · ${scoped.length} partners`
                : `Showing ${ownerNames.get(ownerFilter) ?? "PDM"} · ${scoped.length} partners`}
          </span>
        </section>
      )}

      <section className="mt-5 grid sm:grid-cols-3 gap-3">
        <KpiCard
          label="Open MRR"
          value={fmtMoney(sourcedPipeline.total)}
          hint={`${sourcedPipeline.withMetrics} partner${sourcedPipeline.withMetrics === 1 ? "" : "s"} reporting`}
          accent="octa-1"
          primary
        />
        <KpiCard
          label={COPY.status.at_risk}
          value={String(statusCounts.at_risk)}
          hint={`${activeTotal} active partners in scope`}
          accent="octa-5"
        />
        <KpiCard
          label="Avg maturity"
          value={aggregate.scored > 0 ? aggregate.avg.toFixed(1) : "—"}
          hint={
            aggregate.scored > 0
              ? `${aggregate.scored} diagnosed`
              : `Run ${COPY.diagnostic.noun.toLowerCase()}s to unlock`
          }
          accent="octa-4"
        />
      </section>

      {/* Metrics moved to Reports — keep only the qualification queue here */}
      <section className="mt-6 grid lg:grid-cols-3 gap-4">
        <Link
          to="/reports"
          className="lg:col-span-2 rounded-2xl border border-border/60 bg-card p-6 card-elev relative overflow-hidden hover:border-primary/40 transition group"
        >
          <div
            className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full opacity-40 blur-3xl"
            style={{ background: "var(--primary)" }}
          />
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            {COPY.portfolio.reportsCardEyebrow}
          </p>
          <h2 className="mt-1 text-lg font-semibold">{COPY.portfolio.reportsCardTitle}</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl">
            {COPY.portfolio.reportsCardBody}
          </p>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary group-hover:translate-x-0.5 transition">
            {COPY.portfolio.reportsCardCta}
          </span>
        </Link>

        {/* Qualification Queue */}
        <div className="rounded-2xl border border-border bg-card p-6 card-elev">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            {COPY.portfolio.qualQueueEyebrow}
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-5xl font-display font-bold ${pendingLeads.length > 0 ? "text-foreground" : "text-muted-foreground/60"}`}
            >
              {pendingLeads.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {COPY.portfolio.qualPendingIppSuffix}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {pendingLeads.length === 0
              ? COPY.portfolio.qualQueueEmptyCopy
              : `${leads.leads.filter((l) => l.status === "new").length} new · ${leads.leads.filter((l) => l.status === "in_review").length} in review`}
          </p>
          <div className="mt-4 h-1 rounded-full bg-surface-2 overflow-hidden">
            <div
              className="h-full bg-primary/50 transition-all"
              style={{ width: `${Math.min(100, pendingLeads.length * 10)}%` }}
            />
          </div>
          <Link
            to="/qualification"
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary hover:bg-primary/90 px-4 text-sm font-semibold text-primary-foreground transition shadow-[0_8px_20px_-6px_oklch(0.52_0.16_160_/_0.4)]"
          >
            {COPY.portfolio.qualReviewCta}
          </Link>
        </div>
      </section>

      {/* 5. Growth Initiatives Due */}
      <section
        id="growth-initiatives"
        className="mt-6 rounded-2xl border border-border/60 bg-card p-6 card-elev"
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              {COPY.portfolio.initiativesEyebrow}
            </p>
            <h2 className="mt-1 text-lg font-semibold flex items-center gap-2">
              {focusMode && <Target className="h-4 w-4 text-destructive" />}
              {focusMode
                ? COPY.portfolio.initiativesTitleFocus
                : COPY.portfolio.initiativesTitleIdle}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {focusMode ? COPY.portfolio.initiativesBodyFocus : COPY.portfolio.initiativesBodyIdle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">
              {visibleActions.length} open · {overdueActions.length} overdue
            </span>
            <button
              onClick={() => setFocusMode((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                focusMode
                  ? "border-destructive/40 bg-destructive/15 text-destructive shadow-[0_4px_16px_-6px_oklch(0.58_0.2_27_/_0.45)]"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-surface-2"
              }`}
            >
              <Focus className="h-3.5 w-3.5" />
              {focusMode ? COPY.portfolio.focusModeExit : COPY.portfolio.focusModeEnter}
            </button>
          </div>
        </div>

        {/* Axis filter chips */}
        {!focusMode && openActions.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setAxisFilter("all")}
              className={`text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-md border transition ${
                axisFilter === "all"
                  ? "border-foreground/30 bg-surface-2 text-foreground"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-surface-2"
              }`}
            >
              All · {openActions.length}
            </button>
            {AXES.map((ax) => {
              const count = axisCounts.get(ax.key) ?? 0;
              const active = axisFilter === ax.key;
              const disabled = count === 0;
              return (
                <button
                  key={ax.key}
                  onClick={() => !disabled && setAxisFilter(active ? "all" : ax.key)}
                  disabled={disabled}
                  title={ax.name}
                  className={`text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-md border transition flex items-center gap-1.5 ${
                    disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
                  } ${active ? "" : "hover:bg-surface-2"}`}
                  style={
                    active
                      ? {
                          borderColor: `color-mix(in oklab, var(--${ax.color}) 60%, transparent)`,
                          background: `color-mix(in oklab, var(--${ax.color}) 18%, transparent)`,
                          color: `var(--${ax.color})`,
                        }
                      : {
                          borderColor: "rgba(255,255,255,0.06)",
                          background: "rgba(255,255,255,0.02)",
                          color: "var(--muted-foreground)",
                        }
                  }
                >
                  <span style={{ color: `var(--${ax.color})` }}>{ax.letter}</span>
                  <span>{count}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-5">
          {actionsLoading ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              {COPY.portfolio.loadingInitiatives}
            </div>
          ) : visibleActions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-surface/40 p-8 text-center text-sm text-muted-foreground">
              {openActions.length === 0
                ? COPY.portfolio.initiativesEmptyWide
                : COPY.portfolio.initiativesEmptyAxis}
            </div>
          ) : (
            <ul className="space-y-2 -mx-2">
              {(focusMode ? focusActions : visibleActions.slice(0, 8)).map((a) => {
                const axis = AXES.find((x) => x.key === a.axis_key);
                const due = a.due_date ? new Date(a.due_date) : null;
                const overdue = isOverdue(a.due_date);
                const isHigh = a.priority === "high";
                return (
                  <li key={a.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedAction(a)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedAction(a);
                        }
                      }}
                      className={`group flex items-center gap-3 px-3 py-3 rounded-lg transition border cursor-pointer ${
                        isHigh
                          ? "border-l-4 border-l-destructive border-y border-r border-y-destructive/20 border-r-destructive/20 bg-destructive/5 shadow-[0_8px_24px_-8px_oklch(0.58_0.2_27_/_0.35)] hover:bg-destructive/10"
                          : "border-border bg-surface hover:bg-surface-2"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void completeAction(a);
                        }}
                        disabled={completing === a.id}
                        title="Mark complete"
                        className={`shrink-0 h-6 w-6 rounded-md border flex items-center justify-center transition ${
                          isHigh
                            ? "border-destructive/50 bg-destructive/10 hover:bg-primary hover:border-primary"
                            : "border-border bg-surface hover:bg-primary hover:border-primary"
                        } disabled:opacity-50`}
                      >
                        <Check className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 text-primary-foreground transition" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {axis && (
                            <span
                              className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded"
                              style={{
                                background: `color-mix(in oklab, var(--${axis.color}) 22%, transparent)`,
                                color: `var(--${axis.color})`,
                              }}
                            >
                              {axis.letter}
                            </span>
                          )}
                          <span
                            className={`text-sm truncate ${isHigh ? "font-bold text-foreground" : "font-medium"}`}
                          >
                            {a.title}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground truncate">
                          {a.partner_name}
                          {a.status === "doing" ? " · in motion" : " · planned"}
                        </div>
                      </div>
                      <PriorityPill p={a.priority} />
                      <span
                        className={`text-xs font-mono w-20 text-right ${overdue ? "text-destructive font-semibold" : "text-muted-foreground"}`}
                      >
                        {due ? formatDue(due, overdue) : "no date"}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {focusMode && focusActions.length > 0 && (
            <p className="mt-4 text-center text-[11px] font-mono text-muted-foreground">
              {visibleActions.length - focusActions.length > 0
                ? COPY.focusCopy.hiddenMoreMoves({ n: visibleActions.length - focusActions.length })
                : COPY.focusCopy.onlyTheseMoves}
            </p>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border/60 bg-card p-6 card-elev">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              {COPY.portfolio.weeklyReviewEyebrow}
            </p>
            <h2 className="mt-1 text-lg font-semibold">{COPY.portfolio.weeklyReviewTitle}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{COPY.portfolio.weeklyReviewBody}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() =>
                copyWeeklyDigest("slack", {
                  atRisk: statusCounts.at_risk,
                  overdue: overdueActions.length,
                  top: focusActions,
                })
              }
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs hover:bg-surface-2"
            >
              {COPY.portfolio.exportSlack}
            </button>
            <button
              onClick={() =>
                copyWeeklyDigest("email", {
                  atRisk: statusCounts.at_risk,
                  overdue: overdueActions.length,
                  top: focusActions,
                })
              }
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs hover:bg-surface-2"
            >
              {COPY.portfolio.exportEmail}
            </button>
          </div>
        </div>
      </section>

      {portfolio.isLeadership && scopeFilter === "all" && (
        <section className="mt-6">
          <TeamPulse items={scoped} ownerNames={ownerNames} />
        </section>
      )}

      {/* 6. Partner Roster */}
      <section className="mt-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              {COPY.portfolio.rosterEyebrow}
            </p>
            <h2 className="mt-1 text-2xl font-semibold">{COPY.portfolio.rosterTitle}</h2>
            {statusFilter !== "all" && (
              <p className="text-xs text-muted-foreground mt-1">
                Filtered by{" "}
                <span className="text-foreground font-medium">{prettyStatus(statusFilter)}</span> ·
                <button
                  onClick={() => setStatusFilter("all")}
                  className="ml-1 underline hover:text-foreground"
                >
                  show all
                </button>
              </p>
            )}
          </div>
          <button onClick={() => setShowNew(true)} className="btn-candy min-h-11 px-5">
            {COPY.portfolio.addPartnerCta}
          </button>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <PartnerFilterBar
            query={query}
            onQuery={setQuery}
            type={typeFilter}
            onType={setTypeFilter}
            sort={sortKey}
            onSort={setSortKey}
          />
        </div>

        <div className="mt-5">
          {portfolio.loading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          ) : sorted.length === 0 ? (
            <EmptyPortfolioOnboarding onAdd={() => setShowNew(true)} />
          ) : (
            <PartnerRosterTable
              rows={sorted}
              revenueMap={revenueMap}
              isLeadership={portfolio.isLeadership}
              ownerNames={ownerNames}
              onRowClick={(it) =>
                nav({ to: "/partner/$partnerId", params: { partnerId: it.partner.id } })
              }
              bulkActions={[
                {
                  label: "Mark Active",
                  onClick: (ids) => void bulkUpdate(ids, { status: "active" }, "Scaling"),
                  variant: "default",
                },
                {
                  label: "Mark At Risk",
                  onClick: (ids) => void bulkUpdate(ids, { status: "at_risk" }, "Churn Risk"),
                  variant: "default",
                },
                ...(pdmRoster.pdms.length > 0
                  ? [
                      {
                        label: "Reassign…",
                        onClick: (ids: string[]) => {
                          setSelectedForReassign(ids);
                          setReassignOpen(true);
                        },
                        variant: "primary" as const,
                      },
                    ]
                  : []),
                { label: "Delete", onClick: (ids) => void bulkDelete(ids), variant: "danger" },
              ]}
            />
          )}
        </div>
      </section>

      {showNew && (
        <NewPartnerDialog
          onClose={() => setShowNew(false)}
          onCreate={async (input) => {
            try {
              const p = await portfolio.createPartner(input);
              toast.success(COPY.toast.partnerCreated({ name: p.name }));
              setShowNew(false);
              nav({ to: "/partner/$partnerId", params: { partnerId: p.id } });
            } catch (e) {
              toast.error((e as Error).message);
            }
          }}
        />
      )}

      {selectedAction && (
        <ActionDetailSheet
          action={selectedAction}
          onClose={() => setSelectedAction(null)}
          onComplete={() => void completeAction(selectedAction)}
          completing={completing === selectedAction.id}
        />
      )}

      <BulkReassignDialog
        open={reassignOpen}
        items={selectedForReassign
          .map((id) => portfolio.items.find((it) => it.partner.id === id))
          .filter((it): it is (typeof portfolio.items)[number] => Boolean(it))
          .map<ReassignItem>((it) => ({
            id: it.partner.id,
            name: it.partner.name,
            currentOwnerId: it.partner.owner_id,
            currentOwnerName: ownerNames.get(it.partner.owner_id) ?? "—",
          }))}
        pdms={pdmRoster.pdms}
        entityLabel="partner"
        busy={bulkBusy}
        onClose={() => {
          setReassignOpen(false);
          setSelectedForReassign([]);
        }}
        onConfirm={bulkReassign}
      />
    </div>
  );
}

/* ─────────────────── helpers ─────────────────── */

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function isOverdue(d: string | null): boolean {
  if (!d) return false;
  const due = new Date(d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

function formatDue(d: Date, overdue: boolean): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (overdue) return `${Math.abs(diff)}d late`;
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff < 7) return `in ${diff}d`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function sortActions<T extends { priority: ActionRow["priority"]; due_date: string | null }>(
  arr: T[],
): T[] {
  const prio = { high: 0, medium: 1, low: 2 } as const;
  return [...arr].sort((a, b) => {
    const ao = isOverdue(a.due_date) ? 0 : 1;
    const bo = isOverdue(b.due_date) ? 0 : 1;
    if (ao !== bo) return ao - bo;
    if (prio[a.priority] !== prio[b.priority]) return prio[a.priority] - prio[b.priority];
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
    if (a.due_date) return -1;
    if (b.due_date) return 1;
    return 0;
  });
}

function prettyStatus(s: StatusFilter): string {
  if (s === "active") return "Scaling";
  if (s === "nurturing") return "Developing";
  if (s === "at_risk") return "Churn Risk";
  return "All";
}

function daysAgo(iso: string) {
  const then = new Date(iso);
  const now = new Date();
  then.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((now.getTime() - then.getTime()) / 86400_000));
}

function copyWeeklyDigest(
  mode: "slack" | "email",
  input: { atRisk: number; overdue: number; top: EnrichedAction[] },
) {
  const topLines = input.top.slice(0, 3).map((a, i) => `${i + 1}. ${a.title} (${a.partner_name})`);
  const body = [
    COPY.portfolio.weeklyDigestHeading({ date: new Date().toLocaleDateString() }),
    `${COPY.status.at_risk}: ${input.atRisk}`,
    `Behind schedule ${COPY.jbp.itemPlural.toLowerCase()}: ${input.overdue}`,
    "",
    "Committed next moves:",
    ...(topLines.length ? topLines : ["No Moves scheduled yet"]),
  ].join("\n");
  void navigator.clipboard.writeText(body);
  toast.success(mode === "slack" ? COPY.toast.digestSlack : COPY.toast.digestEmail);
}

/* ─────────────────── presentational ─────────────────── */

function KpiCard({
  label,
  value,
  hint,
  accent,
  primary,
}: {
  label: string;
  value: string;
  hint: string;
  accent: string;
  primary?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 card-elev relative overflow-hidden hover:border-border transition">
      <div
        className="absolute top-0 left-0 h-1 w-full"
        style={{ background: `linear-gradient(90deg, var(--${accent}), transparent)` }}
      />
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-2 text-3xl font-display font-bold ${primary ? "text-gradient" : "text-foreground"}`}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

function HealthBadge({
  label,
  count,
  total,
  tone,
  active,
  onClick,
}: {
  label: string;
  count: number;
  total: number;
  tone: "green" | "yellow" | "red";
  active: boolean;
  onClick: () => void;
}) {
  const isZero = count === 0;
  const ring = isZero
    ? "border-border bg-surface"
    : tone === "green"
      ? "border-primary/30 bg-primary/5"
      : tone === "yellow"
        ? "border-warning/30 bg-warning/5"
        : "border-destructive/40 bg-destructive/5";
  const dot = isZero
    ? "bg-muted-foreground/40"
    : tone === "green"
      ? "bg-primary"
      : tone === "yellow"
        ? "bg-warning"
        : "bg-destructive";
  const text = isZero
    ? "text-muted-foreground"
    : tone === "green"
      ? "text-primary"
      : tone === "yellow"
        ? "text-warning"
        : "text-destructive";
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <button
      onClick={onClick}
      className={`text-left rounded-xl border p-4 transition ${ring} ${isZero ? "opacity-40 hover:opacity-70" : "hover:bg-surface-2"} ${active ? "ring-2 ring-offset-2 ring-offset-background ring-current opacity-100" : ""}`}
    >
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <span className={`text-xs font-medium ${text}`}>{label}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span
          className={`text-3xl font-display font-bold ${isZero ? "text-muted-foreground" : "text-foreground"}`}
        >
          {count}
        </span>
        <span className="text-xs text-muted-foreground">{pct}%</span>
      </div>
    </button>
  );
}

function PriorityPill({ p }: { p: ActionRow["priority"] }) {
  const map = {
    high: "bg-destructive text-destructive-foreground border-destructive font-bold",
    medium: "bg-warning/10 text-warning border-warning/40",
    low: "bg-surface text-muted-foreground border-border",
  } as const;
  return (
    <span
      className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border ${map[p]}`}
    >
      {p}
    </span>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/60 bg-surface/40 p-10 text-center">
      <h2 className="text-lg font-semibold">{COPY.portfolio.filterEmptyTitle}</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
        {COPY.portfolio.filterEmptyBody}
      </p>
      <button
        onClick={onAdd}
        className="mt-5 min-h-11 inline-flex items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground glow-ring"
      >
        {COPY.portfolio.addPartnerCta}
      </button>
    </div>
  );
}

/* ─────────────────── Roster table ─────────────────── */

function PartnerRosterTable({
  rows,
  revenueMap,
  isLeadership,
  ownerNames,
  onRowClick,
  bulkActions,
}: {
  rows: PortfolioItem[];
  revenueMap: Map<
    string,
    { revenue: number; mrr: number; dealsWonValue: number; dealsOpenValue?: number }
  >;
  isLeadership: boolean;
  ownerNames: Map<string, string>;
  onRowClick: (it: PortfolioItem) => void;
  bulkActions: {
    label: string;
    onClick: (ids: string[]) => void;
    variant?: "default" | "primary" | "danger";
  }[];
}) {
  const STATUS_TONE: Record<PortfolioItem["partner"]["status"], StatusTone> = {
    active: "success",
    nurturing: "info",
    at_risk: "danger",
    paused: "muted",
    archived: "muted",
  };

  const columns: CandyColumn<PortfolioItem>[] = [
    {
      key: "partner",
      header: "Partner",
      width: "minmax(220px,2fr)",
      cell: (it) => (
        <div className="flex items-center gap-3 min-w-0">
          <CandyAvatar name={it.partner.name} size={32} />
          <div className="min-w-0">
            <div className="font-medium text-foreground truncate">{it.partner.name}</div>
            <div className="text-xs text-muted-foreground truncate">
              {it.partner.company ?? "—"}
              {it.partner.segment ? ` · ${it.partner.segment}` : ""}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "140px",
      cell: (it) => (
        <StatusPill tone={STATUS_TONE[it.partner.status]}>
          {statusLabel(it.partner.status)}
        </StatusPill>
      ),
    },
    {
      key: "type",
      header: "Type",
      width: "130px",
      cell: (it) => <PartnerTypeChip type={it.partner.partner_type} />,
    },
    {
      key: "tier",
      header: "Tier",
      width: "110px",
      cell: (it) => {
        const c = tierColor(it.partner.tier);
        return (
          <span
            className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-md"
            style={{
              background: `color-mix(in oklab, var(--${c}) 18%, transparent)`,
              color: `var(--${c})`,
            }}
          >
            {it.partner.tier.replace("_", " ")}
          </span>
        );
      },
    },
    ...(isLeadership
      ? [
          {
            key: "owner",
            header: "Owner",
            width: "140px",
            cell: (it: PortfolioItem) => (
              <span className="text-xs font-mono text-muted-foreground truncate">
                {ownerNames.get(it.partner.owner_id) ?? "—"}
              </span>
            ),
          } satisfies CandyColumn<PortfolioItem>,
        ]
      : []),
    {
      key: "mrr",
      header: "MRR",
      width: "100px",
      align: "right",
      cell: (it) => {
        const mrr = revenueMap.get(it.partner.id)?.mrr ?? 0;
        return (
          <span
            className={`font-mono text-sm tabular-nums ${mrr > 0 ? "text-foreground" : "text-muted-foreground/50"}`}
          >
            {mrr > 0 ? fmtMoney(mrr) : "—"}
          </span>
        );
      },
    },
    {
      key: "maturity",
      header: "Maturity",
      width: "110px",
      align: "right",
      cell: (it) => {
        const overall = it.latest ? Number(it.latest.overall) : 0;
        return (
          <div className="flex items-center justify-end gap-2 w-full">
            <div className="h-1 w-8 rounded-full bg-surface-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(overall / 5) * 100}%`,
                  background: overall ? "var(--primary)" : "transparent",
                }}
              />
            </div>
            <span
              className={`font-mono text-sm tabular-nums ${overall ? "text-foreground" : "text-muted-foreground/50"}`}
            >
              {overall ? overall.toFixed(1) : "—"}
            </span>
          </div>
        );
      },
    },
    {
      key: "freshness",
      header: "Freshness",
      width: "110px",
      align: "right",
      cell: (it) => {
        const lastTouched = it.latest?.created_at ?? it.partner.created_at;
        const days = daysAgo(lastTouched);
        return (
          <span
            className={`text-xs font-mono ${days > 14 ? "text-warning" : "text-muted-foreground"}`}
          >
            {days === 0 ? "today" : `${days}d ago`}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "",
      width: "90px",
      align: "right",
      cell: () => null,
      hoverCell: () => <span className="text-xs font-medium text-primary">Open →</span>,
    },
  ];

  return (
    <CandyDataTable
      rows={rows}
      rowKey={(it) => it.partner.id}
      columns={columns}
      selectable
      onRowClick={onRowClick}
      bulkActions={bulkActions}
      ariaLabel="Partner roster"
    />
  );
}

function NewPartnerDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (input: {
    name: string;
    company?: string;
    segment?: string;
    tier?: "strategic" | "core" | "emerging" | "long_tail";
    status?: "active" | "nurturing" | "at_risk" | "paused" | "archived";
    notes?: string;
    partner_type?: PartnerType;
  }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [segment, setSegment] = useState("");
  const [tier, setTier] = useState<"strategic" | "core" | "emerging" | "long_tail">("emerging");
  const [status, setStatus] = useState<"active" | "nurturing" | "at_risk" | "paused" | "archived">(
    "active",
  );
  const [partnerType, setPartnerType] = useState<PartnerType>("referral");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-card border border-border/60 p-6 card-elev"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold">Add a partner</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Set up the partner so you can diagnose, plan, and coach.
        </p>

        <div className="mt-5 space-y-3">
          <Field label="Partner name *">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="e.g. Acme Cloud"
              autoFocus
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Company">
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Segment">
              <input
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                className="input"
                placeholder="SI · ISV · MSP …"
              />
            </Field>
          </div>
          <Field label="Partnership type">
            <select
              value={partnerType}
              onChange={(e) => setPartnerType(e.target.value as PartnerType)}
              className="input"
            >
              {PARTNER_TYPES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label} — {t.description}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tier">
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value as typeof tier)}
                className="input"
              >
                <option value="strategic">Strategic</option>
                <option value="core">Core</option>
                <option value="emerging">Emerging</option>
                <option value="long_tail">Long tail</option>
              </select>
            </Field>
            <Field label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                className="input"
              >
                <option value="active">Scaling</option>
                <option value="nurturing">Developing</option>
                <option value="at_risk">Churn Risk</option>
                <option value="paused">Paused</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
          </div>
          <Field label="PDM notes (optional)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input min-h-[80px]"
              placeholder="Context the AI coach should know — relationship history, key contacts, current friction…"
            />
          </Field>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm hover:bg-surface-2"
          >
            Cancel
          </button>
          <button
            disabled={!name.trim() || busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onCreate({
                  name: name.trim(),
                  company: company.trim() || undefined,
                  segment: segment.trim() || undefined,
                  tier,
                  status,
                  notes: notes.trim() || undefined,
                  partner_type: partnerType,
                });
              } finally {
                setBusy(false);
              }
            }}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-ring disabled:opacity-40"
          >
            {busy ? "Creating…" : "Create partner"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

/* ─────────────────── Action Detail Sheet ─────────────────── */

function ActionDetailSheet({
  action,
  onClose,
  onComplete,
  completing,
}: {
  action: EnrichedAction;
  onClose: () => void;
  onComplete: () => void;
  completing: boolean;
}) {
  const axis: Axis | undefined = AXES.find((x) => x.key === action.axis_key);
  const due = action.due_date ? new Date(action.due_date) : null;
  const overdue = isOverdue(action.due_date);
  const isHigh = action.priority === "high";

  // Build a practical checklist from the axis levers + lesson exercises
  const checklist = axis
    ? [
        ...axis.levers.slice(0, 3).map((l) => ({ kind: "lever" as const, text: l })),
        ...axis.lessons.slice(0, 3).map((l) => ({ kind: "exercise" as const, text: l.exercise })),
      ]
    : [];
  const targetLevel = action.target_level
    ? axis?.levels.find((l) => l.level === action.target_level)
    : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-xl overflow-y-auto bg-card border-l border-border shadow-2xl"
      >
        {/* Header */}
        <div
          className={`relative px-6 pt-6 pb-5 border-b border-border ${isHigh ? "bg-gradient-to-b from-destructive/10 to-transparent" : ""}`}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 h-8 w-8 rounded-md border border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-surface-2 flex items-center justify-center transition"
            aria-label="Close"
          >
            <XIcon className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            {axis && (
              <span
                className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded"
                style={{
                  background: `color-mix(in oklab, var(--${axis.color}) 22%, transparent)`,
                  color: `var(--${axis.color})`,
                }}
              >
                {axis.letter} · {axis.name}
              </span>
            )}
            <PriorityPill p={action.priority} />
            {overdue && (
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border border-destructive/40 bg-destructive/10 text-destructive">
                overdue
              </span>
            )}
          </div>
          <h2 className={`mt-3 text-xl font-semibold ${isHigh ? "text-foreground" : ""}`}>
            {action.title}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {action.partner_name}
            {due && <> · due {formatDue(due, overdue)}</>}
            {action.status === "doing" && <> · in motion</>}
          </p>
          {action.description && (
            <p className="mt-3 text-sm text-foreground/90 leading-relaxed">{action.description}</p>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6">
          {/* Axis context */}
          {axis && (
            <Section title="Axis context" subtitle="Why this work matters">
              <p className="text-sm text-foreground/85 leading-relaxed">{axis.mentalModel}</p>
              {targetLevel && (
                <div
                  className="mt-3 rounded-lg border p-3"
                  style={{
                    borderColor: `color-mix(in oklab, var(--${axis.color}) 35%, transparent)`,
                    background: `color-mix(in oklab, var(--${axis.color}) 8%, transparent)`,
                  }}
                >
                  <p
                    className="text-[10px] font-mono uppercase tracking-widest"
                    style={{ color: `var(--${axis.color})` }}
                  >
                    Target · Level {targetLevel.level} — {targetLevel.name}
                  </p>
                  <p className="mt-1 text-sm text-foreground/90">{targetLevel.summary}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    <strong className="text-foreground/80">Next step:</strong>{" "}
                    {targetLevel.nextStep}
                  </p>
                </div>
              )}
            </Section>
          )}

          {/* Metrics */}
          {axis && axis.metrics.length > 0 && (
            <Section title="Metrics to move" subtitle="What to measure as you progress">
              <ul className="space-y-1.5">
                {axis.metrics.map((m, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="text-primary mt-0.5">▸</span>
                    <span className="text-foreground/85">{m}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Common mistakes */}
          {axis && axis.commonMistakes.length > 0 && (
            <Section title="Common mistakes" subtitle="Don't fall into these traps">
              <ul className="space-y-1.5">
                {axis.commonMistakes.map((m, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="text-destructive mt-0.5">✕</span>
                    <span className="text-foreground/85">{m}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Practical checklist */}
          {checklist.length > 0 && (
            <Section
              title="Practical checklist"
              subtitle="Concrete moves to execute this initiative"
            >
              <ul className="space-y-2">
                {checklist.map((c, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3"
                  >
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border bg-surface text-[10px] font-mono text-muted-foreground">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-foreground/90">{c.text}</p>
                      <p className="mt-0.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                        {c.kind === "lever" ? "Lever" : "Exercise"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 border-t border-border bg-card/95 backdrop-blur px-6 py-4 flex items-center justify-between gap-3">
          <Link
            to="/partner/$partnerId/plan"
            params={{ partnerId: action.partner_id }}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            Open Joint Business Plan →
          </Link>
          <button
            onClick={onComplete}
            disabled={completing}
            className="inline-flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/90 px-4 py-2 text-sm font-semibold text-primary-foreground transition shadow-[0_8px_20px_-6px_oklch(0.52_0.16_160_/_0.4)] disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {completing ? "Saving…" : "Mark complete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      {subtitle && <p className="mt-0.5 text-xs text-muted-foreground/70">{subtitle}</p>}
      <div className="mt-2.5">{children}</div>
    </div>
  );
}
