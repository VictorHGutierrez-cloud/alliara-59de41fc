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
  AreaChart,
  Area,
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

/* ───────── Horizontal stacked rows (e.g. status mix per PDM) ───────── */

export interface StackedRow {
  label: string;
  segments: CompositionSegment[];
  total: number;
}

export function CandyHorizontalStacked({
  rows,
  legend,
  rowHeight = 18,
  labelWidth = 140,
}: {
  rows: StackedRow[];
  legend: { label: string; color: string }[];
  rowHeight?: number;
  labelWidth?: number;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-surface/40 p-6 text-center text-xs text-muted-foreground">
        No data for the current filters.
      </div>
    );
  }
  const maxTotal = Math.max(1, ...rows.map((r) => r.total));
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        {legend.map((l, i) => (
          <span key={i} className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
            <span className="text-foreground">{l.label}</span>
          </span>
        ))}
      </div>
      <div className="space-y-2">
        {rows.map((r) => {
          const widthPct = (r.total / maxTotal) * 100;
          return (
            <div key={r.label} className="flex items-center gap-3">
              <div
                className="text-xs text-foreground font-medium truncate"
                style={{ width: labelWidth, minWidth: labelWidth }}
                title={r.label}
              >
                {r.label}
              </div>
              <div className="flex-1 flex items-center gap-2 min-w-0">
                <div
                  className="flex overflow-hidden rounded-full border border-border/60 bg-surface-2"
                  style={{ height: rowHeight, width: `${widthPct}%`, minWidth: 6 }}
                >
                  {r.segments.map((s, i) => {
                    const pct = r.total > 0 ? (s.value / r.total) * 100 : 0;
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
                <span className="text-[11px] font-mono tabular-nums text-muted-foreground">{r.total}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────── Donut (categorical breakdown) ───────── */

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
  onClick?: () => void;
}

export function CandyDonut({
  slices,
  size = 200,
  thickness = 28,
  centerLabel,
  centerValue,
}: {
  slices: DonutSlice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const radius = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;

  if (total === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-border/60 bg-surface/40 text-xs text-muted-foreground"
        style={{ width: size, height: size }}
      >
        No data
      </div>
    );
  }

  let start = -Math.PI / 2;
  const arcs = slices.map((s) => {
    const angle = (s.value / total) * Math.PI * 2;
    const end = start + angle;
    const x1 = cx + radius * Math.cos(start);
    const y1 = cy + radius * Math.sin(start);
    const x2 = cx + radius * Math.cos(end);
    const y2 = cy + radius * Math.sin(end);
    const largeArc = angle > Math.PI ? 1 : 0;
    const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
    const out = { ...s, path, pct: (s.value / total) * 100 };
    start = end;
    return out;
  });

  return (
    <div className="flex items-center gap-5 flex-wrap">
      <svg width={size} height={size} role="img" aria-label="Donut chart">
        <defs>
          <filter id="donutShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="rgba(255,192,203,0.5)" />
          </filter>
        </defs>
        {arcs.map((a, i) => (
          <path
            key={i}
            d={a.path}
            fill="none"
            stroke={a.color}
            strokeWidth={thickness}
            strokeLinecap="butt"
            filter="url(#donutShadow)"
            onClick={a.onClick}
            style={{ cursor: a.onClick ? "pointer" : "default", transition: "opacity 160ms ease" }}
          >
            <title>{`${a.label}: ${a.value} (${a.pct.toFixed(0)}%)`}</title>
          </path>
        ))}
        {(centerLabel || centerValue) && (
          <g>
            {centerValue && (
              <text
                x={cx}
                y={cy - 2}
                textAnchor="middle"
                style={{ fontSize: 22, fontWeight: 700, fill: "var(--foreground)", fontFamily: "var(--font-display)" }}
              >
                {centerValue}
              </text>
            )}
            {centerLabel && (
              <text
                x={cx}
                y={cy + 16}
                textAnchor="middle"
                style={{ fontSize: 10, fill: "var(--muted-foreground)", letterSpacing: 1, textTransform: "uppercase" }}
              >
                {centerLabel}
              </text>
            )}
          </g>
        )}
      </svg>
      <div className="space-y-1.5 text-xs">
        {arcs.map((a, i) => (
          <button
            key={i}
            onClick={a.onClick}
            disabled={!a.onClick}
            className={`flex items-center gap-2 ${a.onClick ? "hover:text-foreground" : ""} text-muted-foreground`}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: a.color }} />
            <span className="text-foreground font-medium">{a.label}</span>
            <span className="font-mono tabular-nums">
              {a.value} · {a.pct.toFixed(0)}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ───────── Candy stacked area chart ─────────
 * Smooth gradient-filled area stack inspired by reaviz, built on recharts.
 */

export interface AreaSeries {
  key: string;
  label: string;
  color: string;
}

export interface CandyStackedAreaProps {
  data: Array<Record<string, number | string>>;
  series: AreaSeries[];
  height?: number;
  valueFormatter?: (n: number) => string;
  emptyMessage?: string;
  /** Field name for the X axis label (defaults to "label") */
  xKey?: string;
}

function StackedTooltip({ active, payload, label, valueFormatter, series }: any) {
  if (!active || !payload || !payload.length) return null;
  const total = payload.reduce(
    (s: number, p: any) => s + (typeof p.value === "number" ? p.value : 0),
    0,
  );
  return (
    <div
      className="rounded-xl border border-border/70 bg-white/95 backdrop-blur px-3 py-2 text-xs shadow-lg min-w-[160px]"
      style={{ boxShadow: "0 10px 28px -10px rgba(255,192,203,0.55)" }}
    >
      <div className="font-semibold text-foreground mb-1.5">{label}</div>
      <div className="space-y-1">
        {payload
          .slice()
          .reverse()
          .map((p: any, i: number) => {
            const meta = series.find((s: AreaSeries) => s.key === p.dataKey);
            return (
              <div key={i} className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: meta?.color ?? p.color }}
                  />
                  <span className="text-foreground">{meta?.label ?? p.dataKey}</span>
                </span>
                <span className="font-mono tabular-nums text-foreground">
                  {valueFormatter ? valueFormatter(p.value) : p.value}
                </span>
              </div>
            );
          })}
      </div>
      <div className="mt-1.5 pt-1.5 border-t border-border/40 flex items-center justify-between text-[10px] uppercase tracking-widest font-mono text-muted-foreground">
        <span>Total</span>
        <span className="text-foreground">
          {valueFormatter ? valueFormatter(total) : total}
        </span>
      </div>
    </div>
  );
}

export function CandyStackedArea({
  data,
  series,
  height = 260,
  valueFormatter,
  emptyMessage = "No data yet",
  xKey = "label",
}: CandyStackedAreaProps) {
  const id = React.useId().replace(/[:]/g, "");
  const hasAny = data.some((d) =>
    series.some((s) => typeof d[s.key] === "number" && (d[s.key] as number) > 0),
  );

  if (!data.length || !hasAny) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-border/60 bg-surface/40 text-xs text-muted-foreground"
        style={{ height }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
            <span className="text-foreground">{s.label}</span>
          </span>
        ))}
      </div>
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 12, right: 12, left: 4, bottom: 8 }}>
            <defs>
              {series.map((s, i) => (
                <linearGradient
                  key={s.key}
                  id={`candyArea-${id}-${i}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.85} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0.15} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid
              stroke="color-mix(in oklab, var(--border) 70%, transparent)"
              strokeDasharray="3 6"
              vertical={false}
            />
            <XAxis
              dataKey={xKey}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
            />
            <YAxis
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={(v: number) =>
                valueFormatter ? valueFormatter(v) : String(v)
              }
            />
            <Tooltip
              cursor={{
                stroke: "color-mix(in oklab, var(--primary) 40%, transparent)",
                strokeWidth: 1,
                strokeDasharray: "3 4",
              }}
              content={
                <StackedTooltip valueFormatter={valueFormatter} series={series} />
              }
            />
            {series.map((s, i) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stackId="1"
                stroke={s.color}
                strokeWidth={1.5}
                fill={`url(#candyArea-${id}-${i})`}
                isAnimationActive
                animationDuration={750}
                animationEasing="ease-out"
                activeDot={{
                  r: 4,
                  stroke: "#fff",
                  strokeWidth: 2,
                  fill: s.color,
                }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}