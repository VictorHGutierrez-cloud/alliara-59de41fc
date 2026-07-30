import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, CheckCircle2, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { COPY } from "@/lib/copy";
import { getSalesMaterial, LMS_TRACKS } from "@/content/sales-library";
import { getTrackQuiz } from "@/content/track-quizzes";
import { AcademyPageShell } from "@/components/academy/AcademyPageShell";
import {
  completeMaterial,
  isMaterialCompleted,
  isQuizPassed,
  pushAcademyProgress,
  saveLastStudy,
  trackCompletionPercent,
} from "@/lib/academy-progress";
import { useCompletionCelebration } from "@/hooks/use-completion-celebration";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { AcademyAuthSkeleton } from "@/components/academy/AcademyAuthSkeleton";
import { CompanionIllustration } from "@/components/brand/CompanionIllustration";

export const Route = createFileRoute("/academy/learn")({
  head: () => ({ meta: [{ title: COPY.academy.learnMetaTitle }] }),
  component: AcademyLearnLayout,
});

function AcademyLearnLayout() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isIndex = path === "/academy/learn" || path === "/academy/learn/";

  useEffect(() => {
    if (!loading && !user) void nav({ to: "/login" });
  }, [loading, user, nav]);

  if (loading || !user) return <AcademyAuthSkeleton />;
  if (!isIndex) return <Outlet />;
  return <AcademyLearnPage />;
}

function AcademyLearnPage() {
  const { user } = useAuth();
  const [, tick] = useState(0);
  const { celebrate, celebration } = useCompletionCelebration();

  return (
    <AcademyPageShell
      backToAcademy
      title={COPY.academy.learnTitle}
      subtitle={COPY.academy.learnIntro}
    >
      {celebration}
      <div className="mt-6 flex justify-end">
        <CompanionIllustration variant="everythingOnTrack" className="h-20 w-auto hidden md:block" decorative />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {LMS_TRACKS.map((track) => {
          const pct = trackCompletionPercent(track.materialSlugs);
          const quiz = getTrackQuiz(track.id);
          const quizPassed = quiz ? isQuizPassed(track.id) : false;
          return (
            <article
              key={track.id}
              className="rounded-2xl border border-border/60 bg-card p-5 card-elev relative overflow-hidden"
            >
              {track.status === "coming" && (
                <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-1 page-eyebrow">
                  <Lock className="h-3 w-3" />
                  {COPY.academy.trackComingSoon}
                </div>
              )}
              {quizPassed ? (
                <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2 py-1 text-[11px] font-medium">
                  <CheckCircle2 className="h-3 w-3 text-primary" aria-hidden />
                  {COPY.academy.quizPassedBadge}
                </div>
              ) : null}
              <div
                className="flex items-center justify-between gap-3 pr-24"
                onClick={() =>
                  saveLastStudy({ type: "track", slug: track.id, title: track.title })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    saveLastStudy({ type: "track", slug: track.id, title: track.title });
                  }
                }}
                role="presentation"
              >
                <h2 className="text-base font-semibold">{track.title}</h2>
                <span className="page-eyebrow">
                  Track {track.order}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{track.description}</p>

              {track.materialSlugs.length > 0 ? (
                <>
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{COPY.academy.trackProgress(pct)}</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                  <ul className="mt-4 space-y-2">
                    {track.materialSlugs.map((slug) => {
                      const mat = getSalesMaterial(slug);
                      const done = isMaterialCompleted(slug);
                      return (
                        <li key={slug} className="flex items-start gap-2">
                          <Checkbox
                            id={`track-${track.id}-${slug}`}
                            checked={done}
                            onCheckedChange={() => {
                              const { justCompleted } = completeMaterial(slug);
                              if (justCompleted) celebrate();
                              if (user) void pushAcademyProgress(user.id);
                              tick((n) => n + 1);
                            }}
                            className="mt-0.5"
                          />
                          <div className="min-w-0 flex-1">
                            <Link
                              to="/academy/library/$slug"
                              params={{ slug }}
                              onClick={() => {
                                if (mat) {
                                  saveLastStudy({
                                    type: "material",
                                    slug,
                                    title: mat.title,
                                  });
                                }
                              }}
                              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                            >
                              <BookOpen className="h-3.5 w-3.5 shrink-0" />
                              {mat?.title ?? slug}
                            </Link>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  {quiz ? (
                    <Link
                      to="/academy/learn/$trackId/quiz"
                      params={{ trackId: track.id }}
                      className="mt-4 inline-flex min-h-10 items-center rounded-xl border border-border px-3.5 text-xs font-semibold hover:bg-surface-2"
                    >
                      {quizPassed ? COPY.academy.quizRetakeCta : COPY.academy.quizTakeCta}
                    </Link>
                  ) : null}
                </>
              ) : (
                <p className="mt-4 text-xs text-muted-foreground italic">{COPY.academy.trackEmpty}</p>
              )}
            </article>
          );
        })}
      </div>

      <section className="mt-10 rounded-2xl border border-dashed border-border bg-surface/50 p-6 max-w-2xl">
        <h3 className="text-sm font-semibold">{COPY.academy.lmsFutureTitle}</h3>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{COPY.academy.lmsFutureBody}</p>
      </section>
    </AcademyPageShell>
  );
}
