import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useOctoData, levelFromAvg } from "@/lib/octo-store";
import { AXES, overallLevelDescription, overallLevelLabel, xpProgressInLevel, xpToLevel } from "@/content/octo";
import { Radar, RadarChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { useEffect } from "react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — OCTO OS" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const data = useOctoData(user?.id);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  if (loading || !user) return <div className="p-10 text-muted-foreground">Loading…</div>;

  const scores = data.latest?.scores ?? {};
  const overall = data.latest?.overall ?? 0;
  const overallLvl = overall ? levelFromAvg(overall) : null;
  const playerLevel = xpToLevel(data.totalXp);
  const playerProg = xpProgressInLevel(data.totalXp);

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
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Welcome back</p>
          <h1 className="text-3xl font-semibold mt-1">{data.profile?.display_name ?? "Operator"}</h1>
        </div>
        {!data.latest && (
          <Link to="/diagnostic" className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-ring">
            Take your first diagnostic →
          </Link>
        )}
        {data.latest && (
          <Link to="/diagnostic" className="inline-flex items-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold hover:bg-surface-2">
            Re-run diagnostic
          </Link>
        )}
      </div>

      {/* KPI row */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-card border border-border/60 p-6 card-elev">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Maturity</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-5xl font-display font-bold text-gradient">{overall ? overall.toFixed(1) : "—"}</span>
            <span className="text-muted-foreground text-sm">/ 5.0</span>
          </div>
          <p className="mt-2 text-sm font-medium">{overallLvl ? `Level ${overallLvl} · ${overallLevelLabel(overall)}` : "Run the diagnostic"}</p>
          <p className="mt-1 text-xs text-muted-foreground">{overall ? overallLevelDescription(overall) : "Score appears after your first assessment."}</p>
        </div>

        <div className="rounded-2xl bg-card border border-border/60 p-6 card-elev">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Player level</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-5xl font-display font-bold">L{playerLevel}</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-surface-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[var(--octo-1)] to-[var(--octo-4)]" style={{ width: `${playerProg.pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{data.totalXp} XP total · {100 - playerProg.current} XP to L{playerLevel + 1}</p>
        </div>

        <div className="rounded-2xl bg-card border border-border/60 p-6 card-elev">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Progress</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-5xl font-display font-bold">{data.completions.length}</span>
            <span className="text-muted-foreground text-sm">/ {AXES.reduce((s, a) => s + a.lessons.length, 0)} lessons</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Keep a 3-lesson weekly streak to compound.</p>
        </div>
      </div>

      {/* Radar + Axes */}
      <div className="mt-8 grid lg:grid-cols-5 gap-4">
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

      {/* Next actions */}
      <div className="mt-8 rounded-2xl bg-card border border-border/60 p-6 card-elev">
        <h2 className="font-semibold">Next actions</h2>
        <p className="text-sm text-muted-foreground mt-1">Lowest-scoring axes are the highest leverage.</p>
        <div className="mt-4 grid sm:grid-cols-3 gap-3">
          {[...AXES]
            .map((a) => ({ a, s: scores[a.key] ?? 0 }))
            .sort((x, y) => x.s - y.s)
            .slice(0, 3)
            .map(({ a, s }) => (
              <Link key={a.key} to="/axis/$axisKey" params={{ axisKey: a.key }} className="rounded-xl border border-border/60 bg-surface/50 p-4 hover:bg-surface-2 transition">
                <div className="text-xs font-mono text-muted-foreground">Lift {a.name}</div>
                <div className="mt-1 font-medium">
                  {s ? `From level ${levelFromAvg(s)} → ${Math.min(5, levelFromAvg(s) + 1)}` : "Run diagnostic first"}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">{a.tagline}</div>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
