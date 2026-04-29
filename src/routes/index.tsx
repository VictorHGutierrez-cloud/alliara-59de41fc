import { createFileRoute, Link } from "@tanstack/react-router";
import { AXES, CENTRAL_MENTAL_MODEL } from "@/content/octa";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OCTA OS — Build a partner ecosystem that compounds" },
      { name: "description", content: "An interactive operating system for B2B partnership teams. Diagnose maturity across 8 OCTA axes and execute the next move." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface/60 px-3 py-1 text-xs font-mono text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          The Partnership Operating System
        </div>
        <h1 className="mt-6 text-5xl sm:text-7xl font-bold tracking-tight">
          <span className="text-gradient">Partnerships</span>
          <br /> as a growth engine.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          OCTA OS turns the OCTA methodology into an interactive system for B2B partnership teams.
          Diagnose maturity across 8 axes. Execute the next right move. Compound.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/signup" className="inline-flex items-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground glow-ring hover:opacity-90">
            Start free diagnostic →
          </Link>
          <Link to="/login" className="inline-flex items-center rounded-lg border border-border bg-surface px-5 py-3 text-sm font-semibold hover:bg-surface-2">
            Sign in
          </Link>
        </div>

        <p className="mx-auto mt-16 max-w-2xl text-sm text-muted-foreground italic">
          “{CENTRAL_MENTAL_MODEL}”
        </p>
      </section>

      {/* 8 axes grid */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">The system</p>
            <h2 className="text-3xl font-semibold mt-2">8 OCTA axes</h2>
          </div>
          <p className="hidden sm:block max-w-sm text-sm text-muted-foreground">
            Each axis is a discipline. Each discipline has 5 maturity levels, lessons, metrics, and common mistakes.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {AXES.map((a) => (
            <div key={a.key} className="card-elev rounded-2xl bg-card p-5 border border-border/60 group hover:-translate-y-0.5 transition" style={{ ["--axis-color" as never]: `var(--${a.color})` }}>
              <div className="flex items-center justify-between">
                <div className="h-9 w-9 rounded-lg flex items-center justify-center font-display font-bold text-lg" style={{ background: `color-mix(in oklab, var(--${a.color}) 22%, transparent)`, color: `var(--${a.color})` }}>
                  {a.letter}
                </div>
                <span className="text-xs font-mono text-muted-foreground">0{AXES.indexOf(a) + 1}</span>
              </div>
              <h3 className="mt-4 font-semibold">{a.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{a.tagline}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What you get */}
      <section className="mx-auto max-w-7xl px-6 pb-24 grid md:grid-cols-3 gap-4">
        {[
          { t: "Diagnose maturity", d: "A guided assessment scores your team 1–5 across all 8 axes and produces a radar map." },
          { t: "Learn by axis", d: "Bite-sized lessons, exercises, and common pitfalls — sequenced by your current level." },
          { t: "Earn progress", d: "Complete lessons, gain XP, climb player levels, watch your maturity score rise." },
        ].map((f) => (
          <div key={f.t} className="rounded-2xl bg-surface/60 p-6 border border-border/60">
            <h3 className="font-semibold">{f.t}</h3>
            <p className="text-sm text-muted-foreground mt-2">{f.d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
