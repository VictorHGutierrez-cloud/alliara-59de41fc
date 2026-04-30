import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
  type LeadRow,
  type LeadStatus,
  type DimensionKey,
  type LeadActivityKind,
  type LeadActivityRow,
  type LeadTaskRow,
} from "@/lib/leads-store";
import { PARTNER_TYPES, type PartnerType, LEAD_SORTS, type LeadSortKey } from "@/lib/partner-types";
import { PartnerTypeChip } from "@/components/PartnerFilterBar";

export const Route = createFileRoute("/qualification")({
  head: () => ({ meta: [{ title: "Partner Qualification — OCTA OS" }] }),
  component: QualificationPage,
});

function QualificationPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const leadsStore = useLeads(user?.id);
  const [showNew, setShowNew] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<PartnerType | "all">("all");
  const [sortKey, setSortKey] = useState<LeadSortKey>("created_desc");
  const leadTasks = useAllLeadTasks(user?.id, leadsStore.leads);

  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [loading, user, nav]);

  const counts = useMemo(() => {
    const c: Record<LeadStatus, number> = { new: 0, in_review: 0, approved: 0, rejected: 0 };
    for (const l of leadsStore.leads) c[l.status]++;
    return c;
  }, [leadsStore.leads]);

  const active = leadsStore.leads.find((l) => l.id === activeId) ?? null;

  const promoteLeadToPartner = async (lead: LeadRow) => {
    if (lead.promoted_partner_id) {
      nav({ to: "/partner/$partnerId", params: { partnerId: lead.promoted_partner_id } });
      return;
    }
    if (!confirm(`Promote "${lead.company_name}" to your partner portfolio?`)) return;
    try {
      const partnerId = await leadsStore.promoteLead(lead);
      toast.success(`${lead.company_name} added to portfolio`);
      setActiveId(null);
      nav({ to: "/partner/$partnerId", params: { partnerId } });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  // Filter + sort the leads used by the Kanban
  const visibleLeads = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = leadsStore.leads.filter((l) => {
      if (typeFilter !== "all" && l.partner_type !== typeFilter) return false;
      if (q && !`${l.company_name} ${l.contact_person ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "name_asc": return a.company_name.localeCompare(b.company_name);
        case "name_desc": return b.company_name.localeCompare(a.company_name);
        case "score_desc": return (computeFactorialTotal(b) ?? -1) - (computeFactorialTotal(a) ?? -1);
        case "created_desc":
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [leadsStore.leads, query, typeFilter, sortKey]);

  const moveLeadInQualificationKanban = async (lead: LeadRow, next: LeadStatus) => {
    if (next === lead.status && !(next === "approved" && !lead.promoted_partner_id)) return;
    try {
      if (next !== lead.status) await leadsStore.updateLead(lead.id, { status: next });
      if (next !== "approved" || lead.promoted_partner_id) return;

      if (confirm("Create partner object? This will add this approved lead to your Portfolio as an Official Partner.")) {
        await leadsStore.promoteLead(lead);
        toast.success(`${lead.company_name} added to portfolio`);
      } else {
        toast.success(`${lead.company_name} approved in qualification`);
      }
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (loading || !user) return <div className="p-10 text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Qualification</p>
          <h1 className="text-3xl font-semibold mt-1">Partner Lead Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Score every lead on the Factorial 5-Dimension Scorecard before promoting them.
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-ring"
        >
          + New Partner Lead
        </button>
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
          try { await leadTasks.completeTask(id); toast.success("Task done"); }
          catch (e) { toast.error((e as Error).message); }
        }}
        onOpenLead={(leadId) => setActiveId(leadId)}
      />

      {/* Filter bar */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap">
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
            <option key={s.key} value={s.key}>Sort: {s.label}</option>
          ))}
        </select>
      </div>

      <div className="mt-6">
        {leadsStore.loading ? (
          <div className="text-sm text-muted-foreground py-10 text-center">Loading leads…</div>
        ) : leadsStore.leads.length === 0 ? (
          <EmptyState onAdd={() => setShowNew(true)} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {LEAD_STATUSES.map((col) => {
              const items = visibleLeads.filter((l) => l.status === col.key);
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
                  className="rounded-2xl bg-surface/40 border border-border/60 p-3 min-h-[200px]"
                >
                  <div className="flex items-center justify-between px-1 pb-2">
                    <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                      {col.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        onClick={() => setActiveId(lead.id)}
                        onPromote={() => promoteLeadToPartner(lead)}
                        onDelete={async () => {
                          if (!confirm(`Delete lead "${lead.company_name}"? This cannot be undone.`)) return;
                          try {
                            await leadsStore.deleteLead(lead.id);
                            toast.success("Lead deleted");
                            if (activeId === lead.id) setActiveId(null);
                          } catch (e) {
                            toast.error((e as Error).message);
                          }
                        }}
                      />
                    ))}
                    {items.length === 0 && (
                      <div className="text-xs text-muted-foreground text-center py-4">No leads</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card border border-border/60 p-4 card-elev">
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-display font-semibold">{value}</div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/60 bg-surface/40 p-10 text-center">
      <h2 className="text-lg font-semibold">No leads yet</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
        Add your first partner lead to start scoring against the Factorial 5-Dimension Scorecard.
      </p>
      <button onClick={onAdd} className="mt-5 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-ring">
        + Add your first lead
      </button>
    </div>
  );
}

function LeadCard({
  lead, onClick, onDelete, onPromote,
}: {
  lead: LeadRow;
  onClick: () => void;
  onDelete: () => void;
  onPromote: () => void;
}) {
  const total = computeFactorialTotal(lead);
  const verdict = factorialVerdict(total);
  const host = (() => { try { return lead.website ? new URL(lead.website).host : null; } catch { return lead.website; } })();
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
      className="rounded-xl bg-card border border-border/60 p-3 cursor-grab active:cursor-grabbing hover:-translate-y-0.5 transition card-elev"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-semibold truncate">{lead.company_name}</div>
          <div className="text-xs text-muted-foreground truncate mt-0.5">
            {lead.contact_person ?? "—"}{host ? ` · ${host}` : ""}
          </div>
          {lead.partner_type && (
            <div className="mt-1.5"><PartnerTypeChip type={lead.partner_type} /></div>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="Delete lead"
          aria-label="Delete lead"
          className="shrink-0 text-muted-foreground hover:text-red-400 text-sm leading-none px-1.5 py-0.5 rounded-md hover:bg-red-500/10"
        >
          ✕
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        {verdict && total !== null ? (
          <span
            className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-md ${toneClass(verdict.tone)}`}
          >
            {total}/15 · {verdict.label}
          </span>
        ) : (
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Not scored</span>
        )}
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Drag to move</span>
      </div>
      {(summary.openTasks > 0 || lead.next_step_at) && (
        <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
          {summary.openTasks > 0 ? (
            <span className={summary.overdue > 0 ? "text-red-400" : ""}>
              {summary.openTasks} open · {summary.overdue > 0 ? `${summary.overdue} overdue` : "on track"}
            </span>
          ) : <span />}
          {lead.next_step_at && <span>next: {lead.next_step_at}</span>}
        </div>
      )}
      {lead.status === "approved" && !lead.promoted_partner_id && (
        <button
          onClick={(e) => { e.stopPropagation(); onPromote(); }}
          className="mt-2 w-full rounded-md bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 text-[11px] font-semibold px-2 py-1 transition"
        >
          Promote to Partner →
        </button>
      )}
      {lead.promoted_partner_id && (
        <Link
          to="/partner/$partnerId"
          params={{ partnerId: lead.promoted_partner_id }}
          onClick={(e) => e.stopPropagation()}
          className="mt-2 block w-full text-center rounded-md bg-surface text-muted-foreground hover:text-foreground text-[11px] font-semibold px-2 py-1 transition border border-border/60"
        >
          Open partner →
        </Link>
      )}
    </div>
  );
}

