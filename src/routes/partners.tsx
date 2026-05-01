import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  usePortfolio, levelFromAvg, statusLabel, tierColor,
  type PortfolioItem, type ActionRow,
} from "../lib/partners-store";
import { useLeads } from "../lib/leads-store";
import { AXES, type Axis } from "../content/octa";
import { toast } from "sonner";
import { Check, Focus, X as XIcon, Target, Trash2, ChevronDown } from "lucide-react";
import { PARTNER_TYPES, type PartnerType, type SortKey } from "@/lib/partner-types";
import { PartnerFilterBar, PartnerTypeChip } from "@/components/PartnerFilterBar";
import { useLatestPartnerRevenue, fmtMoney } from "@/lib/partner-revenue";

export const Route = createFileRoute("/partners")({
  head: () => ({ meta: [{ title: "PDM Command Center — Conduit" }] }),
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
  const [scopeFilter, setScopeFilter] = useState<"mine" | "all">("mine");
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const clearSelection = () => setSelectedIds(new Set());

  const bulkUpdate = async (patch: { status?: string; tier?: string; partner_type?: string }, label: string) => {
    if (selectedIds.size === 0) return;
    setBulkBusy(true);
    try {
      const ids = [...selectedIds];
      const { error, count } = await supabase
        .from("partners")
        .update(patch as never, { count: "exact" })
        .in("id", ids);
      if (error) throw error;
      toast.success(`${count ?? ids.length} partner${(count ?? ids.length) === 1 ? "" : "s"} → ${label}`);
      clearSelection();
      await portfolio.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBulkBusy(false);
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const ids = [...selectedIds];
    const names = portfolio.items
      .filter((it) => ids.includes(it.partner.id))
      .map((it) => it.partner.name);
    if (!confirm(`Delete ${ids.length} partner${ids.length === 1 ? "" : "s"}?\n\n${names.join(", ")}\n\nThis permanently removes diagnostics, plans, intel runs and documents.`)) return;
    setBulkBusy(true);
    try {
      const { error, count } = await supabase
        .from("partners")
        .delete({ count: "exact" })
        .in("id", ids);
      if (error) throw error;
      toast.success(`${count ?? ids.length} partner${(count ?? ids.length) === 1 ? "" : "s"} deleted`);
      clearSelection();
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
      toast.success(`"${a.title}" marked complete`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCompleting(null);
    }
  };

  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [loading, user, nav]);

  // Aggregate open growth initiatives across all visible partners
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!user || portfolio.loading) return;
      setActionsLoading(true);
      const ownPartners = portfolio.items.filter((it) => it.partner.owner_id === user.id);
      const ids = ownPartners.map((p) => p.partner.id);
      if (ids.length === 0) {
        if (!cancelled) { setOpenActions([]); setActionsLoading(false); }
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
    return () => { cancelled = true; };
  }, [user, portfolio.items, portfolio.loading]);

  if (loading || !user) return <div className="p-10 text-muted-foreground">Loading…</div>;

  // Scoped portfolio (mine vs all for leadership)
  const scoped = portfolio.items.filter((it) =>
    scopeFilter === "all" ? true : it.partner.owner_id === user.id
  );

  const statusCounts = {
    active: scoped.filter((i) => i.partner.status === "active").length,
    nurturing: scoped.filter((i) => i.partner.status === "nurturing").length,
    at_risk: scoped.filter((i) => i.partner.status === "at_risk").length,
    paused: scoped.filter((i) => i.partner.status === "paused").length,
    archived: scoped.filter((i) => i.partner.status === "archived").length,
  };
  const activeTotal = statusCounts.active + statusCounts.nurturing + statusCounts.at_risk;

  const partnerIds = scoped.map((it) => it.partner.id);
  const { map: revenueMap } = useLatestPartnerRevenue(partnerIds);

  const filtered = scoped.filter((it) => {
    if (statusFilter !== "all" && it.partner.status !== statusFilter) return false;
    if (typeFilter !== "all" && it.partner.partner_type !== typeFilter) return false;
    if (query && !`${it.partner.name} ${it.partner.company ?? ""}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const ra = revenueMap.get(a.partner.id);
      const rb = revenueMap.get(b.partner.id);
      switch (sortKey) {
        case "name_asc": return a.partner.name.localeCompare(b.partner.name);
        case "name_desc": return b.partner.name.localeCompare(a.partner.name);
        case "revenue_desc": {
          const va = (ra?.revenue ?? 0) + (ra?.dealsWonValue ?? 0);
          const vb = (rb?.revenue ?? 0) + (rb?.dealsWonValue ?? 0);
          return vb - va;
        }
        case "mrr_desc": return (rb?.mrr ?? 0) - (ra?.mrr ?? 0);
        case "created_desc": return new Date(b.partner.created_at).getTime() - new Date(a.partner.created_at).getTime();
        case "maturity_desc": return Number(b.latest?.overall ?? 0) - Number(a.latest?.overall ?? 0);
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

  // Pending leads = leads not yet approved/rejected
  const pendingLeads = leads.leads.filter((l) => l.status === "new" || l.status === "in_review");
  const overdueActions = openActions.filter((a) => isOverdue(a.due_date));
  const highPriorityOpen = openActions.filter((a) => a.priority === "high");

  // Axis-filtered + sorted view used by both normal and focus modes
  const visibleActions = useMemo(() => {
    const base = axisFilter === "all"
      ? openActions
      : openActions.filter((a) => a.axis_key === axisFilter);
    return sortActions(base);
  }, [openActions, axisFilter]);
  const focusActions = visibleActions.slice(0, 3);

  // Counts per axis (across all open actions, not the filtered view)
  const axisCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of openActions) m.set(a.axis_key, (m.get(a.axis_key) ?? 0) + 1);
    return m;
  }, [openActions]);

  // Briefing copy
  const briefing = buildBriefing({
    atRisk: statusCounts.at_risk,
    overdue: overdueActions.length,
    leads: pendingLeads.length,
    highPriority: highPriorityOpen.length,
  });

  const displayName =
    (user.user_metadata as { display_name?: string } | null)?.display_name
    ?? user.email?.split("@")[0] ?? "operator";

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
            Command Center · {greeting()}
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
          {greeting()}, {displayName}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
          {briefing}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {statusCounts.at_risk > 0 && (
            <button
              onClick={() => setStatusFilter("at_risk")}
              className="inline-flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20 transition"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
              Review {statusCounts.at_risk} Churn Risk
            </button>
          )}
          {pendingLeads.length > 0 && (
            <Link
              to="/qualification"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:bg-surface-2 transition"
            >
              Qualify {pendingLeads.length} lead{pendingLeads.length === 1 ? "" : "s"} →
            </Link>
          )}
          {overdueActions.length > 0 && (
            <a
              href="#growth-initiatives"
              className="inline-flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-1.5 text-xs font-medium text-warning hover:bg-warning/15 transition"
            >
              {overdueActions.length} overdue initiative{overdueActions.length === 1 ? "" : "s"}
            </a>
          )}
        </div>
      </section>

      {/* 2. Revenue & Ecosystem Impact KPIs */}
      <section className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="EQLs this month"
          value={String(estimateEqlsThisMonth(portfolio.items))}
          hint="Ecosystem Qualified Leads"
          accent="octa-1"
        />
        <KpiCard
          label="Partner-sourced pipeline"
          value="$150k"
          hint="ARR in motion · forecast"
          accent="octa-4"
          primary
        />
        <KpiCard
          label="Active partners"
          value={String(activeTotal)}
          hint={`${statusCounts.paused + statusCounts.archived} paused/archived`}
          accent="octa-5"
        />
        <KpiCard
          label="Avg maturity"
          value={aggregate.avg ? aggregate.avg.toFixed(1) : "—"}
          hint={`${aggregate.scored}/${aggregate.count} diagnosed`}
          accent="octa-7"
        />
      </section>

      {/* 3 + 4. Health Snapshot + Qualification Queue */}
      <section className="mt-6 grid lg:grid-cols-3 gap-4">
        {/* Portfolio Health Snapshot */}
        <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card p-6 card-elev">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Portfolio Health</p>
              <h2 className="mt-1 text-lg font-semibold">Status snapshot</h2>
            </div>
            {statusFilter !== "all" && (
              <button onClick={() => setStatusFilter("all")} className="text-xs text-muted-foreground hover:text-foreground underline">
                Clear filter
              </button>
            )}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <HealthBadge
              label="Scaling"
              count={statusCounts.active}
              total={activeTotal || 1}
              tone="green"
              active={statusFilter === "active"}
              onClick={() => setStatusFilter(statusFilter === "active" ? "all" : "active")}
            />
            <HealthBadge
              label="Developing"
              count={statusCounts.nurturing}
              total={activeTotal || 1}
              tone="yellow"
              active={statusFilter === "nurturing"}
              onClick={() => setStatusFilter(statusFilter === "nurturing" ? "all" : "nurturing")}
            />
            <HealthBadge
              label="Churn Risk"
              count={statusCounts.at_risk}
              total={activeTotal || 1}
              tone="red"
              active={statusFilter === "at_risk"}
              onClick={() => setStatusFilter(statusFilter === "at_risk" ? "all" : "at_risk")}
            />
          </div>

          <div className="mt-5 h-2 rounded-full bg-surface-2 overflow-hidden flex">
            {activeTotal > 0 ? (
              <>
                <div className="h-full bg-emerald-500/70" style={{ width: `${(statusCounts.active / activeTotal) * 100}%` }} />
                <div className="h-full bg-yellow-500/70" style={{ width: `${(statusCounts.nurturing / activeTotal) * 100}%` }} />
                <div className="h-full bg-red-500/70" style={{ width: `${(statusCounts.at_risk / activeTotal) * 100}%` }} />
              </>
            ) : <div className="h-full w-full bg-surface-2" />}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Click a status badge to filter the roster below.</p>
        </div>

        {/* Qualification Queue */}
        <div className="rounded-2xl border border-border bg-card p-6 card-elev">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Qualification Queue</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-5xl font-display font-bold ${pendingLeads.length > 0 ? "text-foreground" : "text-muted-foreground/60"}`}>
              {pendingLeads.length}
            </span>
            <span className="text-sm text-muted-foreground">pending IPP scoring</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {pendingLeads.length === 0
              ? "All caught up. Inbox is clean."
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
            className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-primary hover:bg-primary/90 px-4 py-2.5 text-sm font-semibold text-primary-foreground transition shadow-[0_8px_20px_-6px_oklch(0.52_0.16_160_/_0.4)]"
          >
            Review Leads →
          </Link>
        </div>
      </section>

      {/* 5. Growth Initiatives Due */}
      <section id="growth-initiatives" className="mt-6 rounded-2xl border border-border/60 bg-card p-6 card-elev">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Next Best Actions</p>
            <h2 className="mt-1 text-lg font-semibold flex items-center gap-2">
              {focusMode && <Target className="h-4 w-4 text-destructive" />}
              {focusMode ? "Focus Mode · Top 3" : "Growth Initiatives Due"}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {focusMode
                ? "Tunnel vision. Just the next 3 most urgent moves — close them before opening anything else."
                : "Aggregated from every Joint Business Plan in your portfolio. High-priority and overdue first."}
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
              {focusMode ? "Exit focus" : "Focus mode"}
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
            <div className="text-sm text-muted-foreground py-6 text-center">Loading initiatives…</div>
          ) : visibleActions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-surface/40 p-8 text-center text-sm text-muted-foreground">
              {openActions.length === 0
                ? "No open initiatives. Open a partner's Joint Business Plan to draft the next move."
                : `No open initiatives on this axis. Try a different axis.`}
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
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedAction(a); } }}
                      className={`group flex items-center gap-3 px-3 py-3 rounded-lg transition border cursor-pointer ${
                        isHigh
                          ? "border-l-4 border-l-destructive border-y border-r border-y-destructive/20 border-r-destructive/20 bg-destructive/5 shadow-[0_8px_24px_-8px_oklch(0.58_0.2_27_/_0.35)] hover:bg-destructive/10"
                          : "border-border bg-surface hover:bg-surface-2"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); void completeAction(a); }}
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
                              style={{ background: `color-mix(in oklab, var(--${axis.color}) 22%, transparent)`, color: `var(--${axis.color})` }}
                            >
                              {axis.letter}
                            </span>
                          )}
                          <span className={`text-sm truncate ${isHigh ? "font-bold text-foreground" : "font-medium"}`}>{a.title}</span>
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
                ? `${visibleActions.length - focusActions.length} more hidden · close these first`
                : "These are your only open initiatives. Ship them."}
            </p>
          )}
        </div>
      </section>

      {/* 6. Partner Roster */}
      <section className="mt-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Roster</p>
            <h2 className="mt-1 text-2xl font-semibold">Your partners</h2>
            {statusFilter !== "all" && (
              <p className="text-xs text-muted-foreground mt-1">
                Filtered by <span className="text-foreground font-medium">{prettyStatus(statusFilter)}</span> ·
                <button onClick={() => setStatusFilter("all")} className="ml-1 underline hover:text-foreground">show all</button>
              </p>
            )}
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-ring"
          >
            + Add partner
          </button>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          {portfolio.isLeadership && (
            <div className="inline-flex rounded-lg border border-border/60 bg-surface/60 p-1 text-sm">
              {(["mine", "all"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setScopeFilter(f)}
                  className={`px-3 py-1.5 rounded-md transition ${scopeFilter === f ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {f === "mine" ? "My partners" : "All partners"}
                </button>
              ))}
            </div>
          )}
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
            <div className="text-sm text-muted-foreground py-10 text-center">Loading partners…</div>
          ) : sorted.length === 0 ? (
            <EmptyState onAdd={() => setShowNew(true)} />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sorted.map((it) => (
                <PartnerCard
                  key={it.partner.id}
                  item={it}
                  revenue={revenueMap.get(it.partner.id)}
                  onDelete={async () => {
                    if (!confirm(`Delete ${it.partner.name}? This permanently removes the partner and all related diagnostics, plans, intel runs and documents.`)) return;
                    try {
                      await portfolio.deletePartner(it.partner.id);
                      toast.success(`${it.partner.name} deleted`);
                    } catch (e) {
                      toast.error((e as Error).message);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {showNew && (
        <NewPartnerDialog
          onClose={() => setShowNew(false)}
          onCreate={async (input) => {
            try {
              const p = await portfolio.createPartner(input);
              toast.success(`${p.name} added`);
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
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return due < today;
}

function formatDue(d: Date, overdue: boolean): string {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (overdue) return `${Math.abs(diff)}d late`;
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff < 7) return `in ${diff}d`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function sortActions<T extends { priority: ActionRow["priority"]; due_date: string | null }>(arr: T[]): T[] {
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

function buildBriefing({
  atRisk, overdue, leads, highPriority,
}: { atRisk: number; overdue: number; leads: number; highPriority: number }) {
  const parts: string[] = [];
  if (atRisk > 0) parts.push(`${atRisk} partner${atRisk === 1 ? "" : "s"} at risk of churn`);
  if (overdue > 0) parts.push(`${overdue} growth initiative${overdue === 1 ? "" : "s"} overdue`);
  if (highPriority > 0 && overdue === 0) parts.push(`${highPriority} high-priority initiative${highPriority === 1 ? "" : "s"} in motion`);
  if (leads > 0) parts.push(`${leads} new partner lead${leads === 1 ? "" : "s"} waiting for IPP qualification`);
  if (parts.length === 0) return "Quiet morning. No urgent risks, no overdue initiatives, and your qualification queue is empty. Good window to run a diagnostic on your top tier or refresh a Joint Business Plan.";
  const last = parts.pop()!;
  const joined = parts.length ? parts.join(", ") + ", and " + last : last;
  return `You have ${joined}. Tackle the red items first to compound the week.`;
}

function estimateEqlsThisMonth(items: PortfolioItem[]): number {
  // Heuristic placeholder until pipeline data lands: 1 EQL per active partner/month, +2 for strategic
  const now = new Date();
  return items.reduce((s, it) => {
    if (it.partner.status === "archived" || it.partner.status === "paused") return s;
    if (new Date(it.partner.created_at) > now) return s;
    return s + (it.partner.tier === "strategic" ? 3 : it.partner.tier === "core" ? 2 : 1);
  }, 0);
}

function prettyStatus(s: StatusFilter): string {
  if (s === "active") return "Scaling";
  if (s === "nurturing") return "Developing";
  if (s === "at_risk") return "Churn Risk";
  return "All";
}

/* ─────────────────── presentational ─────────────────── */

function KpiCard({ label, value, hint, accent, primary }: { label: string; value: string; hint: string; accent: string; primary?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 card-elev relative overflow-hidden hover:border-border transition">
      <div
        className="absolute top-0 left-0 h-1 w-full"
        style={{ background: `linear-gradient(90deg, var(--${accent}), transparent)` }}
      />
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
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
  label, count, total, tone, active, onClick,
}: {
  label: string; count: number; total: number;
  tone: "green" | "yellow" | "red";
  active: boolean; onClick: () => void;
}) {
  const isZero = count === 0;
  const ring = isZero
    ? "border-border bg-surface"
    : tone === "green" ? "border-primary/30 bg-primary/5"
    : tone === "yellow" ? "border-warning/30 bg-warning/5"
    : "border-destructive/40 bg-destructive/5";
  const dot = isZero
    ? "bg-muted-foreground/40"
    : tone === "green" ? "bg-primary" : tone === "yellow" ? "bg-warning" : "bg-destructive";
  const text = isZero
    ? "text-muted-foreground"
    : tone === "green" ? "text-primary" : tone === "yellow" ? "text-warning" : "text-destructive";
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
        <span className={`text-3xl font-display font-bold ${isZero ? "text-muted-foreground" : "text-foreground"}`}>{count}</span>
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
    <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border ${map[p]}`}>
      {p}
    </span>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/60 bg-surface/40 p-10 text-center">
      <h2 className="text-lg font-semibold">No partners match your filters</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
        Clear the filter or add a new partner to start running the OCTA diagnostic and building a Joint Business Plan.
      </p>
      <button onClick={onAdd} className="mt-5 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-ring">
        + Add partner
      </button>
    </div>
  );
}

function PartnerCard({ item, onDelete, revenue }: { item: PortfolioItem; onDelete: () => void; revenue?: { revenue: number; mrr: number; dealsWonValue: number } }) {
  const overall = item.latest ? Number(item.latest.overall) : 0;
  const lvl = overall ? levelFromAvg(overall) : 0;
  const tColor = tierColor(item.partner.tier);
  const scores = (item.latest?.scores ?? {}) as Record<string, number>;
  const totalRev = (revenue?.revenue ?? 0) + (revenue?.dealsWonValue ?? 0);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
        title="Delete partner"
        aria-label="Delete partner"
        className="absolute top-2 right-2 z-10 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-red-400 hover:bg-surface-2 transition"
      >
        ✕
      </button>
      <Link
        to="/partner/$partnerId"
        params={{ partnerId: item.partner.id }}
        className="block rounded-2xl bg-card border border-border/60 p-5 card-elev hover:-translate-y-0.5 transition"
      >
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <div className="font-semibold truncate">{item.partner.name}</div>
            <div className="text-xs text-muted-foreground truncate">
              {item.partner.company ?? "—"}{item.partner.segment ? ` · ${item.partner.segment}` : ""}
            </div>
            <div className="mt-1.5">
              <PartnerTypeChip type={item.partner.partner_type} />
            </div>
          </div>
          <span
            className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-md mr-7"
            style={{ background: `color-mix(in oklab, var(--${tColor}) 22%, transparent)`, color: `var(--${tColor})` }}
          >
            {item.partner.tier.replace("_", " ")}
          </span>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-display font-bold text-gradient">{overall ? overall.toFixed(1) : "—"}</span>
          <span className="text-xs text-muted-foreground">/ 5.0 · {lvl ? `Level ${lvl}` : "Not diagnosed"}</span>
          {totalRev > 0 && (
            <span className="ml-auto text-xs font-mono text-muted-foreground" title="Latest revenue + won deals">
              {fmtMoney(totalRev)}
            </span>
          )}
        </div>

        <div className="mt-3 flex gap-1 h-8">
          {AXES.map((a) => {
            const s = scores[a.key] ?? 0;
            const h = s ? Math.max(8, (s / 5) * 100) : 4;
            return (
              <div key={a.key} className="flex-1 flex items-end" title={`${a.name}: ${s ? s.toFixed(1) : "—"}`}>
                <div
                  className="w-full rounded-sm"
                  style={{ height: `${h}%`, background: s ? `var(--${a.color})` : "var(--surface-2)" }}
                />
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between text-xs">
          <StatusChip status={item.partner.status} />
          {item.isLeadershipView && (
            <span className="font-mono text-muted-foreground">leadership view</span>
          )}
        </div>
      </Link>
    </div>
  );
}

function StatusChip({ status }: { status: PortfolioItem["partner"]["status"] }) {
  const tone = status === "at_risk" ? "text-red-300 bg-red-500/10 border-red-500/30"
    : status === "nurturing" ? "text-yellow-200 bg-yellow-500/10 border-yellow-500/30"
    : status === "active" ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/30"
    : "text-muted-foreground bg-surface-2 border-border/60";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-mono uppercase tracking-widest ${tone}`}>
      {statusLabel(status)}
    </span>
  );
}

function NewPartnerDialog({
  onClose, onCreate,
}: {
  onClose: () => void;
  onCreate: (input: {
    name: string; company?: string; segment?: string;
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
  const [status, setStatus] = useState<"active" | "nurturing" | "at_risk" | "paused" | "archived">("active");
  const [partnerType, setPartnerType] = useState<PartnerType>("referral");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-card border border-border/60 p-6 card-elev" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold">Add a partner</h2>
        <p className="text-sm text-muted-foreground mt-1">Set up the partner so you can diagnose, plan, and coach.</p>

        <div className="mt-5 space-y-3">
          <Field label="Partner name *">
            <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="e.g. Acme Cloud" autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Company"><input value={company} onChange={(e) => setCompany(e.target.value)} className="input" /></Field>
            <Field label="Segment"><input value={segment} onChange={(e) => setSegment(e.target.value)} className="input" placeholder="SI · ISV · MSP …" /></Field>
          </div>
          <Field label="Partnership type">
            <select value={partnerType} onChange={(e) => setPartnerType(e.target.value as PartnerType)} className="input">
              {PARTNER_TYPES.map((t) => (
                <option key={t.key} value={t.key}>{t.label} — {t.description}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tier">
              <select value={tier} onChange={(e) => setTier(e.target.value as typeof tier)} className="input">
                <option value="strategic">Strategic</option>
                <option value="core">Core</option>
                <option value="emerging">Emerging</option>
                <option value="long_tail">Long tail</option>
              </select>
            </Field>
            <Field label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="input">
                <option value="active">Scaling</option>
                <option value="nurturing">Developing</option>
                <option value="at_risk">Churn Risk</option>
                <option value="paused">Paused</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
          </div>
          <Field label="PDM notes (optional)">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input min-h-[80px]" placeholder="Context the AI coach should know — relationship history, key contacts, current friction…" />
          </Field>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg border border-border bg-surface px-4 py-2 text-sm hover:bg-surface-2">Cancel</button>
          <button
            disabled={!name.trim() || busy}
            onClick={async () => {
              setBusy(true);
              try { await onCreate({ name: name.trim(), company: company.trim() || undefined, segment: segment.trim() || undefined, tier, status, notes: notes.trim() || undefined, partner_type: partnerType }); }
              finally { setBusy(false); }
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
      <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

/* ─────────────────── Action Detail Sheet ─────────────────── */

function ActionDetailSheet({
  action, onClose, onComplete, completing,
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
        <div className={`relative px-6 pt-6 pb-5 border-b border-border ${isHigh ? "bg-gradient-to-b from-destructive/10 to-transparent" : ""}`}>
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
                style={{ background: `color-mix(in oklab, var(--${axis.color}) 22%, transparent)`, color: `var(--${axis.color})` }}
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
          <h2 className={`mt-3 text-xl font-semibold ${isHigh ? "text-foreground" : ""}`}>{action.title}</h2>
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
                  <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: `var(--${axis.color})` }}>
                    Target · Level {targetLevel.level} — {targetLevel.name}
                  </p>
                  <p className="mt-1 text-sm text-foreground/90">{targetLevel.summary}</p>
                  <p className="mt-2 text-xs text-muted-foreground"><strong className="text-foreground/80">Next step:</strong> {targetLevel.nextStep}</p>
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
            <Section title="Practical checklist" subtitle="Concrete moves to execute this initiative">
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

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{title}</p>
      {subtitle && <p className="mt-0.5 text-xs text-muted-foreground/70">{subtitle}</p>}
      <div className="mt-2.5">{children}</div>
    </div>
  );
}
