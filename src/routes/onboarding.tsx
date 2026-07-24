import { createFileRoute, Link, useNavigate, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, GraduationCap, RotateCcw } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { COPY } from "@/lib/copy";
import { ONBOARDING_STEPS, ONBOARDING_PROGRESS_KEY } from "@/content/onboarding";
import { KeptIllustration } from "@/components/brand/KeptIllustration";
import { markOnboardingFirstRunComplete } from "@/lib/onboarding-first-run";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Onboarding — Kept" },
      { name: "description", content: "Step-by-step tour of the Kept system." },
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
          <p className="page-eyebrow inline-flex items-center gap-2">
            <GraduationCap className="h-3.5 w-3.5" /> Onboarding
          </p>
          <h1 className="page-title mt-2">Get to know Kept, at your own pace</h1>
          <p className="page-subtitle mt-2 max-w-prose">
            A step-by-step tour. Skip, go back, or jump straight into any part of the app from here.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 text-right">
          <div>
            <p className="text-xs text-muted-foreground">Progress</p>
            <p className="text-2xl font-semibold text-foreground">{completed}/{total}</p>
          </div>
          <Link
            to="/academy"
            onClick={() => markOnboardingFirstRunComplete()}
            className="inline-flex min-h-10 items-center rounded-xl border border-border px-4 text-sm font-semibold hover:bg-surface-2"
          >
            {COPY.onboarding.skipToAcademy}
          </Link>
          {completed > 0 && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" /> Restart
            </button>
          )}
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary via-primary/80 to-accent transition-all duration-500"
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
                  "group relative flex items-start gap-4 overflow-hidden rounded-2xl border bg-card p-4 transition-all duration-300",
                  "hover:-translate-y-0.5 hover:border-primary/40 hover:bg-surface/80",
                  "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:p-px",
                  "before:bg-gradient-to-r before:from-primary/30 before:via-transparent before:to-transparent",
                  "before:opacity-0 before:transition-opacity before:duration-300 group-hover:before:opacity-100",
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
                  <p className="page-eyebrow">
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
          <p className="text-sm font-semibold">Stuck on a step?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Kept is always in the corner of the screen. Click it and ask anything.
          </p>
        </div>
      </div>
    </div>
  );
}