import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  usePartner,
  levelFromAvg,
  statusLabel,
  tierColor,
  type PartnerRow,
} from "../lib/partners-store";
import { AXES } from "../content/octa";
import {
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { toast } from "sonner";
import { PARTNER_TYPES, type PartnerType } from "@/lib/partner-types";
import { PartnerTypeChip } from "@/components/PartnerFilterBar";
import { Skeleton } from "@/components/ui/skeleton";
import { COPY, partnerScoreSubtitle } from "@/lib/copy";
import { useConfirmDialog } from "@/components/ui/confirm-provider";
import { useLeadership } from "@/lib/use-leadership";
import { usePdmRoster } from "@/lib/use-pdm-roster";
import {
  BulkReassignDialog,
  type ReassignAssignment,
  type ReassignItem,
} from "@/components/BulkReassignDialog";
import { UserRound } from "lucide-react";

export const Route = createFileRoute("/partner/$partnerId")({
  head: () => ({ meta: [{ title: COPY.partnerWorkspace.pageMetaTitle }] }),
  component: PartnerLayout,
});

function PartnerLayout() {
  const { partnerId } = Route.useParams();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const data = usePartner(partnerId);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [editOpen, setEditOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignBusy, setReassignBusy] = useState(false);
  const [ownerName, setOwnerName] = useState<string | null>(null);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const confirmDialog = useConfirmDialog();
  const { isLeadership } = useLeadership(user?.id);
  const pdmRoster = usePdmRoster();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  const ownerId = data.partner?.owner_id;

  useEffect(() => {
    if (!ownerId) {
      setOwnerName(null);
      return;
    }
    let cancelled = false;
    setOwnerLoading(true);
    void (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", ownerId)
        .maybeSingle();
      if (cancelled) return;
      const name = profile?.display_name?.trim() || null;
      setOwnerName(name);
      setOwnerLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [ownerId]);

  // Refetch when leaving the diagnostic sub-route. The diagnostic page uses a
  // separate usePartner instance, so saving a new assessment there doesn't
  // update the layout's cache — without this, the overview keeps showing the
  // empty "Run Readiness Assessment" state even after the assessment is saved.
  const isOnDiagnostic = path.endsWith("/diagnostic");
  useEffect(() => {
    if (!isOnDiagnostic) void data.refresh({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnDiagnostic, partnerId]);

  if (loading || !user || data.loading) {
    return (
      <div className="page-shell space-y-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }
  if (!data.partner) {
    return (
      <div className="page-shell max-w-3xl py-16 text-center">
        <h1 className="text-2xl font-semibold">{COPY.partnerWorkspace.notFoundTitle}</h1>
        <p className="text-sm text-muted-foreground mt-2">{COPY.partnerWorkspace.notFoundBody}</p>
        <Link
          to="/partners"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground"
        >
          {COPY.partnerWorkspace.backToPortfolioCta}
        </Link>
      </div>
    );
  }

  const overall = data.latest ? Number(data.latest.overall) : 0;
  const lvl = overall ? levelFromAvg(overall) : 0;
  const tColor = tierColor(data.partner.tier);
  const isOwner = data.partner.owner_id === user.id;
  const canReassign = (isOwner || isLeadership) && pdmRoster.pdms.length > 0;
  const resolvedOwnerName = ownerName ?? (ownerLoading ? null : COPY.partnerWorkspace.ownerUnassigned);

  const handleReassign = async (assignments: ReassignAssignment[]) => {
    const next = assignments[0];
    if (!next) {
      setReassignOpen(false);
      return;
    }
    if (next.newOwnerId === data.partner!.owner_id) {
      toast.error(COPY.partnerWorkspace.changeOwnerSameTargetError);
      return;
    }
    setReassignBusy(true);
    try {
      await data.updatePartner({ owner_id: next.newOwnerId });
      toast.success(COPY.toast.reassignedPartner({ name: next.newOwnerName }));
      setOwnerName(next.newOwnerName);
      setReassignOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setReassignBusy(false);
    }
  };

  const Tb = COPY.partnerWorkspace.tabs;
  const tabs: { key: string; label: string; to: string }[] = [
    { key: "overview", label: Tb.overview, to: `/partner/${partnerId}` },
    { key: "coach", label: COPY.copilot.label, to: `/partner/${partnerId}/coach` },
    {
      key: "plan",
      label: `${COPY.jbp.short}${data.openActions.length ? ` (${data.openActions.length})` : ""}`,
      to: `/partner/${partnerId}/plan`,
    },
    {
      key: "diagnostic",
      label: data.latest ? COPY.diagnostic.rerun : COPY.diagnostic.noun,
      to: `/partner/${partnerId}/diagnostic`,
    },
    { key: "axes", label: Tb.axes, to: `/partner/${partnerId}/axes` },
    { key: "stakeholders", label: Tb.stakeholders, to: `/partner/${partnerId}/stakeholders` },
    { key: "metrics", label: Tb.metrics, to: `/partner/${partnerId}/metrics` },
    { key: "intel", label: Tb.intel, to: `/partner/${partnerId}/intel` },
    { key: "certification", label: Tb.certification, to: `/partner/${partnerId}/certification` },
  ];

  const isOverview = path === `/partner/${partnerId}` || path === `/partner/${partnerId}/`;

  return (
    <div className="page-shell">
      <Link
        to="/partners"
        className="text-xs font-mono text-muted-foreground hover:text-foreground min-h-11 inline-flex items-center"
      >
        {COPY.partnerWorkspace.backCrumbLabel}
      </Link>

      {/* Hero */}
      <div className="mt-3 rounded-2xl bg-card border border-border/60 p-6 sm:p-8 card-elev">
        <div className="flex flex-col items-center gap-6 text-center lg:flex-row lg:items-start lg:justify-between lg:text-left">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:text-left">
            <div
              className="h-14 w-14 rounded-xl flex items-center justify-center font-display text-xl font-bold uppercase"
              style={{
                background: `color-mix(in oklab, var(--${tColor}) 22%, transparent)`,
                color: `var(--${tColor})`,
              }}
            >
              {data.partner.name.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 flex-wrap sm:justify-start">
                <h1 className="section-title text-2xl">{data.partner.name}</h1>
                <span
                  className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-md"
                  style={{
                    background: `color-mix(in oklab, var(--${tColor}) 22%, transparent)`,
                    color: `var(--${tColor})`,
                  }}
                >
                  {data.partner.tier.replace("_", " ")}
                </span>
                <PartnerTypeChip type={data.partner.partner_type} />
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-md bg-surface-2 text-muted-foreground">
                  {statusLabel(data.partner.status)}
                </span>
                {!isOwner && (
                  <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-md bg-surface-2 text-muted-foreground">
                    {COPY.partnerWorkspace.readOnlyBadge}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {data.partner.company ?? "—"}
                {data.partner.segment ? ` · ${data.partner.segment}` : ""}
              </p>
              <OwnerRow
                ownerName={resolvedOwnerName}
                loading={ownerLoading}
                canChange={canReassign}
                onChange={() => setReassignOpen(true)}
              />
              {data.partner.notes && (
                <p className="text-sm text-muted-foreground mt-2 max-w-xl">{data.partner.notes}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 lg:items-end">
            <div className="flex items-baseline justify-center gap-2 lg:justify-end">
              <span className="text-5xl font-display font-bold text-gradient">
                {overall ? overall.toFixed(1) : "—"}
              </span>
              <span className="text-sm text-muted-foreground">/ 5.0</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {overall
                ? partnerScoreSubtitle(lvl, data.history.length)
                : COPY.partnerWorkspace.scoreUndiagnosed}
            </div>
            {isOwner && (
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="mt-1 text-xs underline text-muted-foreground hover:text-foreground min-h-11"
              >
                {COPY.partnerWorkspace.editPartnerHint}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 border-b border-border/60 overflow-x-auto">
        {tabs.map((t) => {
          const active =
            (t.key === "overview" && isOverview) || (t.key !== "overview" && path.startsWith(t.to));
          return (
            <Link
              key={t.key}
              to={t.to}
              className={`min-h-11 px-4 py-3 text-sm whitespace-nowrap transition ${active ? "border-b-2 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              style={active ? { borderColor: `var(--${tColor})` } : {}}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-6">
        {isOverview ? <Overview partnerId={partnerId} data={data} /> : <Outlet />}
      </div>

      {editOpen && isOwner && (
        <EditPartnerDialog
          partner={data.partner}
          onClose={() => setEditOpen(false)}
          onSave={async (patch) => {
            try {
              await data.updatePartner(patch);
              toast.success(COPY.toast.partnerProfileSaved);
              setEditOpen(false);
            } catch (e) {
              toast.error((e as Error).message);
            }
          }}
          onDelete={async () => {
            const ok = await confirmDialog({
              title: `Delete ${data.partner!.name}?`,
              description: COPY.partnerWorkspace.deletePartnerBody,
              actionLabel: "Delete",
            });
            if (!ok) return;
            try {
              await data.deletePartner();
              toast.success(COPY.toast.partnerWorkspaceRemoved);
              nav({ to: "/partners" });
            } catch (e) {
              toast.error((e as Error).message);
            }
          }}
        />
      )}

      {canReassign && (
        <BulkReassignDialog
          open={reassignOpen}
          items={[
            {
              id: data.partner.id,
              name: data.partner.name,
              currentOwnerId: data.partner.owner_id,
              currentOwnerName:
                resolvedOwnerName ?? COPY.partnerWorkspace.ownerUnassigned,
            } satisfies ReassignItem,
          ]}
          pdms={pdmRoster.pdms}
          entityLabel="partner"
          busy={reassignBusy}
          onClose={() => setReassignOpen(false)}
          onConfirm={handleReassign}
        />
      )}
    </div>
  );
}

function OwnerRow({
  ownerName,
  loading,
  canChange,
  onChange,
}: {
  ownerName: string | null;
  loading: boolean;
  canChange: boolean;
  onChange: () => void;
}) {
  const label = loading
    ? COPY.partnerWorkspace.ownerLoading
    : (ownerName ?? COPY.partnerWorkspace.ownerUnassigned);
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
      <span
        className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-surface/70 px-2.5 py-1 text-muted-foreground"
        aria-label={`${COPY.partnerWorkspace.ownerLabel}: ${label}`}
      >
        <UserRound className="h-3.5 w-3.5" aria-hidden />
        <span className="font-mono uppercase tracking-widest text-[10px] text-muted-foreground/80">
          {COPY.partnerWorkspace.ownerLabel}
        </span>
        <span className="text-foreground font-medium normal-case">{label}</span>
      </span>
      {canChange && (
        <button
          type="button"
          onClick={onChange}
          className="min-h-9 rounded-full border border-border/60 bg-surface px-3 py-1 text-[11px] font-medium text-foreground hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={COPY.partnerWorkspace.changeOwnerHint}
          title={COPY.partnerWorkspace.changeOwnerHint}
        >
          {COPY.partnerWorkspace.changeOwnerCta}
        </button>
      )}
    </div>
  );
}

function Overview({ partnerId, data }: { partnerId: string; data: ReturnType<typeof usePartner> }) {
  const confirmDialog = useConfirmDialog();
  const hasDiagnostic = !!data.latest;
  const history = data.history;
  const [selectedId, setSelectedId] = useState<string | null>(history[0]?.id ?? null);
  const [compareId, setCompareId] = useState<string | null>(null);

  // Keep selection valid if history changes
  useEffect(() => {
    if (!selectedId && history[0]) setSelectedId(history[0].id);
    if (selectedId && !history.find((h) => h.id === selectedId))
      setSelectedId(history[0]?.id ?? null);
    if (compareId && !history.find((h) => h.id === compareId)) setCompareId(null);
  }, [history, selectedId, compareId]);

  const selected = history.find((h) => h.id === selectedId) ?? history[0] ?? null;
  const compare = compareId ? (history.find((h) => h.id === compareId) ?? null) : null;
  const scores = (selected?.scores ?? {}) as Record<string, number>;
  const compareScores = (compare?.scores ?? {}) as Record<string, number>;
  const radarData = AXES.map((a) => ({
    axis: a.letter,
    fullName: a.name,
    score: scores[a.key] ?? 0,
    compare: compareScores[a.key] ?? 0,
  }));

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  };

  const lowest = [...AXES]
    .map((a) => ({ a, s: scores[a.key] ?? 0 }))
    .sort((x, y) => x.s - y.s)
    .slice(0, 3);

  if (!hasDiagnostic) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-surface/40 p-10 text-center">
        <h2 className="text-lg font-semibold">{COPY.diagnostic.emptyPartnerOverviewTitle}</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          {COPY.diagnostic.emptyPartnerOverviewBody}
        </p>
        <Link
          to="/partner/$partnerId/diagnostic"
          params={{ partnerId }}
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground glow-ring"
        >
          {COPY.diagnostic.cta} →
        </Link>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-5 gap-4">
      <div className="lg:col-span-2 rounded-2xl bg-card border border-border/60 p-4 card-elev">
        <div className="flex items-center justify-between px-2 pt-2 gap-2 flex-wrap">
          <h2 className="font-semibold">{COPY.partnerWorkspace.maturityRadarHeading}</h2>
          {history.length > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <select
                value={selectedId ?? ""}
                onChange={(e) => setSelectedId(e.target.value)}
                className="input h-8 py-0 text-xs"
                aria-label="Select assessment version"
              >
                {history.map((h, i) => (
                  <option key={h.id} value={h.id}>
                    {i === 0 ? "Latest · " : `v${history.length - i} · `}
                    {fmtDate(h.created_at)} ({Number(h.overall).toFixed(1)})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        {history.length > 1 && (
          <div className="px-2 mt-2 flex items-center gap-2 text-xs">
            <span className="text-muted-foreground font-mono uppercase tracking-widest text-[10px]">
              Compare
            </span>
            <select
              value={compareId ?? ""}
              onChange={(e) => setCompareId(e.target.value || null)}
              className="input h-8 py-0 text-xs flex-1"
              aria-label="Compare with another assessment"
            >
              <option value="">None</option>
              {history
                .filter((h) => h.id !== selectedId)
                .map((h, i) => (
                  <option key={h.id} value={h.id}>
                    {fmtDate(h.created_at)} ({Number(h.overall).toFixed(1)})
                  </option>
                ))}
            </select>
          </div>
        )}
        <div className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius="75%">
              <defs>
                <radialGradient id="radarFill" cx="50%" cy="50%" r="65%">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="var(--secondary)" stopOpacity={0.18} />
                </radialGradient>
                <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2.4" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <PolarGrid stroke="color-mix(in oklab, var(--primary) 22%, transparent)" />
              <PolarAngleAxis
                dataKey="axis"
                tick={{ fill: "var(--foreground)", fontSize: 12, fontWeight: 600 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 5]}
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                stroke="transparent"
              />
              {compare && (
                <Radar
                  name={`Previous · ${fmtDate(compare.created_at)}`}
                  dataKey="compare"
                  stroke="var(--muted-foreground)"
                  strokeDasharray="4 4"
                  fill="var(--muted-foreground)"
                  fillOpacity={0.1}
                  isAnimationActive
                  animationDuration={650}
                />
              )}
              <Radar
                name={selected ? fmtDate(selected.created_at) : data.partner!.name}
                dataKey="score"
                stroke="var(--primary)"
                strokeWidth={2}
                fill="url(#radarFill)"
                fillOpacity={0.9}
                filter="url(#radarGlow)"
                isAnimationActive
                animationDuration={750}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "rgba(255,255,255,0.96)",
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 10px 28px -10px rgba(255,192,203,0.55)",
                  fontSize: 12,
                }}
                labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        {selected && (
          <div className="px-2 pb-2 text-xs text-muted-foreground flex items-center justify-between">
            <span>
              Showing{" "}
              <span className="text-foreground font-medium">{fmtDate(selected.created_at)}</span> ·
              Overall {Number(selected.overall).toFixed(1)}
            </span>
            {compare && (
              <span className="font-mono">
                Δ {(Number(selected.overall) - Number(compare.overall)).toFixed(1)}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="lg:col-span-3 space-y-4">
        <div className="rounded-2xl bg-card border border-border/60 p-6 card-elev">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{COPY.partnerWorkspace.growthLeversTitle}</h2>
            <Link
              to="/partner/$partnerId/coach"
              params={{ partnerId }}
              className="text-xs font-mono text-muted-foreground hover:text-foreground"
            >
              {COPY.partnerWorkspace.growthLeversLink}
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {COPY.partnerWorkspace.growthLeversBlurb}
          </p>
          <div className="mt-4 space-y-3">
            {lowest.map(({ a, s }) => (
              <Link
                key={a.key}
                to="/partner/$partnerId/axes"
                params={{ partnerId }}
                className="block rounded-xl border border-border/60 bg-surface/50 p-4 hover:bg-surface-2 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-8 w-8 rounded-md flex items-center justify-center font-display font-bold"
                      style={{
                        background: `color-mix(in oklab, var(--${a.color}) 22%, transparent)`,
                        color: `var(--${a.color})`,
                      }}
                    >
                      {a.letter}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{a.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {s
                          ? `Level ${levelFromAvg(s)} → target ${Math.min(5, levelFromAvg(s) + 1)}`
                          : "Not assessed"}
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl font-display font-bold text-gradient">
                    {s ? s.toFixed(1) : "—"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border/60 p-6 card-elev">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{COPY.jbp.itemPlural}</h2>
            <Link
              to="/partner/$partnerId/plan"
              params={{ partnerId }}
              className="text-xs font-mono text-muted-foreground hover:text-foreground"
            >
              {COPY.jbp.short} →
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <Stat label="Open" value={String(data.openActions.length)} />
            <Stat label="Done" value={String(data.doneActions.length)} />
            <Stat label="Total" value={String(data.actions.length)} />
          </div>
        </div>

        <DiagnosticHistory data={data} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface/60 border border-border/60 px-3 py-3">
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="text-2xl font-display font-semibold">{value}</div>
    </div>
  );
}

function DiagnosticHistory({ data }: { data: ReturnType<typeof usePartner> }) {
  const confirmDialog = useConfirmDialog();
  if (data.history.length === 0) return null;
  return (
    <div className="rounded-2xl bg-card border border-border/60 p-6 card-elev">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{COPY.partnerWorkspace.diagHistoryHeading}</h2>
        <span className="text-xs font-mono text-muted-foreground">
          {data.history.length} run{data.history.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="mt-3 divide-y divide-border/60">
        {data.history.map((h, i) => {
          const score = Number(h.overall);
          const lvl = levelFromAvg(score);
          const date = new Date(h.created_at);
          const prev = data.history[i + 1];
          const delta = prev ? score - Number(prev.overall) : null;
          return (
            <div key={h.id} className="flex items-center justify-between py-3">
              <div className="min-w-0">
                <div className="text-sm font-medium">
                  {date.toLocaleDateString(undefined, {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                  {i === 0 && (
                    <span className="ml-2 text-[10px] font-mono uppercase tracking-widest text-primary">
                      latest
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} ·
                  Level {lvl}
                  {delta !== null && (
                    <span
                      className={`ml-2 font-mono ${delta > 0 ? "text-success" : delta < 0 ? "text-destructive" : ""}`}
                    >
                      {delta > 0 ? "▲" : delta < 0 ? "▼" : "="} {Math.abs(delta).toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-display font-semibold text-gradient">
                  {score.toFixed(1)}
                </span>
                <button
                  onClick={async () => {
                    const ok = await confirmDialog({
                      title: COPY.partnerWorkspace.deleteDiagConfirmTitle,
                      description: COPY.partnerWorkspace.deleteDiagConfirmHint,
                      actionLabel: "Delete",
                    });
                    if (!ok) return;
                    try {
                      await data.deleteAssessment(h.id);
                      toast.success(COPY.toast.diagDeleted);
                    } catch (e) {
                      toast.error((e as Error).message);
                    }
                  }}
                  className="text-xs text-destructive hover:underline"
                  aria-label="Delete assessment"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EditPartnerDialog({
  partner,
  onClose,
  onSave,
  onDelete,
}: {
  partner: PartnerRow;
  onClose: () => void;
  onSave: (patch: Partial<PartnerRow>) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [name, setName] = useState(partner.name);
  const [company, setCompany] = useState(partner.company ?? "");
  const [segment, setSegment] = useState(partner.segment ?? "");
  const [tier, setTier] = useState(partner.tier);
  const [status, setStatus] = useState(partner.status);
  const [partnerType, setPartnerType] = useState<PartnerType>(partner.partner_type ?? "referral");
  const [notes, setNotes] = useState(partner.notes ?? "");
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
        <h2 className="text-xl font-semibold">Edit partner</h2>
        <div className="mt-5 space-y-3">
          <Field label="Partner name *">
            <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
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
          <Field label="PDM notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input min-h-[80px]"
            />
          </Field>
        </div>

        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={async () => {
              setBusy(true);
              try {
                await onDelete();
              } finally {
                setBusy(false);
              }
            }}
            className="text-xs text-destructive hover:underline"
          >
            Delete partner
          </button>
          <div className="flex gap-3">
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
                  await onSave({
                    name: name.trim(),
                    company: company.trim() || null,
                    segment: segment.trim() || null,
                    tier,
                    status,
                    notes: notes.trim() || null,
                    partner_type: partnerType,
                  });
                } finally {
                  setBusy(false);
                }
              }}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-ring disabled:opacity-40"
            >
              Save
            </button>
          </div>
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
