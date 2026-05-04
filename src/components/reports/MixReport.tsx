import type { PortfolioItem } from "@/lib/partners-store";
import { ReportCard } from "./ReportCard";
import { CandyDonut } from "@/components/ui/candy-charts";
import { byType, byTier } from "@/lib/reports/aggregations";

const TYPE_COLOR: Record<string, string> = {
  referral: "var(--primary)",
  reseller: "var(--secondary)",
  expert: "var(--octa-4)",
};
const TIER_COLOR: Record<string, string> = {
  strategic: "var(--octa-1)",
  core: "var(--octa-4)",
  emerging: "var(--octa-5)",
  long_tail: "var(--octa-7)",
};
const TIER_LABEL: Record<string, string> = {
  strategic: "Strategic", core: "Core", emerging: "Emerging", long_tail: "Long tail",
};

export function MixReport({ items }: { items: PortfolioItem[] }) {
  const types = byType(items);
  const tiers = byTier(items);
  const total = items.length;

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <ReportCard
        title="Mix by partner type"
        description="Referral / Reseller / Expert split."
        csvRows={() => Object.entries(types).map(([k, v]) => ({ type: k, count: v }))}
      >
        <CandyDonut
          centerLabel="Partners"
          centerValue={String(total)}
          slices={Object.entries(types).map(([k, v]) => ({
            label: k.charAt(0).toUpperCase() + k.slice(1),
            value: v,
            color: TYPE_COLOR[k] ?? "var(--muted-foreground)",
          }))}
        />
      </ReportCard>
      <ReportCard
        title="Mix by tier"
        description="How investment is distributed across partner tiers."
        csvRows={() => Object.entries(tiers).map(([k, v]) => ({ tier: k, count: v }))}
      >
        <CandyDonut
          centerLabel="Partners"
          centerValue={String(total)}
          slices={Object.entries(tiers).map(([k, v]) => ({
            label: TIER_LABEL[k] ?? k,
            value: v,
            color: TIER_COLOR[k] ?? "var(--muted-foreground)",
          }))}
        />
      </ReportCard>
    </div>
  );
}