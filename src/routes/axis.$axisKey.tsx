// rev: octa-rename
import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useEffect, useId, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useOctaData, levelFromAvg } from "../lib/octa-store";
import { AXES, type Axis } from "../content/octa";
import { toast } from "sonner";
import { COPY } from "@/lib/copy";

const M = COPY.methodologyAxis;

export const Route = createFileRoute("/axis/$axisKey")({
  head: ({ params }) => {
    const a = AXES.find((x) => x.key === params.axisKey);
    return { meta: [{ title: a ? `${a.name} · Alliara` : "Axis · Alliara" }] };
  },
  component: AxisPage,
  notFoundComponent: () => (
    <div className="p-10 text-center text-muted-foreground">
      {M.notFoundTitle}{" "}
      <Link to="/dashboard" className="text-primary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
        {M.notFoundDashboardLink}
      </Link>
    </div>
  ),
});

function AxisPage() {
  const { axisKey } = Route.useParams();
  const axis = AXES.find((a) => a.key === axisKey);
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const data = useOctaData(user?.id);
  const [tab, setTab] = useState<"overview" | "levels" | "lessons">("overview");
  const tabIds = {
    overview: useId(),
    levels: useId(),
    lessons: useId(),
  };
  const panelIds = {
    overview: `${tabIds.overview}-panel`,
    levels: `${tabIds.levels}-panel`,
    lessons: `${tabIds.lessons}-panel`,
  };

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);
  if (!axis) throw notFound();
  if (loading || !user)
    return <div className="p-10 text-muted-foreground">{M.loading}</div>;

  const score = data.latest?.scores[axisKey] ?? 0;
  const myLevel = score ? levelFromAvg(score) : 0;
  const completedKeys = new Set(data.lessonsByAxis(axisKey));
  const lessonsDone = completedKeys.size;
  const lessonsTotal = axis.lessons.length;
  const pct = Math.round((lessonsDone / lessonsTotal) * 100);

  const tabs = [
    { key: "overview" as const, label: M.tabOverview },
    { key: "levels" as const, label: M.tabLevels },
    { key: "lessons" as const, label: M.tabLessons },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Header */}
      <Link
        to="/methodology"
        className="text-xs font-mono text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
      >
        ← {M.backLink}
      </Link>
      <div className="mt-3 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="h-14 w-14 rounded-xl flex items-center justify-center font-display text-2xl font-bold"
            style={{
              background: `color-mix(in oklab, var(--${axis.color}) 22%, transparent)`,
              color: `var(--${axis.color})`,
            }}
            aria-hidden
          >
            {axis.letter}
          </div>
          <div>
            <p className="text-xs font-mono uppercase tracking-widest" style={{ color: `var(--${axis.color})` }}>
              {M.axisEyebrow}
            </p>
            <h1 className="text-3xl font-semibold">{axis.name}</h1>
            <p className="text-sm text-muted-foreground">{axis.tagline}</p>
          </div>
        </div>
        <div className="flex gap-3" role="group" aria-label={M.statsGroupAriaLabel}>
          <Stat label={M.statYourLevel} value={myLevel ? `${myLevel} / 5` : "—"} />
          <Stat label={M.statLessons} value={`${lessonsDone}/${lessonsTotal}`} />
          <Stat label={M.statProgress} value={`${pct}%`} />
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 border-b border-border/60" role="tablist" aria-label="Axis sections">
        {tabs.map((t) => {
          const selected = tab === t.key;
          const panelId =
            t.key === "overview" ? panelIds.overview : t.key === "levels" ? panelIds.levels : panelIds.lessons;
          const tabId =
            t.key === "overview" ? tabIds.overview : t.key === "levels" ? tabIds.levels : tabIds.lessons;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              id={tabId}
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                selected ? "border-b-2 text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              style={selected ? { borderColor: `var(--${axis.color})` } : {}}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div
        className="mt-6"
        role="tabpanel"
        id={
          tab === "overview" ? panelIds.overview : tab === "levels" ? panelIds.levels : panelIds.lessons
        }
        aria-labelledby={
          tab === "overview" ? tabIds.overview : tab === "levels" ? tabIds.levels : tabIds.lessons
        }
      >
        {tab === "overview" && <Overview axis={axis} />}
        {tab === "levels" && <Levels axis={axis} myLevel={myLevel} />}
        {tab === "lessons" && (
          <Lessons
            axis={axis}
            completed={completedKeys}
            onComplete={async (lk) => {
              try {
                await data.completeLesson(axis.key, lk, 25);
                toast.success(M.toastLessonDone);
              } catch (e) {
                console.error("[AxisPage completeLesson]:", e);
                toast.error((e as Error).message);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface/60 border border-border/60 px-4 py-2">
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display font-semibold">{value}</div>
    </div>
  );
}

function Overview({ axis }: { axis: Axis }) {
  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 rounded-2xl bg-card border border-border/60 p-6 card-elev">
        <h2 className="font-semibold">{M.overviewSectionTitle}</h2>
        <p className="text-sm text-muted-foreground mt-2">{axis.mentalModel}</p>

        <Section title={M.sectionObjectives} items={axis.objectives} color={axis.color} />
        <Section title={M.sectionLevers} items={axis.levers} color={axis.color} />
        <Section title={M.sectionMetrics} items={axis.metrics} color={axis.color} />
      </div>
      <div className="space-y-4">
        <div className="rounded-2xl bg-card border border-border/60 p-6 card-elev">
          <h2 className="font-semibold text-warning text-lg">{M.commonMistakesTitle}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {axis.commonMistakes.map((m) => (
              <li key={m} className="flex gap-2">
                <span className="text-warning" aria-hidden>
                  ✗
                </span>
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-card border border-border/60 p-6 card-elev">
          <h2 className="font-semibold text-lg">{M.examplesTitle}</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {axis.examples.map((e) => (
              <li key={e} className="border-l-2 pl-3" style={{ borderColor: `var(--${axis.color})` }}>
                {e}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Section({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest font-mono text-xs">
        {title}
      </h3>
      <ul className="mt-2 grid sm:grid-cols-2 gap-2">
        {items.map((i) => (
          <li key={i} className="text-sm flex gap-2">
            <span style={{ color: `var(--${color})` }} aria-hidden>
              ▸
            </span>
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Levels({ axis, myLevel }: { axis: Axis; myLevel: number }) {
  return (
    <div className="space-y-3">
      <h2 className="sr-only">{M.levelsHiddenHeading}</h2>
      {axis.levels.map((l) => {
        const isMe = myLevel === l.level;
        return (
          <div
            key={l.level}
            className={`rounded-2xl border p-5 ${isMe ? "bg-card glow-ring" : "bg-card/60 border-border/60"}`}
            style={isMe ? { borderColor: `var(--${axis.color})` } : {}}
          >
            <div className="flex items-center gap-4">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center font-display font-bold"
                style={{
                  background: isMe ? `var(--${axis.color})` : "var(--surface-2)",
                  color: isMe ? "var(--background)" : "var(--foreground)",
                }}
                aria-hidden
              >
                {l.level}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">{l.name}</h3>
                  {isMe && (
                    <span
                      className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full"
                      style={{
                        background: `color-mix(in oklab, var(--${axis.color}) 25%, transparent)`,
                        color: `var(--${axis.color})`,
                      }}
                    >
                      {M.badgeYouAreHere}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{l.summary}</p>
              </div>
            </div>
            <div className="mt-4 grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{M.levelsSignals}</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {l.signals.map((s) => (
                    <li key={s} className="flex gap-2">
                      <span className="text-muted-foreground" aria-hidden>
                        •
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{M.levelsMoveNext}</p>
                <p className="mt-2 text-sm">{l.nextStep}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Lessons({
  axis,
  completed,
  onComplete,
}: {
  axis: Axis;
  completed: Set<string>;
  onComplete: (lk: string) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      <h2 className="sr-only">{M.lessonsHiddenHeading}</h2>
      {axis.lessons.map((l, i) => {
        const done = completed.has(l.key);
        const isOpen = open === l.key;
        return (
          <div key={l.key} className="rounded-2xl bg-card border border-border/60 card-elev overflow-hidden">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : l.key)}
              aria-expanded={isOpen}
              aria-controls={`lesson-body-${l.key}`}
              aria-label={M.expandLessonAria(l.title, isOpen)}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-surface-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`h-9 w-9 rounded-lg flex items-center justify-center font-display font-bold ${done ? "" : "border border-border"}`}
                  style={done ? { background: `var(--${axis.color})`, color: "var(--background)" } : {}}
                  aria-hidden
                >
                  {done ? "✓" : i + 1}
                </div>
                <div>
                  <div className="font-medium">{l.title}</div>
                  <div className="text-xs text-muted-foreground">{M.lessonMetaLine({ minutes: l.minutes, done })}</div>
                </div>
              </div>
              <span className="text-muted-foreground text-sm" aria-hidden>
                {isOpen ? "−" : "+"}
              </span>
            </button>
            {isOpen && (
              <div className="px-5 pb-5 pt-1 border-t border-border/60" id={`lesson-body-${l.key}`}>
                <p className="mt-3 text-sm">{l.body}</p>
                <div className="mt-4 rounded-xl bg-surface/60 border border-border/60 p-4">
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{M.lessonExerciseLabel}</p>
                  <p className="mt-1 text-sm">{l.exercise}</p>
                </div>
                <div className="mt-4 flex justify-end">
                  {done ? (
                    <span className="text-xs text-muted-foreground">{M.lessonCompleted}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onComplete(l.key)}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {M.markCompleteCta}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
