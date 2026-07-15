import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { COPY } from "@/lib/copy";
import { getSalesMaterial, LMS_TRACKS } from "@/content/sales-library";
import { AcademyPageShell } from "@/components/academy/AcademyPageShell";
import {
  isMaterialCompleted,
  saveLastStudy,
  toggleMaterialCompleted,
  trackCompletionPercent,
} from "@/lib/academy-progress";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/academy/learn")({
  head: () => ({ meta: [{ title: COPY.academy.learnMetaTitle }] }),
  component: AcademyLearnPage,
});

function AcademyLearnPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [, tick] = useState(0);

  useEffect(() => {
    if (!loading && !user) void nav({ to: "/login" });
  }, [loading, user, nav]);

  useEffect(() => {
    const first = LMS_TRACKS.find((t) => t.status === "available");
    if (first) saveLastStudy({ type: "track", slug: first.id, title: first.title });
  }, []);

  if (loading || !user) return null;

  return (
    <AcademyPageShell
      backToAcademy
      title={COPY.academy.learnTitle}
      subtitle={COPY.academy.learnIntro}
    >
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {LMS_TRACKS.map((track) => {
          const pct = trackCompletionPercent(track.materialSlugs);
          return (
            <article
              key={track.id}
              className="rounded-2xl border border-border/60 bg-card p-5 card-elev relative overflow-hidden"
            >
              {track.status === "coming" && (
                <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  {COPY.academy.trackComingSoon}
                </div>
              )}
              <div className="flex items-center justify-between gap-3 pr-24">
                <h2 className="text-base font-semibold">{track.title}</h2>
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
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
                              toggleMaterialCompleted(slug);
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
