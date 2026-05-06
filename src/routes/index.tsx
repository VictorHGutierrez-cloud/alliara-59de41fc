// rev: landing-marketing-home-v1
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import * as Icons from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { PrismaHero } from "@/components/ui/prisma-hero";
import { AgentPlan, type AgentTask, type AgentStatus } from "@/components/ui/agent-plan";
import { Typewriter } from "@/components/ui/typewriter";
import { AXES } from "@/content/octa";
import { DEMO_LANDING_MIX_SLICES, DEMO_LANDING_REVENUE } from "@/content/landing-chart-demos";
import imgProductRadar from "@/assets/landing/product-maturity-radar.png";
import {
  AnimatedCard,
  CardBody,
  CardDescription,
  CardTitle,
  CardVisual,
} from "@/components/ui/animated-card";
import { CandyBarChart, CandyDonut } from "@/components/ui/candy-charts";
import { HeroMessage } from "@/components/landing/HeroMessage";
import { COPY } from "@/lib/copy";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: COPY.landing.metaTitle },
      { name: "description", content: COPY.landing.metaDescription },
    ],
  }),
  component: Landing,
});

const BRAND_ACCENT = "var(--primary)";

function formatDemoEuro(n: number) {
  if (n >= 1000 && n % 1000 === 0) return `€${n / 1000}k`;
  if (n >= 1000) return `€${(n / 1000).toFixed(1)}k`;
  return `€${n}`;
}

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

