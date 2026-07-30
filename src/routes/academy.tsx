import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Drama,
  Flame,
  GraduationCap,
  Newspaper,
  Phone,
  Route as RouteIcon,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { COPY } from "@/lib/copy";
import { LMS_TRACKS, SALES_LIBRARY } from "@/content/sales-library";
import { CompanionIllustration } from "@/components/brand/CompanionIllustration";
import { loadLastStudy, getStudyStreak } from "@/lib/academy-progress";
import { AcademyAuthSkeleton } from "@/components/academy/AcademyAuthSkeleton";
import { CalloutBanner } from "@/components/ui/callout-banner";
import {
  isOnboardingFirstRunComplete,
  markOnboardingFirstRunComplete,
} from "@/lib/onboarding-first-run";
import { hasChosenCompanion } from "@/lib/companion";
import { AcademyStartGuide } from "@/components/academy/AcademyStartGuide";
import { listRecentSessions, sessionBannerLabel, type CoachSession } from "@/lib/coach-sessions";

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
  const { user, accessStatus } = useAuth();
  const nav = useNavigate();
  const trackAvailable = LMS_TRACKS.filter((t) => t.status === "available").length;
  const [lastStudy, setLastStudy] = useState(() => loadLastStudy());
  const [streak, setStreak] = useState(() => getStudyStreak());
  const [showTourBanner, setShowTourBanner] = useState(
    () => !isOnboardingFirstRunComplete(),
  );
  const [recentSessions, setRecentSessions] = useState<CoachSession[]>([]);

  useEffect(() => {
    setLastStudy(loadLastStudy());
    setStreak(getStudyStreak());
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void listRecentSessions(user.id, 3).then((rows) => {
      if (!cancelled) setRecentSessions(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (accessStatus !== "approved") return;
    if (!hasChosenCompanion()) {
      void nav({ to: "/choose-companion", replace: true });
      return;
    }
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

  const latestSession = recentSessions[0];
  const primaryIsPrep = latestSession?.mode === "prep";

  const resumeTo =
    lastStudy?.type === "material"
      ? { to: "/academy/library/$slug" as const, params: { slug: lastStudy.slug } }
      : { to: "/academy/learn" as const };

  const sessionIsNewerThanStudy =
    latestSession && (!lastStudy || latestSession.updated_at > lastStudy.at);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 pb-32">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
            <span className="page-eyebrow">{COPY.academy.eyebrow}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            {COPY.academy.pageTitle}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
            {COPY.academy.intro}
          </p>
          <p
            className="inline-flex items-center gap-1.5 rounded-full border border-secondary-foreground/20 bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground"
            aria-live="polite"
          >
            <Flame className="h-3.5 w-3.5 text-primary" aria-hidden />
            {streak.current > 0
              ? COPY.academy.studyStreakLabel(streak.current)
              : COPY.academy.studyStreakEmpty}
          </p>
        </div>
        <CompanionIllustration
          variant="keepsContext"
          className="hidden h-24 w-auto opacity-95 sm:block"
          decorative
        />
      </section>

      <section className="mt-8">
        {primaryIsPrep ? (
          <>
            <Link
              to="/academy/prep"
              className="flex min-h-16 w-full items-center justify-between gap-3 rounded-2xl bg-primary px-6 text-lg font-semibold text-primary-foreground shadow-sm transition hover:opacity-95"
            >
              <span className="inline-flex items-center gap-3">
                <Phone className="h-5 w-5" aria-hidden />
                {COPY.academy.situationPrepCta}
              </span>
              <ArrowRight className="h-5 w-5 shrink-0" aria-hidden />
            </Link>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1">
              <Link
                to="/academy/stuck"
                className="inline-flex min-h-11 items-center gap-1.5 px-1 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                <TriangleAlert className="h-4 w-4" aria-hidden />
                {COPY.academy.homeOrStuckLink}
              </Link>
              <Link
                to="/academy/roleplay"
                className="inline-flex min-h-11 items-center gap-1.5 px-1 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                <Drama className="h-4 w-4" aria-hidden />
                {COPY.academy.roleplayHomeLink}
              </Link>
            </div>
          </>
        ) : (
          <>
            <Link
              to="/academy/stuck"
              className="flex min-h-16 w-full items-center justify-between gap-3 rounded-2xl bg-primary px-6 text-lg font-semibold text-primary-foreground shadow-sm transition hover:opacity-95"
            >
              <span className="inline-flex items-center gap-3">
                <TriangleAlert className="h-5 w-5" aria-hidden />
                {COPY.academy.situationStuckCta}
              </span>
              <ArrowRight className="h-5 w-5 shrink-0" aria-hidden />
            </Link>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1">
              <Link
                to="/academy/prep"
                className="inline-flex min-h-11 items-center gap-1.5 px-1 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                <Phone className="h-4 w-4" aria-hidden />
                {COPY.academy.homeOrPrepLink}
              </Link>
              <Link
                to="/academy/roleplay"
                className="inline-flex min-h-11 items-center gap-1.5 px-1 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                <Drama className="h-4 w-4" aria-hidden />
                {COPY.academy.roleplayHomeLink}
              </Link>
            </div>
          </>
        )}
      </section>

      {latestSession || lastStudy ? (
        <section className="mt-6">
          <p className="page-eyebrow">{COPY.academy.homeContinueEyebrow}</p>
          {sessionIsNewerThanStudy && latestSession ? (
            <Link
              to="/academy/ask"
              search={{ session: latestSession.id }}
              className="mt-2 flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-3 text-sm transition hover:bg-surface-2"
            >
              <span className="min-w-0 truncate font-medium">
                {sessionBannerLabel(latestSession)}
              </span>
              <span className="shrink-0 text-xs font-semibold text-primary">
                {COPY.academy.recentSessionsResume}
              </span>
            </Link>
          ) : lastStudy ? (
            <Link
              to={resumeTo.to}
              params={"params" in resumeTo ? resumeTo.params : undefined}
              className="mt-2 flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-3 text-sm transition hover:bg-surface-2"
            >
              <span className="min-w-0 truncate font-medium">{lastStudy.title}</span>
              <span className="shrink-0 text-xs font-semibold text-primary">
                {COPY.academy.continueCta}
              </span>
            </Link>
          ) : null}
        </section>
      ) : null}

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

      {showTourBanner ? <AcademyStartGuide /> : null}

      <section className="mt-10">
        <h2 className="page-eyebrow">{COPY.academy.homeExploreTitle}</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <Link
            to="/academy/library"
            className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-card px-4 text-sm font-medium transition hover:bg-accent"
          >
            <BookOpen className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{COPY.academy.libraryCardTitle}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {SALES_LIBRARY.length}
            </span>
          </Link>
          <Link
            to="/academy/learn"
            className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-card px-4 text-sm font-medium transition hover:bg-accent"
          >
            <RouteIcon className="h-4 w-4 shrink-0 text-octa-8" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{COPY.academy.learnCardTitle}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{trackAvailable}</span>
          </Link>
          <Link
            to="/academy/briefing"
            className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-card px-4 text-sm font-medium transition hover:bg-accent"
          >
            <Newspaper className="h-4 w-4 shrink-0 text-octa-4" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{COPY.academy.briefingCardTitle}</span>
          </Link>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">{COPY.academy.recentSessionsTitle}</h2>
        {recentSessions.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{COPY.academy.recentSessionsEmpty}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {recentSessions.map((s) => (
              <li key={s.id}>
                <Link
                  to="/academy/ask"
                  search={{ session: s.id }}
                  className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-2.5 text-sm hover:bg-surface-2"
                >
                  <span className="min-w-0 truncate font-medium">{sessionBannerLabel(s)}</span>
                  <span className="shrink-0 text-xs font-semibold text-primary">
                    {COPY.academy.recentSessionsResume}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
