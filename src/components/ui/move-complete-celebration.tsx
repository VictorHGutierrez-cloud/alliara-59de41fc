import * as React from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";

/** Deterministic 0..1 for confetti layout (client-only; avoids hydration mismatch). */
function seeded(n: number, seed: number): number {
  const x = Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const CONFETTI_COLORS = [
  "var(--primary)",
  "#22c55e",
  "#3b82f6",
  "#eab308",
  "#a855f7",
  "#f97316",
  "#ec4899",
];

const PIECE_COUNT = 52;

export interface MoveCompleteCelebrationProps {
  /** Non-null timestamp (e.g. `Date.now()`) triggers a burst; same value remounts. */
  burstAt: number | null;
  /** Called after the burst finishes (or immediately if reduced motion). */
  onConsumed: () => void;
}

/**
 * Full-viewport confetti burst for marking a Joint Business Plan move as done.
 * Respects `prefers-reduced-motion` (skips animation, still calls `onConsumed`).
 */
export function MoveCompleteCelebration({ burstAt, onConsumed }: MoveCompleteCelebrationProps) {
  const [mounted, setMounted] = React.useState(false);
  const [reducedMotion, setReducedMotion] = React.useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const onConsumedRef = React.useRef(onConsumed);
  onConsumedRef.current = onConsumed;

  React.useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  React.useEffect(() => {
    if (burstAt == null) return;
    if (reducedMotion) {
      onConsumedRef.current();
      return;
    }
    const t = window.setTimeout(() => onConsumedRef.current(), 2800);
    return () => window.clearTimeout(t);
  }, [burstAt, reducedMotion]);

  if (!mounted || burstAt == null || reducedMotion) return null;

  const dropPx = typeof window !== "undefined" ? window.innerHeight * 1.25 : 900;

  const pieces = Array.from({ length: PIECE_COUNT }, (_, i) => {
    const r = seeded(i, burstAt);
    const r2 = seeded(i + 100, burstAt);
    const r3 = seeded(i + 200, burstAt);
    return {
      leftPct: r * 100,
      w: r2 > 0.62 ? 10 : 6,
      h: r2 > 0.62 ? 14 : 9,
      delay: r3 * 0.45,
      duration: 2 + r * 1.35,
      rotate: r2 * 720,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    };
  });

  return createPortal(
    <div
      className="pointer-events-none fixed inset-0 z-[9998] overflow-hidden"
      aria-hidden="true"
    >
      {pieces.map((p, i) => (
        <motion.div
          key={`${burstAt}-${i}`}
          className="absolute top-0 rounded-[2px]"
          style={{
            left: `${p.leftPct}%`,
            marginLeft: -p.w / 2,
            width: p.w,
            height: p.h,
            backgroundColor: p.color,
          }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{ y: dropPx, opacity: 0, rotate: p.rotate }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "linear",
          }}
        />
      ))}
    </div>,
    document.body,
  );
}
