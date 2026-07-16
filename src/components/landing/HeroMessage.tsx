import { Link } from "@tanstack/react-router";
import { COPY } from "@/lib/copy";

export function HeroMessage() {
  const L = COPY.landing;

  return (
    <section className="relative bg-card px-6 pb-12 -mt-8">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xl p-6 sm:p-9 shadow-[var(--shadow-card)]">
          <p className="page-eyebrow">{L.heroEyebrow}</p>
          <h1 className="mt-3 text-[clamp(1.95rem,4.2vw,3.7rem)] font-semibold tracking-tight text-foreground leading-[1.03]">
            {L.heroTitle}
          </h1>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
            {L.heroBody}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Pill>{L.pillLibrary}</Pill>
            <Pill>{L.pillCoach}</Pill>
            <Pill>{L.pillTracks}</Pill>
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="btn-candy group min-h-11 inline-flex items-center justify-center px-5"
              aria-label={L.ctaPrimary}
            >
              {L.ctaPrimary}
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
            <Link
              to="/login"
              className="btn-candy-secondary min-h-11 inline-flex items-center justify-center px-5"
              aria-label={L.ctaSecondary}
            >
              {L.ctaSecondary}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-surface-2 px-3 py-1.5 text-[11px] text-muted-foreground">
      {children}
    </span>
  );
}
