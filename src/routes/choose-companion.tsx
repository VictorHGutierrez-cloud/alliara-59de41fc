import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { COPY } from "@/lib/copy";
import { COMPANION_META, type CompanionId } from "@/lib/companion";
import { useCompanion } from "@/lib/companion-context";
import { CompanionIllustration } from "@/components/brand/CompanionIllustration";
import { KeptKeptaDuoIllustration } from "@/components/brand/KeptKeptaDuoIllustration";
import { AcademyAuthSkeleton } from "@/components/academy/AcademyAuthSkeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/choose-companion")({
  head: () => ({ meta: [{ title: COPY.companion.pageMetaTitle }] }),
  component: ChooseCompanionPage,
});

function ChooseCompanionPage() {
  const { user, loading, accessStatus } = useAuth();
  const nav = useNavigate();
  const { setCompanion, hasChosen } = useCompanion();
  const [selected, setSelected] = useState<CompanionId | null>(null);

  useEffect(() => {
    if (!loading && !user) void nav({ to: "/login", replace: true });
  }, [loading, user, nav]);

  useEffect(() => {
    if (!loading && accessStatus && accessStatus !== "approved") {
      void nav({ to: "/pending-approval", replace: true });
    }
  }, [loading, accessStatus, nav]);

  useEffect(() => {
    if (!loading && hasChosen && user && accessStatus === "approved") {
      void nav({ to: "/onboarding/$stepId", params: { stepId: "welcome" }, replace: true });
    }
  }, [loading, hasChosen, user, accessStatus, nav]);

  if (loading || !user) return <AcademyAuthSkeleton />;

  function continueWithChoice() {
    if (!selected) return;
    setCompanion(selected);
    void nav({ to: "/onboarding/$stepId", params: { stepId: "welcome" }, replace: true });
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 pb-32">
      <div className="text-center">
        <p className="page-eyebrow">{COPY.companion.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {COPY.companion.title}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground leading-relaxed">
          {COPY.companion.intro}
        </p>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-surface-2/50 p-2">
        <KeptKeptaDuoIllustration
          variant="welcomeAcademy"
          className="max-h-48 w-full object-cover sm:max-h-56"
          decorative
          imageLoading="eager"
        />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {(["kept", "kepta"] as const).map((id) => {
          const meta = COMPANION_META[id];
          const isSelected = selected === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setSelected(id)}
              className={cn(
                "relative flex flex-col items-center rounded-2xl border bg-card p-6 text-left transition",
                "hover:border-foreground/25 hover:shadow-sm",
                isSelected
                  ? "border-foreground ring-2 ring-foreground/10"
                  : "border-border",
              )}
            >
              {isSelected ? (
                <span className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background">
                  <Check className="h-4 w-4" aria-hidden />
                </span>
              ) : null}
              <CompanionIllustration
                forceCompanion={id}
                variant="bringsCalm"
                className="h-32 w-auto"
                decorative
                imageLoading="eager"
              />
              <p className="mt-4 text-lg font-semibold">{meta.name}</p>
              <p className="text-xs font-medium text-brand-pink">{meta.tagline}</p>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{meta.description}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">
        <button
          type="button"
          disabled={!selected}
          onClick={continueWithChoice}
          className="inline-flex min-h-12 w-full max-w-sm items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-40 sm:w-auto"
        >
          {COPY.companion.continueCta}
        </button>
        <p className="text-xs text-muted-foreground text-center max-w-sm">{COPY.companion.changeHint}</p>
      </div>
    </div>
  );
}
