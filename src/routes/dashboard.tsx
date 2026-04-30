// rev: pdm-performance
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useOctaData, levelFromAvg } from "../lib/octa-store";
import { usePdmStats, fmtMoney } from "../lib/pdm-stats";
import { AXES } from "../content/octa";
import { Radar, RadarChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { useEffect } from "react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "My Performance — OCTA+" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const data = useOctaData(user?.id);
  const stats = usePdmStats(user?.id);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  if (loading || !user) return <div className="p-10 text-muted-foreground">Loading…</div>;

  const scores = data.latest?.scores ?? {};
  const radarData = AXES.map((a) => ({
    axis: a.letter,
    fullName: a.name,
    score: scores[a.key] ?? 0,
  }));

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">My Performance</p>
          <h1 className="text-3xl font-semibold mt-1">{data.profile?.display_name ?? "Operator"}</h1>
          <p className="text-sm text-muted-foreground mt-1">Live KPIs across your portfolio.</p>
        </div>
        <Link to="/partners" className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-ring">
          Open portfolio →
        </Link>
      </div>

      {/* Top KPI row */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4">
        <Tile label="Active partners" value={stats.partners.active} hint={`${stats.partners.total} total`} />
        <Tile label="Open deals" value={stats.deals.open_count} hint={fmtMoney(stats.deals.open_value)} />
        <Tile label="Won deals" value={stats.deals.won_count} hint={fmtMoney(stats.deals.won_value)} accent />
        <Tile label="Total MRR" value={fmtMoney(stats.mrr)} hint="latest snapshot" />
        <Tile label="Tasks open" value={stats.tasks.todo + stats.tasks.doing} hint={`${stats.tasks.done} done`} />
      </div>

      {/* Activity & Tasks */}
      <div className="mt-6 grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-card border border-border/60 p-6 card-elev">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Tasks in the platform</h2>
            <span className="text-xs font-mono text-muted-foreground">{stats.tasks.total} total</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <MiniStat label="To do" value={stats.tasks.todo} />
            <MiniStat label="Doing" value={stats.tasks.doing} />
            <MiniStat label="Done" value={stats.tasks.done} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <MiniStat label="Completed (30d)" value={stats.tasks.completedLast30} />
            <MiniStat label="Overdue" value={stats.tasks.overdue} danger={stats.tasks.overdue > 0} />
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border/60 p-6 card-elev">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Lead pipeline</h2>
            <Link to="/qualification" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(stats.leads.byStatus).length === 0 && (
              <p className="text-sm text-muted-foreground">No leads yet.</p>
            )}
            {Object.entries(stats.leads.byStatus).map(([status, count]) => (
              <span key={status} className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface px-3 py-1 text-xs">
                <span className="capitalize">{status.replace(/_/g, " ")}</span>
                <span className="font-mono font-semibold">{count}</span>
              </span>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <MiniStat label="Total leads" value={stats.leads.total} />
            <MiniStat label="Next 7d steps" value={stats.leads.nextWeek} />
          </div>
        </div>
      </div>

      {/* Internal PDM KPIs */}
      <div className="mt-6 rounded-2xl bg-card border border-border/60 p-6 card-elev">
        <h2 className="font-semibold">Internal PDM KPIs</h2>
        <p className="text-sm text-muted-foreground mt-1">Coverage and depth across your portfolio.</p>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          <MiniStat label="Stakeholders mapped" value={stats.stakeholders.total} hint={`${stats.stakeholders.coverage}% coverage`} />
          <MiniStat label="Diagnostics run" value={stats.assessments.total} hint={`${stats.assessments.coverage}% coverage`} />
          <MiniStat label="Avg partner maturity" value={stats.assessments.avgOverall ? stats.assessments.avgOverall.toFixed(1) : "—"} hint="/ 5.0" />
          <MiniStat label="Trained people" value={stats.trainedPeople} />
          <MiniStat label="Partners w/ docs" value={stats.documents.partnersWithDocs} hint={`of ${stats.partners.total}`} />
        </div>
      </div>

      {/* Personal OCTA Maturity (secondary) */}
      <div className="mt-10">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Personal learning</p>
            <h2 className="text-xl font-semibold mt-1">My OCTA maturity</h2>
          </div>
          <Link to="/diagnostic" className="text-xs text-primary hover:underline">{data.latest ? "Re-run diagnostic" : "Take diagnostic"} →</Link>
        </div>
      </div>
      <div className="mt-4 grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-card border border-border/60 p-4 card-elev">
          <h2 className="font-semibold px-2 pt-2">Maturity radar</h2>
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="75%">
                <PolarGrid stroke="oklch(0.4 0.02 265 / 0.4)" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: "oklch(0.85 0.01 250)", fontSize: 12, fontFamily: "Space Grotesk" }} />
                <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fill: "oklch(0.6 0.02 260)", fontSize: 10 }} />
                <Radar name="You" dataKey="score" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-3 rounded-2xl bg-card border border-border/60 p-6 card-elev">
          <h2 className="font-semibold">Your 8 axes</h2>
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            {AXES.map((a) => {
              const score = scores[a.key] ?? 0;
              const lvl = score ? levelFromAvg(score) : 0;
              const pct = data.axisCompletionPct(a.key);
              return (
                <Link
                  key={a.key}
                  to="/axis/$axisKey"
                  params={{ axisKey: a.key }}
                  className="group block rounded-xl border border-border/60 bg-surface/50 p-4 hover:bg-surface-2 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-md flex items-center justify-center font-display font-bold" style={{ background: `color-mix(in oklab, var(--${a.color}) 22%, transparent)`, color: `var(--${a.color})` }}>
                        {a.letter}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{a.name}</div>
                        <div className="text-xs text-muted-foreground">{lvl ? `Level ${lvl} / 5` : "Not assessed"}</div>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">{pct}%</span>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                    <div className="h-full" style={{ width: `${pct}%`, background: `var(--${a.color})` }} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value, hint, accent }: { label: string; value: string | number; hint?: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl bg-card border border-border/60 p-5 card-elev">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className={`mt-2 text-3xl font-display font-bold ${accent ? "text-gradient" : ""}`}>{value}</div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function MiniStat({ label, value, hint, danger }: { label: string; value: string | number; hint?: string; danger?: boolean }) {
  return (
    <div className="rounded-xl border border-border/60 bg-surface/50 p-3">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className={`mt-1 text-xl font-semibold ${danger ? "text-destructive" : ""}`}>{value}</div>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
