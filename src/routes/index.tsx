// rev: landing-calm-command
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

/**
 * Landing — "Calm Command"
 * Warm, light, single-CTA entry. Local palette overrides the dark app theme via
 * scoped CSS variables on the wrapper; the rest of the app stays dark.
 */
function Landing() {
  return (
    <div
      className="min-h-[calc(100vh-4rem)] -mt-14 pt-14 px-6"
      style={{
        // Scoped palette — does not leak into other routes.
        background: "oklch(0.985 0.008 85)",
        color: "oklch(0.18 0.02 260)",
        // Subtle warm radial vignette to add depth without noise.
        backgroundImage:
          "radial-gradient(ellipse 80% 60% at 80% 30%, oklch(0.97 0.02 75 / 0.7), transparent 60%), radial-gradient(ellipse 60% 50% at 10% 90%, oklch(0.95 0.025 160 / 0.5), transparent 60%)",
      }}
    >
      <div className="mx-auto max-w-6xl min-h-[calc(100vh-4rem)] grid lg:grid-cols-[1.1fr_0.9fr] items-center gap-12 lg:gap-16 py-12 lg:py-0">
        {/* Left — copy + CTA */}
        <div className="max-w-xl">
          <div
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
            style={{
              borderColor: "oklch(0.92 0.005 80)",
              background: "oklch(1 0 0 / 0.5)",
              color: "oklch(0.45 0.01 80)",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "oklch(0.52 0.16 160)" }}
            />
            <span className="font-mono">for Factorial PDMs</span>
          </div>

          <h1
            className="mt-7 font-display font-semibold tracking-[-0.025em] text-[44px] leading-[1.05] sm:text-[56px] sm:leading-[1.02]"
            style={{ color: "oklch(0.18 0.02 260)" }}
          >
            Orchestrate every partner
            <br />
            <span style={{ color: "oklch(0.52 0.16 160)" }}>
              like it's your only one.
            </span>
          </h1>

          <p
            className="mt-6 max-w-md text-[17px] leading-[1.55]"
            style={{ color: "oklch(0.45 0.01 80)" }}
          >
            One operating system to diagnose, plan, and grow each
            partnership across 8 axes.
          </p>

          <div className="mt-9 flex flex-col items-start gap-4">
            <Link
              to="/login"
              className="group inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-[15px] font-semibold transition hover:-translate-y-0.5"
              style={{
                background: "oklch(0.52 0.16 160)",
                color: "oklch(0.985 0.008 85)",
                boxShadow:
                  "0 12px 28px -12px oklch(0.52 0.16 160 / 0.55), 0 2px 4px -2px oklch(0.52 0.16 160 / 0.4)",
              }}
            >
              Sign in with Factorial
              <span
                aria-hidden
                className="transition-transform group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>

            <Link
              to="/signup"
              className="text-sm underline-offset-4 hover:underline"
              style={{ color: "oklch(0.45 0.01 80)" }}
            >
              New here? <span style={{ color: "oklch(0.18 0.02 260)" }}>Create your account</span>
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

/**
 * OctaMark — decorative SVG octagon showing the 8 OCTA axes.
 * Picture-superiority effect: the user sees the model in 2 seconds.
 */
function OctaMark() {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const r = 110;
  // Start at top, go clockwise. -90deg offset.
  const points = AXES.map((axis, i) => {
    const angle = (i * (360 / 8) - 90) * (Math.PI / 180);
    return {
      axis,
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });

  // Octagon polygon path connecting node positions.
  const polygon = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="relative">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block"
        aria-hidden
      >
        {/* Soft outer halo — slow pulse */}
        <circle
          cx={cx}
          cy={cy}
          r={r + 28}
          fill="oklch(0.52 0.16 160 / 0.06)"
        >
          <animate
            attributeName="r"
            values={`${r + 22};${r + 32};${r + 22}`}
            dur="8s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.5;0.9;0.5"
            dur="8s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Connecting octagon */}
        <polygon
          points={polygon}
          fill="none"
          stroke="oklch(0.85 0.01 80)"
          strokeWidth="1"
        />

        {/* Inner connecting lines from each node to center — sparse spokes */}
        {points.map((p, i) => (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="oklch(0.92 0.005 80)"
            strokeWidth="1"
          />
        ))}

        {/* Center pulse — "always orchestrating" */}
        <circle
          cx={cx}
          cy={cy}
          r="6"
          fill="oklch(0.52 0.16 160)"
        />
        <circle
          cx={cx}
          cy={cy}
          r="6"
          fill="none"
          stroke="oklch(0.52 0.16 160)"
          strokeWidth="1.5"
          opacity="0.6"
        >
          <animate attributeName="r" values="6;18;6" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0;0.6" dur="3s" repeatCount="indefinite" />
        </circle>

        {/* Axis nodes */}
        {points.map(({ axis, x, y }, i) => {
          const color = `var(--${axis.color})`;
          return (
            <g key={axis.key}>
              <circle cx={x} cy={y} r="18" fill="oklch(1 0 0)" stroke={color} strokeWidth="1.5" />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="Space Grotesk, ui-sans-serif, system-ui, sans-serif"
                fontSize="13"
                fontWeight="700"
                fill="oklch(0.18 0.02 260)"
              >
                {axis.letter}
              </text>
            </g>
          );
        })}
      </svg>
      <p
        className="mt-3 text-center text-[11px] font-mono uppercase tracking-[0.18em]"
        style={{ color: "oklch(0.55 0.01 80)" }}
      >
        the OCTA model · 8 axes
      </p>
    </div>
  );
}
