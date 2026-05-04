import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

/* ───────── shared types ───────── */

export type StatusTone =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "muted";

const TONE_VARS: Record<StatusTone, string> = {
  primary: "var(--primary)",
  secondary: "var(--secondary)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--destructive)",
  info: "var(--octa-4)",
  muted: "var(--muted-foreground)",
};

export function StatusPill({
  tone = "muted",
  children,
  className,
}: {
  tone?: StatusTone;
  children: React.ReactNode;
  className?: string;
}) {
  const c = TONE_VARS[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest",
        className,
      )}
      style={{
        background: `color-mix(in oklab, ${c} 12%, transparent)`,
        borderColor: `color-mix(in oklab, ${c} 28%, transparent)`,
        color: c,
      }}
    >
      {children}
    </span>
  );
}

/* ───────── custom checkbox ───────── */

function CandyCheckbox({
  checked,
  indeterminate,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (next: boolean) => void;
  ariaLabel?: string;
}) {
  const state: boolean | "mixed" = indeterminate ? "mixed" : checked;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={state}
      aria-label={ariaLabel}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={cn(
        "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border transition-all",
        checked || indeterminate
          ? "border-primary text-primary-foreground"
          : "border-muted-foreground/40 bg-background hover:border-primary/60",
      )}
      style={
        checked || indeterminate
          ? {
              background: "var(--primary)",
              boxShadow: "0 4px 10px -4px color-mix(in oklab, var(--primary) 60%, transparent)",
            }
          : undefined
      }
    >
      <AnimatePresence initial={false} mode="wait">
        {indeterminate ? (
          <motion.span
            key="ind"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.12 }}
          >
            <Minus className="h-3 w-3" strokeWidth={3} />
          </motion.span>
        ) : checked ? (
          <motion.span
            key="chk"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.14 }}
          >
            <Check className="h-3 w-3" strokeWidth={3} />
          </motion.span>
        ) : null}
      </AnimatePresence>
    </button>
  );
}

/* ───────── data table ───────── */

export interface CandyColumn<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  /** Render this when the row is hovered (e.g. an Engage/Promote action). */
  hoverCell?: (row: T) => React.ReactNode;
  /** CSS grid track size, e.g. "minmax(220px,2fr)" or "120px". */
  width?: string;
  align?: "left" | "right" | "center";
  className?: string;
}

export interface CandyBulkAction {
  label: string;
  onClick: (selectedIds: string[]) => void;
  variant?: "default" | "primary" | "danger";
}

export interface CandyDataTableProps<T> {
  rows: T[];
  rowKey: (row: T) => string;
  columns: CandyColumn<T>[];
  selectable?: boolean;
  onRowClick?: (row: T) => void;
  bulkActions?: CandyBulkAction[];
  empty?: React.ReactNode;
  /** Aria label for the table region. */
  ariaLabel?: string;
}

const ALIGN: Record<NonNullable<CandyColumn<unknown>["align"]>, string> = {
  left: "justify-start text-left",
  right: "justify-end text-right",
  center: "justify-center text-center",
};

