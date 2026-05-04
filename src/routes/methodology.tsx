import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useOctaData, levelFromAvg } from "@/lib/octa-store";
import { AXES, CENTRAL_MENTAL_MODEL, OCTA_FULL_NAME } from "@/content/octa";
import { ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/methodology")({
  head: () => ({
    meta: [
      { title: "OCTA Methodology — Alliara" },
      { name: "description", content: "The 8 axes of OCTA — operating model for Channel and Tech Orchestration. Browse objectives, levers, metrics, common mistakes and real-world examples." },
      { property: "og:title", content: "OCTA Methodology — 8 axes for partner orchestration" },
      { property: "og:description", content: "Diagnose and operate any B2B partnership across 8 maturity axes — strategy, trust, enablement, marketing and beyond." },
    ],
  }),
  component: MethodologyPage,
});

function MethodologyPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const data = useOctaData(user?.id);

  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [loading, user, nav]);
  if (loading || !user) return <div className="p-10 text-muted-foreground">Loading…</div>;

  const scores = data.latest?.scores ?? {};
  const diagnosed = AXES.filter((a) => (scores[a.key] ?? 0) > 0).length;
  const overall = data.latest ? Number(data.latest.overall) : 0;
  const lessonsDone = data.completions.length;
  const lessonsTotal = AXES.reduce((s, a) => s + a.lessons.length, 0);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 pb-32">
      {/* Header */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Methodology · {OCTA_FULL_NAME}
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
          The 8 axes of OCTA
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
          Every partner is a unique growth engine. Each axis below evaluates one
          dimension of partner maturity — open the axis to see objectives, levers,
          metrics, common mistakes, real examples and the 5 maturity levels.
        </p>
      </section>

      {/* Stats */}
      <section className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Overall maturity"
          value={overall ? overall.toFixed(1) : "—"}
          hint={overall ? `Level ${levelFromAvg(overall)} / 5` : "Run a diagnostic"}
          accent="primary"
        />
        <StatCard
          label="Axes diagnosed"
          value={`${diagnosed}/${AXES.length}`}
          hint={diagnosed === AXES.length ? "Full coverage" : `${AXES.length - diagnosed} pending`}
          accent="octa-3"
        />
        <StatCard
          label="Lessons completed"
          value={`${lessonsDone}`}
          hint={`${lessonsTotal} available`}
          accent="octa-5"
        />
        <StatCard
          label="XP earned"
          value={`${data.totalXp}`}
          hint="Lifetime"
          accent="octa-7"
        />
      </section>

      {/* Central mental model */}
      <section className="mt-6 rounded-2xl border border-border/60 bg-card p-6 card-elev relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full opacity-30 blur-3xl"
          style={{ background: "var(--primary)" }}
        />
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Central mental model</p>
        <h2 className="mt-1 text-lg font-semibold">An operating system for partner orchestration</h2>
        <p className="mt-3 text-sm text-foreground/85 leading-relaxed max-w-4xl whitespace-pre-line">
          {CENTRAL_MENTAL_MODEL}
        </p>
        {!data.latest && (
          <Link
            to="/diagnostic"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition shadow-[0_8px_20px_-6px_oklch(0.52_0.16_160_/_0.4)]"
          >
            Run your first diagnostic
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </section>

      {/* Axes grid */}
      <section className="mt-8">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Axes</p>
            <h2 className="mt-1 text-2xl font-semibold">Browse the 8 axes</h2>
          </div>
          <p className="text-xs text-muted-foreground">Click any card to drill into objectives, levels and lessons</p>
        </div>

        <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {AXES.map((axis) => {
            const score = scores[axis.key] ?? 0;
            const lvl = score ? levelFromAvg(score) : 0;
            const lessons = data.lessonsByAxis(axis.key).length;
            return (
              <Link
                key={axis.key}
                to="/axis/$axisKey"
                params={{ axisKey: axis.key }}
                className="group relative rounded-2xl border border-border/60 bg-card p-5 card-elev hover:-translate-y-0.5 transition overflow-hidden"
              >
                <div
                  className="pointer-events-none absolute top-0 left-0 h-1 w-full opacity-80"
                  style={{ background: `linear-gradient(90deg, var(--${axis.color}), transparent)` }}
                />
                <div className="flex items-start gap-3">
                  <div
                    className="h-12 w-12 shrink-0 rounded-xl flex items-center justify-center font-display text-xl font-bold"
                    style={{
                      background: `color-mix(in oklab, var(--${axis.color}) 22%, transparent)`,
                      color: `var(--${axis.color})`,
                    }}
                  >
                    {axis.letter}
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-[10px] font-mono uppercase tracking-widest"
                      style={{ color: `var(--${axis.color})` }}
                    >
                      Axis {axis.letter}
                    </p>
                    <h3 className="text-base font-semibold leading-tight truncate">{axis.name}</h3>
                  </div>
                </div>

                <p className="mt-3 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {axis.tagline}
                </p>

                {/* Objectives preview */}
                <ul className="mt-3 space-y-1.5">
                  {axis.objectives.slice(0, 3).map((o) => (
                    <li key={o} className="text-xs text-foreground/80 flex gap-2">
                      <span style={{ color: `var(--${axis.color})` }} className="mt-0.5">▸</span>
                      <span className="line-clamp-1">{o}</span>
                    </li>
                  ))}
                </ul>

                {/* Score bar */}
                <div className="mt-4 pt-3 border-t border-border/40">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    <span>Your level</span>
                    <span>{lessons > 0 ? `${lessons}/${axis.lessons.length} lessons` : `${axis.lessons.length} lessons`}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: score ? `${(score / 5) * 100}%` : "0%",
                          background: `var(--${axis.color})`,
                        }}
                      />
                    </div>
                    <span
                      className={`font-mono text-sm tabular-nums ${score ? "text-foreground" : "text-muted-foreground/50"}`}
                    >
                      {score ? `${lvl}/5` : "—"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition">
                  Open axis
                  <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label, value, hint, accent,
}: {
  label: string; value: string; hint: string; accent: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 card-elev relative overflow-hidden">
      <div
        className="absolute top-0 left-0 h-0.5 w-full"
        style={{ background: `linear-gradient(90deg, var(--${accent}), transparent)` }}
      />
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1.5 text-2xl font-display font-bold text-foreground">{value}</div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>
    </div>
  );
}