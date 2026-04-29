import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import {
  useLeads,
  LEAD_STATUSES,
  fitVerdict,
  type LeadRow,
  type LeadStatus,
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
            Qualify incoming leads against your Ideal Partner Profile before promoting them.
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
        Add your first partner lead to start qualifying against your Ideal Partner Profile.
      </p>
      <button onClick={onAdd} className="mt-5 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-ring">
        + Add your first lead
      </button>
    </div>
  );
}

function LeadCard({
  lead, onClick, onStatusChange,
}: {
  lead: LeadRow;
  onClick: () => void;
  onStatusChange: (s: LeadStatus) => void;
}) {
  const total =
    lead.sales_score !== null && lead.expertise_score !== null && lead.fit_score !== null
      ? (lead.sales_score ?? 0) + (lead.expertise_score ?? 0) + (lead.fit_score ?? 0)
      : null;
  const verdict = fitVerdict(total);
  const host = (() => { try { return lead.website ? new URL(lead.website).host : null; } catch { return lead.website; } })();

  return (
    <div
      onClick={onClick}
      className="rounded-xl bg-card border border-border/60 p-3 cursor-pointer hover:-translate-y-0.5 transition card-elev"
    >
      <div className="font-semibold truncate">{lead.company_name}</div>
      <div className="text-xs text-muted-foreground truncate mt-0.5">
        {lead.contact_person ?? "—"}{host ? ` · ${host}` : ""}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        {verdict ? (
          <span
            className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-md ${toneClass(verdict.tone)}`}
          >
            {total}/9 · {verdict.label}
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
        <p className="text-sm text-muted-foreground mt-1">Capture the basics — qualify against the IPP next.</p>

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

const IPP_QUESTIONS: { key: "sales_score" | "expertise_score" | "fit_score"; label: string; help: string }[] = [
  { key: "sales_score", label: "Sales & Audience Capacity", help: "Pipeline reach, sales muscle, and customer base relevance." },
  { key: "expertise_score", label: "Technical & Market Expertise", help: "Domain depth, certifications, and ability to deliver." },
  { key: "fit_score", label: "Strategic & Cultural Fit", help: "Values, long-term alignment, and ease of collaboration." },
];

function LeadDetailPanel({
  lead, onClose, onUpdate, onDelete, onPromote,
}: {
  lead: LeadRow;
  onClose: () => void;
  onUpdate: (patch: Partial<LeadRow>) => Promise<void>;
  onDelete: () => Promise<void>;
  onPromote: () => Promise<void>;
}) {
  const [notes, setNotes] = useState(lead.notes ?? "");
  useEffect(() => { setNotes(lead.notes ?? ""); }, [lead.id, lead.notes]);

  const total =
    lead.sales_score !== null && lead.expertise_score !== null && lead.fit_score !== null
      ? (lead.sales_score ?? 0) + (lead.expertise_score ?? 0) + (lead.fit_score ?? 0)
      : null;
  const verdict = fitVerdict(total);

  const setScore = async (key: "sales_score" | "expertise_score" | "fit_score", val: 1 | 2 | 3) => {
    const next = { ...lead, [key]: val } as LeadRow;
    const t =
      next.sales_score !== null && next.expertise_score !== null && next.fit_score !== null
        ? (next.sales_score ?? 0) + (next.expertise_score ?? 0) + (next.fit_score ?? 0)
        : null;
    await onUpdate({ [key]: val, total_score: t } as Partial<LeadRow>);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-background/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-[520px] h-full overflow-y-auto bg-card border-l border-border/60 p-6"
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

        <div className="mt-4 flex items-center gap-2">
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
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold">IPP Scorecard</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Score the lead against your Ideal Partner Profile.</p>

          <div className="mt-4 space-y-4">
            {IPP_QUESTIONS.map((q) => {
              const value = lead[q.key] as number | null;
              return (
                <div key={q.key}>
                  <div className="text-sm font-medium">{q.label}</div>
                  <div className="text-xs text-muted-foreground">{q.help}</div>
                  <div className="mt-2 inline-flex rounded-lg border border-border/60 bg-surface/60 p-1 text-xs">
                    {([
                      { v: 1, label: "Low" },
                      { v: 2, label: "Medium" },
                      { v: 3, label: "High" },
                    ] as const).map((opt) => (
                      <button
                        key={opt.v}
                        onClick={() => setScore(q.key, opt.v)}
                        className={`px-3 py-1.5 rounded-md transition ${value === opt.v ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-5">
          {verdict ? (
            <div className={`rounded-xl border p-4 ${bannerClass(verdict.tone)}`}>
              <div className="text-sm font-semibold">{verdict.label} · Score {total}/9</div>
              <div className="text-xs mt-1 opacity-90">{verdict.message}</div>
            </div>
          ) : (
            <div className="rounded-xl border border-border/60 bg-surface/40 p-4 text-xs text-muted-foreground">
              Answer all 3 questions to see the fit recommendation.
            </div>
          )}
        </div>

        <div className="mt-5">
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => { if ((lead.notes ?? "") !== notes) void onUpdate({ notes: notes || null }); }}
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
              onClick={() => onUpdate({ status: "rejected" })}
              className="rounded-lg border border-border bg-surface px-4 py-2 text-sm hover:bg-surface-2"
            >
              Reject
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