export function CandyDataTable<T>({
  rows,
  rowKey,
  columns,
  selectable = false,
  onRowClick,
  bulkActions,
  empty,
  ariaLabel,
}: CandyDataTableProps<T>) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  // Keep selection in sync if rows change
  React.useEffect(() => {
    setSelected((prev) => {
      const ids = new Set(rows.map(rowKey));
      let changed = false;
      const next = new Set<string>();
      prev.forEach((id) => {
        if (ids.has(id)) next.add(id);
        else changed = true;
      });
      return changed ? next : prev;
    });
  }, [rows, rowKey]);

  const allChecked = rows.length > 0 && selected.size === rows.length;
  const indeterminate = selected.size > 0 && selected.size < rows.length;

  const toggleAll = (next: boolean) => {
    setSelected(next ? new Set(rows.map(rowKey)) : new Set());
  };
  const toggleOne = (id: string, next: boolean) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (next) n.add(id);
      else n.delete(id);
      return n;
    });
  };

  const gridTemplate = [
    selectable ? "44px" : null,
    ...columns.map((c) => c.width ?? "minmax(120px,1fr)"),
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="relative">
      <div
        className="overflow-x-auto rounded-2xl border border-border/60 bg-card"
        role="table"
        aria-label={ariaLabel}
      >
        {/* Header */}
        <div
          role="row"
          className="sticky top-0 z-10 grid items-center gap-3 border-b border-border/60 bg-surface/70 backdrop-blur px-3 py-2.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground"
          style={{ gridTemplateColumns: gridTemplate, minWidth: "fit-content" }}
        >
          {selectable && (
            <div className="flex items-center justify-center">
              <CandyCheckbox
                checked={allChecked}
                indeterminate={indeterminate}
                onChange={toggleAll}
                ariaLabel="Select all rows"
              />
            </div>
          )}
          {columns.map((c) => (
            <div
              key={c.key}
              role="columnheader"
              className={cn(
                "flex items-center truncate",
                ALIGN[c.align ?? "left"],
              )}
            >
              {c.header}
            </div>
          ))}
        </div>

        {/* Body */}
        {rows.length === 0 ? (
          <div className="px-3 py-12 text-center text-sm text-muted-foreground">
            {empty ?? "No rows match the current filters."}
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.03, delayChildren: 0.05 } },
            }}
            role="rowgroup"
          >
            {rows.map((row) => {
              const id = rowKey(row);
              const isSel = selected.has(id);
              const isHover = hoveredId === id;
              return (
                <motion.div
                  key={id}
                  role="row"
                  aria-selected={isSel}
                  variants={{
                    hidden: { opacity: 0, y: 8, filter: "blur(2px)" },
                    visible: {
                      opacity: 1,
                      y: 0,
                      filter: "blur(0px)",
                      transition: { type: "spring", stiffness: 380, damping: 28, mass: 0.6 },
                    },
                  }}
                  onMouseEnter={() => setHoveredId(id)}
                  onMouseLeave={() => setHoveredId((h) => (h === id ? null : h))}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "grid items-center gap-3 border-b border-border/40 px-3 py-3 text-sm transition-colors",
                    onRowClick && "cursor-pointer",
                    isSel
                      ? "bg-primary/[0.06]"
                      : "hover:bg-primary/[0.04]",
                  )}
                  style={{ gridTemplateColumns: gridTemplate, minWidth: "fit-content" }}
                >
                  {selectable && (
                    <div className="flex items-center justify-center">
                      <CandyCheckbox
                        checked={isSel}
                        onChange={(next) => toggleOne(id, next)}
                        ariaLabel="Select row"
                      />
                    </div>
                  )}
                  {columns.map((c) => {
                    const showHover = isHover && c.hoverCell;
                    return (
                      <div
                        key={c.key}
                        role="cell"
                        className={cn(
                          "flex items-center min-w-0 truncate",
                          ALIGN[c.align ?? "left"],
                          c.className,
                        )}
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.div
                            key={showHover ? "hover" : "base"}
                            initial={{ opacity: 0, y: 2 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -2 }}
                            transition={{ duration: 0.15 }}
                            className="min-w-0 truncate"
                          >
                            {showHover ? c.hoverCell!(row) : c.cell(row)}
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Bulk action bar (sits above the Dock, which is bottom-6 ≈ 88px tall) */}
      <AnimatePresence>
        {selectable && bulkActions && bulkActions.length > 0 && selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed left-1/2 z-50 -translate-x-1/2"
            style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 116px)" }}
          >
            <div
              className="flex items-center gap-2 rounded-full border border-border/70 bg-card/95 px-3 py-2 backdrop-blur shadow-lg"
              style={{ boxShadow: "0 18px 40px -16px color-mix(in oklab, var(--primary) 50%, transparent)" }}
            >
              <span className="px-2 text-xs font-medium text-foreground">
                {selected.size} selected
              </span>
              <span className="h-4 w-px bg-border/70" />
              {bulkActions.map((a, i) => (
                <button
                  key={i}
                  onClick={() => a.onClick(Array.from(selected))}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    a.variant === "danger"
                      ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                      : a.variant === "primary"
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-muted text-foreground/80 hover:bg-muted/70",
                  )}
                >
                  {a.label}
                </button>
              ))}
              <button
                onClick={() => setSelected(new Set())}
                className="rounded-full px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                aria-label="Clear selection"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───────── lead/partner avatar ───────── */

export function CandyAvatar({ name, size = 32 }: { name: string; size?: number }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  // deterministic accent from name
  const palette = ["var(--primary)", "var(--secondary)", "var(--octa-4)", "var(--octa-5)", "var(--octa-7)"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const color = palette[hash % palette.length];
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-display font-bold text-white"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${color}, color-mix(in oklab, ${color} 60%, white))`,
        boxShadow: `0 6px 14px -6px color-mix(in oklab, ${color} 60%, transparent)`,
        fontSize: size * 0.42,
      }}
      aria-hidden
    >
      {initial}
    </div>
  );
}