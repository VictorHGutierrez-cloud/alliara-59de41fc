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
  );
}
