// rev: landing-marketing-home-v1
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import * as Icons from "lucide-react";
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

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Alliara — Orchestrate every partner like it's your only one" },
      { name: "description", content: "An operating system for Partner Development Managers. Diagnose, plan, and grow each partnership across 8 axes." },
    ],
  }),
  component: Landing,
});

const PINK = "#EC1E79";

function formatDemoEuro(n: number) {
  if (n >= 1000 && n % 1000 === 0) return `€${n / 1000}k`;
  if (n >= 1000) return `€${(n / 1000).toFixed(1)}k`;
  return `€${n}`;
}

function ProductShowcase() {
  const blocks = [
    {
      kind: "image" as const,
      title: "Maturity radar & growth levers",
      body: "See OCTA scores on a live radar, surface at-risk partners, and jump to the axes that unlock the next level of revenue.",
      img: imgProductRadar,
      alt: "Alliara partner overview with maturity radar and high-impact growth levers",
    },
    {
      kind: "bars" as const,
      title: "Revenue that tells a story",
      body: "Rank partners by Open MRR and other metrics, export when you need to brief leadership, and keep the view aligned to how you run the business.",
    },
    {
      kind: "donut" as const,
      title: "Mix by tier",
      body: "See how your portfolio splits across tiers — where you over-invest and where a nudge unlocks the next stage of maturity.",
    },
  ] as const;

  return (
    <section className="relative py-24 sm:py-32 px-6 overflow-hidden bg-gradient-to-b from-[#F7F7F8] via-white to-[#F7F7F8]">
      <div className="pointer-events-none absolute -top-20 right-[-10%] h-[28rem] w-[28rem] rounded-full bg-[#EC1E79]/[0.07] blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute bottom-20 left-[-15%] h-[22rem] w-[22rem] rounded-full bg-violet-500/[0.08] blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-500">Product</p>
          <h2 className="mt-3 font-display font-semibold tracking-tight text-3xl sm:text-4xl text-neutral-900">
            The command center, in the wild.
          </h2>
          <p className="mt-3 text-neutral-600 max-w-xl">
            Live chart previews plus a real product screen — crisp analytics, OCTA depth, and the workflows your PDMs use every week.
          </p>
        </div>

        <div className="mt-16 sm:mt-20 flex flex-col gap-20 sm:gap-24">
          {blocks.map((b, i) => (
            <div
              key={b.title}
              className={`flex flex-col gap-10 lg:gap-14 lg:items-center ${
                i % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"
              }`}
            >
              <div className="flex-1 min-w-0 flex justify-center lg:justify-start">
                {b.kind === "image" ? (
                  <AnimatedCard aria-label={b.title} className="max-w-xl shadow-md">
                    <CardVisual className="rounded-t-xl bg-gradient-to-b from-neutral-100 to-neutral-50 p-2 sm:p-3">
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
                  <AnimatedCard className="max-w-xl shadow-md">
                    <CardVisual className="rounded-t-xl bg-white px-1 pt-2">
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
                  <AnimatedCard className="max-w-xl shadow-md">
                    <CardVisual className="rounded-t-xl bg-white px-2 pt-4">
                      <div className="flex h-full min-h-0 items-center justify-center overflow-x-auto pb-2">
                        <CandyDonut
                          slices={DEMO_LANDING_MIX_SLICES}
                          size={188}
                          thickness={26}
                          centerValue="73"
                          centerLabel="PARTNERS"
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
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400">
                  {String(i + 1).padStart(2, "0")} — {b.kind === "image" ? "Screen" : "Live preview"}
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

function Landing() {
  return (
    <>
      {/* 1. HERO — full-bleed video, only CTAs */}
      <PrismaHero
        videoSrc="/fios.mp4"
        eyebrow={null}
        description={null}
        overlayOpacity={0}
        primaryCta={
          <div className="flex flex-wrap gap-3">
            <Link to="/login" className="btn-candy group">
              Sign in
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
            <Link to="/signup" className="btn-candy-secondary">
              Create your account
            </Link>
          </div>
        }
        secondaryCta={null}
      />

      <Manifesto />
      <ProductShowcase />
      <PortfolioPreview />
      <AxesPreview />
      <PlanPreview />
      <FinalCta />
    </>
  );
}

/* ---------------- 2. Manifesto ---------------- */
function Manifesto() {
  return (
    <section className="bg-[#F7F7F8] py-32 px-6">
      <div className="mx-auto max-w-5xl text-center">
        <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-500">
          Our manifesto
        </p>
        <h2 className="mt-6 font-display font-semibold tracking-[-0.03em] text-neutral-900 text-5xl sm:text-7xl leading-[1.05]">
          <span className="block">We exist</span>
          <span className="block">
            <span>to </span>
            <span style={{ color: PINK }} className="italic">
              <Typewriter
                text={[
                  "partner.",
                  "co-create.",
                  "grow together.",
                  "unlock alliances.",
                  "build what's next.",
                ]}
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
  { name: "Northwind Solutions", type: "Reseller", status: "Active", tier: "Strategic", score: 4.6, region: "DACH" },
  { name: "Helix Integrations", type: "ISV", status: "Nurturing", tier: "Growth", score: 3.4, region: "UK & I" },
  { name: "Bluepeak Consulting", type: "SI", status: "Active", tier: "Growth", score: 3.9, region: "Iberia" },
  { name: "Orbit Tech Group", type: "Reseller", status: "At risk", tier: "Emerging", score: 2.3, region: "Nordics" },
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
  return (
    <section className="bg-white py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-500">
            Portfolio
          </p>
          <h2 className="mt-3 font-display font-semibold tracking-tight text-3xl sm:text-4xl text-neutral-900">
            Every partner, in one command center.
          </h2>
          <p className="mt-3 text-neutral-600 max-w-xl">
            One screen to see who's strategic, who's drifting, and who needs your time this week.
            Tier, status, and OCTA maturity score — at a glance.
          </p>
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
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[p.status]}`}>
                  {p.status}
                </span>
              </div>
              <h3 className="mt-4 font-semibold text-neutral-900">{p.name}</h3>
              <p className="text-xs text-neutral-500 mt-0.5">{p.type} · {p.region}</p>
              <div className="mt-5 flex items-end justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-neutral-400">OCTA score</p>
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
  return (
    <section className="bg-[#F7F7F8] py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-500">
            The OCTA framework
          </p>
          <h2 className="mt-3 font-display font-semibold tracking-tight text-3xl sm:text-4xl text-neutral-900">
            Eight axes. One operating system.
          </h2>
          <p className="mt-3 text-neutral-600 max-w-xl">
            Every partner is evaluated across eight dimensions of revenue maturity —
            from strategic fit to customer success — so you always know where to invest next.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {AXES.map((axis, idx) => {
            const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[axis.icon] ?? Icons.Circle;
            const colorVar = `var(--octa-${idx + 1})`;
            return (
              <div
                key={axis.key}
                className="group relative rounded-2xl border border-neutral-200 bg-white p-6 hover:shadow-lg transition overflow-hidden"
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
    description: "Source, qualify and sign two integration partners covering the DACH mid-market by end of quarter.",
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
    description: "Joint webinar to convert Acme's mid-market pipeline into co-sourced opportunities.",
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
    description: "Certify the partner's CSM team so they can lead implementations without our involvement.",
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

  return (
    <section className="bg-white py-24 px-6">
      <div className="mx-auto max-w-3xl">
        <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-500">
          Joint Business Plan
        </p>
        <h2 className="mt-3 font-display font-semibold tracking-tight text-3xl sm:text-4xl text-neutral-900">
          Every partner gets their own plan.
        </h2>
        <p className="mt-3 text-neutral-600 max-w-xl">
          Click a status icon to cycle through Planned → In Motion → Delivered. Click a task to expand its subtasks.
        </p>
        <div className="mt-8">
          <AgentPlan tasks={tasks} isOwner onCycleStatus={cycle} />
        </div>
      </div>
    </section>
  );
}

/* ---------------- 6. Final CTA ---------------- */
function FinalCta() {
  return (
    <section className="bg-neutral-950 text-white py-24 px-6">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="font-display font-semibold tracking-tight text-3xl sm:text-5xl">
          Ready to orchestrate your ecosystem?
        </h2>
        <p className="mt-4 text-white/70 max-w-xl mx-auto">
          Join the Partner Development Managers using Alliara to turn every partnership into measurable growth.
        </p>
        <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/signup" className="btn-candy">
            Create your account
            <span aria-hidden>→</span>
          </Link>
          <Link to="/login" className="btn-candy-secondary">
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}
