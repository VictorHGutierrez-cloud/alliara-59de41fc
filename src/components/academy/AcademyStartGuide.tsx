import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { KeptIllustration } from "@/components/brand/KeptIllustration";
import { COPY } from "@/lib/copy";

const STEPS = [
  { n: 1, title: COPY.academy.startStep1Title, body: COPY.academy.startStep1Body, to: "/onboarding/$stepId" as const, params: { stepId: "welcome" } },
  { n: 2, title: COPY.academy.startStep2Title, body: COPY.academy.startStep2Body, to: "/academy/learn" as const },
  { n: 3, title: COPY.academy.startStep3Title, body: COPY.academy.startStep3Body, to: "/academy/ask" as const },
] as const;

export function AcademyStartGuide() {
  return (
    <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="page-eyebrow">{COPY.academy.startGuideEyebrow}</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">{COPY.academy.startGuideTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{COPY.academy.startGuideBody}</p>
          <ol className="mt-5 space-y-3">
            {STEPS.map((s) => (
              <li key={s.n}>
                <Link
                  to={s.to}
                  params={"params" in s ? s.params : undefined}
                  className="group flex items-start gap-3 rounded-xl border border-border/80 bg-background p-3 transition hover:border-border hover:bg-surface-2"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
                    {s.n}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{s.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{s.body}</p>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
                </Link>
              </li>
            ))}
          </ol>
        </div>
        <KeptIllustration variant="bringsCalm" className="mx-auto h-28 w-auto sm:mx-0 sm:h-32" decorative />
      </div>
    </section>
  );
}
