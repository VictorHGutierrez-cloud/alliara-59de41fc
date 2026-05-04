import { useReducer, useCallback } from "react";
import type { PartnerType } from "@/lib/partner-types";

export type ReportScope = "mine" | "all";
export type ReportStatus = "all" | "active" | "nurturing" | "at_risk" | "paused" | "archived";
export type ReportTier = "all" | "strategic" | "core" | "emerging" | "long_tail";
export type ReportPeriod = "30d" | "90d" | "6m" | "12m" | "all";

export interface ReportFilters {
  scope: ReportScope;
  pdmId: string;          // "all" or specific id
  type: PartnerType | "all";
  status: ReportStatus;
  tier: ReportTier;
  period: ReportPeriod;
}

export const DEFAULT_REPORT_FILTERS: ReportFilters = {
  scope: "mine",
  pdmId: "all",
  type: "all",
  status: "all",
  tier: "all",
  period: "all",
};

type Action =
  | { type: "set"; key: keyof ReportFilters; value: string }
  | { type: "patch"; value: Partial<ReportFilters> }
  | { type: "reset" };

function reducer(state: ReportFilters, action: Action): ReportFilters {
  if (action.type === "reset") return DEFAULT_REPORT_FILTERS;
  if (action.type === "patch") return { ...state, ...action.value };
  return { ...state, [action.key]: action.value } as ReportFilters;
}

export function useReportFilters(initial?: Partial<ReportFilters>) {
  const [filters, dispatch] = useReducer(
    reducer,
    { ...DEFAULT_REPORT_FILTERS, ...initial },
  );

  const set = useCallback(
    <K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) =>
      dispatch({ type: "set", key, value: value as string }),
    [],
  );
  const patch = useCallback((value: Partial<ReportFilters>) => dispatch({ type: "patch", value }), []);
  const reset = useCallback(() => dispatch({ type: "reset" }), []);

  return { filters, set, patch, reset };
}

export function periodToCutoff(p: ReportPeriod): Date | null {
  const now = new Date();
  switch (p) {
    case "30d": return new Date(now.getTime() - 30 * 86400_000);
    case "90d": return new Date(now.getTime() - 90 * 86400_000);
    case "6m": { const d = new Date(now); d.setMonth(d.getMonth() - 6); return d; }
    case "12m": { const d = new Date(now); d.setMonth(d.getMonth() - 12); return d; }
    case "all":
    default: return null;
  }
}