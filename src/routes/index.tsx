// rev: landing-calm-command-v2 (uses global tokens)
import { createFileRoute, Link } from "@tanstack/react-router";
import { AXES } from "../content/octa";

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
    <div className="min-h-[calc(100vh-3.5rem)] -mt-14 pt-14 px-6">
      <div className="mx-auto max-w-6xl min-h-[calc(100vh-3.5rem)] grid lg:grid-cols-[1.1fr_0.9fr] items-center gap-12 lg:gap-16 py-12 lg:py-0">
        {/* Left — copy + CTA */}
        <div className="max-w-xl animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="font-mono">for Factorial PDMs</span>
          </div>

          <h1 className="mt-7 font-display font-semibold tracking-[-0.025em] text-[44px] leading-[1.05] sm:text-[56px] sm:leading-[1.02] text-foreground">
            Orchestrate every partner
            <br />
            <span className="text-primary">like it's your only one.</span>
          </h1>

          <p className="mt-6 max-w-md text-[17px] leading-[1.55] text-muted-foreground">
            One operating system to diagnose, plan, and grow each partnership across 8 axes.
          </p>

          <div className="mt-9 flex flex-col items-start gap-4">
            <Link
              to="/login"
              className="group inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3.5 text-[15px] font-semibold transition hover:-translate-y-0.5 glow-ring"
            >
              Sign in with Factorial
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>

            <Link to="/signup" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              New here? <span className="text-foreground">Create your account</span>
            </Link>
          </div>
        </div>

        {/* Right — OCTA octagon */}
        <div className="flex justify-center lg:justify-end">
          <OctaMark />
        </div>
      </div>
    </div>
  );
}

function OctaMark() {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const r = 110;
  const points = AXES.map((axis, i) => {
    const angle = (i * (360 / 8) - 90) * (Math.PI / 180);
    return { axis, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
  const polygon = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="relative">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block" aria-hidden>
        {/* Soft outer halo — slow pulse */}
        <circle cx={cx} cy={cy} r={r + 28} fill="var(--primary)" opacity="0.06">
          <animate attributeName="r" values={`${r + 22};${r + 32};${r + 22}`} dur="8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.04;0.1;0.04" dur="8s" repeatCount="indefinite" />
        </circle>

        {/* Connecting octagon */}
        <polygon points={polygon} fill="none" stroke="var(--border)" strokeWidth="1" />

        {/* Spokes */}
        {points.map((p, i) => (
          <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--border)" strokeWidth="1" opacity="0.6" />
        ))}

        {/* Center pulse */}
        <circle cx={cx} cy={cy} r="6" fill="var(--primary)" />
        <circle cx={cx} cy={cy} r="6" fill="none" stroke="var(--primary)" strokeWidth="1.5" opacity="0.6">
          <animate attributeName="r" values="6;18;6" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0;0.6" dur="3s" repeatCount="indefinite" />
        </circle>

        {/* Axis nodes */}
        {points.map(({ axis, x, y }) => {
          const color = `var(--${axis.color})`;
          return (
            <g key={axis.key}>
              <circle cx={x} cy={y} r="18" fill="var(--card)" stroke={color} strokeWidth="1.5" />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="Space Grotesk, ui-sans-serif, system-ui, sans-serif"
                fontSize="13"
                fontWeight="700"
                fill="var(--foreground)"
              >
                {axis.letter}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-3 text-center text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
        the OCTA model · 8 axes
      </p>
    </div>
  );
}
