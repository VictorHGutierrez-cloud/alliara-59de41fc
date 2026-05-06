import { Link } from "@tanstack/react-router";
import { COPY } from "@/lib/copy";

export function HeroMessage() {
  return (
    <section className="relative bg-white px-6 pb-12 -mt-8">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-neutral-200/80 bg-white/95 backdrop-blur-xl p-6 sm:p-9 shadow-[0_30px_80px_-42px_rgba(11,18,32,0.35)]">
          <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-neutral-500">
            OCTO command center for {COPY.role.short}s
          </p>
          <h1 className="mt-3 text-[clamp(1.95rem,4.2vw,3.7rem)] font-semibold tracking-tight text-neutral-900 leading-[1.03]">
            Run the partner portfolio with the precision of one.
          </h1>
          <p className="mt-4 text-sm sm:text-base text-neutral-600 max-w-3xl leading-relaxed">
            Diagnose maturity across 8 axes, turn insights into weekly {COPY.jbp.itemPlural.toLowerCase()},
            and let {COPY.copilot.label} keep execution momentum across your entire ecosystem.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Pill>8-axis {COPY.diagnostic.noun}</Pill>
            <Pill>Joint Business Plan</Pill>
            <Pill>Copilot coaching loop</Pill>
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/signup" className="btn-candy group">
              Start free
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
            <Link to="/login" className="btn-candy-secondary">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[11px] text-neutral-600">
      {children}
    </span>
  );
}
