import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useEffect } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "@/lib/auth";
import { levelFromAvg, usePartner } from "@/lib/partners-store";
import { AXES } from "@/content/octa";
import { COPY } from "@/lib/copy";
import { Skeleton } from "@/components/ui/skeleton";
import { KeptIllustration } from "@/components/brand/KeptIllustration";

export const Route = createFileRoute("/partner/$partnerId/maturity")({
  head: () => ({
    meta: [{ title: COPY.partnerWorkspace.maturityPageMetaTitle }],
  }),
  component: PartnerMaturityPage,
});

function PartnerMaturityPage() {
  const { partnerId } = Route.useParams();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const data = usePartner(partnerId);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  const chartData = useMemo(() => {
    const asc = [...data.history].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    return asc.map((row) => {
      const ov = Number(row.overall);
      const scores = (row.scores ?? {}) as Record<string, number>;
      return {
        id: row.id,
        rawDate: row.created_at,
        label: new Date(row.created_at).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "2-digit",
        }),
        score: ov,
        ...Object.fromEntries(AXES.map((ax) => [`axis_${ax.key}`, scores[ax.key] ?? null])),
      };
    });
  }, [data.history]);

  const latest = data.history[0] ?? null;
  const overallLatest = latest ? Number(latest.overall) : 0;
  const levelLatest = overallLatest ? levelFromAvg(overallLatest) : 0;
  const latestScores = latest ? ((latest.scores ?? {}) as Record<string, number>) : {};

  if (loading || !user || data.loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (!data.partner) {
    return (
      <div className="rounded-2xl border border-border/60 bg-surface/40 p-8 text-center">
        <p className="text-sm text-muted-foreground">{COPY.partnerWorkspace.notFoundBody}</p>
        <Link
          to="/partners"
          className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
        >
          {COPY.partnerWorkspace.backToPortfolioCta}
        </Link>
      </div>
    );
  }

  if (data.history.length === 0) {
    return (
      <div className="rounded-2xl border border-border/60 bg-surface/40 p-10 text-center">
        <KeptIllustration
          variant="keepsContext"
          className="mx-auto h-24 w-auto opacity-90"
          decorative
        />
        <h2 className="mt-4 text-lg font-semibold">{COPY.portfolio.maturityEmptyTitle}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {COPY.portfolio.maturityEmptyBody}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/partner/$partnerId/diagnostic"
            params={{ partnerId }}
            className="inline-flex min-h-11 items-center rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground glow-ring"
          >
            {COPY.portfolio.maturityRunDiagnosticCta}
          </Link>
          <Link
            to="/partner/$partnerId"
            params={{ partnerId }}
            className="inline-flex min-h-11 items-center rounded-lg border border-border bg-surface px-5 py-2 text-sm"
          >
            {COPY.portfolio.maturityViewOverviewCta}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="page-eyebrow">{COPY.partnerWorkspace.tabs.maturity}</p>
        <h2 className="section-title">{COPY.portfolio.maturityDashboardTitle}</h2>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground">
          {COPY.portfolio.maturityDashboardSubtitle}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            {COPY.portfolio.maturityCurrentScore}
          </p>
          <p className="mt-2 text-4xl font-bold tabular-nums">{overallLatest.toFixed(2)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            scale 1.0–5.0 · average across dimensions
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            {COPY.portfolio.maturityCurrentLevel}
          </p>
          <p className="mt-2 text-4xl font-bold tabular-nums">L{levelLatest}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {COPY.portfolio.maturityRunsCount({ n: data.history.length })}
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-6 sm:col-span-1">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Partner
          </p>
          <p className="mt-2 text-xl font-semibold">{data.partner.name}</p>
        </div>
      </div>

      <section className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h3 className="font-semibold">{COPY.portfolio.maturityRunHistory}</h3>
          <span className="text-xs font-mono text-muted-foreground">Overall score</span>
        </div>
        <div className="mt-4 h-72 w-full min-h-[288px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} width={28} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number) => [value.toFixed(2), "Score"]}
                labelFormatter={(l) => `Run · ${String(l)}`}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          {COPY.portfolio.maturityChartFootnote}
        </p>
      </section>

      <section>
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {COPY.portfolio.maturityAxisTrendsEyebrow}
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {AXES.map((ax) => {
            const v = latestScores[ax.key];
            const n = v !== undefined ? Number(v) : null;
            return (
              <div
                key={ax.key}
                className="rounded-xl border border-border/60 bg-surface/50 px-4 py-3"
                style={{
                  borderColor: `color-mix(in oklab, var(--${ax.color}) 35%, var(--border))`,
                }}
              >
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  {ax.letter} · {ax.name}
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums">
                  {n !== null ? n.toFixed(2) : "—"}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/partner/$partnerId/diagnostic"
          params={{ partnerId }}
          className="inline-flex min-h-11 items-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium"
        >
          {COPY.portfolio.maturityRunDiagnosticCta}
        </Link>
      </div>
    </div>
  );
}
