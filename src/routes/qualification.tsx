import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import {
  useLeads,
  LEAD_STATUSES,
  FACTORIAL_DIMENSIONS,
  factorialVerdict,
  computeFactorialTotal,
  getDimensionValue,
  parseScorecard,
  useLeadActivities,
  activitySummary,
  LEAD_SOURCES,
  LEAD_ACTIVITY_KINDS,
  useAllLeadTasks,
  SCORECARD_MAX_TOTAL,
  type LeadRow,
  type LeadStatus,
  type DimensionKey,
  type ScoreLevel,
  type LeadActivityKind,
  type LeadActivityRow,
  type LeadTaskRow,
} from "@/lib/leads-store";
import { PARTNER_TYPES, type PartnerType, LEAD_SORTS, type LeadSortKey } from "@/lib/partner-types";
import { PartnerTypeChip } from "@/components/PartnerFilterBar";
import { useOwnerScope } from "@/lib/use-owner-scope";
import { usePdmRoster, type PdmEntry } from "@/lib/use-pdm-roster";
import { supabase } from "@/integrations/supabase/client";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { PromoteLeadDialog } from "@/components/PromoteLeadDialog";
import {
  CandyDataTable,
  StatusPill,
  CandyAvatar,
  type CandyColumn,
} from "@/components/ui/candy-data-table";
import { downloadCsv, slugifyForFile } from "@/lib/report-export";
import { COPY } from "@/lib/copy";
import { KeptWorkspaceRibbon } from "@/components/brand/KeptWorkspaceRibbon";
import { useConfirmDialog } from "@/components/ui/confirm-provider";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/qualification")({
  head: () => ({ meta: [{ title: COPY.qualification.pageMetaTitle }] }),
  component: QualificationPage,
});

function QualificationPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const leadsStore = useLeads(user?.id);
  const [showNew, setShowNew] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [promoteLead, setPromoteLead] = useState<LeadRow | null>(null);
  const [promoteBusy, setPromoteBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<PartnerType | "all">("all");
  const [sortKey, setSortKey] = useState<LeadSortKey>("created_desc");
  const leadTasks = useAllLeadTasks(user?.id, leadsStore.leads);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [kanbanSelectedIds, setKanbanSelectedIds] = useState<Set<string>>(() => new Set());
  const [kanbanBulkSelectKey, setKanbanBulkSelectKey] = useState(0);

  const confirmDialog = useConfirmDialog();

  const ownerScope = useOwnerScope({
    items: leadsStore.leads,
    getOwnerId: (l) => l.owner_id,
    isLeadership: leadsStore.isLeadership,
    currentUserId: user?.id,
  });
  const { scope, setScope, ownerFilter, setOwnerFilter, ownersInScope, ownerNames } = ownerScope;
  const pdmRoster = usePdmRoster();

  const reassignLead = async (leadId: string, newOwnerId: string, newOwnerName: string) => {
    try {
      const { error } = await supabase
        .from("partner_leads")
        .update({ owner_id: newOwnerId })
        .eq("id", leadId);
      if (error) throw error;
      toast.success(`Lead reassigned to ${newOwnerName}`);
      await leadsStore.refresh({ silent: true });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  // Apply scope (mine/all + per-PDM) before counting and filtering.
  const scopedLeads = useMemo(
    () => leadsStore.leads.filter(ownerScope.applyFilter),
    [leadsStore.leads, ownerScope],
  );

  const counts = useMemo(() => {
    const c: Record<LeadStatus, number> = { new: 0, in_review: 0, approved: 0, rejected: 0 };
    for (const l of scopedLeads) c[l.status]++;
    return c;
  }, [scopedLeads]);

  const active = leadsStore.leads.find((l) => l.id === activeId) ?? null;

  const promoteLeadToPartner = async (lead: LeadRow) => {
    if (lead.promoted_partner_id) {
      nav({ to: "/partner/$partnerId", params: { partnerId: lead.promoted_partner_id } });
      return;
    }
    setPromoteLead(lead);
  };

  // Filter + sort the leads used by the Kanban
  const visibleLeads = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = scopedLeads.filter((l) => {
      if (typeFilter !== "all" && l.partner_type !== typeFilter) return false;
      if (q && !`${l.company_name} ${l.contact_person ?? ""}`.toLowerCase().includes(q))
        return false;
      return true;
    });
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "name_asc":
          return a.company_name.localeCompare(b.company_name);
        case "name_desc":
          return b.company_name.localeCompare(a.company_name);
        case "score_desc":
          return (computeFactorialTotal(b) ?? -1) - (computeFactorialTotal(a) ?? -1);
        case "created_desc":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [scopedLeads, query, typeFilter, sortKey]);

  const moveLeadInQualificationKanban = async (lead: LeadRow, next: LeadStatus) => {
    if (next === lead.status && !(next === "approved" && !lead.promoted_partner_id)) return;
    try {
      if (next !== lead.status) await leadsStore.updateLead(lead.id, { status: next });
      if (next !== "approved" || lead.promoted_partner_id) return;
      // Approved on the kanban — open the promotion dialog instead of using
      // the native confirm so the user can review owner + partner type.
      setPromoteLead({ ...lead, status: "approved" });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const toggleKanbanLeadSelected = useCallback((leadId: string) => {
    setKanbanSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(leadId)) next.delete(leadId);
      else next.add(leadId);
      return next;
    });
  }, []);

  const clearKanbanSelection = useCallback(() => {
    setKanbanSelectedIds(new Set());
    setKanbanBulkSelectKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (view !== "kanban") {
      setKanbanSelectedIds(new Set());
      setKanbanBulkSelectKey((k) => k + 1);
    }
  }, [view]);

  const bulkUpdateLeadStatus = async (ids: string[], status: LeadStatus) => {
    try {
      await Promise.all(ids.map((id) => leadsStore.updateLead(id, { status })));
      toast.success(`Updated ${ids.length} lead${ids.length === 1 ? "" : "s"}`);
      clearKanbanSelection();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const bulkRejectLeads = async (ids: string[]) => {
    const reason = "Bulk reject — qualification";
    try {
      for (const id of ids) {
        const lead = leadsStore.leads.find((l) => l.id === id);
        if (lead) await leadsStore.rejectLead(lead, reason);
      }
      toast.success(`Rejected ${ids.length} lead${ids.length === 1 ? "" : "s"}`);
      clearKanbanSelection();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const bulkDeleteLeads = async (ids: string[]) => {
    try {
      await Promise.all(ids.map((id) => leadsStore.deleteLead(id)));
      toast.success(`Deleted ${ids.length} lead${ids.length === 1 ? "" : "s"}`);
      if (activeId && ids.includes(activeId)) setActiveId(null);
      clearKanbanSelection();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (loading || !user) {
    return (
      <div className="page-shell space-y-4">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-12 w-full max-w-xl rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
        <div className="min-w-0 sm:flex-1">
          <p className="page-eyebrow">{COPY.qualification.eyebrow}</p>
          <h1 className="page-title">{COPY.qualification.title}</h1>
          <p className="page-subtitle mx-auto max-w-2xl sm:mx-0">{COPY.qualification.intro}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowNew(true)}
          className="inline-flex min-h-11 shrink-0 items-center justify-center self-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground glow-ring sm:self-auto"
        >
          {COPY.qualification.addLeadCta}
        </button>
      </div>

      <div className="mt-4">
        <KeptWorkspaceRibbon variant="keepsContext" />
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {LEAD_STATUSES.map((s) => (
          <Kpi key={s.key} label={s.label} value={String(counts[s.key])} />
        ))}
      </div>

      {/* Lead Tasks · Next moves */}
      <LeadTasksSection
        tasks={leadTasks.tasks}
        loading={leadTasks.loading}
        onComplete={async (id) => {
          try {
            await leadTasks.completeTask(id);
            toast.success("Task done");
          } catch (e) {
            toast.error((e as Error).message);
          }
        }}
        onOpenLead={(leadId) => setActiveId(leadId)}
      />

      {/* Filter bar */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap">
        {leadsStore.isLeadership && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-border/60 bg-surface/60 p-1 text-sm">
              {(["mine", "all"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setScope(f)}
                  className={`px-3 py-1.5 rounded-md transition ${scope === f ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {f === "mine" ? "My leads" : "All leads"}
                </button>
              ))}
            </div>
            {scope === "all" && ownersInScope.length > 1 && (
              <select
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
                className="rounded-lg border border-border/60 bg-surface/60 px-3 py-2 text-sm"
                title="Filter by PDM"
              >
                <option value="all">PDM: All ({ownersInScope.length})</option>
                {ownersInScope.map((o) => (
                  <option key={o.id} value={o.id}>
                    PDM: {o.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search leads…"
          className="rounded-lg border border-border/60 bg-surface/60 px-3 py-2 text-sm w-full sm:w-56"
        />
        <div className="inline-flex rounded-lg border border-border/60 bg-surface/60 p-1 text-xs">
          <button
            onClick={() => setTypeFilter("all")}
            className={`px-2.5 py-1.5 rounded-md transition ${typeFilter === "all" ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            All types
          </button>
          {PARTNER_TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => setTypeFilter(t.key)}
              className={`px-2.5 py-1.5 rounded-md transition ${typeFilter === t.key ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              style={typeFilter === t.key ? { color: `var(--${t.color})` } : {}}
            >
              {t.label}
            </button>
          ))}
        </div>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as LeadSortKey)}
          className="rounded-lg border border-border/60 bg-surface/60 px-3 py-2 text-xs"
        >
          {LEAD_SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              Sort: {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6">
        {leadsStore.loading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        ) : leadsStore.leads.length === 0 ? (
          <EmptyState onAdd={() => setShowNew(true)} />
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <div className="seg-candy">
                <button
                  onClick={() => setView("kanban")}
                  className="seg-candy-item"
                  data-active={view === "kanban"}
                >
                  Kanban
                </button>
                <button
                  onClick={() => setView("list")}
                  className="seg-candy-item"
                  data-active={view === "list"}
                >
                  List
                </button>
              </div>
              <span className="text-xs text-muted-foreground">
                {visibleLeads.length} lead{visibleLeads.length === 1 ? "" : "s"}
              </span>
            </div>
            {view === "list" ? (
              <CandyDataTable
                rows={visibleLeads}
                rowKey={(l) => l.id}
                ariaLabel="Leads"
                onRowClick={(l) => setActiveId(l.id)}
                selectable
                empty={<>No leads match the filters.</>}
                bulkActions={[
                  {
                    label: "Export CSV",
                    variant: "primary",
                    onClick: (ids) => {
                      const rows = visibleLeads
                        .filter((l) => ids.includes(l.id))
                        .map((l) => {
                          const total = computeFactorialTotal(l);
                          const verdict = factorialVerdict(total);
                          return {
                            company: l.company_name,
                            contact: l.contact_person ?? "",
                            type: l.partner_type ?? "",
                            score: total !== null ? `${total}/${SCORECARD_MAX_TOTAL}` : "",
                            verdict: verdict?.label ?? "",
                            status:
                              LEAD_STATUSES.find((s) => s.key === l.status)?.label ?? l.status,
                            next_step: l.next_step_at ?? "",
                            pdm: ownerNames.get(l.owner_id) ?? "",
                          };
                        });
                      downloadCsv(`${slugifyForFile("leads-selection")}.csv`, rows);
                    },
                  },
                  {
                    label: "Mark: New",
                    onClick: (ids) => void bulkUpdateLeadStatus(ids, "new"),
                  },
                  {
                    label: "Mark: In review",
                    onClick: (ids) => void bulkUpdateLeadStatus(ids, "in_review"),
                  },
                  {
                    label: "Mark: Approved",
                    onClick: (ids) => void bulkUpdateLeadStatus(ids, "approved"),
                  },
                  {
                    label: "Mark: Rejected",
                    variant: "danger",
                    onClick: async (ids) => {
                      const ok = await confirmDialog({
                        title: `Reject ${ids.length} lead${ids.length === 1 ? "" : "s"}?`,
                        description:
                          "They will move to Rejected with a shared reason. You can still open each lead for detail.",
                        actionLabel: "Reject all",
                      });
                      if (!ok) return;
                      void bulkRejectLeads(ids);
                    },
                  },
                  {
                    label: "Delete",
                    variant: "danger",
                    onClick: async (ids) => {
                      const ok = await confirmDialog({
                        title: `Delete ${ids.length} lead${ids.length === 1 ? "" : "s"}?`,
                        description: "This cannot be undone.",
                        actionLabel: "Delete",
                      });
                      if (!ok) return;
                      void bulkDeleteLeads(ids);
                    },
                  },
                ]}
                columns={[
                  {
                    key: "company",
                    header: "Lead",
                    width: "minmax(220px,2fr)",
                    cell: (l) => (
                      <div className="flex items-center gap-3 min-w-0">
                        <CandyAvatar name={l.company_name} size={32} />
                        <div className="min-w-0">
                          <div className="font-medium text-foreground truncate">
                            {l.company_name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {l.contact_person ?? "—"}
                          </div>
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "type",
                    header: "Type",
                    width: "120px",
                    cell: (l) =>
                      l.partner_type ? (
                        <PartnerTypeChip type={l.partner_type} />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      ),
                  },
                  {
                    key: "score",
                    header: COPY.ipp.short,
                    width: "150px",
                    cell: (l) => {
                      const total = computeFactorialTotal(l);
                      const verdict = factorialVerdict(total);
                      if (!verdict || total === null)
                        return <span className="text-xs text-muted-foreground">Not scored</span>;
                      const tone =
                        verdict.tone === "green"
                          ? "success"
                          : verdict.tone === "yellow"
                            ? "warning"
                            : "danger";
                      return (
                        <StatusPill tone={tone}>
                          {total}/{SCORECARD_MAX_TOTAL} · {verdict.label}
                        </StatusPill>
                      );
                    },
                  },
                  {
                    key: "status",
                    header: "Status",
                    width: "120px",
                    cell: (l) => {
                      const stLabel =
                        LEAD_STATUSES.find((s) => s.key === l.status)?.label ?? l.status;
                      const tone =
                        l.status === "approved"
                          ? "success"
                          : l.status === "rejected"
                            ? "danger"
                            : l.status === "in_review"
                              ? "warning"
                              : "info";
                      return <StatusPill tone={tone}>{stLabel}</StatusPill>;
                    },
                  },
                  {
                    key: "next",
                    header: "Next step",
                    width: "120px",
                    cell: (l) => (
                      <span className="text-xs text-muted-foreground">{l.next_step_at ?? "—"}</span>
                    ),
                  },
                  ...(leadsStore.isLeadership
                    ? [
                        {
                          key: "pdm",
                          header: "PDM",
                          width: "140px",
                          cell: (l: LeadRow) => (
                            <span className="text-xs">{ownerNames.get(l.owner_id) ?? "—"}</span>
                          ),
                        } as CandyColumn<LeadRow>,
                      ]
                    : []),
                  {
                    key: "actions",
                    header: "Action",
                    width: "140px",
                    align: "right",
                    cell: (l) =>
                      l.promoted_partner_id ? (
                        <Link
                          to="/partner/$partnerId"
                          params={{ partnerId: l.promoted_partner_id }}
                          className="text-xs underline text-muted-foreground hover:text-foreground"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Open
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      ),
                    hoverCell: (l) =>
                      !l.promoted_partner_id && l.status !== "rejected" ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            promoteLeadToPartner(l);
                          }}
                          className="rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-3 py-1 text-[11px] font-semibold transition"
                        >
                          Promote →
                        </button>
                      ) : l.promoted_partner_id ? (
                        <Link
                          to="/partner/$partnerId"
                          params={{ partnerId: l.promoted_partner_id }}
                          className="rounded-full bg-muted hover:bg-muted/70 px-3 py-1 text-[11px] font-medium transition"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Open
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      ),
                  },
                ]}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {LEAD_STATUSES.map((col) => {
                    const items = visibleLeads.filter((l) => l.status === col.key);
                    const accent =
                      col.key === "new"
                        ? "border-sky-500/25"
                        : col.key === "in_review"
                          ? "border-amber-500/30"
                          : col.key === "approved"
                            ? "border-emerald-500/25"
                            : "border-rose-500/25";
                    return (
                      <div
                        key={col.key}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const leadId = e.dataTransfer.getData("text/plain");
                          const lead = leadsStore.leads.find((l) => l.id === leadId);
                          if (lead) void moveLeadInQualificationKanban(lead, col.key);
                        }}
                        className={cn(
                          "flex min-h-[220px] flex-col rounded-2xl border border-border/50 bg-gradient-to-b from-card to-surface/25 p-4 shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.04]",
                          accent,
                        )}
                      >
                        <div className="mb-3 flex items-center justify-between gap-2 border-b border-border/40 pb-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-foreground">{col.label}</div>
                            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                              Drop cards here
                            </div>
                          </div>
                          <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-foreground">
                            {items.length}
                          </span>
                        </div>
                        <div className="flex min-h-0 flex-1 flex-col gap-2.5">
                          {items.map((lead) => (
                            <LeadCard
                              key={lead.id}
                              lead={lead}
                              selected={kanbanSelectedIds.has(lead.id)}
                              onToggleSelect={() => toggleKanbanLeadSelected(lead.id)}
                              onClick={() => setActiveId(lead.id)}
                              onPromote={() => promoteLeadToPartner(lead)}
                              isLeadership={leadsStore.isLeadership}
                              ownerName={ownerNames.get(lead.owner_id) ?? null}
                              pdms={pdmRoster.pdms}
                              canReassign={leadsStore.isLeadership || lead.owner_id === user.id}
                              onReassign={(newOwnerId, name) =>
                                reassignLead(lead.id, newOwnerId, name)
                              }
                              onDelete={async () => {
                                const ok = await confirmDialog({
                                  title: `Delete lead "${lead.company_name}"?`,
                                  description: "This action cannot be undone.",
                                  actionLabel: "Delete",
                                });
                                if (!ok) return;
                                try {
                                  await leadsStore.deleteLead(lead.id);
                                  toast.success("Lead deleted");
                                  setKanbanSelectedIds((prev) => {
                                    const n = new Set(prev);
                                    n.delete(lead.id);
                                    return n;
                                  });
                                  if (activeId === lead.id) setActiveId(null);
                                } catch (e) {
                                  toast.error((e as Error).message);
                                }
                              }}
                            />
                          ))}
                          {items.length === 0 && (
                            <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-surface/20 px-3 py-8 text-center text-xs text-muted-foreground">
                              No leads in this stage
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {kanbanSelectedIds.size > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 24 }}
                      transition={{ type: "spring", stiffness: 320, damping: 28 }}
                      className="fixed left-1/2 z-40 w-[min(100vw-1.5rem,520px)] -translate-x-1/2"
                      style={{
                        bottom: "calc(env(safe-area-inset-bottom, 0px) + 116px)",
                      }}
                    >
                      <div
                        className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-card/95 p-3 shadow-xl backdrop-blur-md sm:flex-row sm:flex-wrap sm:items-center sm:justify-center"
                        style={{
                          boxShadow:
                            "0 18px 40px -16px color-mix(in oklab, var(--primary) 50%, transparent)",
                        }}
                      >
                        <span className="px-1 text-center text-xs font-medium text-foreground sm:text-left">
                          {kanbanSelectedIds.size} selected
                        </span>
                        <span className="hidden h-4 w-px bg-border/70 sm:block" />
                        <select
                          key={kanbanBulkSelectKey}
                          defaultValue=""
                          className="min-h-11 w-full rounded-xl border border-border/60 bg-surface/80 px-3 py-2 text-xs font-medium sm:min-w-[160px] sm:flex-1"
                          aria-label="Move selected leads to stage"
                          onChange={(e) => {
                            const v = e.target.value as LeadStatus | "";
                            setKanbanBulkSelectKey((k) => k + 1);
                            void (async () => {
                              if (!v) return;
                              const ids = Array.from(kanbanSelectedIds);
                              if (ids.length === 0) return;
                              if (v === "rejected") {
                                const ok = await confirmDialog({
                                  title: `Reject ${ids.length} lead${ids.length === 1 ? "" : "s"}?`,
                                  description:
                                    "They will move to Rejected with a shared bulk reason.",
                                  actionLabel: "Reject all",
                                });
                                if (ok) void bulkRejectLeads(ids);
                                return;
                              }
                              void bulkUpdateLeadStatus(ids, v);
                            })();
                          }}
                        >
                          <option value="" disabled>
                            Move to stage…
                          </option>
                          {LEAD_STATUSES.map((s) => (
                            <option key={s.key} value={s.key}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="min-h-11 w-full rounded-xl bg-destructive/15 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/25 sm:w-auto"
                          onClick={() => {
                            void (async () => {
                              const ids = Array.from(kanbanSelectedIds);
                              const ok = await confirmDialog({
                                title: `Delete ${ids.length} lead${ids.length === 1 ? "" : "s"}?`,
                                description: "This cannot be undone.",
                                actionLabel: "Delete",
                              });
                              if (!ok) return;
                              void bulkDeleteLeads(ids);
                            })();
                          }}
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          className="min-h-11 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                          onClick={clearKanbanSelection}
                        >
                          Clear
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </>
        )}
      </div>

      {showNew && (
        <NewLeadDialog
          onClose={() => setShowNew(false)}
          onCreate={async (input) => {
            try {
              const lead = await leadsStore.createLead(input);
              toast.success(`${lead.company_name} added`);
              setShowNew(false);
              setActiveId(lead.id);
            } catch (e) {
              toast.error((e as Error).message);
            }
          }}
        />
      )}

      {active && (
        <LeadDetailPanel
          lead={active}
          onClose={() => setActiveId(null)}
          onUpdate={(patch) => leadsStore.updateLead(active.id, patch)}
          onSetDimension={(key, v) => leadsStore.setDimension(active, key, v)}
          onUpdateNotes={(text) => leadsStore.updateFreeNotes(active, text)}
          onPromote={() => promoteLeadToPartner(active)}
          isLeadership={leadsStore.isLeadership}
          ownerName={ownerNames.get(active.owner_id) ?? null}
          pdms={pdmRoster.pdms}
          canReassign={leadsStore.isLeadership || active.owner_id === user.id}
          onReassign={(newOwnerId, name) => reassignLead(active.id, newOwnerId, name)}
          onReject={async (reason) => {
            try {
              await leadsStore.rejectLead(active, reason);
              toast.success(`${active.company_name} rejected`);
            } catch (e) {
              toast.error((e as Error).message);
            }
          }}
          onDelete={async () => {
            await leadsStore.deleteLead(active.id);
            toast.success("Lead deleted");
            setActiveId(null);
          }}
        />
      )}

      {promoteLead && (
        <PromoteLeadDialog
          open
          companyName={promoteLead.company_name}
          defaultType={promoteLead.partner_type}
          ownerName={ownerNames.get(promoteLead.owner_id) ?? "current owner"}
          busy={promoteBusy}
          onClose={() => {
            if (!promoteBusy) setPromoteLead(null);
          }}
          onConfirm={async ({ partner_type }) => {
            setPromoteBusy(true);
            try {
              const partnerId = await leadsStore.promoteLead(promoteLead, { partner_type });
              toast.success(`${promoteLead.company_name} added to portfolio`);
              setPromoteLead(null);
              setActiveId(null);
              nav({ to: "/partner/$partnerId", params: { partnerId } });
            } catch (e) {
              toast.error((e as Error).message);
            } finally {
              setPromoteBusy(false);
            }
          }}
        />
      )}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card border border-border/60 p-4 card-elev">
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-2xl font-display font-semibold">{value}</div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/60 bg-surface/40 p-10 text-center">
      <h2 className="text-lg font-semibold">No leads yet</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
        Add your first partner lead to start scoring against the {COPY.ipp.full}.
      </p>
      <button
        onClick={onAdd}
        className="mt-5 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-ring"
      >
        + Add your first lead
      </button>
    </div>
  );
}

function LeadCard({
  lead,
  onClick,
  onDelete,
  onPromote,
  isLeadership,
  ownerName,
  pdms,
  onReassign,
  canReassign,
  selected,
  onToggleSelect,
}: {
  lead: LeadRow;
  onClick: () => void;
  onDelete: () => void;
  onPromote: () => void;
  isLeadership?: boolean;
  ownerName?: string | null;
  pdms?: PdmEntry[];
  onReassign?: (newOwnerId: string, newOwnerName: string) => void | Promise<void>;
  canReassign?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const total = computeFactorialTotal(lead);
  const verdict = factorialVerdict(total);
  const host = (() => {
    try {
      return lead.website ? new URL(lead.website).host : null;
    } catch {
      return lead.website;
    }
  })();
  const { activities } = useLeadActivities(lead.id, lead.owner_id);
  const summary = activitySummary(activities);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", lead.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={onClick}
      className={cn(
        "cursor-grab rounded-xl border border-border/50 bg-card/90 p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing card-elev",
        selected && "ring-2 ring-primary/55 ring-offset-2 ring-offset-card",
      )}
    >
      <div className="flex items-start gap-2">
        {onToggleSelect && (
          <button
            type="button"
            role="checkbox"
            aria-checked={selected ?? false}
            aria-label={selected ? "Remove lead from selection" : "Select lead for bulk actions"}
            className={cn(
              "mt-0.5 flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-xl border text-sm font-semibold transition",
              selected
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border/60 bg-surface/80 text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect();
            }}
          >
            {selected ? <Check className="h-4 w-4" strokeWidth={3} /> : null}
          </button>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="font-semibold leading-snug text-foreground">{lead.company_name}</div>
              <div className="mt-0.5 truncate text-xs text-muted-foreground">
                {lead.contact_person ?? "—"}
                {host ? ` · ${host}` : ""}
              </div>
              {lead.partner_type && (
                <div className="mt-1.5">
                  <PartnerTypeChip type={lead.partner_type} />
                </div>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Delete lead"
              aria-label="Delete lead"
              className="min-h-9 min-w-9 shrink-0 rounded-lg text-sm leading-none text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
            >
              ✕
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            {verdict && total !== null ? (
              <span
                className={cn(
                  "inline-flex items-center rounded-md border px-2 py-1 text-[10px] font-mono uppercase tracking-widest",
                  toneClass(verdict.tone),
                )}
              >
                {total}/{SCORECARD_MAX_TOTAL} · {verdict.label}
              </span>
            ) : (
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Not scored
              </span>
            )}
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Drag to move
            </span>
          </div>
          {(summary.openTasks > 0 || lead.next_step_at) && (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
              {summary.openTasks > 0 ? (
                <span className={summary.overdue > 0 ? "text-red-400" : ""}>
                  {summary.openTasks} open ·{" "}
                  {summary.overdue > 0 ? `${summary.overdue} overdue` : "on track"}
                </span>
              ) : (
                <span />
              )}
              {lead.next_step_at && <span>next: {lead.next_step_at}</span>}
            </div>
          )}
          {(canReassign ?? isLeadership) && (
            <div className="mt-2" onClick={(e) => e.stopPropagation()}>
              <LeadOwnerChip
                currentName={ownerName ?? "Unassigned"}
                currentOwnerId={lead.owner_id}
                pdms={pdms ?? []}
                onReassign={onReassign}
              />
            </div>
          )}
          {!lead.promoted_partner_id && lead.status !== "rejected" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPromote();
              }}
              className="mt-2 min-h-11 w-full rounded-lg bg-emerald-500/15 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/25 dark:text-emerald-400"
            >
              Promote to Partner →
            </button>
          )}
          {lead.promoted_partner_id && (
            <Link
              to="/partner/$partnerId"
              params={{ partnerId: lead.promoted_partner_id }}
              onClick={(e) => e.stopPropagation()}
              className="mt-2 block min-h-11 w-full rounded-lg border border-border/60 bg-surface py-2.5 text-center text-sm font-semibold text-muted-foreground transition hover:text-foreground"
            >
              Open partner →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function toneClass(tone: "red" | "yellow" | "green") {
  switch (tone) {
    case "red":
      return "border-red-600/35 bg-red-100 text-red-950 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-100";
    case "yellow":
      return "border-amber-600/40 bg-amber-100 text-amber-950 dark:border-amber-400/45 dark:bg-amber-950/55 dark:text-amber-50";
    case "green":
      return "border-emerald-600/35 bg-emerald-100 text-emerald-950 dark:border-emerald-500/35 dark:bg-emerald-950/40 dark:text-emerald-100";
  }
}

function NewLeadDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (input: {
    company_name: string;
    contact_person?: string;
    website?: string;
    partner_type?: PartnerType;
    firstTask?: { title: string; due_date?: string | null } | null;
  }) => Promise<void>;
}) {
  const [companyName, setCompanyName] = useState("");
  const [contact, setContact] = useState("");
  const [website, setWebsite] = useState("");
  const [partnerType, setPartnerType] = useState<PartnerType>("referral");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
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
        <h2 className="text-xl font-semibold">New partner lead</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Capture the basics. Then score the five dimensions next.
        </p>

        <div className="mt-5 space-y-3">
          <Field label="Company name *">
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="input"
              placeholder="e.g. Northwind Cloud"
              autoFocus
            />
          </Field>
          <Field label="Contact person">
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="input"
              placeholder="Full name"
            />
          </Field>
          <Field label="Website">
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="input"
              placeholder="https://…"
            />
          </Field>
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
          <div className="rounded-lg border border-border/60 bg-surface/30 p-3">
            <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
              First next step (optional)
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g. Send intro email, schedule discovery call…"
                className="input text-sm"
              />
              <input
                type="date"
                value={taskDue}
                onChange={(e) => setTaskDue(e.target.value)}
                className="input text-xs w-36"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Attach a task so the lead never sits idle. You can always add more later.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm hover:bg-surface-2"
          >
            Cancel
          </button>
          <button
            disabled={!companyName.trim() || busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onCreate({
                  company_name: companyName.trim(),
                  contact_person: contact.trim() || undefined,
                  website: website.trim() || undefined,
                  partner_type: partnerType,
                  firstTask: taskTitle.trim()
                    ? { title: taskTitle.trim(), due_date: taskDue || null }
                    : null,
                });
              } finally {
                setBusy(false);
              }
            }}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-ring disabled:opacity-40"
          >
            {busy ? "Creating…" : "Create lead"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LeadDetailPanel({
  lead,
  onClose,
  onUpdate,
  onSetDimension,
  onUpdateNotes,
  onReject,
  onDelete,
  onPromote,
  isLeadership,
  ownerName,
  pdms,
  onReassign,
  canReassign,
}: {
  lead: LeadRow;
  onClose: () => void;
  onUpdate: (patch: Partial<LeadRow>) => Promise<void>;
  onSetDimension: (key: DimensionKey, v: ScoreLevel) => Promise<void>;
  onUpdateNotes: (text: string) => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onPromote: () => void;
  isLeadership?: boolean;
  ownerName?: string | null;
  pdms?: PdmEntry[];
  onReassign?: (newOwnerId: string, newOwnerName: string) => void | Promise<void>;
  canReassign?: boolean;
}) {
  const confirmDialog = useConfirmDialog();
  const { meta, freeText } = parseScorecard(lead.notes);
  const [notes, setNotes] = useState(freeText);
  const [showReject, setShowReject] = useState(false);
  const [tab, setTab] = useState<"scorecard" | "crm">("scorecard");
  useEffect(() => {
    setNotes(freeText);
  }, [lead.id, freeText]);

  const total = computeFactorialTotal(lead);
  const verdict = factorialVerdict(total);
  const canPromote =
    !lead.promoted_partner_id && lead.status !== "rejected" && verdict?.tone !== "red";

  const handlePipelineStatusChange = async (next: LeadStatus) => {
    if (next === lead.status) return;
    if (next === "rejected") {
      setShowReject(true);
      return;
    }
    if (next === "approved" && !lead.promoted_partner_id) {
      try {
        await onUpdate({ status: "approved" });
        onPromote();
      } catch (e) {
        toast.error((e as Error).message);
      }
      return;
    }
    try {
      await onUpdate({ status: next });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleSetDimension = async (key: DimensionKey, v: ScoreLevel) => {
    try {
      await onSetDimension(key, v);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-background/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-panel-title"
        className="flex h-[100dvh] w-full max-w-full flex-col border-l border-border/60 bg-card shadow-2xl md:max-w-lg lg:max-w-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="shrink-0 border-b border-border/60 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                Lead
              </p>
              <h2 id="lead-panel-title" className="truncate text-xl font-semibold text-foreground">
                {lead.company_name}
              </h2>
              <div className="mt-1 text-xs text-muted-foreground">
                {lead.contact_person ?? "No contact"}
                {lead.website ? (
                  <>
                    {" "}
                    ·{" "}
                    <a className="underline" href={lead.website} target="_blank" rel="noreferrer">
                      {lead.website}
                    </a>
                  </>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 shrink-0 rounded-lg px-3 text-sm text-muted-foreground hover:bg-surface-2 hover:text-foreground"
            >
              Close
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 sm:px-6 sm:py-5 [scrollbar-gutter:stable]">
          <div className="space-y-4">
            <div>
              <Field label="Pipeline status">
                <select
                  value={lead.status}
                  onChange={(e) => void handlePipelineStatusChange(e.target.value as LeadStatus)}
                  className="input w-full min-h-11 touch-manipulation"
                  aria-label="Edit qualification pipeline status"
                >
                  {LEAD_STATUSES.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </Field>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Choosing Approved opens promote to partner when this lead is not in the portfolio yet.
                Choosing Rejected asks for a reason next.
              </p>
            </div>

            {lead.promoted_partner_id && (
              <span className="inline-flex rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                Promoted to partner
              </span>
            )}
            {meta.rejection_reason && lead.status === "rejected" && (
              <span className="inline-flex rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-red-700 dark:text-red-400">
                Reason: {meta.rejection_reason}
              </span>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                Type
              </span>
              <select
                value={lead.partner_type ?? ""}
                onChange={(e) => {
                  const v = e.target.value as PartnerType | "";
                  void onUpdate({ partner_type: v ? v : null });
                }}
                className="min-h-11 rounded-md border border-border/60 bg-surface px-2 py-2 text-xs touch-manipulation"
              >
                <option value="">Not set</option>
                {PARTNER_TYPES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
              {lead.partner_type && <PartnerTypeChip type={lead.partner_type} />}
            </div>

            {(canReassign ?? isLeadership) && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                  PDM
                </span>
                <LeadOwnerChip
                  currentName={ownerName ?? "Unassigned"}
                  currentOwnerId={lead.owner_id}
                  pdms={pdms ?? []}
                  onReassign={onReassign}
                />
              </div>
            )}

            {lead.status !== "rejected" && (
              <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-surface/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-foreground">
                    {lead.promoted_partner_id
                      ? "Already in your portfolio"
                      : "Ready to add to portfolio?"}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {lead.promoted_partner_id
                      ? "This lead has been promoted to a partner."
                      : verdict?.tone === "red"
                        ? "Score the lead first. The current verdict is too low to promote."
                        : "Creates the partner record and opens the workspace."}
                  </div>
                </div>
                {lead.promoted_partner_id ? (
                  <Link
                    to="/partner/$partnerId"
                    params={{ partnerId: lead.promoted_partner_id }}
                    className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-border bg-surface px-4 text-sm font-semibold hover:bg-surface-2"
                  >
                    Open partner →
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={onPromote}
                    disabled={!canPromote}
                    className="min-h-11 shrink-0 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground glow-ring disabled:opacity-40"
                  >
                    Promote to Partner →
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 inline-flex rounded-lg border border-border/60 bg-surface/60 p-1 text-xs">
            <button
              type="button"
              onClick={() => setTab("scorecard")}
              className={`min-h-10 rounded-md px-3 py-2 transition touch-manipulation ${tab === "scorecard" ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Scorecard
            </button>
            <button
              type="button"
              onClick={() => setTab("crm")}
              className={`min-h-10 rounded-md px-3 py-2 transition touch-manipulation ${tab === "crm" ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              CRM & Activities
            </button>
          </div>

          {tab === "crm" ? (
            <CrmTab lead={lead} onUpdate={onUpdate} />
          ) : (
            <>
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-foreground">Alliara 5-dimension scorecard</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Rate each dimension from 1 (weakest) to 5 (strongest). Total ranges from 5 to{" "}
                  {SCORECARD_MAX_TOTAL}.
                </p>

                <div className="mt-4 space-y-6">
                  {FACTORIAL_DIMENSIONS.map((d, idx) => {
                    const value = getDimensionValue(lead, d.key);
                    const selectedHelp = d.options.find((o) => o.v === value)?.help ?? null;
                    return (
                      <div key={d.key} className="rounded-xl border border-border/50 bg-surface/20 p-3 sm:p-4">
                        <div className="text-sm font-medium text-foreground">
                          <span className="mr-2 font-mono text-muted-foreground">{idx + 1}.</span>
                          {d.label}
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">{d.description}</div>
                        <div className="mt-3 flex flex-col gap-2 sm:grid sm:grid-cols-5 sm:gap-2.5">
                          {d.options.map((opt) => (
                            <button
                              key={opt.v}
                              type="button"
                              title={opt.help}
                              onClick={() => void handleSetDimension(d.key, opt.v)}
                              className={cn(
                                "flex min-h-14 w-full touch-manipulation select-none items-center justify-center rounded-xl border px-2 text-base font-semibold transition sm:min-h-[52px] sm:text-sm",
                                value === opt.v
                                  ? "border-primary bg-primary/15 text-foreground ring-2 ring-primary/35"
                                  : "border-border/60 bg-background/80 text-muted-foreground hover:border-border hover:bg-surface hover:text-foreground",
                              )}
                              style={{ WebkitTapHighlightColor: "transparent" }}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        {selectedHelp && (
                          <div className="mt-2 text-[11px] leading-snug text-muted-foreground italic">
                            → {selectedHelp}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6">
                {verdict && total !== null ? (
                  <div className={`rounded-xl border p-4 ${bannerClass(verdict.tone)}`}>
                    <div className="text-sm font-semibold leading-snug">{verdict.label} · Score {total}/{SCORECARD_MAX_TOTAL}</div>
                    <div className="verdict-sub mt-2 text-xs leading-relaxed">{verdict.message}</div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border/60 bg-surface/40 p-4 text-xs text-muted-foreground">
                    Score all 5 dimensions to see the fit recommendation.
                  </div>
                )}
              </div>

              <div className="mt-6">
                <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                  Notes
                </span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={() => {
                    if ((freeText ?? "") !== notes) void onUpdateNotes(notes);
                  }}
                  className="input mt-1 min-h-[100px]"
                  placeholder="Context, source of the lead, key conversation points…"
                />
              </div>
            </>
          )}
        </div>

        <footer className="shrink-0 border-t border-border/60 bg-card/95 px-4 py-4 backdrop-blur-sm sm:px-6 sm:py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => {
                void (async () => {
                  const ok = await confirmDialog({
                    title: "Delete this lead?",
                    description: "This action cannot be undone.",
                    actionLabel: "Delete",
                  });
                  if (ok) await onDelete();
                })();
              }}
              className="min-h-11 text-left text-sm text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300"
            >
              Delete lead
            </button>
            <button
              type="button"
              onClick={() => setShowReject(true)}
              disabled={lead.status === "rejected"}
              className="min-h-11 rounded-lg border border-border bg-surface px-4 text-sm font-medium hover:bg-surface-2 disabled:opacity-40"
            >
              Reject lead
            </button>
          </div>
        </footer>

        {showReject && (
          <RejectReasonDialog
            onClose={() => setShowReject(false)}
            onConfirm={async (reason) => {
              await onReject(reason);
              setShowReject(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

const REJECT_REASONS = [
  "Below 20 employees",
  "Above 3000 employees",
  "Competitor overlap",
  "No sales capacity",
  "No delivery muscle",
  "Misaligned ICP",
  "Other",
] as const;

function RejectReasonDialog({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [preset, setPreset] = useState<string>(REJECT_REASONS[0]);
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-card border border-border/60 p-6 card-elev"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold">Reject lead</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Pick the primary reason. It will be archived with the lead for context.
        </p>

        <div className="mt-4 space-y-3">
          <Field label="Rejection reason">
            <select value={preset} onChange={(e) => setPreset(e.target.value)} className="input">
              {REJECT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
          {preset === "Other" && (
            <Field label="Details">
              <input
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                className="input"
                placeholder="Short description"
                autoFocus
              />
            </Field>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm hover:bg-surface-2"
          >
            Cancel
          </button>
          <button
            disabled={busy || (preset === "Other" && !detail.trim())}
            onClick={async () => {
              setBusy(true);
              try {
                const reason = preset === "Other" ? detail.trim() : preset;
                await onConfirm(reason);
              } finally {
                setBusy(false);
              }
            }}
            className="rounded-lg bg-red-500/90 hover:bg-red-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            {busy ? "Rejecting…" : "Confirm reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

function bannerClass(tone: "red" | "yellow" | "green") {
  switch (tone) {
    case "red":
      return [
        "border-red-600/35 bg-red-100 text-red-950",
        "dark:border-red-500/35 dark:bg-red-950/45 dark:text-red-50",
        "[&_.verdict-sub]:text-red-900/90 dark:[&_.verdict-sub]:text-red-100/90",
      ].join(" ");
    case "yellow":
      return [
        "border-amber-700/40 bg-amber-100 text-amber-950",
        "dark:border-amber-400/50 dark:bg-amber-950/65 dark:text-amber-50",
        "[&_.verdict-sub]:text-amber-950/90 dark:[&_.verdict-sub]:text-amber-100/95",
      ].join(" ");
    case "green":
      return [
        "border-emerald-600/35 bg-emerald-100 text-emerald-950",
        "dark:border-emerald-500/35 dark:bg-emerald-950/45 dark:text-emerald-50",
        "[&_.verdict-sub]:text-emerald-900/90 dark:[&_.verdict-sub]:text-emerald-100/90",
      ].join(" ");
  }
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

/* ───────────────── CRM & Activities tab ───────────────── */

function CrmTab({
  lead,
  onUpdate,
}: {
  lead: LeadRow;
  onUpdate: (patch: Partial<LeadRow>) => Promise<void>;
}) {
  const confirmDialog = useConfirmDialog();
  const acts = useLeadActivities(lead.id, lead.owner_id);
  const summary = activitySummary(acts.activities);
  const lastActivity = acts.activities[0]?.created_at ?? null;

  return (
    <div className="mt-5 space-y-6">
      {/* Contact block */}
      <section>
        <h3 className="text-sm font-semibold">Contact</h3>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <InlineField
            label="Email"
            value={lead.contact_email ?? ""}
            placeholder="name@company.com"
            type="email"
            onSave={(v) => onUpdate({ contact_email: v || null })}
          />
          <InlineField
            label="Phone"
            value={lead.contact_phone ?? ""}
            placeholder="+34 …"
            onSave={(v) => onUpdate({ contact_phone: v || null })}
          />
          <InlineField
            label="Role"
            value={lead.contact_role ?? ""}
            placeholder="e.g. CEO, Head of HR"
            onSave={(v) => onUpdate({ contact_role: v || null })}
          />
          <InlineSelect
            label="Source"
            value={lead.source ?? ""}
            options={["", ...LEAD_SOURCES]}
            onSave={(v) => onUpdate({ source: v || null })}
          />
          <InlineField
            label="Next step"
            value={lead.next_step_at ?? ""}
            type="date"
            onSave={(v) => onUpdate({ next_step_at: v || null })}
          />
        </div>
      </section>

      {/* Activities */}
      <section>
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold">Activities</h3>
          <div className="text-[11px] text-muted-foreground">
            {summary.openTasks} open
            {summary.overdue > 0 && (
              <span className="text-red-400"> · {summary.overdue} overdue</span>
            )}
            {lastActivity && <> · last {new Date(lastActivity).toLocaleDateString()}</>}
          </div>
        </div>

        <NewActivityForm
          onCreate={(input) => acts.create(input).catch((e) => toast.error((e as Error).message))}
        />

        <div className="mt-4 space-y-2">
          {acts.loading ? (
            <div className="text-xs text-muted-foreground py-4 text-center">Loading…</div>
          ) : acts.activities.length === 0 ? (
            <div className="text-xs text-muted-foreground py-4 text-center">
              No activities yet. Log a call, plan a task, or jot a note.
            </div>
          ) : (
            acts.activities.map((a) => (
              <ActivityRow
                key={a.id}
                activity={a}
                onToggle={() => acts.toggleDone(a).catch((e) => toast.error((e as Error).message))}
                onDelete={() => {
                  void (async () => {
                    const ok = await confirmDialog({
                      title: "Delete this activity?",
                      actionLabel: "Delete",
                    });
                    if (!ok) return;
                    acts.remove(a.id).catch((e) => toast.error((e as Error).message));
                  })();
                }}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function InlineField({
  label,
  value,
  placeholder,
  type = "text",
  onSave,
}: {
  label: string;
  value: string;
  placeholder?: string;
  type?: string;
  onSave: (v: string) => Promise<void> | void;
}) {
  const [v, setV] = useState(value);
  useEffect(() => {
    setV(value);
  }, [value]);
  return (
    <label className="block">
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={v}
        placeholder={placeholder}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => {
          if (v !== value) void onSave(v);
        }}
        className="input mt-1 text-sm"
      />
    </label>
  );
}

function InlineSelect({
  label,
  value,
  options,
  onSave,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onSave: (v: string) => Promise<void> | void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => void onSave(e.target.value)}
        className="input mt-1 text-sm"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o || "—"}
          </option>
        ))}
      </select>
    </label>
  );
}

function NewActivityForm({
  onCreate,
}: {
  onCreate: (input: {
    kind: LeadActivityKind;
    title: string;
    description?: string;
    due_date?: string | null;
  }) => void;
}) {
  const [kind, setKind] = useState<LeadActivityKind>("task");
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [desc, setDesc] = useState("");

  const submit = () => {
    if (!title.trim()) return;
    onCreate({
      kind,
      title: title.trim(),
      description: desc.trim() || undefined,
      due_date: kind === "task" ? due || null : null,
    });
    setTitle("");
    setDesc("");
    setDue("");
  };

  return (
    <div className="mt-3 rounded-xl border border-border/60 bg-surface/40 p-3 space-y-2">
      <div className="flex gap-2">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as LeadActivityKind)}
          className="input text-xs flex-shrink-0 w-28"
        >
          {LEAD_ACTIVITY_KINDS.map((k) => (
            <option key={k.key} value={k.key}>
              {k.label}
            </option>
          ))}
        </select>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={
            kind === "task"
              ? "What needs to happen?"
              : kind === "note"
                ? "Quick note…"
                : `Log a ${kind}…`
          }
          className="input text-sm flex-1"
        />
        {kind === "task" && (
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="input text-xs w-36"
          />
        )}
      </div>
      <div className="flex gap-2">
        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Optional details"
          className="input text-xs flex-1"
        />
        <button
          onClick={submit}
          disabled={!title.trim()}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function ActivityRow({
  activity,
  onToggle,
  onDelete,
}: {
  activity: LeadActivityRow;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const meta = LEAD_ACTIVITY_KINDS.find((k) => k.key === activity.kind);
  const today = new Date().toISOString().slice(0, 10);
  const overdue =
    activity.kind === "task" && !activity.done && activity.due_date && activity.due_date < today;

  return (
    <div
      className={`rounded-lg border border-border/60 bg-card/60 p-3 flex items-start gap-3 ${activity.done ? "opacity-60" : ""}`}
    >
      {activity.kind === "task" ? (
        <input
          type="checkbox"
          checked={activity.done}
          onChange={onToggle}
          className="mt-1 h-4 w-4 accent-primary cursor-pointer"
        />
      ) : (
        <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-md bg-surface-2 text-xs">
          {meta?.icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm ${activity.done ? "line-through" : ""}`}>{activity.title}</span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            {meta?.label}
          </span>
          {activity.due_date && (
            <span className={`text-[10px] ${overdue ? "text-red-400" : "text-muted-foreground"}`}>
              {overdue ? "overdue · " : "due "}
              {activity.due_date}
            </span>
          )}
        </div>
        {activity.description && (
          <div className="text-xs text-muted-foreground mt-0.5">{activity.description}</div>
        )}
        <div className="text-[10px] text-muted-foreground mt-1">
          {new Date(activity.created_at).toLocaleString()}
        </div>
      </div>
      <button
        onClick={onDelete}
        title="Delete"
        className="text-muted-foreground hover:text-red-400 text-sm leading-none px-1.5 py-0.5 rounded-md hover:bg-red-500/10"
      >
        ✕
      </button>
    </div>
  );
}
/* ───────────────── Lead Tasks · Next moves ───────────────── */

function LeadTasksSection({
  tasks,
  loading,
  onComplete,
  onOpenLead,
}: {
  tasks: LeadTaskRow[];
  loading: boolean;
  onComplete: (id: string) => void | Promise<void>;
  onOpenLead: (leadId: string) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const overdue = tasks.filter((t) => t.due_date && t.due_date < today).length;
  const top = tasks.slice(0, 6);

  return (
    <section
      id="lead-tasks"
      className="mt-6 rounded-2xl border border-border/60 bg-card p-5 card-elev"
    >
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Lead Tasks · Next moves
          </p>
          <h2 className="mt-1 text-lg font-semibold">
            {tasks.length} open
            {overdue > 0 && (
              <span className="ml-2 text-sm font-mono text-red-400">· {overdue} overdue</span>
            )}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tasks attached to leads in the qualification pipeline. Sorted by due date.
          </p>
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="text-sm text-muted-foreground py-4 text-center">Loading tasks…</div>
        ) : top.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-surface/40 p-6 text-center text-sm text-muted-foreground">
            No open tasks on any lead. Add one inside a lead's CRM tab to keep things moving.
          </div>
        ) : (
          <ul className="space-y-2">
            {top.map((t) => {
              const isOverdue = !!(t.due_date && t.due_date < today);
              return (
                <li
                  key={t.id}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition cursor-pointer hover:bg-surface-2 ${
                    isOverdue ? "border-red-500/30 bg-red-500/5" : "border-border bg-surface"
                  }`}
                  onClick={() => onOpenLead(t.lead_id)}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void onComplete(t.id);
                    }}
                    title="Mark complete"
                    className="shrink-0 h-5 w-5 rounded border border-border bg-card hover:bg-primary hover:border-primary transition"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{t.title}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {t.lead_company}
                      {t.lead_status === "rejected" || t.lead_status === "approved"
                        ? ` · ${t.lead_status}`
                        : ""}
                    </div>
                  </div>
                  <span
                    className={`text-xs font-mono ${isOverdue ? "text-red-400 font-semibold" : "text-muted-foreground"}`}
                  >
                    {t.due_date ?? "no date"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        {tasks.length > top.length && (
          <p className="mt-3 text-[11px] text-center font-mono text-muted-foreground">
            +{tasks.length - top.length} more · open a lead to see all its tasks
          </p>
        )}
      </div>
    </section>
  );
}

function LeadOwnerChip({
  currentName,
  currentOwnerId,
  pdms,
  onReassign,
}: {
  currentName: string;
  currentOwnerId: string;
  pdms: PdmEntry[];
  onReassign?: (newOwnerId: string, newOwnerName: string) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  if (!onReassign || pdms.length === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-border/60 bg-surface/60 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--primary)]/70" />
        {currentName}
      </span>
    );
  }
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        title="Reassign to another PDM"
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-border/60 bg-surface/60 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-[color:var(--primary)]/60 transition"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--primary)]/70" />
        {currentName}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
            }}
          />
          <div
            className="absolute left-0 top-full mt-1 z-40 min-w-[12rem] rounded-lg border border-border bg-card p-1 shadow-lg"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Reassign to…
            </div>
            {pdms.map((p) => (
              <button
                key={p.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(false);
                  if (p.id !== currentOwnerId) void onReassign(p.id, p.name);
                }}
                className={`block w-full text-left px-3 py-1.5 text-sm rounded ${p.id === currentOwnerId ? "bg-surface-2 text-foreground" : "hover:bg-surface-2 text-muted-foreground hover:text-foreground"}`}
              >
                {p.name}
                {p.id === currentOwnerId ? " · current" : ""}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
