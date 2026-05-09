import { Link } from "@tanstack/react-router";
import { COPY } from "@/lib/copy";
import { KeptIllustration } from "@/components/brand/KeptIllustration";

export function EmptyPortfolioOnboarding({ onAdd }: { onAdd: () => void }) {
  const O = COPY.onboarding;
  const T = COPY.introTour;
  return (
    <div className="rounded-2xl border border-dashed border-border/60 bg-surface/40 p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            {O.eyebrow}
          </p>
          <h2 className="mt-2 text-lg font-semibold">{O.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl">{O.bodyLead}</p>
          <p className="mt-3 text-sm text-muted-foreground max-w-xl">
            {T.emptyPortfolioHint}{" "}
            <Link to="/intro" className="font-medium text-primary underline-offset-4 hover:underline">
              {T.emptyPortfolioCta}
            </Link>
          </p>
        </div>
        <KeptIllustration variant="bringsCalm" className="mx-auto h-[112px] w-auto shrink-0 object-contain opacity-95 sm:mx-0" decorative />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <StepCard step="1" title={O.stepAddTitle} body={O.stepAddBody} />
        <StepCard
          step="2"
          title={O.stepDiagTitleRuns({ noun: COPY.diagnostic.noun })}
          body={O.stepDiagBody}
        />
        <StepCard
          step="3"
          title={O.stepKeptTitle({ kept: COPY.kept.label })}
          body={O.stepKeptBody}
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
