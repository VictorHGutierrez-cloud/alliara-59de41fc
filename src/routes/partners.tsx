import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { usePortfolio, levelFromAvg, statusLabel, tierColor, type PortfolioItem } from "../lib/partners-store";
import { AXES } from "../content/octa";
import { toast } from "sonner";

export const Route = createFileRoute("/partners")({
  head: () => ({ meta: [{ title: "Partner Portfolio — OCTA OS" }] }),
  component: PartnersPage,
});

function PartnersPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const portfolio = usePortfolio(user?.id);
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState<"mine" | "all">("mine");
  const [query, setQuery] = useState("");

  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [loading, user, nav]);

  if (loading || !user) return <div className="p-10 text-muted-foreground">Loading…</div>;

  const filtered = portfolio.items.filter((it) => {
    if (filter === "mine" && it.partner.owner_id !== user.id) return false;
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

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Portfolio</p>
          <h1 className="text-3xl font-semibold mt-1">Your partners</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Run the OCTA diagnostic on every partner. Track maturity, build action plans, get AI coaching.
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-ring"
        >
          + Add partner
        </button>
      </div>

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Partners" value={String(aggregate.count)} />
        <Kpi label="Diagnosed" value={`${aggregate.scored}/${aggregate.count}`} />
        <Kpi label="Avg maturity" value={aggregate.avg ? aggregate.avg.toFixed(1) : "—"} />
        <Kpi label="Role" value={portfolio.isLeadership ? "Leadership" : "PDM"} />
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        {portfolio.isLeadership && (
          <div className="inline-flex rounded-lg border border-border/60 bg-surface/60 p-1 text-sm">
            {(["mine", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md transition ${filter === f ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
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

      {/* List */}
      <div className="mt-6">
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
      <h2 className="text-lg font-semibold">No partners yet</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
        Add your first partner to start running the OCTA diagnostic, build an action plan, and get AI coaching tailored to that relationship.
      </p>
      <button onClick={onAdd} className="mt-5 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-ring">
        + Add your first partner
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

      {/* Mini sparkline of axes */}
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
        <span className="text-muted-foreground">{statusLabel(item.partner.status)}</span>
        {item.isLeadershipView && (
          <span className="font-mono text-muted-foreground">leadership view</span>
        )}
      </div>
      </Link>
    </div>
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
                <option value="active">Active</option>
                <option value="nurturing">Nurturing</option>
                <option value="at_risk">At risk</option>
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