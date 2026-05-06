import { Link } from "@tanstack/react-router";
import { COPY } from "@/lib/copy";

export function HeroMessage() {
  return (
    <section className="bg-white py-8 px-6 border-b border-neutral-200/70">
      <div className="mx-auto max-w-6xl">
        <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-neutral-500">
          OCTO for {COPY.role.short}s
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900">
          Diagnose every partner. Plan your next 3 moves. Let Copilot coach execution.
        </h1>
        <p className="mt-3 text-sm sm:text-base text-neutral-600 max-w-3xl">
          Alliara gives every {COPY.role.full} one command center to run the OCTO framework:
          8-axis {COPY.diagnostic.noun.toLowerCase()}, focused {COPY.jbp.itemPlural.toLowerCase()}, and AI guidance that turns insight into weekly delivery.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/signup" className="btn-candy group">
            Create your account
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
          <Link to="/login" className="btn-candy-secondary">
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}
