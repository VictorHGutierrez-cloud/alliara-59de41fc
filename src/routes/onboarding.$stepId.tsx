import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowLeft, ArrowRight, Check, ExternalLink } from "lucide-react";
import { ONBOARDING_STEPS, ONBOARDING_PROGRESS_KEY } from "@/content/onboarding";
import { KeptIllustration } from "@/components/brand/KeptIllustration";

export const Route = createFileRoute("/onboarding/$stepId")({
  head: ({ params }) => {
    const step = ONBOARDING_STEPS.find((s) => s.id === params.stepId);
    return {
      meta: [
        { title: step ? `${step.title} — Onboarding Alliara` : "Onboarding — Alliara" },
        { name: "description", content: step?.summary ?? "Tour da Alliara." },
      ],
    };
  },
  component: OnboardingStepPage,
  notFoundComponent: () => (
    <div className="page-shell">
      <p className="text-sm text-muted-foreground">Passo não encontrado.</p>
      <Link to="/onboarding" className="mt-3 inline-block text-sm text-primary underline-offset-4 hover:underline">
        Voltar ao tour
      </Link>
    </div>
  ),
});

function markDone(id: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(ONBOARDING_PROGRESS_KEY);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    if (!arr.includes(id)) {
      arr.push(id);
      localStorage.setItem(ONBOARDING_PROGRESS_KEY, JSON.stringify(arr));
    }
  } catch {
    /* ignore */
  }
}

function OnboardingStepPage() {
  const { stepId } = Route.useParams();
  const nav = useNavigate();
  const idx = ONBOARDING_STEPS.findIndex((s) => s.id === stepId);
  if (idx === -1) throw notFound();
  const step = ONBOARDING_STEPS[idx];
  const prev = idx > 0 ? ONBOARDING_STEPS[idx - 1] : null;
  const next = idx < ONBOARDING_STEPS.length - 1 ? ONBOARDING_STEPS[idx + 1] : null;

  useEffect(() => {
    markDone(step.id);
  }, [step.id]);

  return (
    <div className="page-shell max-w-4xl space-y-8">
      <Link
        to="/onboarding"
        className="text-xs font-mono text-muted-foreground hover:text-foreground inline-flex items-center gap-1 min-h-11"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Tour
      </Link>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-mono">
          {String(step.index).padStart(2, "0")} / {String(ONBOARDING_STEPS.length).padStart(2, "0")}
        </span>
        <span>·</span>
        <span className="uppercase tracking-widest font-mono text-[10px]">{step.eyebrow}</span>
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_220px] md:items-start">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold leading-tight text-foreground">{step.title}</h1>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">{step.summary}</p>

          <div className="mt-6 rounded-2xl border border-border/70 bg-card p-5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              O que isso significa pra você
            </p>
            <ul className="mt-3 space-y-2">
              {step.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {step.cta ? (
            <a
              href={step.cta.to}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground glow-ring"
            >
              {step.cta.label} <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
        </div>

        <div className="md:sticky md:top-24">
          <div className="rounded-2xl border border-border/70 bg-surface/60 p-4 flex items-center justify-center">
            <KeptIllustration
              variant={step.variant}
              className="h-40 w-auto object-contain"
              decorative
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-5">
        {prev ? (
          <Link
            to="/onboarding/$stepId"
            params={{ stepId: prev.id }}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border/70 bg-card px-4 text-sm font-medium text-foreground hover:bg-surface"
          >
            <ArrowLeft className="h-4 w-4" /> {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <button
            type="button"
            onClick={() => void nav({ to: "/onboarding/$stepId", params: { stepId: next.id } })}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground glow-ring"
          >
            Próximo: {next.title} <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <Link
            to="/onboarding"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground glow-ring"
          >
            Concluir tour <Check className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}