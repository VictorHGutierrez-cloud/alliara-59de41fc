import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, Clock, MessageCircleQuestion, Route as RouteIcon } from "lucide-react";
import { FactorialStyleHero } from "@/components/landing/FactorialStyleHero";
import {
  AnimatedCard,
  CardBody,
  CardDescription,
  CardTitle,
} from "@/components/ui/animated-card";
import { COPY } from "@/lib/copy";
import { SALES_LIBRARY, SALES_MATERIAL_CATEGORIES } from "@/content/sales-library";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: COPY.landing.metaTitle },
      { name: "description", content: COPY.landing.metaDescription },
    ],
  }),
  component: Landing,
});

const FEATURED = SALES_LIBRARY.filter((m) =>
  ["enterprise-playbook", "sales-psychology", "people-path"].includes(m.slug),
);

function RevealSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.55, delay, ease: [0.2, 0.85, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Landing() {
  const L = COPY.landing;

  return (
    <div className="bg-background">
      <FactorialStyleHero />

      <RevealSection>
        <section className="px-6 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <p className="page-eyebrow text-center">{L.pillarsEyebrow}</p>
            <h2 className="mt-3 text-center section-title text-3xl sm:text-4xl">{L.pillarsTitle}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-center section-subtitle">{L.pillarsIntro}</p>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <PillarCard title={L.pillarLibraryTitle} body={L.pillarLibraryBody} icon={BookOpen} />
              <PillarCard title={L.pillarCoachTitle} body={L.pillarCoachBody} icon={MessageCircleQuestion} />
              <PillarCard title={L.pillarTracksTitle} body={L.pillarTracksBody} icon={RouteIcon} />
            </div>
          </div>
        </section>
      </RevealSection>

      <RevealSection delay={0.05}>
        <section className="border-y border-border/50 bg-card/30 px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <p className="page-eyebrow">{L.previewEyebrow}</p>
            <h2 className="mt-2 section-title text-2xl sm:text-3xl">{L.previewTitle}</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {FEATURED.map((m) => (
                <Link
                  key={m.slug}
                  to="/signup"
                  search={{}}
                  className="rounded-2xl border border-border/60 bg-card p-5 card-elev block hover:-translate-y-0.5 transition"
                >
                  <p className="page-eyebrow text-primary">
                    {SALES_MATERIAL_CATEGORIES[m.category].label}
                  </p>
                  <h3 className="mt-2 text-base font-semibold">{m.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{m.summary}</p>
                  {m.durationMin ? (
                    <p className="mt-3 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {m.durationMin} min
                    </p>
                  ) : null}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </RevealSection>

      <RevealSection delay={0.08}>
        <section className="px-6 py-20">
          <div className="mx-auto max-w-3xl rounded-3xl border border-border/60 bg-gradient-to-br from-primary/5 to-card p-8 sm:p-10 text-center">
            <p className="page-eyebrow">{L.coachExampleEyebrow}</p>
            <h2 className="mt-2 text-xl sm:text-2xl font-semibold">{L.coachExampleTitle}</h2>
            <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">{L.coachExampleBody}</p>
            <Link
              to="/signup"
              search={{}}
              className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              {L.coachExampleCta}
            </Link>
          </div>
        </section>
      </RevealSection>

      <RevealSection delay={0.1}>
        <section className="px-6 pb-24 pt-4">
          <div className="mx-auto max-w-4xl">
            <AnimatedCard className="border-primary/15">
              <CardBody className="p-8 sm:p-10 text-center">
                <CardTitle className="text-2xl sm:text-3xl">{L.finalCtaTitle}</CardTitle>
                <CardDescription className="mx-auto mt-3 max-w-lg text-base">
                  {L.finalCtaBody}
                </CardDescription>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <Link
                    to="/signup"
                    search={{}}
                    className="inline-flex min-h-11 items-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground hover:opacity-90"
                  >
                    {L.finalCtaPrimary}
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex min-h-11 items-center rounded-xl border border-border px-6 text-sm font-semibold hover:bg-surface-2"
                  >
                    {L.finalCtaSecondary}
                  </Link>
                </div>
              </CardBody>
            </AnimatedCard>

            <div className="mt-12 flex flex-wrap justify-center gap-8 text-center">
              {L.trustStats.map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-semibold text-primary">{s.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground uppercase tracking-widest">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </RevealSection>
    </div>
  );
}

function PillarCard({
  title,
  body,
  icon: Icon,
}: {
  title: string;
  body: string;
  icon: typeof BookOpen;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 card-elev">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
