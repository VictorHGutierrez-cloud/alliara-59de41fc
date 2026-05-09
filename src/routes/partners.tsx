import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  usePortfolio,
  statusLabel,
  type PortfolioItem,
  type ActionRow,
} from "../lib/partners-store";
import { useLeads } from "../lib/leads-store";
import { AXES, type Axis } from "../content/octa";
import { toast } from "sonner";
import { AlertTriangle, CalendarClock, Check, ChevronDown, ChevronRight, ChevronUp, HeartHandshake, Plus, X as XIcon } from "lucide-react";
import { PARTNER_TYPES, type PartnerType, type SortKey } from "@/lib/partner-types";
import { PartnerFilterBar } from "@/components/PartnerFilterBar";
import { useOwnerScope } from "@/lib/use-owner-scope";
import { usePdmRoster, type PdmEntry } from "@/lib/use-pdm-roster";
import {
  BulkReassignDialog,
  type ReassignAssignment,
  type ReassignItem,
} from "@/components/BulkReassignDialog";
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
import { cn } from "@/lib/utils";

const PAGE_SIZES = [10, 20, 50, 100, 200] as const;

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
  const [selectedAction, setSelectedAction] = useState<EnrichedAction | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [selectedForReassign, setSelectedForReassign] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(20);
  const [pageIndex, setPageIndex] = useState(0);
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

  const sortedOpenActions = useMemo(() => sortActions(openActions), [openActions]);

  const todayQueueActions = useMemo(() => sortedOpenActions.slice(0, 5), [sortedOpenActions]);

  const nextActionByPartner = useMemo(() => {
    const map = new Map<string, string>();
    const actionByPartner = new Map<string, EnrichedAction[]>();
    for (const action of sortedOpenActions) {
      const list = actionByPartner.get(action.partner_id) ?? [];
      list.push(action);
      actionByPartner.set(action.partner_id, list);
    }
    for (const item of scoped) {
      const partnerActions = actionByPartner.get(item.partner.id) ?? [];
      const hasOverdue = partnerActions.some((a) => isOverdue(a.due_date));
      if (!item.latest || Number(item.latest.overall) <= 0) {
        map.set(item.partner.id, COPY.diagnostic.cta);
      } else if (hasOverdue) {
        map.set(item.partner.id, "Close overdue move");
      } else if (partnerActions.length > 0) {
        map.set(item.partner.id, "Follow up move");
      } else {
        map.set(item.partner.id, COPY.jbp.addMoveCta.replace("+ ", ""));
      }
    }
    return map;
  }, [scoped, sortedOpenActions]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const touchMs = (it: PortfolioItem) =>
      new Date(it.latest?.created_at ?? it.partner.created_at).getTime();
    const nextText = (it: PortfolioItem) => nextActionByPartner.get(it.partner.id) ?? "";
    const ownerLabel = (it: PortfolioItem) => ownerNames.get(it.partner.owner_id) ?? "";

    arr.sort((a, b) => {
      switch (sortKey) {
        case "name_asc":
          return a.partner.name.localeCompare(b.partner.name);
        case "name_desc":
          return b.partner.name.localeCompare(a.partner.name);
        case "revenue_desc":
        case "mrr_desc":
        case "created_desc":
          return (
            new Date(b.partner.created_at).getTime() - new Date(a.partner.created_at).getTime()
          );
        case "maturity_desc":
          return Number(b.latest?.overall ?? 0) - Number(a.latest?.overall ?? 0);
        case "status_asc":
          return statusLabel(a.partner.status).localeCompare(statusLabel(b.partner.status));
        case "status_desc":
          return statusLabel(b.partner.status).localeCompare(statusLabel(a.partner.status));
        case "next_action_asc":
          return nextText(a).localeCompare(nextText(b));
        case "next_action_desc":
          return nextText(b).localeCompare(nextText(a));
        case "owner_asc":
          return ownerLabel(a).localeCompare(ownerLabel(b));
        case "owner_desc":
          return ownerLabel(b).localeCompare(ownerLabel(a));
        case "last_touch_asc":
          return touchMs(a) - touchMs(b);
        case "last_touch_desc":
          return touchMs(b) - touchMs(a);
      }
    });
    return arr;
  }, [filtered, sortKey, nextActionByPartner, ownerNames]);

  useEffect(() => {
    setPageIndex(0);
  }, [statusFilter, typeFilter, query, sortKey, scopeFilter, ownerFilter, pageSize]);

  useEffect(() => {
    const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
    const maxIdx = pageCount - 1;
    if (pageIndex > maxIdx) {
      setPageIndex(maxIdx);
    }
  }, [sorted.length, pageSize, pageIndex]);

  const rosterTotal = sorted.length;
  const pageCount = Math.max(1, Math.ceil(rosterTotal / pageSize));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const pageRows = sorted.slice(safePageIndex * pageSize, (safePageIndex + 1) * pageSize);
  const rangeStart = rosterTotal === 0 ? 0 : safePageIndex * pageSize + 1;
  const rangeEnd = Math.min((safePageIndex + 1) * pageSize, rosterTotal);

  const pendingLeads = leads.leads.filter((l) => l.status === "new" || l.status === "in_review");
  const overdueActions = openActions.filter((a) => isOverdue(a.due_date));
  const highPriorityOpen = openActions.filter((a) => a.priority === "high");

  const stalePartnersCount = useMemo(
    () =>
      scoped.filter((it) => {
        const lastTouched = it.latest?.created_at ?? it.partner.created_at;
        return daysAgo(lastTouched) >= 14;
      }).length,
    [scoped],
  );
  const undiagnosedCount = useMemo(
    () => scoped.filter((it) => !it.latest || Number(it.latest.overall) <= 0).length,
    [scoped],
  );

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

  if (loading || !user) {
    return (
      <div className="page-shell space-y-5">
        <Skeleton className="h-7 w-72" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (portfolio.error) {
    return (
      <div className="page-shell">
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
    <div className="page-shell space-y-5">
      <section className="sticky top-20 z-20 rounded-2xl border border-border/70 bg-card/95 px-4 py-4 backdrop-blur sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="page-eyebrow">
              {scopeFilter === "all" ? COPY.portfolio.kickerAllPartners : COPY.portfolio.kickerPortfolioMine}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Your Partner Portfolio
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Start with the partners who need your attention most today.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                const queue = document.getElementById("today-queue");
                queue?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="btn-candy min-h-11 px-5"
            >
              Start weekly review
            </button>
            <button onClick={() => setShowNew(true)} className="btn-candy-secondary min-h-11 px-5">
              <Plus className="h-4 w-4" />
              Add partner
            </button>
          </div>
        </div>
        {portfolio.isLeadership && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-surface/50 p-2">
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
                title="Filter by owner"
              >
                {(() => {
                  const roster: PdmEntry[] = pdmRoster.pdms.length > 0 ? pdmRoster.pdms : ownersInScope;
                  return (
                    <>
                      <option value="all">Owner: All ({roster.length})</option>
                      {roster.map((o) => (
                        <option key={o.id} value={o.id}>
                          Owner: {o.name}
                        </option>
                      ))}
                    </>
                  );
                })()}
              </select>
            )}
            <span className="ml-auto px-2 text-xs text-muted-foreground">
              {scopeFilter === "mine"
                ? "Showing your portfolio"
                : ownerFilter === "all"
                  ? `Showing all owners · ${scoped.length} partners`
                  : `Showing ${ownerNames.get(ownerFilter) ?? "owner"} · ${scoped.length} partners`}
            </span>
          </div>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <FocusCard
          title="At risk"
          value={statusCounts.at_risk}
          hint="Partners that need direct follow-up this week."
          icon={AlertTriangle}
          tone="danger"
          onClick={() => setStatusFilter("at_risk")}
        />
        <FocusCard
          title="Overdue moves"
          value={overdueActions.length}
          hint="Commitments that slipped past due date."
          icon={CalendarClock}
          tone="warning"
          onClick={() => {
            const queue = document.getElementById("today-queue");
            queue?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />
        <FocusCard
          title="No update in 14 days"
          value={stalePartnersCount}
          hint="Relationships with stale signals or no recent diagnostic."
          icon={HeartHandshake}
          tone="info"
          onClick={() => setStatusFilter("all")}
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
        <div className="min-w-0 space-y-4">
          <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="page-eyebrow">{COPY.portfolio.rosterEyebrow}</p>
                <h2 className="mt-1 section-title">{COPY.portfolio.rosterTitle}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{briefing}</p>
              </div>
              {statusFilter !== "all" && (
                <button
                  onClick={() => setStatusFilter("all")}
                  className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  Clear status filter ({prettyStatus(statusFilter)})
                </button>
              )}
            </div>

            <div
              className="mt-4 flex flex-wrap gap-2"
              role="group"
              aria-label={COPY.portfolio.statusFilterLegend}
            >
              <StatusChip
                active={statusFilter === "all"}
                tone="neutral"
                onClick={() => setStatusFilter("all")}
                label={COPY.portfolio.statusFilterAll}
              />
              <StatusChip
                active={statusFilter === "active"}
                tone="primary"
                onClick={() => setStatusFilter("active")}
                label={COPY.portfolio.statusFilterScaling}
              />
              <StatusChip
                active={statusFilter === "nurturing"}
                tone="warning"
                onClick={() => setStatusFilter("nurturing")}
                label={COPY.portfolio.statusFilterDeveloping}
              />
              <StatusChip
                active={statusFilter === "at_risk"}
                tone="danger"
                onClick={() => setStatusFilter("at_risk")}
                label={COPY.portfolio.statusFilterAtRisk}
              />
            </div>

            <div className="mt-4">
              <PartnerFilterBar
                query={query}
                onQuery={setQuery}
                type={typeFilter}
                onType={setTypeFilter}
                sort={sortKey}
                onSort={setSortKey}
              />
            </div>
          </div>

          {!portfolio.loading && sorted.length > 0 && (
            <nav
              aria-label={COPY.portfolio.paginationLabel}
              className="flex min-h-11 flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-3 py-2.5 sm:px-4"
            >
              <p className="text-xs tabular-nums text-muted-foreground">
                {COPY.portfolio.paginationRange({
                  start: rangeStart,
                  end: rangeEnd,
                  total: rosterTotal,
                })}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="whitespace-nowrap">{COPY.portfolio.paginationRowsLabel}</span>
                  <select
                    className="select-candy min-h-11 py-2"
                    value={pageSize}
                    aria-label={COPY.portfolio.paginationRowsLabel}
                    onChange={(e) =>
                      setPageSize(Number(e.target.value) as (typeof PAGE_SIZES)[number])
                    }
                  >
                    {PAGE_SIZES.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="btn-candy-ghost min-h-11 px-3"
                    disabled={safePageIndex <= 0}
                    onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                    aria-label={COPY.portfolio.paginationPrev}
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    className="btn-candy-ghost min-h-11 px-3"
                    disabled={safePageIndex >= pageCount - 1}
                    onClick={() =>
                      setPageIndex((p) => {
                        const pc = Math.max(1, Math.ceil(rosterTotal / pageSize));
                        return Math.min(pc - 1, p + 1);
                      })
                    }
                    aria-label={COPY.portfolio.paginationNext}
                  >
                    Next
                  </button>
                </div>
              </div>
            </nav>
          )}

          {portfolio.loading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          ) : sorted.length === 0 ? (
            <EmptyPortfolioOnboarding onAdd={() => setShowNew(true)} />
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {pageRows.map((it) => (
                  <MobilePartnerCard
                    key={it.partner.id}
                    item={it}
                    ownerName={ownerNames.get(it.partner.owner_id) ?? "—"}
                    nextAction={nextActionByPartner.get(it.partner.id) ?? "Open partner"}
                    isLeadership={portfolio.isLeadership}
                    onOpen={() => nav({ to: "/partner/$partnerId", params: { partnerId: it.partner.id } })}
                  />
                ))}
              </div>
              <div className="hidden md:block">
                <PartnerRosterTable
                  rows={pageRows}
                  nextActionByPartner={nextActionByPartner}
                  isLeadership={portfolio.isLeadership}
                  ownerNames={ownerNames}
                  sortKey={sortKey}
                  onSortKey={setSortKey}
                  onRowClick={(it) =>
                    nav({ to: "/partner/$partnerId", params: { partnerId: it.partner.id } })
                  }
                  bulkActions={[
                    {
                      label: "Mark Scaling",
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
              </div>
            </>
          )}
        </div>

        <aside id="today-queue" className="min-w-0">
          <div className="sticky top-24 space-y-4 rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
            <div className="text-center">
              <p className="page-eyebrow">Today&apos;s queue</p>
              <h2 className="mt-1 section-title">What should happen next?</h2>
            </div>

            <button
              onClick={() => setStatusFilter("at_risk")}
              className="flex w-full flex-col items-center justify-center gap-0.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-3 text-center min-h-11"
            >
              <span className="text-sm text-foreground">Partners needing attention</span>
              <span className="text-lg font-semibold tabular-nums text-destructive">{statusCounts.at_risk}</span>
            </button>

            <button
              onClick={() => setStatusFilter("all")}
              className="flex w-full flex-col items-center justify-center gap-0.5 rounded-xl border border-warning/30 bg-warning/10 px-3 py-3 text-center min-h-11"
            >
              <span className="text-sm text-foreground">Missing diagnostics</span>
              <span className="text-lg font-semibold tabular-nums text-warning">{undiagnosedCount}</span>
            </button>

            <button
              onClick={() => {
                const queue = document.getElementById("today-queue");
                queue?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="flex w-full flex-col items-center justify-center gap-0.5 rounded-xl border border-border bg-surface px-3 py-3 text-center min-h-11"
            >
              <span className="text-sm text-foreground">Overdue moves</span>
              <span className="text-lg font-semibold tabular-nums text-foreground">{overdueActions.length}</span>
            </button>

            <div className="space-y-2 border-t border-border/70 pt-4 text-center">
              <p className="text-xs font-semibold text-foreground">Next moves</p>
              {actionsLoading ? (
                <Skeleton className="h-10 w-full rounded-lg" />
              ) : todayQueueActions.length === 0 ? (
                <p className="text-balance text-xs text-muted-foreground">
                  No open moves for now. Create one from a partner workspace.
                </p>
              ) : (
                <ul className="space-y-2">
                  {todayQueueActions.map((a) => (
                    <li key={a.id}>
                      <button
                        onClick={() => setSelectedAction(a)}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-center hover:bg-surface-2"
                      >
                        <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{a.partner_name}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex gap-2 border-t border-border/70 pt-4">
              <button
                onClick={() =>
                  copyWeeklyDigest("slack", {
                    atRisk: statusCounts.at_risk,
                    overdue: overdueActions.length,
                    top: todayQueueActions,
                  })
                }
                className="btn-candy-ghost flex-1 justify-center"
              >
                {COPY.portfolio.exportSlack}
              </button>
              <button
                onClick={() =>
                  copyWeeklyDigest("email", {
                    atRisk: statusCounts.at_risk,
                    overdue: overdueActions.length,
                    top: todayQueueActions,
                  })
                }
                className="btn-candy-ghost flex-1 justify-center"
              >
                {COPY.portfolio.exportEmail}
              </button>
            </div>
          </div>
        </aside>
      </section>

      {portfolio.isLeadership && scopeFilter === "all" && (
        <section>
          <TeamPulse items={scoped} ownerNames={ownerNames} />
        </section>
      )}

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

type RosterSortColumn = "partner" | "health" | "next" | "owner" | "last_touch";

function nextRosterSort(column: RosterSortColumn, current: SortKey): SortKey {
  const pairs: Record<RosterSortColumn, readonly [SortKey, SortKey]> = {
    partner: ["name_asc", "name_desc"],
    health: ["status_asc", "status_desc"],
    next: ["next_action_asc", "next_action_desc"],
    owner: ["owner_asc", "owner_desc"],
    last_touch: ["last_touch_asc", "last_touch_desc"],
  };
  const [asc, desc] = pairs[column];
  if (current === asc) return desc;
  if (current === desc) return asc;
  return asc;
}

function RosterSortableHeader({
  label,
  align,
  sortKey,
  ascKey,
  descKey,
  onSort,
}: {
  label: string;
  align: "left" | "center";
  sortKey: SortKey;
  ascKey: SortKey;
  descKey: SortKey;
  onSort: () => void;
}) {
  const active = sortKey === ascKey || sortKey === descKey;
  const ascending = sortKey === ascKey;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onSort();
      }}
      className={cn(
        "group inline-flex min-h-11 max-w-full items-center gap-0.5 rounded-lg px-1.5 -mx-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors hover:bg-primary/10 hover:text-foreground",
        align === "center" ? "justify-center" : "justify-start",
        active ? "text-foreground" : "text-muted-foreground",
      )}
      aria-label={`Sort by ${label}. ${active ? (ascending ? "Ascending" : "Descending") : "Not sorted"}`}
    >
      <span className="truncate">{label}</span>
      {active ? (
        ascending ? (
          <ChevronUp className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
        )
      ) : null}
    </button>
  );
}

function StatusChip({
  active,
  tone,
  onClick,
  label,
}: {
  active: boolean;
  tone: "neutral" | "primary" | "warning" | "danger";
  onClick: () => void;
  label: string;
}) {
  const toneClass =
    tone === "primary"
      ? "border-primary/40 bg-primary/10 text-foreground"
      : tone === "warning"
        ? "border-warning/40 bg-warning/10 text-warning"
        : tone === "danger"
          ? "border-destructive/50 bg-destructive/15 text-destructive"
          : "border-foreground/30 bg-surface-2 text-foreground";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "min-h-9 rounded-lg border px-3 py-1.5 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active
          ? toneClass
          : "border-border bg-surface text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function FocusCard({
  title,
  value,
  hint,
  icon: Icon,
  tone,
  onClick,
}: {
  title: string;
  value: number;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "danger" | "warning" | "info";
  onClick: () => void;
}) {
  const toneClass =
    tone === "danger"
      ? "border-destructive/35 bg-destructive/10"
      : tone === "warning"
        ? "border-warning/35 bg-warning/10"
        : "border-primary/30 bg-primary/10";
  const iconClass =
    tone === "danger"
      ? "text-destructive"
      : tone === "warning"
        ? "text-warning"
        : "text-primary";

  return (
    <button
      onClick={onClick}
      className={`flex w-full flex-col items-center rounded-xl border p-5 text-center transition hover:bg-surface-2 ${toneClass}`}
    >
      <Icon className={`h-5 w-5 shrink-0 ${iconClass}`} />
      <p className="mt-3 text-[11px] font-medium text-foreground">{title}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground tabular-nums">{value}</p>
      <p className="mt-2 max-w-[16rem] text-xs leading-snug text-muted-foreground">{hint}</p>
    </button>
  );
}

function MobilePartnerCard({
  item,
  ownerName,
  nextAction,
  isLeadership,
  onOpen,
}: {
  item: PortfolioItem;
  ownerName: string;
  nextAction: string;
  isLeadership: boolean;
  onOpen: () => void;
}) {
  const touched = item.latest?.created_at ?? item.partner.created_at;
  const touchedDays = daysAgo(touched);
  const toneMap: Record<PortfolioItem["partner"]["status"], StatusTone> = {
    active: "success",
    nurturing: "info",
    at_risk: "danger",
    paused: "muted",
    archived: "muted",
  };
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={COPY.portfolio.rowOpenAria({ name: item.partner.name })}
      className="group flex w-full flex-col gap-3 rounded-xl border border-border/70 bg-card p-4 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-inset"
    >
      <div className="flex items-center gap-3">
        <CandyAvatar name={item.partner.name} size={34} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{item.partner.name}</p>
          <p className="truncate text-xs text-muted-foreground">{item.partner.company ?? "—"}</p>
        </div>
        <StatusPill tone={toneMap[item.partner.status]}>{statusLabel(item.partner.status)}</StatusPill>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex max-w-full items-center rounded-md border border-border bg-surface px-2 py-1 text-xs text-foreground">
          {nextAction}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <span>{touchedDays === 0 ? "today" : `${touchedDays}d ago`}</span>
          <ChevronRight
            className="h-4 w-4 text-muted-foreground/60 transition-colors group-hover:text-primary group-focus-visible:text-primary"
            aria-hidden
          />
        </span>
      </div>
      {isLeadership && (
        <p className="text-[11px] text-muted-foreground">
          {COPY.partnerWorkspace.ownerLabel}: {ownerName}
        </p>
      )}
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

/* ─────────────────── Roster table ─────────────────── */

function PartnerRosterTable({
  rows,
  nextActionByPartner,
  isLeadership,
  ownerNames,
  sortKey,
  onSortKey,
  onRowClick,
  bulkActions,
}: {
  rows: PortfolioItem[];
  nextActionByPartner: Map<string, string>;
  isLeadership: boolean;
  ownerNames: Map<string, string>;
  sortKey: SortKey;
  onSortKey: (key: SortKey) => void;
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
      header: (
        <RosterSortableHeader
          label="Partner"
          align="left"
          sortKey={sortKey}
          ascKey="name_asc"
          descKey="name_desc"
          onSort={() => onSortKey(nextRosterSort("partner", sortKey))}
        />
      ),
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
      header: (
        <RosterSortableHeader
          label="Health"
          align="center"
          sortKey={sortKey}
          ascKey="status_asc"
          descKey="status_desc"
          onSort={() => onSortKey(nextRosterSort("health", sortKey))}
        />
      ),
      width: "140px",
      align: "center",
      cell: (it) => (
        <StatusPill tone={STATUS_TONE[it.partner.status]}>
          {statusLabel(it.partner.status)}
        </StatusPill>
      ),
    },
    {
      key: "next",
      header: (
        <RosterSortableHeader
          label="Next action"
          align="center"
          sortKey={sortKey}
          ascKey="next_action_asc"
          descKey="next_action_desc"
          onSort={() => onSortKey(nextRosterSort("next", sortKey))}
        />
      ),
      width: "200px",
      align: "center",
      cell: (it) => (
        <span className="inline-flex max-w-full items-center justify-center rounded-lg border border-border bg-surface px-2.5 py-1 text-center text-xs text-foreground">
          {nextActionByPartner.get(it.partner.id) ?? "Open partner"}
        </span>
      ),
    },
    ...(isLeadership
      ? [
          {
            key: "owner",
            header: (
              <RosterSortableHeader
                label="Owner"
                align="center"
                sortKey={sortKey}
                ascKey="owner_asc"
                descKey="owner_desc"
                onSort={() => onSortKey(nextRosterSort("owner", sortKey))}
              />
            ),
            width: "140px",
            align: "center",
            cell: (it: PortfolioItem) => (
              <span className="truncate text-center text-xs font-mono text-muted-foreground">
                {ownerNames.get(it.partner.owner_id) ?? "—"}
              </span>
            ),
          } satisfies CandyColumn<PortfolioItem>,
        ]
      : []),
    {
      key: "lastTouch",
      header: (
        <RosterSortableHeader
          label="Last touch"
          align="center"
          sortKey={sortKey}
          ascKey="last_touch_asc"
          descKey="last_touch_desc"
          onSort={() => onSortKey(nextRosterSort("last_touch", sortKey))}
        />
      ),
      width: "120px",
      align: "center",
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
      cell: () => (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground/70 transition-colors group-hover:text-primary group-focus-visible:text-primary">
          <span>{COPY.portfolio.rowOpenCue}</span>
          <ChevronRight className="h-4 w-4" aria-hidden />
        </span>
      ),
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
      getRowAriaLabel={(it) => COPY.portfolio.rowOpenAria({ name: it.partner.name })}
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
