import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useOctaData, levelFromAvg } from "@/lib/octa-store";
import { AXES, type Axis } from "@/content/octa";
import { toast } from "sonner";

export const Route = createFileRoute("/axis/$axisKey")({
  head: ({ params }) => {
    const a = AXES.find((x) => x.key === params.axisKey);
    return { meta: [{ title: a ? `${a.name} — OCTA OS` : "Axis — OCTA OS" }] };
  },
  component: AxisPage,
  notFoundComponent: () => (
    <div className="p-10 text-center text-muted-foreground">
      Axis not found. <Link to="/dashboard" className="text-primary underline">Back to dashboard</Link>
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

  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [loading, user, nav]);
  if (!axis) throw notFound();
  if (loading || !user) return <div className="p-10 text-muted-foreground">Loading…</div>;

  const score = data.latest?.scores[axisKey] ?? 0;
  const myLevel = score ? levelFromAvg(score) : 0;
  const completedKeys = new Set(data.lessonsByAxis(axisKey));
  const lessonsDone = completedKeys.size;
  const lessonsTotal = axis.lessons.length;
  const pct = Math.round((lessonsDone / lessonsTotal) * 100);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Header */}
      <Link to="/dashboard" className="text-xs font-mono text-muted-foreground hover:text-foreground">← Dashboard</Link>
      <div className="mt-3 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl flex items-center justify-center font-display text-2xl font-bold" style={{ background: `color-mix(in oklab, var(--${axis.color}) 22%, transparent)`, color: `var(--${axis.color})` }}>
            {axis.letter}
          </div>
          <div>
            <p className="text-xs font-mono uppercase tracking-widest" style={{ color: `var(--${axis.color})` }}>OCTA axis</p>
            <h1 className="text-3xl font-semibold">{axis.name}</h1>
            <p className="text-sm text-muted-foreground">{axis.tagline}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Stat label="Your level" value={myLevel ? `${myLevel} / 5` : "—"} />
          <Stat label="Lessons" value={`${lessonsDone}/${lessonsTotal}`} />
          <Stat label="Progress" value={`${pct}%`} />
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 border-b border-border/60">
        {(["overview", "levels", "lessons"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm capitalize transition ${tab === t ? "border-b-2 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            style={tab === t ? { borderColor: `var(--${axis.color})` } : {}}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "overview" && <Overview axis={axis} />}
        {tab === "levels" && <Levels axis={axis} myLevel={myLevel} />}
        {tab === "lessons" && (
          <Lessons
            axis={axis}
            completed={completedKeys}
            onComplete={async (lk) => {
              try {
                await data.completeLesson(axis.key, lk, 25);
                toast.success("+25 XP · Lesson complete");
              } catch (e) {
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
        <h2 className="font-semibold">Mental model</h2>
        <p className="text-sm text-muted-foreground mt-2">{axis.mentalModel}</p>

        <Section title="Objectives" items={axis.objectives} color={axis.color} />
        <Section title="Key levers" items={axis.levers} color={axis.color} />
        <Section title="Metrics that matter" items={axis.metrics} color={axis.color} />
      </div>
      <div className="space-y-4">
        <div className="rounded-2xl bg-card border border-border/60 p-6 card-elev">
          <h3 className="font-semibold text-warning">Common mistakes</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {axis.commonMistakes.map((m) => (
              <li key={m} className="flex gap-2"><span className="text-warning">✗</span><span>{m}</span></li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-card border border-border/60 p-6 card-elev">
          <h3 className="font-semibold">Examples in the wild</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {axis.examples.map((e) => <li key={e} className="border-l-2 pl-3" style={{ borderColor: `var(--${axis.color})` }}>{e}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Section({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest font-mono text-xs">{title}</h3>
      <ul className="mt-2 grid sm:grid-cols-2 gap-2">
        {items.map((i) => (
          <li key={i} className="text-sm flex gap-2">
            <span style={{ color: `var(--${color})` }}>▸</span>
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
      {axis.levels.map((l) => {
        const isMe = myLevel === l.level;
        return (
          <div
            key={l.level}
            className={`rounded-2xl border p-5 ${isMe ? "bg-card glow-ring" : "bg-card/60 border-border/60"}`}
            style={isMe ? { borderColor: `var(--${axis.color})` } : {}}
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full flex items-center justify-center font-display font-bold" style={{ background: isMe ? `var(--${axis.color})` : "var(--surface-2)", color: isMe ? "var(--background)" : "var(--foreground)" }}>
                {l.level}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{l.name}</h3>
                  {isMe && <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: `color-mix(in oklab, var(--${axis.color}) 25%, transparent)`, color: `var(--${axis.color})` }}>You are here</span>}
                </div>
                <p className="text-sm text-muted-foreground">{l.summary}</p>
              </div>
            </div>
            <div className="mt-4 grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Signals</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {l.signals.map((s) => <li key={s} className="flex gap-2"><span className="text-muted-foreground">•</span>{s}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Move to next</p>
                <p className="mt-2 text-sm">{l.nextStep}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Lessons({ axis, completed, onComplete }: { axis: Axis; completed: Set<string>; onComplete: (lk: string) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      {axis.lessons.map((l, i) => {
        const done = completed.has(l.key);
        const isOpen = open === l.key;
        return (
          <div key={l.key} className="rounded-2xl bg-card border border-border/60 card-elev overflow-hidden">
            <button onClick={() => setOpen(isOpen ? null : l.key)} className="w-full p-5 flex items-center justify-between text-left hover:bg-surface-2 transition">
              <div className="flex items-center gap-4">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center font-display font-bold ${done ? "" : "border border-border"}`} style={done ? { background: `var(--${axis.color})`, color: "var(--background)" } : {}}>
                  {done ? "✓" : i + 1}
                </div>
                <div>
                  <div className="font-medium">{l.title}</div>
                  <div className="text-xs text-muted-foreground">{l.minutes} min · +25 XP {done && "· completed"}</div>
                </div>
              </div>
              <span className="text-muted-foreground text-sm">{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen && (
              <div className="px-5 pb-5 pt-1 border-t border-border/60">
                <p className="mt-3 text-sm">{l.body}</p>
                <div className="mt-4 rounded-xl bg-surface/60 border border-border/60 p-4">
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Exercise</p>
                  <p className="mt-1 text-sm">{l.exercise}</p>
                </div>
                <div className="mt-4 flex justify-end">
                  {done ? (
                    <span className="text-xs text-muted-foreground">Completed</span>
                  ) : (
                    <button onClick={() => onComplete(l.key)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
                      Mark complete · +25 XP
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
