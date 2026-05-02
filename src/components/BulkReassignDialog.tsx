import { useMemo, useState } from "react";
import type { PdmEntry } from "@/lib/use-pdm-roster";
import { X as XIcon } from "lucide-react";

export type ReassignItem = {
  id: string;
  name: string;
  currentOwnerId: string;
  currentOwnerName: string;
};

export type ReassignAssignment = { id: string; newOwnerId: string; newOwnerName: string };

type Mode = "single" | "round_robin";

export function BulkReassignDialog({
  open,
  items,
  pdms,
  entityLabel,
  busy,
  onClose,
  onConfirm,
}: {
  open: boolean;
  items: ReassignItem[];
  pdms: PdmEntry[];
  entityLabel: string; // "partner" or "lead"
  busy?: boolean;
  onClose: () => void;
  onConfirm: (assignments: ReassignAssignment[]) => void | Promise<void>;
}) {
  const [mode, setMode] = useState<Mode>("single");
  const [singleTarget, setSingleTarget] = useState<string>("");
  const [rrSelected, setRrSelected] = useState<Set<string>>(new Set());

  const pdmName = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of pdms) m.set(p.id, p.name);
    return m;
  }, [pdms]);

  const assignments: ReassignAssignment[] = useMemo(() => {
    if (mode === "single") {
      if (!singleTarget) return [];
      const name = pdmName.get(singleTarget) ?? "—";
      return items.map((it) => ({ id: it.id, newOwnerId: singleTarget, newOwnerName: name }));
    }
    const targets = [...rrSelected];
    if (targets.length === 0) return [];
    return items.map((it, idx) => {
      const ownerId = targets[idx % targets.length];
      return { id: it.id, newOwnerId: ownerId, newOwnerName: pdmName.get(ownerId) ?? "—" };
    });
  }, [mode, singleTarget, rrSelected, items, pdmName]);

  const changedCount = useMemo(
    () => assignments.filter((a, i) => a.newOwnerId !== items[i]?.currentOwnerId).length,
    [assignments, items]
  );

  if (!open) return null;

  const toggleRr = (id: string) => {
    setRrSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const canConfirm = assignments.length > 0 && changedCount > 0 && !busy;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[88vh] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl flex flex-col"
      >
        <header className="flex items-start justify-between gap-4 px-6 py-4 border-b border-border">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Bulk reassign</p>
            <h2 className="text-lg font-semibold">
              Reassign {items.length} {entityLabel}{items.length === 1 ? "" : "s"}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Preview the new ownership before confirming.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground rounded-md p-1">
            <XIcon className="h-4 w-4" />
          </button>
        </header>

        <div className="px-6 py-4 border-b border-border space-y-3">
          <div className="inline-flex rounded-lg border border-border/60 bg-surface/60 p-1 text-xs">
            <button
              onClick={() => setMode("single")}
              className={`px-3 py-1.5 rounded-md transition ${mode === "single" ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Same PDM for all
            </button>
            <button
              onClick={() => setMode("round_robin")}
              className={`px-3 py-1.5 rounded-md transition ${mode === "round_robin" ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Distribute (round-robin)
            </button>
          </div>

          {mode === "single" ? (
            <select
              value={singleTarget}
              onChange={(e) => setSingleTarget(e.target.value)}
              className="w-full rounded-lg border border-border/60 bg-surface/60 px-3 py-2 text-sm"
            >
              <option value="">Select target PDM…</option>
              {pdms.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          ) : (
            <div className="flex flex-wrap gap-2">
              {pdms.map((p) => {
                const on = rrSelected.has(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleRr(p.id)}
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      on
                        ? "border-primary bg-primary/15 text-foreground"
                        : "border-border bg-surface/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
              {pdms.length === 0 && <span className="text-xs text-muted-foreground">No PDMs available.</span>}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto px-6 py-3">
          <table className="w-full text-sm">
            <thead className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              <tr className="border-b border-border/60">
                <th className="text-left py-2 font-normal">{entityLabel}</th>
                <th className="text-left py-2 font-normal">Current PDM</th>
                <th className="text-left py-2 font-normal">→ New PDM</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => {
                const a = assignments[i];
                const changed = a && a.newOwnerId !== it.currentOwnerId;
                return (
                  <tr key={it.id} className="border-b border-border/30 last:border-b-0">
                    <td className="py-2 pr-2 font-medium truncate max-w-[14rem]">{it.name}</td>
                    <td className="py-2 pr-2 text-muted-foreground">{it.currentOwnerName}</td>
                    <td className={`py-2 ${changed ? "text-foreground font-medium" : "text-muted-foreground/60"}`}>
                      {a ? a.newOwnerName : "—"}
                      {changed && <span className="ml-2 text-[10px] uppercase tracking-widest text-emerald-400">change</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <footer className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border bg-surface/40">
          <span className="text-xs text-muted-foreground">
            {changedCount} of {items.length} will change
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={busy}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm hover:bg-surface-2 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => void onConfirm(assignments.filter((a, i) => a.newOwnerId !== items[i]?.currentOwnerId))}
              disabled={!canConfirm}
              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground glow-ring disabled:opacity-40"
            >
              {busy ? "Reassigning…" : `Confirm reassignment`}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}