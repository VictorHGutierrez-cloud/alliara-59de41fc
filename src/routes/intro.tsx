import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { COPY } from "@/lib/copy";
import {
  type KeptIllustrationVariant,
} from "@/components/brand/KeptIllustration";
import { KeptKeptaDuoIllustration, type KeptKeptaDuoVariant } from "@/components/brand/KeptKeptaDuoIllustration";
import { useAuth } from "@/lib/auth";
import { BrandLogo } from "@/components/brand/BrandLogo";

export const Route = createFileRoute("/intro")({
  head: () => ({
    meta: [
      { title: COPY.introTour.metaTitle },
      { name: "description", content: COPY.introTour.metaDescription },
    ],
  }),
  component: IntroTourPage,
});

function IntroTourPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const slides = COPY.introTour.slides as readonly {
    variant: KeptIllustrationVariant;
    title: string;
    body: string;
  }[];
  const [idx, setIdx] = useState(0);
  const last = idx === slides.length - 1;

  const goNext = useCallback(() => {
    setIdx((i) => Math.min(i + 1, slides.length - 1));
  }, [slides.length]);

  const goPrev = useCallback(() => {
    setIdx((i) => Math.max(i - 1, 0));
  }, []);

  const finish = useCallback(() => {
    if (user) void nav({ to: "/academy" });
    else void nav({ to: "/signup", search: {} });
  }, [user, nav]);

  const skip = useCallback(() => {
    void nav({ to: "/" });
  }, [nav]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  const slide = slides[idx];
  const duoVariants: KeptKeptaDuoVariant[] = [
    "welcomeAcademy",
    "libraryPlaybooks",
    "coachDealHelp",
    "learningTracks",
    "dailyBriefing",
  ];

  return (
    <div className="min-h-svh bg-background px-4 py-8 sm:py-12">
      <div className="mx-auto flex max-w-lg flex-col">
        <div className="mb-6 flex items-center justify-between gap-3">
          <BrandLogo variant="intro" />
          <button
            type="button"
            onClick={skip}
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            {COPY.introTour.skip}
          </button>
        </div>

        <p className="page-eyebrow text-center">
          {COPY.introTour.progress({ step: idx + 1, total: slides.length })}
        </p>

        <div className="mt-6 rounded-3xl border border-border/90 bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
          <figure className="mx-auto flex w-full max-w-md flex-col items-center justify-center rounded-2xl border border-border/60 bg-surface-2 px-3 py-6 sm:min-h-[320px] sm:px-6 sm:py-10">
            <KeptKeptaDuoIllustration
              variant={duoVariants[idx] ?? "welcomeAcademy"}
              imageLoading="eager"
              className="mx-auto max-h-[min(52vh,420px)] w-full max-w-full object-contain"
            />
          </figure>
          <h1 className="mt-6 text-center font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {slide.title}
          </h1>
          <p className="mt-3 text-center text-sm leading-relaxed text-muted-foreground sm:text-base">
            {slide.body}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full`}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === idx ? "true" : undefined}
              >
                <span
                  className={`block h-2.5 rounded-full transition-all ${i === idx ? "w-8 bg-primary" : "w-2.5 bg-border"}`}
                />
              </button>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={goPrev}
              disabled={idx === 0}
              className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground shadow-sm disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              {COPY.introTour.back}
            </button>
            {!last ? (
              <button
                type="button"
                onClick={goNext}
                className="btn-candy inline-flex min-h-11 items-center gap-1 px-5 text-sm font-semibold"
              >
                {COPY.introTour.next}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                onClick={finish}
                disabled={loading}
                className="btn-candy inline-flex min-h-11 items-center px-5 text-sm font-semibold disabled:opacity-50"
              >
                {loading ? COPY.introTour.checkingSession : user ? COPY.introTour.finishSignedIn : COPY.introTour.finishSignedOut}
              </button>
            )}
          </div>

          {last && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => void nav({ to: "/" })}
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                {COPY.introTour.finishHome}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
