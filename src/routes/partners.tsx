import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  usePortfolio, levelFromAvg, statusLabel, tierColor,
  type PortfolioItem, type ActionRow,
} from "../lib/partners-store";
import { useLeads } from "../lib/leads-store";
import { AXES } from "../content/octa";
import { toast } from "sonner";

export const Route = createFileRoute("/partners")({
  head: () => ({ meta: [{ title: "PDM Command Center — OCTA OS" }] }),
  component: PartnersPage,
});

type StatusFilter = "all" | "active" | "nurturing" | "at_risk";

function PartnersPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const portfolio = usePortfolio(user?.id);
  const leads = useLeads(user?.id);
  const [showNew, setShowNew] = useState(false);
  const [scopeFilter, setScopeFilter] = useState<"mine" | "all">("mine");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [openActions, setOpenActions] = useState<(ActionRow & { partner_name: string })[]>([]);
  const [actionsLoading, setActionsLoading] = useState(true);

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

  const filtered = scoped.filter((it) => {
    if (statusFilter !== "all" && it.partner.status !== statusFilter) return false;
    if (query && !`${it.partner.name} ${it.partner.company ?? ""}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

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
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
          {greeting()}, {displayName}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
          {briefing}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {statusCounts.at_risk > 0 && (
            <button
              onClick={() => setStatusFilter("at_risk")}
              className="inline-flex items-center gap-2 rounded-lg border border-[#FF4444]/40 bg-[#FF4444]/10 px-3 py-1.5 text-xs font-medium text-[#FF6B6B] hover:bg-[#FF4444]/20 transition"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF4444]" />
              Review {statusCounts.at_risk} Churn Risk
            </button>
          )}
          {pendingLeads.length > 0 && (
            <Link
              to="/qualification"
              className="inline-flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs font-medium hover:bg-white/[0.06] transition"
            >
              Qualify {pendingLeads.length} lead{pendingLeads.length === 1 ? "" : "s"} →
            </Link>
          )}
          {overdueActions.length > 0 && (
            <a
              href="#growth-initiatives"
              className="inline-flex items-center gap-2 rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-3 py-1.5 text-xs font-medium text-[#F59E0B] hover:bg-[#F59E0B]/15 transition"
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
        <div className="rounded-2xl border border-border/60 bg-card p-6 card-elev relative overflow-hidden">
          <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[var(--octa-5)]/20 blur-3xl pointer-events-none" />
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Qualification Queue</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-5xl font-display font-bold text-gradient">{pendingLeads.length}</span>
            <span className="text-sm text-muted-foreground">pending IPP scoring</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {pendingLeads.length === 0
              ? "All caught up. Inbox is clean."
              : `${leads.leads.filter((l) => l.status === "new").length} new · ${leads.leads.filter((l) => l.status === "in_review").length} in review`}
          </p>
          <Link
            to="/qualification"
            className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-ring"
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
            <h2 className="mt-1 text-lg font-semibold">Growth Initiatives Due</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Aggregated from every Joint Business Plan in your portfolio. High-priority and overdue first.
            </p>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {openActions.length} open · {overdueActions.length} overdue
          </span>
        </div>

        <div className="mt-5">
          {actionsLoading ? (
            <div className="text-sm text-muted-foreground py-6 text-center">Loading initiatives…</div>
          ) : openActions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-surface/40 p-8 text-center text-sm text-muted-foreground">
              No open initiatives. Open a partner's Joint Business Plan to draft the next move.
            </div>
          ) : (
            <ul className="divide-y divide-border/50 -mx-2">
              {sortActions(openActions).slice(0, 8).map((a) => {
                const axis = AXES.find((x) => x.key === a.axis_key);
                const due = a.due_date ? new Date(a.due_date) : null;
                const overdue = isOverdue(a.due_date);
                return (
                  <li key={a.id}>
                    <Link
                      to="/partner/$partnerId/plan"
                      params={{ partnerId: a.partner_id }}
                      className="flex items-center gap-3 px-2 py-3 rounded-lg hover:bg-surface-2/60 transition"
                    >
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
                          <span className="text-sm font-medium truncate">{a.title}</span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground truncate">
                          {a.partner_name}
                          {a.status === "doing" ? " · in motion" : " · planned"}
                        </div>
                      </div>
                      <PriorityPill p={a.priority} />
                      <span
                        className={`text-xs font-mono w-20 text-right ${overdue ? "text-red-400" : "text-muted-foreground"}`}
                      >
                        {due ? formatDue(due, overdue) : "no date"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
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
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search partners…"
            className="rounded-lg border border-border/60 bg-surface/60 px-3 py-2 text-sm w-full sm:w-72"
          />
        </div>

        <div className="mt-5">
          {portfolio.loading ? (
            <div className="text-sm text-muted-foreground py-10 text-center">Loading partners…</div>
          ) : filtered.length === 0 ? (
            <EmptyState onAdd={() => setShowNew(true)} />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((it) => (
                <PartnerCard
                  key={it.partner.id}
                  item={it}
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

function KpiCard({ label, value, hint, accent }: { label: string; value: string; hint: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 card-elev relative overflow-hidden">
      <div
        className="absolute top-0 left-0 h-1 w-full"
        style={{ background: `linear-gradient(90deg, var(--${accent}), transparent)` }}
      />
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-display font-bold">{value}</div>
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
  const ring = tone === "green" ? "border-emerald-500/40 bg-emerald-500/5"
    : tone === "yellow" ? "border-yellow-500/40 bg-yellow-500/5"
    : "border-red-500/40 bg-red-500/5";
  const dot = tone === "green" ? "bg-emerald-400" : tone === "yellow" ? "bg-yellow-400" : "bg-red-400";
  const text = tone === "green" ? "text-emerald-300" : tone === "yellow" ? "text-yellow-200" : "text-red-300";
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <button
      onClick={onClick}
      className={`text-left rounded-xl border p-4 transition ${ring} ${active ? "ring-2 ring-offset-2 ring-offset-background ring-current" : "hover:bg-surface-2/40"}`}
    >
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <span className={`text-xs font-medium ${text}`}>{label}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-display font-bold">{count}</span>
        <span className="text-xs text-muted-foreground">{pct}%</span>
      </div>
    </button>
  );
}

function PriorityPill({ p }: { p: ActionRow["priority"] }) {
  const map = {
    high: "bg-red-500/15 text-red-300 border-red-500/30",
    medium: "bg-yellow-500/10 text-yellow-200 border-yellow-500/30",
    low: "bg-surface-2 text-muted-foreground border-border/60",
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

function PartnerCard({ item, onDelete }: { item: PortfolioItem; onDelete: () => void }) {
  const overall = item.latest ? Number(item.latest.overall) : 0;
  const lvl = overall ? levelFromAvg(overall) : 0;
  const tColor = tierColor(item.partner.tier);
  const scores = (item.latest?.scores ?? {}) as Record<string, number>;

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
  }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [segment, setSegment] = useState("");
  const [tier, setTier] = useState<"strategic" | "core" | "emerging" | "long_tail">("emerging");
  const [status, setStatus] = useState<"active" | "nurturing" | "at_risk" | "paused" | "archived">("active");
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
              try { await onCreate({ name: name.trim(), company: company.trim() || undefined, segment: segment.trim() || undefined, tier, status, notes: notes.trim() || undefined }); }
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