function ProductShowcase() {
  const S = COPY.landing.showcase;
  const intro = COPY.landing;
  const blocks = [
    {
      kind: "image" as const,
      title: S.radarTitle,
      body: S.radarBody,
      img: imgProductRadar,
      alt: "Alliara partner overview with OCTA maturity radar and coaching-ready growth levers",
    },
    {
      kind: "bars" as const,
      title: S.revenueTitle,
      body: S.revenueBody,
    },
    {
      kind: "donut" as const,
      title: S.mixTitle,
      body: S.mixBody,
    },
  ] as const;

  return (
    <section className="relative py-24 sm:py-28 px-6 overflow-hidden bg-gradient-to-b from-[#F7F7F8] via-white to-[#F7F7F8]">
      <div
        className="pointer-events-none absolute -top-20 right-[-10%] h-[28rem] w-[28rem] rounded-full bg-[#EC1E79]/[0.07] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-20 left-[-15%] h-[22rem] w-[22rem] rounded-full bg-violet-500/[0.08] blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="page-eyebrow">{intro.productEyebrow}</p>
          <h2 className="mt-3 section-title text-3xl text-neutral-900 sm:text-4xl">
            {intro.productTitle}
          </h2>
          <p className="section-subtitle mt-3 max-w-xl text-neutral-600">{intro.productIntro}</p>
        </div>

        <div className="mt-14 sm:mt-16 flex flex-col gap-16 sm:gap-20">
          {blocks.map((b, i) => (
            <div
              key={b.title}
              className={`flex flex-col gap-10 lg:gap-14 lg:items-center ${
                i % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"
              }`}
            >
              <div className="flex-1 min-w-0 flex justify-center lg:justify-start">
                {b.kind === "image" ? (
                  <AnimatedCard aria-label={b.title} className="max-w-xl">
                    <CardVisual className="rounded-t-2xl bg-gradient-to-b from-neutral-100 via-neutral-50 to-white p-2 sm:p-3">
                      <img
                        src={b.img}
                        alt={b.alt}
                        className="h-full w-full rounded-lg object-cover object-top shadow-sm sm:rounded-xl"
                        loading="lazy"
                        decoding="async"
                      />
                    </CardVisual>
                  </AnimatedCard>
                ) : b.kind === "bars" ? (
                  <AnimatedCard className="max-w-xl">
                    <CardVisual className="rounded-t-2xl bg-white px-1.5 pt-3">
                      <CandyBarChart
                        data={DEMO_LANDING_REVENUE}
                        height={236}
                        variant="palette"
                        valueFormatter={formatDemoEuro}
                        showLabels
                      />
                    </CardVisual>
                    <CardBody className="sr-only">
                      <CardTitle>{b.title}</CardTitle>
                      <CardDescription>{b.body}</CardDescription>
                    </CardBody>
                  </AnimatedCard>
                ) : (
                  <AnimatedCard className="max-w-xl">
                    <CardVisual className="rounded-t-2xl bg-white px-2 pt-4">
                      <div className="flex h-full min-h-0 items-center justify-center overflow-x-auto pb-2">
                        <CandyDonut
                          slices={DEMO_LANDING_MIX_SLICES}
                          size={188}
                          thickness={26}
                          centerValue="73"
                          centerLabel={COPY.landing.donutCenterPartners}
                        />
                      </div>
                    </CardVisual>
                    <CardBody className="sr-only">
                      <CardTitle>{b.title}</CardTitle>
                      <CardDescription>{b.body}</CardDescription>
                    </CardBody>
                  </AnimatedCard>
                )}
              </div>
              <div className="flex-1 min-w-0 lg:max-w-md">
                <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-neutral-400">
                  {String(i + 1).padStart(2, "0")} —{" "}
                  {b.kind === "image" ? "Screen" : "Live preview"}
                </p>
                <h3 className="mt-3 font-display font-semibold text-2xl sm:text-3xl text-neutral-900 tracking-tight">
                  {b.title}
                </h3>
                <p className="mt-3 text-neutral-600 leading-relaxed">{b.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  const L = COPY.landing;
  return (
    <section className="bg-white px-6 py-8">
      <div className="mx-auto max-w-6xl rounded-2xl border border-neutral-200/80 bg-gradient-to-r from-white to-neutral-50 px-5 py-5 sm:px-6 sm:py-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="page-eyebrow text-neutral-500">
            {L.trustEyebrow}
          </p>
          <p className="mt-1 text-sm text-neutral-700 leading-relaxed">{L.trustBlurb}</p>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-center">
            <p className="text-lg font-display font-semibold text-neutral-900">8</p>
            <p className="text-[11px] text-neutral-500">{L.trustStatAxes}</p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-center">
            <p className="text-lg font-display font-semibold text-neutral-900">1</p>
            <p className="text-[11px] text-neutral-500">{L.trustStatCenter}</p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-center">
            <p className="text-lg font-display font-semibold text-neutral-900">100%</p>
            <p className="text-[11px] text-neutral-500">{L.trustStatFocus}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Landing() {
  return (
    <>
      {/* 1. HERO */}
      <PrismaHero
        videoSrc="/fios.mp4"
        eyebrow={null}
        headlineNode={null}
        description={null}
        overlayOpacity={0}
        primaryCta={null}
        secondaryCta={null}
      />
      <HeroMessage />

      <RevealSection>
        <TrustStrip />
      </RevealSection>
      <RevealSection delay={0.03}>
        <Manifesto />
      </RevealSection>
      <RevealSection delay={0.04}>
        <ProductShowcase />
      </RevealSection>
      <RevealSection delay={0.05}>
        <PortfolioPreview />
      </RevealSection>
      <RevealSection delay={0.06}>
        <AxesPreview />
      </RevealSection>
      <RevealSection delay={0.07}>
        <PlanPreview />
      </RevealSection>
      <RevealSection delay={0.08}>
        <FinalCta />
      </RevealSection>
    </>
  );
}

/* ---------------- 2. Manifesto ---------------- */
function Manifesto() {
  const L = COPY.landing;
  return (
    <section className="bg-[#F7F7F8] py-24 sm:py-28 px-6">
      <div className="mx-auto max-w-5xl text-center">
        <p className="page-eyebrow text-neutral-500">
          {L.manifestoEyebrow}
        </p>
        <h2 className="mt-5 font-display font-semibold tracking-[-0.03em] text-neutral-900 text-4xl sm:text-6xl leading-[1.07]">
          <span className="block">{L.manifestoLeading}</span>
          <span className="block">
            <span style={{ color: BRAND_ACCENT }} className="italic">
              <Typewriter
                text={[...L.manifestoTyping]}
                speed={70}
                deleteSpeed={40}
                waitTime={1800}
                cursorClassName="ml-1"
                cursorChar="|"
              />
            </span>
          </span>
        </h2>
      </div>
    </section>
  );
}

/* ---------------- 3. Portfolio preview ---------------- */
type MockPartner = {
  name: string;
  type: string;
  status: "Active" | "Nurturing" | "At risk";
  tier: "Strategic" | "Growth" | "Emerging";
  score: number;
  region: string;
};

const MOCK_PARTNERS: MockPartner[] = [
  {
    name: "Northwind Solutions",
    type: "Reseller",
    status: "Active",
    tier: "Strategic",
    score: 4.6,
    region: "DACH",
  },
  {
    name: "Helix Integrations",
    type: "ISV",
    status: "Nurturing",
    tier: "Growth",
    score: 3.4,
    region: "UK & I",
  },
  {
    name: "Bluepeak Consulting",
    type: "SI",
    status: "Active",
    tier: "Growth",
    score: 3.9,
    region: "Iberia",
  },
  {
    name: "Orbit Tech Group",
    type: "Reseller",
    status: "At risk",
    tier: "Emerging",
    score: 2.3,
    region: "Nordics",
  },
];

const TIER_DOT: Record<MockPartner["tier"], string> = {
  Strategic: "bg-[--octa-1]",
  Growth: "bg-[--octa-3]",
  Emerging: "bg-[--octa-7]",
};

const STATUS_STYLE: Record<MockPartner["status"], string> = {
  Active: "bg-emerald-100 text-emerald-700",
  Nurturing: "bg-amber-100 text-amber-700",
  "At risk": "bg-rose-100 text-rose-700",
};

function PortfolioPreview() {
  const L = COPY.landing;
  return (
    <section className="bg-white py-22 sm:py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="page-eyebrow text-neutral-500">
            {L.portfolioEyebrow}
          </p>
          <h2 className="mt-3 section-title text-3xl text-neutral-900 sm:text-4xl">
            {L.portfolioTitle}
          </h2>
          <p className="section-subtitle mt-3 max-w-xl text-neutral-600">{L.portfolioIntro}</p>
        </div>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MOCK_PARTNERS.map((p) => (
            <div
              key={p.name}
              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-2 text-xs text-neutral-600`}>
                  <span className={`h-2 w-2 rounded-full ${TIER_DOT[p.tier]}`} />
                  {p.tier}
                </span>
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[p.status]}`}
                >
                  {p.status}
                </span>
              </div>
              <h3 className="mt-4 font-semibold text-neutral-900">{p.name}</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                {p.type} · {p.region}
              </p>
              <div className="mt-5 flex items-end justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-neutral-400">OCTA score</p>
                  <p className="text-2xl font-semibold text-neutral-900">{p.score.toFixed(1)}</p>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span
                      key={i}
                      className={`h-6 w-1.5 rounded-sm ${i <= Math.round(p.score) ? "bg-neutral-900" : "bg-neutral-200"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- 4. 8 OCTA Axes preview ---------------- */
function AxesPreview() {
  const L = COPY.landing;
  return (
    <section className="bg-[#F7F7F8] py-22 sm:py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="page-eyebrow text-neutral-500">
            {L.axesEyebrow}
          </p>
          <h2 className="mt-3 section-title text-3xl text-neutral-900 sm:text-4xl">
            {L.axesTitle}
          </h2>
          <p className="section-subtitle mt-3 max-w-xl text-neutral-600">{L.axesIntro}</p>
        </div>

        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {AXES.map((axis, idx) => {
            const Icon =
              (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[
                axis.icon
              ] ?? Icons.Circle;
            const colorVar = `var(--octa-${idx + 1})`;
            return (
              <div
                key={axis.key}
                className="group relative rounded-2xl border border-neutral-200 bg-white p-6 transition overflow-hidden shadow-[0_14px_40px_-30px_rgba(15,23,42,0.45)] hover:shadow-[0_20px_44px_-28px_rgba(15,23,42,0.5)]"
              >
                <div
                  aria-hidden
                  className="absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-10 group-hover:opacity-20 transition"
                  style={{ background: colorVar }}
                />
                <div className="relative flex items-start justify-between">
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center text-white font-display font-bold text-lg"
                    style={{ background: colorVar }}
                  >
                    {axis.letter}
                  </div>
                  <Icon className="h-5 w-5 text-neutral-400" />
                </div>
                <h3 className="relative mt-5 font-semibold text-neutral-900 leading-tight">
                  {axis.name}
                </h3>
                <p className="relative mt-2 text-xs text-neutral-600 leading-relaxed">
                  {axis.tagline}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- 5. Joint Business Plan preview ---------------- */
const STATUS_CYCLE: AgentStatus[] = ["todo", "doing", "done"];

const SAMPLE_TASKS: AgentTask[] = [
  {
    id: "demo-1",
    title: "Recruit 2 new ISVs in DACH",
    description:
      "Source, qualify and sign two integration partners covering the DACH mid-market by end of quarter.",
    status: "doing",
    priority: "high",
    axisKey: "recruit",
    targetLevel: 4,
    source: "ai",
    subtasks: [
      { id: "demo-1-a", title: "Build target list of 25 ISVs", status: "done" },
      { id: "demo-1-b", title: "Run discovery calls with top 8", status: "doing" },
    ],
  },
  {
    id: "demo-2",
    title: "Launch co-marketing webinar with Acme",
    description:
      "Joint webinar to convert Acme's mid-market pipeline into co-sourced opportunities.",
    status: "todo",
    priority: "medium",
    axisKey: "cosell",
    subtasks: [
      { id: "demo-2-a", title: "Lock topic and exec speaker", status: "todo" },
      { id: "demo-2-b", title: "Co-write landing page copy", status: "todo" },
      { id: "demo-2-c", title: "Schedule promotion across both lists", status: "todo" },
    ],
  },
  {
    id: "demo-3",
    title: "Close enablement gap on integration certification",
    description:
      "Certify the partner's CSM team so they can lead implementations without our involvement.",
    status: "done",
    priority: "high",
    axisKey: "enable",
    targetLevel: 5,
    subtasks: [
      { id: "demo-3-a", title: "Run 2-day technical bootcamp", status: "done" },
      { id: "demo-3-b", title: "Issue certification credentials", status: "done" },
    ],
  },
];

function PlanPreview() {
  const [tasks, setTasks] = useState<AgentTask[]>(SAMPLE_TASKS);
  const cycle = (id: string) =>
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const i = STATUS_CYCLE.indexOf(t.status);
        const next = STATUS_CYCLE[(i + 1) % STATUS_CYCLE.length];
        return { ...t, status: next };
      }),
    );

  const L = COPY.landing;
  return (
    <section className="bg-white py-22 sm:py-24 px-6">
      <div className="mx-auto max-w-3xl">
        <p className="page-eyebrow text-neutral-500">
          {L.jbpEyebrow}
        </p>
        <h2 className="mt-3 section-title text-3xl text-neutral-900 sm:text-4xl">
          {L.jbpDemoTitle}
        </h2>
        <p className="section-subtitle mt-3 max-w-xl text-neutral-600">{L.jbpDemoIntro}</p>
        <div className="mt-8">
          <AgentPlan tasks={tasks} isOwner onCycleStatus={cycle} />
        </div>
      </div>
    </section>
  );
}

/* ---------------- 6. Final CTA ---------------- */
function FinalCta() {
  const L = COPY.landing;
  return (
    <section className="bg-neutral-950 text-white py-24 sm:py-28 px-6">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="font-display font-semibold tracking-tight text-3xl sm:text-5xl">
          {L.finalCtaTitle}
        </h2>
        <p className="mt-4 text-white/70 max-w-xl mx-auto leading-relaxed">{L.finalCtaBody}</p>
        <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/signup"
            className="btn-candy min-h-11 px-8 inline-flex items-center justify-center"
            aria-label={L.finalCtaPrimary}
          >
            {L.finalCtaPrimary}
            <span aria-hidden>→</span>
          </Link>
          <Link
            to="/login"
            className="btn-candy-secondary min-h-11 px-8 inline-flex items-center justify-center"
            aria-label={L.finalCtaSecondary}
          >
            {L.finalCtaSecondary}
          </Link>
        </div>
      </div>
    </section>
  );
}
