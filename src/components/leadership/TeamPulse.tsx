import type { PortfolioItem } from "@/lib/partners-store";

export function TeamPulse({
  items,
  ownerNames,
}: {
  items: PortfolioItem[];
  ownerNames: Map<string, string>;
}) {
  const byOwner = new Map<string, { load: number; avgMaturity: number; diagnosed: number }>();
  for (const it of items) {
    const key = it.partner.owner_id;
    const row = byOwner.get(key) ?? { load: 0, avgMaturity: 0, diagnosed: 0 };
    row.load += 1;
    if (it.latest) {
      row.avgMaturity += Number(it.latest.overall);
      row.diagnosed += 1;
    }
    byOwner.set(key, row);
  }
  const rows = Array.from(byOwner.entries())
    .map(([ownerId, row]) => ({
      ownerId,
      name: ownerNames.get(ownerId) ?? "Unknown PDM",
      load: row.load,
      avgMaturity: row.diagnosed > 0 ? row.avgMaturity / row.diagnosed : 0,
      diagnosed: row.diagnosed,
    }))
    .sort((a, b) => b.load - a.load);

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 card-elev">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Leadership</p>
      <h2 className="mt-1 text-lg font-semibold">Team pulse</h2>
      <p className="mt-1 text-xs text-muted-foreground">Load, maturity uplift potential, and diagnostic coverage per PDM.</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left py-2">PDM</th>
              <th className="text-right py-2">Portfolio load</th>
              <th className="text-right py-2">Avg maturity</th>
              <th className="text-right py-2">Diagnosed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rows.map((r) => (
              <tr key={r.ownerId}>
                <td className="py-2">{r.name}</td>
                <td className="py-2 text-right font-mono">{r.load}</td>
                <td className="py-2 text-right font-mono">{r.diagnosed > 0 ? r.avgMaturity.toFixed(1) : "—"}</td>
                <td className="py-2 text-right font-mono">{r.diagnosed}/{r.load}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
