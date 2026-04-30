// rev: octa-rename
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OCTA OS — Build a partner ecosystem that compounds" },
      { name: "description", content: "An interactive operating system for B2B partnership teams. Diagnose maturity across 8 OCTA axes and execute the next move." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface/60 px-3 py-1 text-xs font-mono text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          The Partnership Operating System
        </div>
        <h1 className="mt-6 text-5xl sm:text-6xl font-bold tracking-tight">
          <span className="text-gradient">OCTA OS</span>
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base text-muted-foreground">
          The command center for Partner Development Managers. Sign in to manage your portfolio.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/login" className="inline-flex items-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground glow-ring hover:opacity-90">
            Sign in
          </Link>
          <Link to="/signup" className="inline-flex items-center rounded-lg border border-border bg-surface px-5 py-3 text-sm font-semibold hover:bg-surface-2">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
