import { useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight, Mail } from "lucide-react";
import { COPY } from "@/lib/copy";
import imgProductRadar from "@/assets/landing/product-maturity-radar.png";
import imgJbpTask from "@/assets/landing/jbp-new-task.png";
import { CandyBarChart, CandyStackedArea } from "@/components/ui/candy-charts";
import { DEMO_LANDING_GROWTH, DEMO_LANDING_REVENUE } from "@/content/landing-chart-demos";

const MESH_STYLE: React.CSSProperties = {
  background: `
    radial-gradient(ellipse 85% 55% at 12% 35%, color-mix(in oklab, var(--primary) 42%, transparent), transparent 62%),
    radial-gradient(ellipse 70% 50% at 88% 28%, color-mix(in oklab, var(--secondary) 38%, transparent), transparent 58%),
    radial-gradient(ellipse 65% 48% at 52% 92%, color-mix(in oklab, var(--octa-7) 28%, transparent), transparent 55%),
    linear-gradient(180deg, #fffdfb 0%, #faf8fc 45%, #fff9f6 100%)
  `,
};

function formatDemoEuro(n: number) {
  if (n >= 1000 && n % 1000 === 0) return `€${n / 1000}k`;
  if (n >= 1000) return `€${(n / 1000).toFixed(1)}k`;
  return `€${n}`;
}

export function FactorialStyleHero() {
  const L = COPY.landing;
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cards = L.heroCarousel;

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

  const chartBlock = useMemo(
    () => ({
      revenue: (
        <div className="h-[200px] w-full overflow-hidden rounded-xl bg-white px-1 pt-2">
          <CandyBarChart
            data={DEMO_LANDING_REVENUE}
            height={180}
            variant="palette"
            valueFormatter={formatDemoEuro}
            showLabels
          />
        </div>
      ),
      mix: (
        <div className="h-[200px] w-full overflow-hidden rounded-xl bg-white px-2 pt-2">
          <CandyStackedArea
            data={DEMO_LANDING_GROWTH}
            series={[
              { key: "active", label: "Scaling", color: "var(--success)" },
              { key: "nurturing", label: "Developing", color: "var(--warning)" },
              { key: "at_risk", label: "Churn Risk", color: "var(--destructive)" },
            ]}
            height={170}
          />
        </div>
      ),
    }),
    [],
  );

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10" style={MESH_STYLE} aria-hidden />

      <div className="relative px-6 pb-6 pt-10 sm:pb-10 sm:pt-14">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-neutral-600">{L.heroEyebrow}</p>
          <h1 className="mt-4 text-balance text-[clamp(1.85rem,4vw,3.25rem)] font-semibold tracking-tight text-neutral-900 leading-[1.08]">
            {L.heroTitle}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-neutral-600 sm:text-lg sm:leading-relaxed">
            {L.heroBody}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Pill>{L.pillDiagnostic}</Pill>
            <Pill>{L.pillJbp}</Pill>
            <Pill>{L.pillKept}</Pill>
          </div>

          <form
            onSubmit={onEmailSubmit}
            className="mx-auto mt-8 flex w-full max-w-xl flex-col gap-2 rounded-full border border-neutral-200/90 bg-white/90 p-1.5 shadow-[0_12px_40px_-24px_rgba(11,18,32,0.35)] backdrop-blur-sm sm:flex-row sm:items-center"
          >
            <label className="flex min-h-11 flex-1 items-center gap-2 rounded-full px-3 py-2 sm:pl-4">
              <Mail className="h-5 w-5 shrink-0 text-neutral-400" aria-hidden />
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder={L.heroEmailPlaceholder}
                aria-label={L.heroEmailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
              />
            </label>
            <button
              type="submit"
              className="btn-candy shrink-0 rounded-full px-6 py-3 text-sm font-semibold sm:py-2.5"
            >
              {L.ctaPrimary}
            </button>
          </form>
          <p className="mt-2 text-xs text-neutral-500">{L.heroEmailHelper}</p>
        </div>
      </div>

      <div className="relative pb-16 pt-2">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#fffdfb] to-transparent sm:w-16" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#fff9f6] to-transparent sm:w-16" />

        <div className="mx-auto flex max-w-6xl items-center gap-2 px-6">
          <button
            type="button"
            onClick={() => scrollByDir(-1)}
            className="hidden min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-neutral-200/90 bg-white/90 text-neutral-700 shadow-sm backdrop-blur transition hover:bg-white hover:text-neutral-900 sm:inline-flex"
            aria-label="Show previous cards"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div
            ref={scrollerRef}
            className="flex min-h-0 flex-1 touch-pan-x gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
          >
            {cards.map((card, i) => (
              <article
                key={`${card.title}-${i}`}
                className={`group relative w-[min(78vw,320px)] shrink-0 snap-center rounded-2xl border border-neutral-200/80 bg-white/95 p-3 shadow-[0_20px_50px_-34px_rgba(11,18,32,0.35)] backdrop-blur-sm transition duration-300 ${
                  i === 1 ? "sm:scale-[1.03] sm:shadow-lg" : ""
                }`}
              >
                <div className="absolute inset-0 rounded-2xl bg-[color-mix(in_oklab,var(--primary)_6%,transparent)] opacity-100 transition group-hover:opacity-0" />
                <div className="relative">
                  <p className="text-left text-sm font-semibold text-neutral-900">{card.title}</p>
                  <p className="mt-0.5 text-left text-xs text-neutral-500">{card.subtitle}</p>
                  <div className="mt-3 overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50/80">
                    {card.visual === "radar" ? (
                      <img
                        src={imgProductRadar}
                        alt={card.imgAlt}
                        className="h-[200px] w-full object-cover object-top"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : card.visual === "revenue" ? (
                      chartBlock.revenue
                    ) : card.visual === "mix" ? (
                      chartBlock.mix
                    ) : (
                      <img
                        src={imgJbpTask}
                        alt={card.imgAlt}
                        className="h-[200px] w-full object-contain bg-white"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollByDir(1)}
            className="hidden min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-neutral-200/90 bg-white/90 text-neutral-700 shadow-sm backdrop-blur transition hover:bg-white hover:text-neutral-900 sm:inline-flex"
            aria-label="Show next cards"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-auto max-w-6xl px-6 pb-2 sm:pb-4">
          <p className="text-center text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
            {L.heroSocialProofEyebrow}
          </p>
          <ul
            className="mt-5 flex list-none flex-wrap items-center justify-center gap-x-10 gap-y-3"
            aria-label="Demo partner names"
          >
            {L.heroSocialProofNames.map((name) => (
              <li key={name}>
                <span className="font-display text-sm font-semibold tracking-tight text-neutral-400 sm:text-base">
                  {name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-neutral-200/90 bg-white/80 px-3 py-1.5 text-[11px] text-neutral-600 shadow-sm">
      {children}
    </span>
  );
}