function toneClass(tone: "red" | "yellow" | "green") {
  switch (tone) {
    case "red": return "bg-red-500/15 text-red-400";
    case "yellow": return "bg-yellow-500/15 text-yellow-400";
    case "green": return "bg-emerald-500/15 text-emerald-400";
  }
}

function NewLeadDialog({
  onClose, onCreate,
}: {
  onClose: () => void;
  onCreate: (input: {
    company_name: string; contact_person?: string; website?: string;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-card border border-border/60 p-6 card-elev" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold">New partner lead</h2>
        <p className="text-sm text-muted-foreground mt-1">Capture the basics — score the 5 dimensions next.</p>

        <div className="mt-5 space-y-3">
          <Field label="Company name *">
            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="input" placeholder="e.g. Northwind Cloud" autoFocus />
          </Field>
          <Field label="Contact person">
            <input value={contact} onChange={(e) => setContact(e.target.value)} className="input" placeholder="Full name" />
          </Field>
          <Field label="Website">
            <input value={website} onChange={(e) => setWebsite(e.target.value)} className="input" placeholder="https://…" />
          </Field>
          <Field label="Partnership type">
            <select value={partnerType} onChange={(e) => setPartnerType(e.target.value as PartnerType)} className="input">
              {PARTNER_TYPES.map((t) => (
                <option key={t.key} value={t.key}>{t.label} — {t.description}</option>
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
              <input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} className="input text-xs w-36" />
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Attach a task so the lead never sits idle. You can always add more later.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg border border-border bg-surface px-4 py-2 text-sm hover:bg-surface-2">Cancel</button>
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
  lead, onClose, onUpdate, onSetDimension, onUpdateNotes, onReject, onDelete, onPromote,
}: {
  lead: LeadRow;
  onClose: () => void;
  onUpdate: (patch: Partial<LeadRow>) => Promise<void>;
  onSetDimension: (key: DimensionKey, v: 1 | 2 | 3) => Promise<void>;
  onUpdateNotes: (text: string) => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onPromote: () => void;
}) {
  const { meta, freeText } = parseScorecard(lead.notes);
  const [notes, setNotes] = useState(freeText);
  const [showReject, setShowReject] = useState(false);
  const [tab, setTab] = useState<"scorecard" | "crm">("scorecard");
  useEffect(() => { setNotes(freeText); }, [lead.id, freeText]);

  const total = computeFactorialTotal(lead);
  const verdict = factorialVerdict(total);
  const canPromote = !lead.promoted_partner_id && lead.status !== "rejected" && verdict?.tone !== "red";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-background/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-[560px] h-full overflow-y-auto bg-card border-l border-border/60 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Lead</p>
            <h2 className="text-xl font-semibold truncate">{lead.company_name}</h2>
            <div className="text-xs text-muted-foreground mt-1">
              {lead.contact_person ?? "No contact"}
              {lead.website ? <> · <a className="underline" href={lead.website} target="_blank" rel="noreferrer">{lead.website}</a></> : null}
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">Close</button>
        </div>

        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Status</span>
          <span className="text-xs rounded-md bg-surface border border-border/60 px-2 py-1">
            {LEAD_STATUSES.find((s) => s.key === lead.status)?.label ?? lead.status}
          </span>
          {lead.promoted_partner_id && (
            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400">
              Promoted
            </span>
          )}
          {meta.rejection_reason && lead.status === "rejected" && (
            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-md bg-red-500/15 text-red-400">
              Reason: {meta.rejection_reason}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Type</span>
          <select
            value={lead.partner_type ?? ""}
            onChange={(e) => {
              const v = e.target.value as PartnerType | "";
              void onUpdate({ partner_type: v ? v : null });
            }}
            className="rounded-md bg-surface border border-border/60 px-2 py-1 text-xs"
          >
            <option value="">— Not set —</option>
            {PARTNER_TYPES.map((t) => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
          {lead.partner_type && <PartnerTypeChip type={lead.partner_type} />}
        </div>

        {lead.status !== "rejected" && (
          <div className="mt-4 rounded-xl border border-border/60 bg-surface/40 p-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold">
                {lead.promoted_partner_id ? "Already in your portfolio" : "Ready to add to portfolio?"}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {lead.promoted_partner_id
                  ? "This lead has been promoted to a partner."
                  : verdict?.tone === "red"
                    ? "Score the lead first — current verdict is too low to promote."
                    : "Promotes the lead and opens the new partner workspace."}
              </div>
            </div>
            {lead.promoted_partner_id ? (
              <Link
                to="/partner/$partnerId"
                params={{ partnerId: lead.promoted_partner_id }}
                className="shrink-0 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold hover:bg-surface-2"
              >
                Open partner →
              </Link>
            ) : (
              <button
                onClick={onPromote}
                disabled={!canPromote}
                className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground glow-ring disabled:opacity-40"
              >
                Promote to Partner →
              </button>
            )}
          </div>
        )}

        <div className="mt-5 inline-flex rounded-lg border border-border/60 bg-surface/60 p-1 text-xs">
          <button
            onClick={() => setTab("scorecard")}
            className={`px-3 py-1.5 rounded-md transition ${tab === "scorecard" ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Scorecard
          </button>
          <button
            onClick={() => setTab("crm")}
            className={`px-3 py-1.5 rounded-md transition ${tab === "crm" ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            CRM & Activities
          </button>
        </div>

        {tab === "crm" ? (
          <CrmTab lead={lead} onUpdate={onUpdate} />
        ) : (
        <>
        <div className="mt-6">
          <h3 className="text-sm font-semibold">Factorial 5-Dimension Scorecard</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Score each dimension Low (1) · Medium (2) · High (3). Total ranges 5–15.</p>

          <div className="mt-4 space-y-5">
            {FACTORIAL_DIMENSIONS.map((d, idx) => {
              const value = getDimensionValue(lead, d.key);
              const selectedHelp = d.options.find((o) => o.v === value)?.help ?? null;
              return (
                <div key={d.key}>
                  <div className="text-sm font-medium">
                    <span className="text-muted-foreground font-mono mr-2">{idx + 1}.</span>{d.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{d.description}</div>
                  <div className="mt-2 inline-flex rounded-lg border border-border/60 bg-surface/60 p-1 text-xs">
                    {d.options.map((opt) => (
                      <button
                        key={opt.v}
                        title={opt.help}
                        onClick={() => onSetDimension(d.key, opt.v)}
                        className={`px-3 py-1.5 rounded-md transition ${value === opt.v ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {selectedHelp && (
                    <div className="text-[11px] text-muted-foreground mt-1.5 italic">→ {selectedHelp}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          {verdict && total !== null ? (
            <div className={`rounded-xl border p-4 ${bannerClass(verdict.tone)}`}>
              <div className="text-sm font-semibold">{verdict.label} · Score {total}/15</div>
              <div className="text-xs mt-1 opacity-90">{verdict.message}</div>
            </div>
          ) : (
            <div className="rounded-xl border border-border/60 bg-surface/40 p-4 text-xs text-muted-foreground">
              Score all 5 dimensions to see the Factorial fit recommendation.
            </div>
          )}
        </div>

        <div className="mt-5">
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => { if ((freeText ?? "") !== notes) void onUpdateNotes(notes); }}
            className="input mt-1 min-h-[100px]"
            placeholder="Context, source of the lead, key conversation points…"
          />
        </div>
        </>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            onClick={() => { if (confirm("Delete this lead?")) void onDelete(); }}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Delete lead
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setShowReject(true)}
              disabled={lead.status === "rejected"}
              className="rounded-lg border border-border bg-surface px-4 py-2 text-sm hover:bg-surface-2 disabled:opacity-40"
            >
              Reject Lead
            </button>
            <button
              disabled={lead.status !== "new"}
              onClick={() => void onUpdate({ status: "in_review" })}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-ring disabled:opacity-40"
            >
              {lead.status === "new" ? "Put in Qualification Pipe" : "In Qualification Pipe"}
            </button>
          </div>
        </div>

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
  onClose, onConfirm,
}: {
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [preset, setPreset] = useState<string>(REJECT_REASONS[0]);
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-card border border-border/60 p-6 card-elev" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold">Reject lead</h3>
        <p className="text-sm text-muted-foreground mt-1">Pick the primary reason — it will be archived with the lead for context.</p>

        <div className="mt-4 space-y-3">
          <Field label="Rejection reason">
            <select value={preset} onChange={(e) => setPreset(e.target.value)} className="input">
              {REJECT_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          {preset === "Other" && (
            <Field label="Details">
              <input value={detail} onChange={(e) => setDetail(e.target.value)} className="input" placeholder="Short description" autoFocus />
            </Field>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg border border-border bg-surface px-4 py-2 text-sm hover:bg-surface-2">Cancel</button>
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
    case "red": return "bg-red-500/10 border-red-500/30 text-red-300";
    case "yellow": return "bg-yellow-500/10 border-yellow-500/30 text-yellow-300";
    case "green": return "bg-emerald-500/10 border-emerald-500/30 text-emerald-300";
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
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
            {summary.overdue > 0 && <span className="text-red-400"> · {summary.overdue} overdue</span>}
            {lastActivity && <> · last {new Date(lastActivity).toLocaleDateString()}</>}
          </div>
        </div>

        <NewActivityForm onCreate={(input) => acts.create(input).catch((e) => toast.error((e as Error).message))} />

        <div className="mt-4 space-y-2">
          {acts.loading ? (
            <div className="text-xs text-muted-foreground py-4 text-center">Loading…</div>
          ) : acts.activities.length === 0 ? (
            <div className="text-xs text-muted-foreground py-4 text-center">No activities yet — log a call, plan a task, or jot a note.</div>
          ) : (
            acts.activities.map((a) => (
              <ActivityRow
                key={a.id}
                activity={a}
                onToggle={() => acts.toggleDone(a).catch((e) => toast.error((e as Error).message))}
                onDelete={() => {
                  if (!confirm("Delete this activity?")) return;
                  acts.remove(a.id).catch((e) => toast.error((e as Error).message));
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
  label, value, placeholder, type = "text", onSave,
}: {
  label: string;
  value: string;
  placeholder?: string;
  type?: string;
  onSave: (v: string) => Promise<void> | void;
}) {
  const [v, setV] = useState(value);
  useEffect(() => { setV(value); }, [value]);
  return (
    <label className="block">
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
      <input
        type={type}
        value={v}
        placeholder={placeholder}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => { if (v !== value) void onSave(v); }}
        className="input mt-1 text-sm"
      />
    </label>
  );
}

function InlineSelect({
  label, value, options, onSave,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onSave: (v: string) => Promise<void> | void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => void onSave(e.target.value)}
        className="input mt-1 text-sm"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o || "—"}</option>
        ))}
      </select>
    </label>
  );
}

function NewActivityForm({
  onCreate,
}: {
  onCreate: (input: { kind: LeadActivityKind; title: string; description?: string; due_date?: string | null }) => void;
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
      due_date: kind === "task" ? (due || null) : null,
    });
    setTitle("");
    setDesc("");
    setDue("");
  };

  return (
    <div className="mt-3 rounded-xl border border-border/60 bg-surface/40 p-3 space-y-2">
      <div className="flex gap-2">
        <select value={kind} onChange={(e) => setKind(e.target.value as LeadActivityKind)} className="input text-xs flex-shrink-0 w-28">
          {LEAD_ACTIVITY_KINDS.map((k) => <option key={k.key} value={k.key}>{k.label}</option>)}
        </select>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
          placeholder={kind === "task" ? "What needs to happen?" : kind === "note" ? "Quick note…" : `Log a ${kind}…`}
          className="input text-sm flex-1"
        />
        {kind === "task" && (
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="input text-xs w-36" />
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
  activity, onToggle, onDelete,
}: {
  activity: LeadActivityRow;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const meta = LEAD_ACTIVITY_KINDS.find((k) => k.key === activity.kind);
  const today = new Date().toISOString().slice(0, 10);
  const overdue = activity.kind === "task" && !activity.done && activity.due_date && activity.due_date < today;

  return (
    <div className={`rounded-lg border border-border/60 bg-card/60 p-3 flex items-start gap-3 ${activity.done ? "opacity-60" : ""}`}>
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
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{meta?.label}</span>
          {activity.due_date && (
            <span className={`text-[10px] ${overdue ? "text-red-400" : "text-muted-foreground"}`}>
              {overdue ? "overdue · " : "due "}{activity.due_date}
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
  tasks, loading, onComplete, onOpenLead,
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
    <section id="lead-tasks" className="mt-6 rounded-2xl border border-border/60 bg-card p-5 card-elev">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Lead Tasks · Next moves
          </p>
          <h2 className="mt-1 text-lg font-semibold">
            {tasks.length} open
            {overdue > 0 && <span className="ml-2 text-sm font-mono text-red-400">· {overdue} overdue</span>}
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
                    onClick={(e) => { e.stopPropagation(); void onComplete(t.id); }}
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
                  <span className={`text-xs font-mono ${isOverdue ? "text-red-400 font-semibold" : "text-muted-foreground"}`}>
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
