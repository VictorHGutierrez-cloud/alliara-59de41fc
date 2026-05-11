import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  usePortfolio,
  statusLabel,
  type PortfolioItem,
  type ActionRow,
} from "../lib/partners-store";
import { useLeads } from "../lib/leads-store";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, ChevronUp, Plus } from "lucide-react";
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
import { AXES } from "@/content/octa";
import { AgentPlan, AgentTaskCard, type AgentTask } from "@/components/ui/agent-plan";
import { PartnerTaskEditDialog } from "@/components/PartnerTaskEditDialog";
import { EmailStakeholderComposer } from "@/components/EmailStakeholderComposer";
import { MoveCompleteCelebration } from "@/components/ui/move-complete-celebration";
import { actionRowToAgentTask } from "@/lib/agent-task-mapper";

const PAGE_SIZES = [10, 20, 50, 100, 200] as const;
/** Cap for the portfolio “Open tasks” list at the top (same roster scope as the grid). */
const PORTFOLIO_OPEN_TASKS_LIST_CAP = 14;

export const Route = createFileRoute("/partners")({
  head: () => ({ meta: [{ title: COPY.portfolio.pageMetaTitle }] }),
  component: PartnersPage,
});

type StatusFilter = "all" | "active" | "nurturing" | "at_risk";
type EnrichedAction = ActionRow & { partner_name: string };
type PortfolioTaskFilter = "open" | "done" | "all";

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
  const [portfolioActionRows, setPortfolioActionRows] = useState<EnrichedAction[]>([]);
  const [openActionsIncomplete, setOpenActionsIncomplete] = useState<EnrichedAction[]>([]);
  const [portfolioTaskFilter, setPortfolioTaskFilter] = useState<PortfolioTaskFilter>("open");
  const [portfolioActionsFetchTick, setPortfolioActionsFetchTick] = useState(0);
  const [taskPartnerFilterId, setTaskPartnerFilterId] = useState<string>("all");
  const [taskAxisFilterKey, setTaskAxisFilterKey] = useState<string>("all");
  const [taskWorkflowStatusFilter, setTaskWorkflowStatusFilter] = useState<
    "all" | ActionRow["status"]
  >("all");
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<"all" | ActionRow["priority"]>(
    "all",
  );
  const [taskSearchQuery, setTaskSearchQuery] = useState("");
  const [editingPortfolioAction, setEditingPortfolioAction] = useState<EnrichedAction | null>(null);
  const [emailPortfolioCtx, setEmailPortfolioCtx] = useState<{
    partnerId: string;
    defaultSubject: string;
    defaultBody: string;
  } | null>(null);
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

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  const scoped = useMemo(() => {
    if (!user || portfolio.loading || portfolio.error) return [] as PortfolioItem[];
    return portfolio.items.filter(ownerScope.applyFilter);
  }, [user, portfolio.items, portfolio.loading, portfolio.error, ownerScope]);

  const scopedRosterKey = useMemo(
    () =>
      scoped
        .map((it) => `${it.partner.id}:${it.partner.name}`)
        .sort()
        .join("|"),
    [scoped],
  );

  const ownerIdByPartner = useMemo(
    () => new Map(scoped.map((it) => [it.partner.id, it.partner.owner_id])),
    [scoped],
  );

  const partnerMetaById = useMemo(
    () =>
      new Map(
        scoped.map((it) => [
          it.partner.id,
          { name: it.partner.name, company: it.partner.company ?? null },
        ]),
      ),
    [scoped],
  );

  // Partner tasks for the list (filtered) + incomplete-only for roster “next action” and briefing counts
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!user || portfolio.loading) return;
      const ids = scoped.map((it) => it.partner.id);
      if (ids.length === 0) {
        if (!cancelled) {
          setPortfolioActionRows([]);
          setOpenActionsIncomplete([]);
        }
        return;
      }
      const nameMap = new Map(scoped.map((it) => [it.partner.id, it.partner.name]));
      const enrich = (rows: ActionRow[] | null | undefined): EnrichedAction[] =>
        (rows ?? []).map((row) => ({
          ...row,
          partner_name: nameMap.get(row.partner_id) ?? "—",
        }));

      let listQ = supabase.from("action_plans").select("*").in("partner_id", ids);
      if (portfolioTaskFilter === "open") {
        listQ = listQ
          .neq("status", "done")
          .order("due_date", { ascending: true, nullsFirst: false });
      } else if (portfolioTaskFilter === "done") {
        listQ = listQ
          .eq("status", "done")
          .order("completed_at", { ascending: false, nullsFirst: false });
      } else {
        listQ = listQ
          .order("completed_at", { ascending: true, nullsFirst: true })
          .order("due_date", { ascending: true, nullsFirst: false });
      }

      const incompleteQ = supabase
        .from("action_plans")
        .select("*")
        .in("partner_id", ids)
        .neq("status", "done")
        .order("due_date", { ascending: true, nullsFirst: false });

      const [{ data: listData }, { data: incData }] = await Promise.all([listQ, incompleteQ]);
      if (cancelled) return;
      setPortfolioActionRows(enrich(listData as ActionRow[] | null));
      setOpenActionsIncomplete(enrich(incData as ActionRow[] | null));
    })();
    return () => {
      cancelled = true;
    };
  }, [user, portfolio.loading, scoped, portfolioTaskFilter, portfolioActionsFetchTick]);

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

  const sortedIncompleteActions = useMemo(
    () => sortActions(openActionsIncomplete),
    [openActionsIncomplete],
  );
  const sortedPortfolioActions = useMemo(
    () => sortActions(portfolioActionRows),
    [portfolioActionRows],
  );

  const firstOpenActionByPartner = useMemo(() => {
    const m = new Map<string, EnrichedAction>();
    for (const action of sortedIncompleteActions) {
      if (!m.has(action.partner_id)) m.set(action.partner_id, action);
    }
    return m;
  }, [sortedIncompleteActions]);

  const [moveBurstAt, setMoveBurstAt] = useState<number | null>(null);
  const clearMoveBurst = useCallback(() => setMoveBurstAt(null), []);

  const handlePortfolioCycleStatus = useCallback(
    async (taskId: string) => {
      const current =
        portfolioActionRows.find((a) => a.id === taskId) ??
        openActionsIncomplete.find((a) => a.id === taskId);
      if (!current) return;
      const next: ActionRow["status"] =
        current.status === "todo" ? "doing" : current.status === "doing" ? "done" : "todo";
      try {
        const { error } = await supabase
          .from("action_plans")
          .update({
            status: next,
            completed_at: next === "done" ? new Date().toISOString() : null,
          })
          .eq("id", taskId);
        if (error) throw error;
        if (next === "done") setMoveBurstAt(Date.now());
        setPortfolioActionsFetchTick((n) => n + 1);
        void portfolio.refresh();
      } catch (e) {
        console.error("[PartnersPage - handlePortfolioCycleStatus]:", e);
        toast.error((e as Error).message);
      }
    },
    [portfolioActionRows, openActionsIncomplete, portfolio],
  );

  const handlePortfolioDelete = useCallback(
    async (taskId: string) => {
      try {
        const { error } = await supabase.from("action_plans").delete().eq("id", taskId);
        if (error) throw error;
        setPortfolioActionsFetchTick((n) => n + 1);
        void portfolio.refresh();
      } catch (e) {
        console.error("[PartnersPage - handlePortfolioDelete]:", e);
        toast.error((e as Error).message);
      }
    },
    [portfolio],
  );

  const handlePortfolioUpdateFields = useCallback(
    async (
      taskId: string,
      patch: {
        axis_key: string;
        title: string;
        description: string | null;
        priority: ActionRow["priority"];
        target_level: number | null;
        due_date: string | null;
      },
    ) => {
      try {
        const { error } = await supabase
          .from("action_plans")
          .update(patch as never)
          .eq("id", taskId);
        if (error) throw error;
        toast.success(COPY.toast.moveUpdated);
        setPortfolioActionsFetchTick((n) => n + 1);
        void portfolio.refresh();
      } catch (e) {
        console.error("[PartnersPage - handlePortfolioUpdateFields]:", e);
        toast.error((e as Error).message);
        throw e;
      }
    },
    [portfolio],
  );

  const enrichedActionById = useMemo(() => {
    const m = new Map<string, EnrichedAction>();
    for (const row of portfolioActionRows) {
      m.set(row.id, row);
    }
    for (const row of openActionsIncomplete) {
      if (!m.has(row.id)) {
        m.set(row.id, row);
      }
    }
    return m;
  }, [portfolioActionRows, openActionsIncomplete]);

  const firstPortfolioTaskByPartner = useMemo(() => {
    const m = new Map<string, AgentTask>();
    for (const [partnerId, a] of firstOpenActionByPartner) {
      const ownerId = ownerIdByPartner.get(partnerId);
      const meta = partnerMetaById.get(partnerId);
      m.set(
        partnerId,
        actionRowToAgentTask(a, {
          canMutate: ownerId === user?.id,
          includePartnerContext: true,
          partnerName: meta?.name ?? "",
          partnerCompany: meta?.company ?? null,
        }),
      );
    }
    return m;
  }, [firstOpenActionByPartner, ownerIdByPartner, partnerMetaById, user?.id]);

  const portfolioTaskRowsFiltered = useMemo(() => {
    let rows = sortedPortfolioActions;
    if (taskPartnerFilterId !== "all") {
      rows = rows.filter((r) => r.partner_id === taskPartnerFilterId);
    }
    if (taskAxisFilterKey !== "all") {
      rows = rows.filter((r) => r.axis_key === taskAxisFilterKey);
    }
    if (taskWorkflowStatusFilter !== "all") {
      rows = rows.filter((r) => r.status === taskWorkflowStatusFilter);
    }
    if (taskPriorityFilter !== "all") {
      rows = rows.filter((r) => r.priority === taskPriorityFilter);
    }
    const qq = taskSearchQuery.trim().toLowerCase();
    if (qq) {
      rows = rows.filter((r) => {
        const desc = r.description ?? "";
        return (
          r.title.toLowerCase().includes(qq) ||
          desc.toLowerCase().includes(qq) ||
          (r.partner_name ?? "").toLowerCase().includes(qq)
        );
      });
    }
    return rows;
  }, [
    sortedPortfolioActions,
    taskPartnerFilterId,
    taskAxisFilterKey,
    taskWorkflowStatusFilter,
    taskPriorityFilter,
    taskSearchQuery,
  ]);

  const hasActiveTaskFineFilters =
    taskPartnerFilterId !== "all" ||
    taskAxisFilterKey !== "all" ||
    taskWorkflowStatusFilter !== "all" ||
    taskPriorityFilter !== "all" ||
    taskSearchQuery.trim() !== "";

  const portfolioTaskDisplayCap = hasActiveTaskFineFilters ? 50 : PORTFOLIO_OPEN_TASKS_LIST_CAP;

  const portfolioOpenTasksForPlan = useMemo(
    () =>
      portfolioTaskRowsFiltered.map((a) => {
        const meta = partnerMetaById.get(a.partner_id);
        return actionRowToAgentTask(a, {
          canMutate: ownerIdByPartner.get(a.partner_id) === user?.id,
          includePartnerContext: true,
          partnerName: meta?.name ?? "",
          partnerCompany: meta?.company ?? null,
        });
      }),
    [portfolioTaskRowsFiltered, ownerIdByPartner, partnerMetaById, user?.id],
  );

  const nextActionByPartner = useMemo(() => {
    const map = new Map<string, string>();
    const actionByPartner = new Map<string, EnrichedAction[]>();
    for (const action of sortedIncompleteActions) {
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
  }, [scoped, sortedIncompleteActions]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const touchMs = (it: PortfolioItem) =>
      new Date(it.latest?.created_at ?? it.partner.created_at).getTime();
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
          return comparePartnersByNextAction(
            a,
            b,
            firstOpenActionByPartner,
            nextActionByPartner,
            "asc",
          );
        case "next_action_desc":
          return comparePartnersByNextAction(
            a,
            b,
            firstOpenActionByPartner,
            nextActionByPartner,
            "desc",
          );
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
  }, [filtered, sortKey, nextActionByPartner, firstOpenActionByPartner, ownerNames]);

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
  const overdueActions = openActionsIncomplete.filter((a) => isOverdue(a.due_date));
  const highPriorityOpen = openActionsIncomplete.filter((a) => a.priority === "high");

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
      <section className="sticky top-20 z-20 rounded-2xl border border-border/70 bg-card/95 px-3 py-3 backdrop-blur sm:px-4 sm:py-3">
        <div className="mx-auto w-full max-w-5xl space-y-2.5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0 flex-1">
              {scopeFilter === "mine" && (
                <p className="page-eyebrow">{COPY.portfolio.kickerPortfolioMine}</p>
              )}
              <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {COPY.portfolio.stickyHeroTitle}
              </h1>
              <p className="mt-0.5 max-w-prose text-xs leading-snug text-muted-foreground sm:text-sm line-clamp-2 sm:line-clamp-none">
                {COPY.portfolio.stickyHeroSubtitle}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  document
                    .getElementById("portfolio-roster")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="btn-candy min-h-10 px-4 text-sm sm:min-h-11 sm:px-5"
              >
                {COPY.portfolio.startWeeklyReviewCta}
              </button>
              <button
                type="button"
                onClick={() => setShowNew(true)}
                className="btn-candy-secondary min-h-10 px-4 text-sm sm:min-h-11 sm:px-5"
              >
                <Plus className="h-4 w-4" />
                {COPY.portfolio.stickyAddPartnerCta}
              </button>
            </div>
          </div>
        </div>
        {portfolio.isLeadership && (
          <div className="mx-auto mt-2.5 flex w-full max-w-5xl flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-surface/50 px-2 py-1.5">
            <div className="seg-candy">
              {(["mine", "all"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
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
                  const roster: PdmEntry[] =
                    pdmRoster.pdms.length > 0 ? pdmRoster.pdms : ownersInScope;
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
            <span className="w-full px-1 text-xs text-muted-foreground sm:ml-auto sm:w-auto sm:max-w-[min(24rem,100%)] sm:text-right">
              {scopeFilter === "mine"
                ? "Showing your portfolio"
                : ownerFilter === "all"
                  ? `Showing all owners · ${scoped.length} partners`
                  : `Showing ${ownerNames.get(ownerFilter) ?? "owner"} · ${scoped.length} partners`}
            </span>
          </div>
        )}
      </section>

      <section
        id="portfolio-open-tasks"
        aria-label={COPY.portfolio.openTasksEyebrow}
        className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <p className="page-eyebrow">{COPY.portfolio.openTasksEyebrow}</p>
            <p className="mt-1 max-w-prose text-xs text-muted-foreground">
              {COPY.portfolio.openTasksSubtitle}
            </p>
          </div>
          <div
            className="seg-candy shrink-0 self-start"
            role="group"
            aria-label="Filter partner tasks by completion"
          >
            {(["open", "done", "all"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setPortfolioTaskFilter(f)}
                className="seg-candy-item min-h-11 px-3"
                data-active={portfolioTaskFilter === f}
              >
                {f === "open"
                  ? COPY.portfolio.partnerTaskFilterOpen
                  : f === "done"
                    ? COPY.portfolio.partnerTaskFilterDone
                    : COPY.portfolio.partnerTaskFilterAll}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          <input
            type="search"
            value={taskSearchQuery}
            onChange={(e) => setTaskSearchQuery(e.target.value)}
            placeholder={COPY.portfolio.taskSearchPlaceholder}
            className="input min-h-11 w-full max-w-md"
            aria-label={COPY.portfolio.taskSearchPlaceholder}
          />
          <div className="flex flex-wrap gap-2">
            <select
              value={taskPartnerFilterId}
              onChange={(e) => setTaskPartnerFilterId(e.target.value)}
              className="select-candy min-h-11 shrink-0"
              aria-label={COPY.portfolio.taskFilterPartnerAria}
            >
              <option value="all">{COPY.portfolio.taskFilterPartnerAll}</option>
              {[...scoped]
                .sort((a, b) => a.partner.name.localeCompare(b.partner.name))
                .map((it) => (
                  <option key={it.partner.id} value={it.partner.id}>
                    {it.partner.name}
                  </option>
                ))}
            </select>
            <select
              value={taskAxisFilterKey}
              onChange={(e) => setTaskAxisFilterKey(e.target.value)}
              className="select-candy min-h-11 shrink-0"
              aria-label={COPY.portfolio.taskFilterAxisAria}
            >
              <option value="all">{COPY.portfolio.taskFilterAxisAll}</option>
              {AXES.map((ax) => (
                <option key={ax.key} value={ax.key}>
                  {ax.letter} · {ax.name}
                </option>
              ))}
            </select>
            <select
              value={taskWorkflowStatusFilter}
              onChange={(e) =>
                setTaskWorkflowStatusFilter(e.target.value as "all" | ActionRow["status"])
              }
              className="select-candy min-h-11 shrink-0"
              aria-label={COPY.portfolio.taskFilterStatusAria}
            >
              <option value="all">{COPY.portfolio.taskFilterStatusAll}</option>
              <option value="todo">{COPY.portfolio.taskFilterStatusTodo}</option>
              <option value="doing">{COPY.portfolio.taskFilterStatusDoing}</option>
              <option value="done">{COPY.portfolio.taskFilterStatusDone}</option>
            </select>
            <select
              value={taskPriorityFilter}
              onChange={(e) =>
                setTaskPriorityFilter(e.target.value as "all" | ActionRow["priority"])
              }
              className="select-candy min-h-11 shrink-0"
              aria-label={COPY.portfolio.taskFilterPriorityAria}
            >
              <option value="all">{COPY.portfolio.taskFilterPriorityAll}</option>
              <option value="low">{COPY.jbp.priorityLow}</option>
              <option value="medium">{COPY.jbp.priorityMedium}</option>
              <option value="high">{COPY.jbp.priorityHigh}</option>
            </select>
          </div>
        </div>
        {sortedPortfolioActions.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {portfolioTaskFilter === "done"
              ? COPY.portfolio.openTasksEmptyDone
              : portfolioTaskFilter === "all"
                ? COPY.portfolio.openTasksEmptyAll
                : COPY.portfolio.openTasksEmpty}
          </p>
        ) : portfolioOpenTasksForPlan.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{COPY.portfolio.tasksNoMatchFilters}</p>
        ) : (
          <>
            <div className="mt-3 min-w-0">
              <AgentPlan
                tasks={portfolioOpenTasksForPlan.slice(0, portfolioTaskDisplayCap)}
                isOwner={false}
                onCycleStatus={(id) => void handlePortfolioCycleStatus(id)}
                onDelete={(id) => void handlePortfolioDelete(id)}
                onEdit={(id) => {
                  const row = enrichedActionById.get(id);
                  if (!row || ownerIdByPartner.get(row.partner_id) !== user?.id) return;
                  setEditingPortfolioAction(row);
                }}
                onComposeEmail={(task) => {
                  if (!task.partnerId) return;
                  setEmailPortfolioCtx({
                    partnerId: task.partnerId,
                    defaultSubject: task.title,
                    defaultBody: task.description
                      ? `${task.description}\n\n`
                      : `Hi,\n\nFollowing up regarding: ${task.title}\n\n`,
                  });
                }}
              />
            </div>
            {portfolioTaskRowsFiltered.length > portfolioTaskDisplayCap ? (
              <p className="mt-3 text-xs text-muted-foreground">
                {COPY.portfolio.openTasksShowingCap({ n: portfolioTaskDisplayCap })}
              </p>
            ) : null}
          </>
        )}
      </section>

      <section id="portfolio-roster" className="min-w-0 space-y-4">
        <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="section-title">{COPY.portfolio.rosterTitle}</h2>
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
                  firstPortfolioTask={firstPortfolioTaskByPartner.get(it.partner.id) ?? null}
                  onPortfolioCycle={(id) => void handlePortfolioCycleStatus(id)}
                  onPortfolioDelete={(id) => void handlePortfolioDelete(id)}
                  onPortfolioEditTask={(id) => {
                    const row = enrichedActionById.get(id);
                    if (!row || ownerIdByPartner.get(row.partner_id) !== user?.id) return;
                    setEditingPortfolioAction(row);
                  }}
                  onPortfolioComposeEmail={(task) => {
                    if (!task.partnerId) return;
                    setEmailPortfolioCtx({
                      partnerId: task.partnerId,
                      defaultSubject: task.title,
                      defaultBody: task.description
                        ? `${task.description}\n\n`
                        : `Hi,\n\nFollowing up regarding: ${task.title}\n\n`,
                    });
                  }}
                  isLeadership={portfolio.isLeadership}
                  onOpen={() =>
                    nav({ to: "/partner/$partnerId", params: { partnerId: it.partner.id } })
                  }
                />
              ))}
            </div>
            <div className="hidden md:block">
              <PartnerRosterTable
                rows={pageRows}
                nextActionByPartner={nextActionByPartner}
                firstPortfolioTaskByPartner={firstPortfolioTaskByPartner}
                onPortfolioCycle={(id) => void handlePortfolioCycleStatus(id)}
                onPortfolioDelete={(id) => void handlePortfolioDelete(id)}
                onPortfolioEditTask={(id) => {
                  const row = enrichedActionById.get(id);
                  if (!row || ownerIdByPartner.get(row.partner_id) !== user?.id) return;
                  setEditingPortfolioAction(row);
                }}
                onPortfolioComposeEmail={(task) => {
                  if (!task.partnerId) return;
                  setEmailPortfolioCtx({
                    partnerId: task.partnerId,
                    defaultSubject: task.title,
                    defaultBody: task.description
                      ? `${task.description}\n\n`
                      : `Hi,\n\nFollowing up regarding: ${task.title}\n\n`,
                  });
                }}
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
      {editingPortfolioAction && (
        <PartnerTaskEditDialog
          action={editingPortfolioAction}
          onClose={() => setEditingPortfolioAction(null)}
          onSave={(id, patch) => handlePortfolioUpdateFields(id, patch)}
        />
      )}
      {emailPortfolioCtx && (
        <EmailStakeholderComposer
          partnerId={emailPortfolioCtx.partnerId}
          defaultSubject={emailPortfolioCtx.defaultSubject}
          defaultBody={emailPortfolioCtx.defaultBody}
          onClose={() => setEmailPortfolioCtx(null)}
        />
      )}
      <MoveCompleteCelebration burstAt={moveBurstAt} onConsumed={clearMoveBurst} />
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

