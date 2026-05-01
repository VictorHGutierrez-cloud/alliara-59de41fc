// rev: landing-prisma-hero-v2
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PrismaHero } from "@/components/ui/prisma-hero";
import { AgentPlan, type AgentTask, type AgentStatus } from "@/components/ui/agent-plan";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Conduit — Orchestrate every partner like it's your only one" },
      { name: "description", content: "An operating system for Factorial Partner Development Managers. Diagnose, plan, and grow each partnership across 8 axes." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <>
      <PrismaHero
      videoSrc="https://hbarmsaprabwwickdudg.supabase.co/storage/v1/object/public/public-assets/prisma-hero.mp4"
      eyebrow={null}
      headlineSegments={[
        { text: "Orchestrate every partner", className: "text-white" },
        { text: "like it's your only one.", className: "italic text-white/70" },
      ]}
      description={null}
      primaryCta={
        <Link
          to="/login"
          className="group inline-flex items-center gap-2 rounded-xl bg-white text-black px-6 py-3.5 text-[15px] font-semibold transition hover:-translate-y-0.5 hover:bg-white/90"
        >
          Sign in
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      }
      secondaryCta={
        <Link to="/signup" className="text-sm text-white/70 underline-offset-4 hover:underline hover:text-white">
          New here? <span className="text-white font-medium">Create your account</span>
        </Link>
      }
      />
      <DemoTasks />
    </>
  );
}

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

function DemoTasks() {
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
    <section className="bg-background py-20 px-6">
      <div className="mx-auto max-w-3xl">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">See it in motion</p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-display font-semibold tracking-tight">
          Every partner gets their own Joint Business Plan.
        </h2>
        <p className="mt-3 text-sm text-muted-foreground max-w-xl">
          Click a status icon to cycle through Planned → In Motion → Delivered. Click a task to expand its subtasks.
        </p>
        <div className="mt-8">
          <AgentPlan tasks={tasks} isOwner onCycleStatus={cycle} />
        </div>
      </div>
    </section>
  );
}
