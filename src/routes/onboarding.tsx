import { createFileRoute, Link, useNavigate, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, GraduationCap, RotateCcw } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ONBOARDING_STEPS, ONBOARDING_PROGRESS_KEY } from "@/content/onboarding";
import { KeptIllustration } from "@/components/brand/KeptIllustration";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Onboarding — Alliara" },
      { name: "description", content: "Tour passo a passo do sistema Alliara." },
    ],
  }),
  component: OnboardingLayout,
});

function readDone(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(ONBOARDING_PROGRESS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function OnboardingLayout() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [done, setDone] = useState<Set<string>>(() => readDone());

  useEffect(() => {
    if (!loading && !user) void nav({ to: "/login" });
  }, [loading, user, nav]);

  // Re-read progress on path change so the index reflects newly visited steps.
  useEffect(() => {
    setDone(readDone());
  }, [path]);

  const total = ONBOARDING_STEPS.length;
  const completed = useMemo(
    () => ONBOARDING_STEPS.filter((s) => done.has(s.id)).length,
    [done],
  );

  const isIndex = path === "/onboarding" || path === "/onboarding/";

  if (!isIndex) {
    // Sub-route renders its own layout.
    return <Outlet />;
  }

  function reset() {
    try {
      localStorage.removeItem(ONBOARDING_PROGRESS_KEY);
    } catch {
      /* ignore */
    }
    setDone(new Set());
  }

  return (
    <div className="page-shell max-w-4xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground inline-flex items-center gap-2">
            <GraduationCap className="h-3.5 w-3.5" /> Onboarding
          </p>
          <h1 className="page-title mt-2">Conheça a Alliara, no seu ritmo</h1>
          <p className="page-subtitle mt-2 max-w-prose">
            Um tour passo a passo. Você pode pular, voltar, ou abrir cada parte do app direto daqui.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Progresso</p>
          <p className="text-2xl font-semibold text-foreground">{completed}/{total}</p>
          {completed > 0 && (
            <button
              type="button"
              onClick={reset}
              className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" /> Recomeçar
            </button>
          )}
        </div>
      </div>

      <div className="h-1.5 w-full rounded-full bg-surface overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${(completed / total) * 100}%` }}
        />
      </div>

      <ol className="space-y-3">
        {ONBOARDING_STEPS.map((s) => {
          const isDone = done.has(s.id);
          return (
            <li key={s.id}>
              <Link
                to="/onboarding/$stepId"
                params={{ stepId: s.id }}
                className={cn(
                  "group flex items-start gap-4 rounded-2xl border bg-card p-4 transition hover:border-primary/40 hover:bg-surface/80",
                  isDone ? "border-primary/30" : "border-border/70",
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                    isDone
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface text-muted-foreground border border-border/70",
                  )}
                >
                  {isDone ? <Check className="h-4 w-4" /> : s.index}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    {s.eyebrow}
                  </p>
                  <p className="mt-0.5 text-base font-semibold text-foreground">{s.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{s.summary}</p>
                </div>
                <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
              </Link>
            </li>
          );
        })}
      </ol>

      <div className="rounded-2xl border border-dashed border-border/60 bg-surface/40 p-5 flex items-start gap-4">
        <KeptIllustration variant="bringsCalm" className="h-16 w-auto shrink-0 object-contain" decorative />
        <div className="min-w-0">
          <p className="text-sm font-semibold">Travou em algum passo?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            O Kept está sempre no canto da tela. Clique nele e escolha “Faça uma pergunta”.
          </p>
        </div>
      </div>
    </div>
  );
}