import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { BookOpen, ChevronLeft, ChevronRight, GraduationCap, Mail, MessageCircleQuestion } from "lucide-react";
import { COPY } from "@/lib/copy";
import { KeptKeptaDuoIllustration } from "@/components/brand/KeptKeptaDuoIllustration";

const HERO_VIDEO_SRC = "/videos/next-one-activation.mp4";

const MESH_STYLE: React.CSSProperties = {
  background: "#ffffff",
};

const PREVIEW_CARDS = [
  {
    icon: BookOpen,
    title: COPY.landing.pillarLibraryTitle,
    body: COPY.landing.pillarLibraryBody,
  },
  {
    icon: MessageCircleQuestion,
    title: COPY.landing.pillarCoachTitle,
    body: COPY.landing.pillarCoachBody,
  },
  {
    icon: GraduationCap,
    title: COPY.landing.pillarTracksTitle,
    body: COPY.landing.pillarTracksBody,
  },
] as const;

export function FactorialStyleHero() {
  const L = COPY.landing;
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [preferReducedMotion, setPreferReducedMotion] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPreferReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (preferReducedMotion || !videoRef.current) return;
    videoRef.current.defaultMuted = true;
    void videoRef.current.play().catch(() => {
      /* autoplay may be blocked — mesh still shows */
    });
  }, [preferReducedMotion]);

  const scrollByDir = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const w = el.clientWidth * 0.72;
    el.scrollBy({ left: dir * w, behavior: "smooth" });
  };

  const onEmailSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      void navigate({ to: "/signup", search: {} });
      return;
    }
    void navigate({ to: "/signup", search: { email: trimmed } });
  };

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10" style={MESH_STYLE} aria-hidden />
      {!preferReducedMotion && (
        <>
          <video
            ref={videoRef}
            className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-[0.06]"
            src={HERO_VIDEO_SRC}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-background via-background/95 to-background"
            aria-hidden
          />
        </>
      )}

      <div className="relative px-6 pb-6 pt-10 sm:pb-10 sm:pt-14">
        <div className="mx-auto max-w-3xl text-center">
          <KeptKeptaDuoIllustration
            variant="welcomeAcademy"
            className="mx-auto mb-6 max-h-40 w-full max-w-md object-contain sm:max-h-48"
            decorative
            imageLoading="eager"
          />
          <p className="page-eyebrow text-muted-foreground">{L.heroEyebrow}</p>
          <h1 className="mt-4 text-balance text-[clamp(1.85rem,4vw,3.25rem)] font-semibold tracking-tight text-foreground leading-[1.08]">
            {L.heroTitle}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg sm:leading-relaxed">
            {L.heroBody}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Pill>{L.pillLibrary}</Pill>
            <Pill>{L.pillCoach}</Pill>
            <Pill>{L.pillTracks}</Pill>
          </div>

          <form
            onSubmit={onEmailSubmit}
            className="mx-auto mt-8 flex w-full max-w-xl flex-col gap-2 rounded-full border border-border bg-card p-1.5 sm:flex-row sm:items-center"
          >
            <label className="flex min-h-11 flex-1 items-center gap-2 rounded-full px-3 py-2 sm:pl-4">
              <Mail className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder={L.heroEmailPlaceholder}
                aria-label={L.heroEmailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </label>
            <button
              type="submit"
              className="btn-candy shrink-0 rounded-full px-6 py-3 text-sm font-semibold sm:py-2.5"
            >
              {L.ctaPrimary}
            </button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">{L.heroEmailHelper}</p>
        </div>
      </div>

      <div className="relative pb-16 pt-2">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-background to-transparent sm:w-16" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-background to-transparent sm:w-16" />

        <div className="mx-auto flex max-w-6xl items-center gap-2 px-6">
          <button
            type="button"
            onClick={() => scrollByDir(-1)}
            className="hidden min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-border/90 bg-card/90 text-foreground shadow-sm backdrop-blur transition hover:bg-card hover:text-foreground sm:inline-flex"
            aria-label="Show previous cards"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div
            ref={scrollerRef}
            className="flex min-h-0 flex-1 touch-pan-x gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
          >
            {PREVIEW_CARDS.map((card, i) => {
              const Icon = card.icon;
              return (
                <article
                  key={card.title}
                  className={`group relative w-[min(78vw,320px)] shrink-0 snap-center rounded-2xl border border-border/80 bg-card/95 p-5 shadow-[var(--shadow-card)] backdrop-blur-sm transition duration-300 ${
                    i === 1 ? "sm:scale-[1.03] sm:shadow-lg" : ""
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-2 text-foreground">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <p className="mt-4 text-left text-sm font-semibold text-foreground">{card.title}</p>
                  <p className="mt-2 text-left text-xs leading-relaxed text-muted-foreground">{card.body}</p>
                </article>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => scrollByDir(1)}
            className="hidden min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-border/90 bg-card/90 text-foreground shadow-sm backdrop-blur transition hover:bg-card hover:text-foreground sm:inline-flex"
            aria-label="Show next cards"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-auto max-w-6xl px-6 pb-2 sm:pb-4">
          <p className="text-center page-eyebrow">{L.trustEyebrow}</p>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted-foreground">{L.trustBlurb}</p>
        </div>
      </div>
    </section>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border/90 bg-card/80 px-3 py-1.5 text-[11px] text-muted-foreground shadow-sm">
      {children}
    </span>
  );
}
