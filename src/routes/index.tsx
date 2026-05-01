// rev: landing-prisma-hero-v1
import { createFileRoute, Link } from "@tanstack/react-router";
import { PrismaHero } from "@/components/ui/prisma-hero";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OCTA OS — Orchestrate every partner like it's your only one" },
      { name: "description", content: "An operating system for Factorial Partner Development Managers. Diagnose, plan, and grow each partnership across 8 axes." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <PrismaHero
      eyebrow="for Factorial PDMs"
      headlineSegments={[
        { text: "Orchestrate every partner", className: "text-foreground" },
        { text: "like it's your only one.", className: "text-primary" },
      ]}
      description="One operating system to diagnose, plan, and grow each partnership across 8 axes."
      primaryCta={
        <Link
          to="/login"
          className="group inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3.5 text-[15px] font-semibold transition hover:-translate-y-0.5 glow-ring"
        >
          Sign in with Factorial
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      }
      secondaryCta={
        <Link to="/signup" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
          New here? <span className="text-foreground">Create your account</span>
        </Link>
      }
    />
  );
}
