import { PARTNER_TYPES, PARTNER_SORTS, type PartnerType, type SortKey } from "@/lib/partner-types";

export type FilterBarProps = {
  query: string;
  onQuery: (q: string) => void;
  type: PartnerType | "all";
  onType: (t: PartnerType | "all") => void;
  sort: SortKey;
  onSort: (s: SortKey) => void;
  rightSlot?: React.ReactNode;
};

export function PartnerFilterBar({
  query, onQuery, type, onType, sort, onSort, rightSlot,
}: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search…"
          className="rounded-lg border border-border/60 bg-surface/60 px-3 py-2 text-sm w-full sm:w-56"
        />
        <div className="inline-flex rounded-lg border border-border/60 bg-surface/60 p-1 text-xs">
          <button
            onClick={() => onType("all")}
            className={`px-2.5 py-1.5 rounded-md transition ${type === "all" ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            All types
          </button>
          {PARTNER_TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => onType(t.key)}
              title={t.description}
              className={`px-2.5 py-1.5 rounded-md transition ${type === t.key ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              style={type === t.key ? { color: `var(--${t.color})` } : {}}
            >
              {t.label}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => onSort(e.target.value as SortKey)}
          className="rounded-lg border border-border/60 bg-surface/60 px-3 py-2 text-xs"
        >
          {PARTNER_SORTS.map((s) => (
            <option key={s.key} value={s.key}>Sort: {s.label}</option>
          ))}
        </select>
      </div>
      {rightSlot}
    </div>
  );
}

export function PartnerTypeChip({ type }: { type: PartnerType | null | undefined }) {
  if (!type) return null;
  const meta = PARTNER_TYPES.find((x) => x.key === type);
  if (!meta) return null;
  return (
    <span
      className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-md"
      style={{
        background: `color-mix(in oklab, var(--${meta.color}) 18%, transparent)`,
        color: `var(--${meta.color})`,
      }}
    >
      {meta.label}
    </span>
  );
}
