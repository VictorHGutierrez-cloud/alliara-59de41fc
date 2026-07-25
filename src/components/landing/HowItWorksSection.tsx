import { Link } from "@tanstack/react-router";
import { KeptKeptaDuoIllustration, type KeptKeptaDuoVariant } from "@/components/brand/KeptKeptaDuoIllustration";
import { COPY } from "@/lib/copy";

const STEPS: {
  step: string;
  title: string;
  body: string;
  variant: KeptKeptaDuoVariant;
  to: string;
}[] = [
  {
    step: "01",
    title: COPY.landing.howStep1Title,
    body: COPY.landing.howStep1Body,
    variant: "welcomeAcademy",
    to: "/signup",
  },
  {
    step: "02",
    title: COPY.landing.howStep2Title,
    body: COPY.landing.howStep2Body,
    variant: "coachDealHelp",
    to: "/signup",
  },
  {
    step: "03",
    title: COPY.landing.howStep3Title,
    body: COPY.landing.howStep3Body,
    variant: "learningTracks",
    to: "/signup",
  },
];

export function HowItWorksSection() {
  return (
    <section className="border-y border-border bg-surface-2/50 px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="page-eyebrow text-center">{COPY.landing.howEyebrow}</p>
        <h2 className="mt-2 text-center section-title text-2xl sm:text-3xl">{COPY.landing.howTitle}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center section-subtitle">{COPY.landing.howIntro}</p>

        <ol className="mt-12 grid gap-8 lg:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.step} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
              <KeptKeptaDuoIllustration
                variant={s.variant}
                className="h-36 w-full object-cover border-b border-border/60 sm:h-40"
                decorative
              />
              <div className="flex flex-1 flex-col p-6">
                <span className="page-eyebrow text-brand-pink">{s.step}</span>
                <h3 className="mt-2 text-lg font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                <Link
                  to={s.to}
                  search={{}}
                  className="mt-5 inline-flex min-h-10 items-center text-sm font-semibold text-foreground hover:underline"
                >
                  {COPY.landing.howStepCta}
                </Link>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
