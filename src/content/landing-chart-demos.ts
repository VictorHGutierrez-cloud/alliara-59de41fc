import type { BarDatum, DonutSlice } from "@/components/ui/candy-charts";

/** Demo bars for landing “Open MRR” story (illustrative). */
export const DEMO_LANDING_REVENUE: BarDatum[] = [
  { label: "Northwind", value: 2000 },
  { label: "Helix", value: 1000 },
  { label: "Bluepeak", value: 985 },
  { label: "Orbit", value: 588 },
  { label: "Vertex", value: 573 },
  { label: "Aurora", value: 531 },
  { label: "Cobalt", value: 451 },
  { label: "Pulse", value: 420 },
  { label: "Stride", value: 259 },
];

/** Demo slices for landing “mix by tier” donut (illustrative). */
export const DEMO_LANDING_MIX_SLICES: DonutSlice[] = [
  { label: "Emerging", value: 33, color: "var(--octa-7)" },
  { label: "Core", value: 19, color: "var(--octa-4)" },
  { label: "Long tail", value: 19, color: "var(--octa-5)" },
  { label: "Strategic", value: 2, color: "var(--octa-1)" },
];

/** Demo stacked-area data for landing "Portfolio growth & health" (illustrative). */
export const DEMO_LANDING_GROWTH: Array<{
  label: string;
  active: number;
  nurturing: number;
  at_risk: number;
}> = [
  { label: "Dec", active: 0, nurturing: 0, at_risk: 0 },
  { label: "Jan", active: 0, nurturing: 0, at_risk: 0 },
  { label: "Feb", active: 0, nurturing: 0, at_risk: 0 },
  { label: "Mar", active: 1, nurturing: 2, at_risk: 4 },
  { label: "Apr", active: 6, nurturing: 18, at_risk: 54 },
  { label: "May", active: 24, nurturing: 4, at_risk: 0 },
];
