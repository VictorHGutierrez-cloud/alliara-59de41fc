import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { usePartner, levelFromAvg } from "../lib/partners-store";
import { AXES, type Axis } from "../content/octa";

export const Route = createFileRoute("/partner/$partnerId/axes")({
  head: () => ({ meta: [{ title: "Axes — OCTA OS" }] }),
  component: PartnerAxes,
});

function PartnerAxes() {
  const { partnerId } = Route.useParams();
  const data = usePartner(partnerId);
  const [openKey, setOpenKey] = useState<string | null>(null);

  if (data.loading) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-3">
      {AXES.map((axis) => {
        const score = data.axisScore(axis.key);
        const lvl = score ? levelFromAvg(score) : 0;
        const open = openKey === axis.key;
        const actions = data.actionsByAxis(axis.key);
        return (
          <div key={axis.key} className="rounded-2xl bg-card border border-border/60 card-elev overflow-hidden">
            <button
              onClick={() => setOpenKey(open ? null : axis.key)}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-surface-2 transition"
            >
              <div className="flex items-center gap-4">
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center font-display font-bold"
                  style={{ background: `color-mix(in oklab, var(--${axis.color}) 22%, transparent)`, color: `var(--${axis.color})` }}
                >
                  {axis.letter}
                </div>
                <div>
                  <div className="font-medium">{axis.name}</div>
                  <div className="text-xs text-muted-foreground">{axis.tagline}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-display font-bold" style={{ color: score ? `var(--${axis.color})` : undefined }}>
                    {score ? score.toFixed(1) : "—"}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground">{lvl ? `Level ${lvl}` : "Not assessed"}</div>
                </div>
                <span className="text-muted-foreground">{open ? "−" : "+"}</span>
              </div>
            </button>

            {open && (
              <div className="px-5 pb-5 border-t border-border/60">
                <AxisDetail axis={axis} myLevel={lvl} actions={actions.length} partnerId={partnerId} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AxisDetail({ axis, myLevel, actions, partnerId }: { axis: Axis; myLevel: number; actions: number; partnerId: string }) {
  return (
    <div className="mt-5 grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-5">
        <div>
          <h3 className="text-sm font-semibold">Ecosystem Mindset</h3>
          <p className="mt-1 text-sm text-muted-foreground">{axis.mentalModel}</p>
        </div>

        <ListSection title="Expansion Goals" items={axis.objectives} color={axis.color} />
        <ListSection title="Traction Levers" items={axis.levers} color={axis.color} />
        <ListSection title="Impact KPIs" items={axis.metrics} color={axis.color} />

        <div>
          <h3 className="text-sm font-semibold text-warning">Frictions & Blind Spots</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {axis.commonMistakes.map((m) => (
              <li key={m} className="flex gap-2"><span className="text-warning">✗</span><span>{m}</span></li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Real-World Plays</h3>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {axis.examples.map((e) => (
              <li key={e} className="border-l-2 pl-3" style={{ borderColor: `var(--${axis.color})` }}>{e}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl bg-surface/60 border border-border/60 p-4">
          <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Maturity Journey</h3>
          <div className="mt-3 space-y-2">
            {axis.levels.map((l) => {
              const isMe = l.level === myLevel;
              return (
                <div
                  key={l.level}
                  className={`rounded-lg border px-3 py-2 ${isMe ? "border-[var(--axis-color)] bg-[color-mix(in_oklab,var(--axis-color)_10%,transparent)]" : "border-border/60"}`}
                  style={{ ["--axis-color" as never]: `var(--${axis.color})` }}
                >
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full text-[10px] font-mono flex items-center justify-center" style={isMe ? { background: `var(--${axis.color})`, color: "var(--background)" } : { background: "var(--surface-2)" }}>
                      {l.level}
                    </span>
                    <span className="text-sm font-medium">{l.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{l.summary}</p>
                  {isMe && <p className="mt-1 text-xs"><span className="text-muted-foreground">Move to next:</span> {l.nextStep}</p>}
                </div>
              );
            })}
          </div>
        </div>

        <Link
          to="/partner/$partnerId/plan"
          params={{ partnerId }}
          className="block rounded-xl border border-border/60 bg-surface/60 p-4 hover:bg-surface-2 transition"
        >
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Joint Business Plan</div>
          <div className="mt-1 text-sm font-medium">{actions} item{actions !== 1 ? "s" : ""} on this axis</div>
          <div className="mt-1 text-xs text-muted-foreground">Open the JBP to add or update growth initiatives →</div>
        </Link>
      </div>
    </div>
  );
}

function ListSection({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div>
      <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{title}</h3>
      <ul className="mt-2 grid sm:grid-cols-2 gap-2">
        {items.map((i) => (
          <li key={i} className="text-sm flex gap-2">
            <span style={{ color: `var(--${color})` }}>▸</span><span>{i}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}