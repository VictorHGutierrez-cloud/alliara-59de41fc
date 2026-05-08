import type { Database } from "@/integrations/supabase/types";

export type PartnerType = Database["public"]["Enums"]["partner_type"];

export const PARTNER_TYPES: { key: PartnerType; label: string; color: string; description: string }[] = [
  { key: "referral", label: "Referral", color: "octa-1", description: "Sources opportunities, hands them to Factorial sales" },
  { key: "reseller", label: "Reseller", color: "octa-4", description: "Owns the commercial cycle end-to-end" },
  { key: "expert", label: "Expert", color: "octa-7", description: "Implementation / advisory partner — deep delivery muscle" },
];

export function partnerTypeLabel(t: PartnerType | null | undefined): string {
  if (!t) return "—";
  return PARTNER_TYPES.find((x) => x.key === t)?.label ?? t;
}

export function partnerTypeColor(t: PartnerType | null | undefined): string {
  if (!t) return "octa-7";
  return PARTNER_TYPES.find((x) => x.key === t)?.color ?? "octa-7";
}

export type SortKey =
  | "name_asc"
  | "name_desc"
  | "revenue_desc"
  | "mrr_desc"
  | "created_desc"
  | "maturity_desc"
  | "status_asc"
  | "status_desc"
  | "next_action_asc"
  | "next_action_desc"
  | "owner_asc"
  | "owner_desc"
  | "last_touch_asc"
  | "last_touch_desc";

export const PARTNER_SORTS: { key: SortKey; label: string }[] = [
  { key: "name_asc", label: "Name · A → Z" },
  { key: "name_desc", label: "Name · Z → A" },
  { key: "status_asc", label: "Health · A → Z" },
  { key: "status_desc", label: "Health · Z → A" },
  { key: "next_action_asc", label: "Next action · A → Z" },
  { key: "next_action_desc", label: "Next action · Z → A" },
  { key: "owner_asc", label: "Owner · A → Z" },
  { key: "owner_desc", label: "Owner · Z → A" },
  { key: "last_touch_asc", label: "Last touch · oldest first" },
  { key: "last_touch_desc", label: "Last touch · newest first" },
  { key: "revenue_desc", label: "Revenue · highest" },
  { key: "mrr_desc", label: "MRR · highest" },
  { key: "created_desc", label: "Recently added" },
  { key: "maturity_desc", label: "Maturity · highest" },
];

export const LEAD_SORTS = [
  { key: "name_asc", label: "Name · A → Z" },
  { key: "name_desc", label: "Name · Z → A" },
  { key: "score_desc", label: "Score · highest" },
  { key: "created_desc", label: "Recently added" },
] as const;

export type LeadSortKey = typeof LEAD_SORTS[number]["key"];
