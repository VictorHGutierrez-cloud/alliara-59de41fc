import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useOctaData, levelFromAvg } from "@/lib/octa-store";
import { usePortfolio } from "@/lib/partners-store";
import { AXES, CENTRAL_MENTAL_MODEL } from "@/content/octa";
import { ArrowRight, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  COPY,
  methodologyLessonsBadge,
  methodologyPortfolioLevelHint,
  methodologyStatLessonsTotalHint,
} from "@/lib/copy";
import { KeptIllustration } from "@/components/brand/KeptIllustration";

export const Route = createFileRoute("/methodology")({
  head: () => ({
    meta: [
      { title: COPY.methodology.pageMetaTitle },
      { name: "description", content: COPY.methodology.pageMetaDescription },
      { property: "og:title", content: COPY.methodology.ogTitle },
      { property: "og:description", content: COPY.methodology.ogDescription },
    ],
  }),
  component: MethodologyPage,
});

function MethodologyPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const data = useOctaData(user?.id);
  const portfolio = usePortfolio(user?.id);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);
  if (loading || !user || portfolio.loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const scores = data.latest?.scores ?? {};
  const diagnosed = AXES.filter((a) => (scores[a.key] ?? 0) > 0).length;
  const overall = data.latest ? Number(data.latest.overall) : 0;
  const lessonsDone = data.completions.length;
  const lessonsTotal = AXES.reduce((s, a) => s + a.lessons.length, 0);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 pb-32">
      {/* Header */}
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              {COPY.methodology.eyebrowSuffix}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            {COPY.methodology.pageTitle}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
            {COPY.methodology.intro}
          </p>
        </div>
        <KeptIllustration
          variant="idleAllClear"
          className="mx-auto h-[118px] w-auto shrink-0 object-contain opacity-95 lg:mx-0"
          decorative
        />
      </section>

      {/* Stats */}
      <section className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label={COPY.methodology.statOverallLabel}
          value={overall ? overall.toFixed(1) : "—"}
          hint={
            overall
              ? methodologyPortfolioLevelHint(levelFromAvg(overall))
              : COPY.methodology.statsRunDiagnosticHint
          }
          accent="primary"
        />
        <StatCard
          label={COPY.methodology.statAxesLabel}
          value={`${diagnosed}/${AXES.length}`}
          hint={
            diagnosed === AXES.length
              ? COPY.methodology.statsFullCoverageHint
              : COPY.methodology.statsPendingAxes.replace("{n}", String(AXES.length - diagnosed))
          }
          accent="octa-3"
        />
        <StatCard
          label={COPY.methodology.statLessonsLabel}
          value={`${lessonsDone}`}
          hint={methodologyStatLessonsTotalHint(lessonsTotal)}
          accent="octa-5"
        />
        <StatCard
          label={COPY.methodology.statXpLabel}
          value={`${data.totalXp}`}
          hint={COPY.methodology.statXpHint}
          accent="octa-7"
        />
      </section>

      {/* Central mental model */}
      <section className="mt-6 rounded-2xl border border-border/60 bg-card p-6 card-elev relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full opacity-30 blur-3xl"
          style={{ background: "var(--primary)" }}
        />
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {COPY.methodology.centralModelEyebrow}
        </p>
        <h2 className="mt-1 text-lg font-semibold">{COPY.methodology.centralModelTitle}</h2>
        <p className="mt-3 text-sm text-foreground/85 leading-relaxed max-w-4xl whitespace-pre-line">
          {CENTRAL_MENTAL_MODEL}
        </p>
        {!data.latest && (
          <Link
            to={portfolio.items.length === 0 ? "/partners" : "/diagnostic"}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition shadow-[0_8px_20px_-6px_oklch(0.52_0.16_160_/_0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {portfolio.items.length === 0
              ? COPY.methodology.ctaFirstPartner
              : COPY.methodology.ctaFirstDiag}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        )}
      </section>

      {/* Axes grid */}
      <section className="mt-8">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              {COPY.methodology.axesSectionEyebrow}
            </p>
            <h2 className="mt-1 text-2xl font-semibold">{COPY.methodology.axesSectionTitle}</h2>
          </div>
          <p className="text-xs text-muted-foreground">{COPY.methodology.axesSectionHint}</p>
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
                aria-label={COPY.methodology.axisCardAriaLabel(axis.name)}
                className="group relative rounded-2xl border border-border/60 bg-card p-5 card-elev hover:-translate-y-0.5 transition overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <div
                  className="pointer-events-none absolute top-0 left-0 h-1 w-full opacity-80"
                  style={{
                    background: `linear-gradient(90deg, var(--${axis.color}), transparent)`,
                  }}
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
                      {COPY.methodology.axisLetterEyebrow(axis.letter)}
                    </p>
                    <h3 className="text-base font-semibold leading-tight truncate">{axis.name}</h3>
                    <p className="mt-1 text-[10px] text-muted-foreground leading-snug line-clamp-2">
                      {COPY.methodology.bookChapterLine({
                        n: String(axis.bookChapterIndex),
                        titlePt: axis.bookPrognosisTitlePt,
                        aspect: axis.bookAspectPt,
                      })}
                      {axis.bookRelatedPrognosisPt ? ` · also: ${axis.bookRelatedPrognosisPt}` : ""}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {axis.tagline}
                </p>

                {/* Objectives preview */}
                <ul className="mt-3 space-y-1.5">
                  {axis.objectives.slice(0, 3).map((o) => (
                    <li key={o} className="text-xs text-foreground/80 flex gap-2">
                      <span style={{ color: `var(--${axis.color})` }} className="mt-0.5" aria-hidden>
                        ▸
                      </span>
                      <span className="line-clamp-1">{o}</span>
                    </li>
                  ))}
                </ul>

                {/* Score bar */}
                <div className="mt-4 pt-3 border-t border-border/40">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    <span>{COPY.methodology.yourLevel}</span>
                    <span>{methodologyLessonsBadge(lessons, axis.lessons.length)}</span>
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
                  {COPY.methodology.openAxisCta}
                  <ArrowRight className="h-3 w-3" aria-hidden />
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
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 card-elev relative overflow-hidden">
      <div
        className="absolute top-0 left-0 h-0.5 w-full"
        style={{ background: `linear-gradient(90deg, var(--${accent}), transparent)` }}
      />
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-display font-bold text-foreground">{value}</div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>
    </div>
  );
}
