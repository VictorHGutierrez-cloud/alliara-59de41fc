import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

/* ───────── shared visuals ─────────
 * Candy-themed chart primitives. Pastel pink primary, sky-blue secondary,
 * soft glassy tooltips, rounded bar tops, and animated entry.
 */

export type BarDatum = {
  label: string;
  value: number;
  /** Optional secondary value shown in the tooltip */
  secondary?: { label: string; value: string | number };
  /** Optional accent token override (e.g. "octa-4") */
  accent?: string;
};

const CANDY_COLORS = [
  "var(--primary)",
  "var(--secondary)",
  "var(--octa-4)",
  "var(--octa-1)",
  "var(--octa-5)",
  "var(--octa-7)",
  "var(--octa-3)",
  "var(--octa-6)",
];

function CandyTooltip({ active, payload, valueFormatter }: any) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0];
  const datum: BarDatum = p.payload;
  return (
    <div
      className="rounded-xl border border-border/70 bg-white/95 backdrop-blur px-3 py-2 text-xs shadow-lg"
      style={{ boxShadow: "0 10px 28px -10px rgba(255,192,203,0.55)" }}
    >
      <div className="font-semibold text-foreground">{datum.label}</div>
      <div className="mt-0.5 font-mono tabular-nums text-foreground">
        {valueFormatter ? valueFormatter(datum.value) : datum.value}
      </div>
      {datum.secondary && (
        <div className="mt-0.5 text-muted-foreground">
          {datum.secondary.label}:{" "}
          <span className="text-foreground font-medium">{datum.secondary.value}</span>
        </div>
      )}
    </div>
  );
}

/* ───────── Candy bar chart ───────── */

export interface CandyBarChartProps {
  data: BarDatum[];
  height?: number;
  /** Format a value for the Y axis ticks AND tooltip. */
  valueFormatter?: (n: number) => string;
  /** Show value labels on top of each bar (formatted). */
  showLabels?: boolean;
  /** Use a single color for all bars (default) vs a palette. */
  variant?: "primary" | "palette" | "secondary";
  /** Optional empty-state message. */
  emptyMessage?: string;
}

export function CandyBarChart({
  data,
  height = 260,
  valueFormatter,
  showLabels = true,
  variant = "primary",
  emptyMessage = "No data yet",
}: CandyBarChartProps) {
  const id = React.useId().replace(/[:]/g, "");

  if (!data.length || data.every((d) => !d.value)) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-border/60 bg-surface/40 text-xs text-muted-foreground"
        style={{ height }}
      >
        {emptyMessage}
      </div>
    );
  }

  const colorFor = (i: number) => {
    if (variant === "palette") return CANDY_COLORS[i % CANDY_COLORS.length];
    if (variant === "secondary") return "var(--secondary)";
    return "var(--primary)";
  };

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 24, right: 12, left: 4, bottom: 8 }}
          barCategoryGap={"22%"}
        >
          <defs>
            {data.map((_, i) => (
              <linearGradient
                key={i}
                id={`candyBar-${id}-${i}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={colorFor(i)} stopOpacity={0.95} />
                <stop offset="100%" stopColor={colorFor(i)} stopOpacity={0.55} />
              </linearGradient>
            ))}
            <filter id={`candyShadow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow
                dx="0"
                dy="4"
                stdDeviation="3"
                floodColor="rgba(255,192,203,0.55)"
              />
            </filter>
          </defs>
          <CartesianGrid
            stroke="color-mix(in oklab, var(--border) 70%, transparent)"
            strokeDasharray="3 6"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            interval={0}
            angle={data.length > 6 ? -18 : 0}
            textAnchor={data.length > 6 ? "end" : "middle"}
            height={data.length > 6 ? 56 : 30}
          />
          <YAxis
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(v: number) =>
              valueFormatter ? valueFormatter(v) : String(v)
            }
          />
          <Tooltip
            cursor={{
              fill: "color-mix(in oklab, var(--primary) 8%, transparent)",
              radius: 8,
            }}
            content={<CandyTooltip valueFormatter={valueFormatter} />}
          />
          <Bar
            dataKey="value"
            radius={[10, 10, 4, 4]}
            isAnimationActive
            animationDuration={750}
            animationEasing="ease-out"
            filter={`url(#candyShadow-${id})`}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={`url(#candyBar-${id}-${i})`} />
            ))}
            {showLabels && (
              <LabelList
                dataKey="value"
                position="top"
                formatter={(v: number) =>
                  valueFormatter ? valueFormatter(v) : String(v)
                }
                style={{
                  fill: "var(--foreground)",
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: "var(--font-mono)",
                }}
              />
            )}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ───────── Stacked composition bar (single horizontal row) ─────────
 * Use to visualize how a total breaks down (e.g. partner status mix).
 */

export interface CompositionSegment {
  label: string;
  value: number;
  color: string; // CSS color or var(--token)
}

export function CandyComposition({
  segments,
  showLegend = true,
  height = 14,
}: {
  segments: CompositionSegment[];
  showLegend?: boolean;
  height?: number;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div className="space-y-2">
      <div
        className="flex w-full overflow-hidden rounded-full border border-border/60 bg-surface-2"
        style={{ height }}
      >
        {segments.map((s, i) => {
          const pct = (s.value / total) * 100;
          if (pct <= 0) return null;
          return (
            <div
              key={i}
              title={`${s.label}: ${s.value} (${pct.toFixed(0)}%)`}
              style={{
                width: `${pct}%`,
                background: `linear-gradient(180deg, ${s.color}, color-mix(in oklab, ${s.color} 70%, white))`,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45)",
                transition: "width 600ms ease",
              }}
            />
          );
        })}
      </div>
      {showLegend && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          {segments.map((s, i) => {
            const pct = Math.round((s.value / total) * 100);
            return (
              <div key={i} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: s.color }}
                />
                <span className="text-foreground font-medium">{s.label}</span>
                <span className="font-mono tabular-nums">
                  {s.value} · {pct}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}