function compareTwoOpenActions(a: EnrichedAction, b: EnrichedAction): number {
  const prio = { high: 0, medium: 1, low: 2 } as const;
  const ao = isOverdue(a.due_date) ? 0 : 1;
  const bo = isOverdue(b.due_date) ? 0 : 1;
  if (ao !== bo) return ao - bo;
  if (prio[a.priority] !== prio[b.priority]) return prio[a.priority] - prio[b.priority];
  if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
  if (a.due_date) return -1;
  if (b.due_date) return 1;
  return 0;
}

function comparePartnersByNextAction(
  a: PortfolioItem,
  b: PortfolioItem,
  firstByPartner: Map<string, EnrichedAction>,
  fallbackLabel: Map<string, string>,
  direction: "asc" | "desc",
): number {
  const dir = direction === "asc" ? 1 : -1;
  const fa = firstByPartner.get(a.partner.id);
  const fb = firstByPartner.get(b.partner.id);
  if (fa && fb) return dir * compareTwoOpenActions(fa, fb);
  if (fa && !fb) return -1 * dir;
  if (!fa && fb) return 1 * dir;
  const ta = fallbackLabel.get(a.partner.id) ?? "";
  const tb = fallbackLabel.get(b.partner.id) ?? "";
  return dir * ta.localeCompare(tb);
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
        active ? toneClass : "border-border bg-surface text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function MobilePartnerCard({
  item,
  ownerName,
  nextAction,
  firstPortfolioTask,
  onPortfolioCycle,
  onPortfolioDelete,
  onPortfolioEditTask,
  onPortfolioComposeEmail,
  isLeadership,
  onOpen,
}: {
  item: PortfolioItem;
  ownerName: string;
  nextAction: string;
  firstPortfolioTask: AgentTask | null;
  onPortfolioCycle: (taskId: string) => void;
  onPortfolioDelete: (taskId: string) => void;
  onPortfolioEditTask: (taskId: string) => void;
  onPortfolioComposeEmail: (task: AgentTask) => void;
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
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      aria-label={COPY.portfolio.rowOpenAria({ name: item.partner.name })}
      className="group flex w-full flex-col gap-3 rounded-xl border border-border/70 bg-card p-4 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-inset cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <CandyAvatar name={item.partner.name} size={34} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{item.partner.name}</p>
          <p className="truncate text-xs text-muted-foreground">{item.partner.company ?? "—"}</p>
        </div>
        <StatusPill tone={toneMap[item.partner.status]}>
          {statusLabel(item.partner.status)}
        </StatusPill>
      </div>
      <div className="flex items-start justify-between gap-2">
        {firstPortfolioTask ? (
          <div
            className="min-w-0 flex-1"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <AgentTaskCard
              task={firstPortfolioTask}
              isOwner={false}
              compact
              onCycleStatus={onPortfolioCycle}
              onDelete={onPortfolioDelete}
              onEdit={onPortfolioEditTask}
              onComposeEmail={onPortfolioComposeEmail}
            />
          </div>
        ) : (
          <span className="inline-flex max-w-full items-center rounded-md border border-border bg-surface px-2 py-1 text-xs text-foreground">
            {nextAction}
          </span>
        )}
        <span className="inline-flex shrink-0 items-center gap-1 self-center text-[11px] text-muted-foreground">
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
    </div>
  );
}

