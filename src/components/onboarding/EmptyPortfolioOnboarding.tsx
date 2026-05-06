import { Link } from "@tanstack/react-router";
import { COPY } from "@/lib/copy";

export function EmptyPortfolioOnboarding({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/60 bg-surface/40 p-8">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Start in 3 steps</p>
      <h2 className="mt-2 text-lg font-semibold">Your portfolio is empty. Let's create momentum.</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <StepCard step="1" title="Add partner" body="Create your first partner workspace to start tracking progress." />
        <StepCard step="2" title={`Run ${COPY.diagnostic.noun}`} body="Score the 8 OCTA axes and reveal the maturity gap." />
        <StepCard step="3" title={`See ${COPY.copilot.label}`} body={`Open ${COPY.copilot.label} and convert the gap into next ${COPY.jbp.itemPlural.toLowerCase()}.`} />
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={onAdd} className="btn-candy">+ Add partner</button>
        <Link to="/methodology" className="btn-candy-secondary">
          Review OCTO Methodology
        </Link>
      </div>
    </div>
  );
}

function StepCard({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 card-elev">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Step {step}</p>
      <p className="mt-1 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
    </div>
  );
}
