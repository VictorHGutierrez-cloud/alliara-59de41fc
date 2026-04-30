import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
  type LeadRow,
  type LeadStatus,
  type DimensionKey,
  type LeadActivityKind,
  type LeadActivityRow,
} from "@/lib/leads-store";

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

  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [loading, user, nav]);

  const counts = useMemo(() => {
    const c: Record<LeadStatus, number> = { new: 0, in_review: 0, approved: 0, rejected: 0 };
    for (const l of leadsStore.leads) c[l.status]++;
    return c;
  }, [leadsStore.leads]);

  const active = leadsStore.leads.find((l) => l.id === activeId) ?? null;

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

      <div className="mt-6">
        {leadsStore.loading ? (
          <div className="text-sm text-muted-foreground py-10 text-center">Loading leads…</div>
        ) : leadsStore.leads.length === 0 ? (
          <EmptyState onAdd={() => setShowNew(true)} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {LEAD_STATUSES.map((col) => {
              const items = leadsStore.leads.filter((l) => l.status === col.key);
              return (
                <div key={col.key} className="rounded-2xl bg-surface/40 border border-border/60 p-3 min-h-[200px]">
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
                        onStatusChange={(s) => leadsStore.updateLead(lead.id, { status: s })}
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
          onPromote={async () => {
            try {
              const partnerId = await leadsStore.promoteLead(active);
              toast.success(`${active.company_name} promoted to partner`);
              setActiveId(null);
              nav({ to: "/partner/$partnerId", params: { partnerId } });
            } catch (e) {
              toast.error((e as Error).message);
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
  lead, onClick, onStatusChange, onDelete,
}: {
  lead: LeadRow;
  onClick: () => void;
  onStatusChange: (s: LeadStatus) => void;
  onDelete: () => void;
}) {
  const total = computeFactorialTotal(lead);
  const verdict = factorialVerdict(total);
  const host = (() => { try { return lead.website ? new URL(lead.website).host : null; } catch { return lead.website; } })();

  return (
    <div
      onClick={onClick}
      className="rounded-xl bg-card border border-border/60 p-3 cursor-pointer hover:-translate-y-0.5 transition card-elev"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-semibold truncate">{lead.company_name}</div>
          <div className="text-xs text-muted-foreground truncate mt-0.5">
            {lead.contact_person ?? "—"}{host ? ` · ${host}` : ""}
          </div>
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
        <select
          value={lead.status}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onStatusChange(e.target.value as LeadStatus)}
          className="text-xs rounded-md bg-surface border border-border/60 px-1.5 py-1"
        >
          {LEAD_STATUSES.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
      </div>
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
  onCreate: (input: { company_name: string; contact_person?: string; website?: string }) => Promise<void>;
}) {
  const [companyName, setCompanyName] = useState("");
  const [contact, setContact] = useState("");
  const [website, setWebsite] = useState("");
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
  onPromote: () => Promise<void>;
}) {
  const { meta, freeText } = parseScorecard(lead.notes);
  const [notes, setNotes] = useState(freeText);
  const [showReject, setShowReject] = useState(false);
  useEffect(() => { setNotes(freeText); }, [lead.id, freeText]);

  const total = computeFactorialTotal(lead);
  const verdict = factorialVerdict(total);

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
          <select
            value={lead.status}
            onChange={(e) => onUpdate({ status: e.target.value as LeadStatus })}
            className="text-xs rounded-md bg-surface border border-border/60 px-2 py-1"
          >
            {LEAD_STATUSES.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
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
              disabled={total === null || lead.status === "approved"}
              onClick={onPromote}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-ring disabled:opacity-40"
            >
              {lead.status === "approved" ? "Already promoted" : "Promote to Official Partner"}
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