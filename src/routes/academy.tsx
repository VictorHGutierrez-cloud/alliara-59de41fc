import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, GraduationCap, MessageCircleQuestion, Newspaper, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { COPY } from "@/lib/copy";
import { LMS_TRACKS, SALES_LIBRARY } from "@/content/sales-library";
import { KeptIllustration } from "@/components/brand/KeptIllustration";
import { loadLastStudy } from "@/lib/academy-progress";
import { AcademyAuthSkeleton } from "@/components/academy/AcademyAuthSkeleton";
import { CalloutBanner } from "@/components/ui/callout-banner";
import { FeatureHubCard } from "@/components/ui/feature-hub-card";
import {
  isOnboardingFirstRunComplete,
  markOnboardingFirstRunComplete,
} from "@/lib/onboarding-first-run";

export const Route = createFileRoute("/academy")({
  head: () => ({
    meta: [
      { title: COPY.academy.pageMetaTitle },
      { name: "description", content: COPY.academy.pageMetaDescription },
    ],
  }),
  component: AcademyLayout,
});

function AcademyLayout() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isIndex = path === "/academy" || path === "/academy/";

  useEffect(() => {
    if (!loading && !user) void nav({ to: "/login" });
  }, [loading, user, nav]);

  if (loading || !user) return <AcademyAuthSkeleton />;

  if (!isIndex) return <Outlet />;

  return <AcademyHomePage />;
}

function AcademyHomePage() {
  const { accessStatus } = useAuth();
  const nav = useNavigate();
  const trackAvailable = LMS_TRACKS.filter((t) => t.status === "available").length;
  const [lastStudy, setLastStudy] = useState(() => loadLastStudy());
  const [showTourBanner, setShowTourBanner] = useState(
    () => !isOnboardingFirstRunComplete(),
  );

  useEffect(() => {
    setLastStudy(loadLastStudy());
  }, []);

  useEffect(() => {
    if (accessStatus !== "approved") return;
    if (isOnboardingFirstRunComplete()) return;
    void nav({
      to: "/onboarding/$stepId",
      params: { stepId: "welcome" },
      replace: true,
    });
  }, [accessStatus, nav]);

  function dismissTourBanner() {
    markOnboardingFirstRunComplete();
    setShowTourBanner(false);
  }

  const resumeTo =
    lastStudy?.type === "material"
      ? { to: "/academy/library/$slug" as const, params: { slug: lastStudy.slug } }
      : { to: "/academy/learn" as const };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 pb-32">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
            <span className="page-eyebrow">
              {COPY.academy.eyebrow}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">{COPY.academy.pageTitle}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">{COPY.academy.intro}</p>
        </div>
        <KeptIllustration variant="keepsContext" className="h-[110px] w-auto opacity-95" decorative />
      </section>

      {showTourBanner ? (
        <CalloutBanner
          className="mt-8"
          title={COPY.onboarding.firstRunBannerTitle}
          body={COPY.onboarding.firstRunBannerBody}
          icon={GraduationCap}
          actions={[
            {
              label: COPY.onboarding.firstRunBannerCta,
              to: "/onboarding/$stepId",
              params: { stepId: "welcome" },
            },
            {
              label: COPY.onboarding.skipToAcademy,
              variant: "secondary",
              onClick: dismissTourBanner,
            },
          ]}
        />
      ) : null}

      {lastStudy ? (
        <CalloutBanner
          className="mt-8"
          tone="primary"
          title={COPY.academy.continueTitle}
          body={`${COPY.academy.continueBody} ${lastStudy.title}`}
          actions={[
            {
              label: COPY.academy.continueCta,
              to: resumeTo.to,
              params: "params" in resumeTo ? resumeTo.params : undefined,
            },
          ]}
        />
      ) : (
        <section className="mt-8 rounded-2xl border border-dashed border-border bg-surface/40 p-5">
          <p className="text-sm text-muted-foreground">{COPY.academy.continueEmpty}</p>
        </section>
      )}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FeatureHubCard
          icon={BookOpen}
          title={COPY.academy.libraryCardTitle}
          body={COPY.academy.libraryCardBody}
          meta={`${SALES_LIBRARY.length} resources`}
          to="/academy/library"
        />
        <FeatureHubCard
          icon={MessageCircleQuestion}
          title={COPY.academy.askCardTitle}
          body={COPY.academy.askCardBody}
          meta={COPY.academy.askCardMeta}
          to="/academy/ask"
        />
        <FeatureHubCard
          icon={GraduationCap}
          title={COPY.academy.learnCardTitle}
          body={COPY.academy.learnCardBody}
          meta={`${trackAvailable} tracks live`}
          to="/academy/learn"
        />
        <FeatureHubCard
          icon={Newspaper}
          title={COPY.academy.briefingCardTitle}
          body={COPY.academy.briefingCardBody}
          meta={COPY.academy.briefingCardMeta}
          to="/academy/briefing"
        />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">{COPY.academy.situationTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{COPY.academy.situationBody}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/academy/ask"
            className="inline-flex min-h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            {COPY.academy.situationCta}
          </Link>
          <Link
            to="/academy/library"
            className="inline-flex min-h-10 items-center rounded-xl border border-border px-4 text-sm font-semibold hover:bg-surface-2"
          >
            {COPY.academy.browseLibraryCta}
          </Link>
        </div>
      </section>
    </div>
  );
}
