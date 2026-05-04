import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";

export interface KpiTileProps {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  /** CSS color or token, e.g. "var(--primary)" */
  accent?: string;
  /** Percent delta vs previous period. Positive = up. */
  delta?: number;
  /** When true, "down" is treated as good (e.g. churn rate). */
  invertDelta?: boolean;
  delay?: number;
}

export function KpiTile({
  label,
  value,
  hint,
  icon: Icon,
  accent = "var(--primary)",
  delta,
  invertDelta = false,
  delay = 0,
}: KpiTileProps) {
  const hasDelta = typeof delta === "number" && Number.isFinite(delta);
  const up = hasDelta && delta! > 0;
  const down = hasDelta && delta! < 0;
  const flat = hasDelta && delta === 0;
  const good = (up && !invertDelta) || (down && invertDelta);
  const TrendIcon = flat ? Minus : up ? TrendingUp : TrendingDown;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 card-elev hover:-translate-y-0.5 transition-transform"
    >
      <div
        className="absolute top-0 left-0 h-1 w-full"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
      />
      <div
        className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40"
        style={{ background: accent }}
      />
      <div className="flex items-start justify-between gap-3 relative">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            {label}
          </div>
          <div className="mt-2 text-3xl font-display font-bold text-foreground tabular-nums">
            {value}
          </div>
          {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
        </div>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: `color-mix(in oklab, ${accent} 18%, transparent)`,
            color: accent,
          }}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {hasDelta && (
        <div
          className="mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-mono tabular-nums"
          style={{
            background: good
              ? "color-mix(in oklab, var(--success) 14%, transparent)"
              : flat
                ? "color-mix(in oklab, var(--muted-foreground) 14%, transparent)"
                : "color-mix(in oklab, var(--destructive) 14%, transparent)",
            color: good
              ? "var(--success)"
              : flat
                ? "var(--muted-foreground)"
                : "var(--destructive)",
          }}
        >
          <TrendIcon className="h-3 w-3" />
          {flat ? "0%" : `${up ? "+" : ""}${delta!.toFixed(1)}%`}
        </div>
      )}
    </motion.div>
  );
}