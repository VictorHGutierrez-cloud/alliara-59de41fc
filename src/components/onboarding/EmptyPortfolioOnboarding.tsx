import { Link } from "@tanstack/react-router";
import { COPY } from "@/lib/copy";

export function EmptyPortfolioOnboarding({ onAdd }: { onAdd: () => void }) {
  const O = COPY.onboarding;
  return (
    <div className="rounded-2xl border border-dashed border-border/60 bg-surface/40 p-8">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {O.eyebrow}
      </p>
      <h2 className="mt-2 text-lg font-semibold">{O.title}</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-xl">{O.bodyLead}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <StepCard step="1" title={O.stepAddTitle} body={O.stepAddBody} />
        <StepCard
          step="2"
          title={O.stepDiagTitleRuns({ noun: COPY.diagnostic.noun })}
          body={O.stepDiagBody}
        />
        <StepCard
          step="3"
          title={O.stepCopilotTitle({ copilot: COPY.copilot.label })}
          body={O.stepCopilotBody}
        />
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={onAdd} className="btn-candy min-h-11 px-5">
          {COPY.portfolio.addPartnerCta}
        </button>
        <Link
          to="/methodology"
          className="btn-candy-secondary min-h-11 px-5 inline-flex items-center justify-center"
        >
          {O.methodologyCta}
        </Link>
      </div>
    </div>
  );
}

function StepCard({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 card-elev">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        Step {step}
      </p>
      <p className="mt-1 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
    </div>
  );
}