/* ─────────────────── Roster table ─────────────────── */

function PartnerRosterTable({
  rows,
  nextActionByPartner,
  firstPortfolioTaskByPartner,
  onPortfolioCycle,
  onPortfolioDelete,
  onPortfolioEditTask,
  onPortfolioComposeEmail,
  isLeadership,
  ownerNames,
  sortKey,
  onSortKey,
  onRowClick,
  bulkActions,
}: {
  rows: PortfolioItem[];
  nextActionByPartner: Map<string, string>;
  firstPortfolioTaskByPartner: Map<string, AgentTask>;
  onPortfolioCycle: (taskId: string) => void;
  onPortfolioDelete: (taskId: string) => void;
  onPortfolioEditTask: (taskId: string) => void;
  onPortfolioComposeEmail: (task: AgentTask) => void;
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
      width: "minmax(240px,1.35fr)",
      align: "center",
      /** Top-align so expanding a task card does not vertically center a tall cell awkwardly */
      className:
        "items-start self-stretch py-3 !overflow-visible [&>div]:!overflow-visible [&>div]:!whitespace-normal [&>div]:w-full [&>div]:max-w-full",
      cell: (it) => {
        const task = firstPortfolioTaskByPartner.get(it.partner.id);
        if (task) {
          return (
            <div
              className="flex w-full min-w-0 justify-center sm:justify-start"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <AgentTaskCard
                task={task}
                isOwner={false}
                compact
                className="w-full max-w-md"
                onCycleStatus={onPortfolioCycle}
                onDelete={onPortfolioDelete}
                onEdit={onPortfolioEditTask}
                onComposeEmail={onPortfolioComposeEmail}
              />
            </div>
          );
        }
        return (
          <span className="inline-flex max-w-full items-center justify-center rounded-lg border border-border bg-surface px-2.5 py-1 text-center text-xs text-foreground">
            {nextActionByPartner.get(it.partner.id) ?? "Open partner"}
          </span>
        );
      },
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
                  {t.label} · {t.description}
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
              placeholder="Context the AI coach should know: relationship history, key contacts, current friction…"
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
