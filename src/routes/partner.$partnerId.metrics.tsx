import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/partner/$partnerId/metrics")({
  head: () => ({ meta: [{ title: "Metrics — Conduit" }] }),
  component: MetricsPage,
});

type Metric = Database["public"]["Tables"]["partner_metrics"]["Row"];
type MetricInsert = Database["public"]["Tables"]["partner_metrics"]["Insert"];

const FIELDS = [
  { key: "period", label: "Period", type: "text" as const, hint: "e.g. 2025-Q1, Jan 2025" },
  { key: "mrr", label: "Total MRR sold", type: "number" as const },
  { key: "deals_open", label: "Open deals (count)", type: "number" as const },
  { key: "deals_open_value", label: "Open deals value", type: "number" as const },
  { key: "deals_won", label: "Won deals (count)", type: "number" as const },
  { key: "deals_won_value", label: "Won deals value", type: "number" as const },
  { key: "trained_people", label: "Trained people", type: "number" as const },
  { key: "revenue", label: "Revenue", type: "number" as const },
  { key: "notes", label: "Notes", type: "text" as const },
] as const;
type FieldKey = typeof FIELDS[number]["key"];

const fmtMoney = (n: number | null) => n == null ? "—" : new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const fmtNum = (n: number | null) => n == null ? "—" : new Intl.NumberFormat().format(n);

function MetricsPage() {
  const { partnerId } = Route.useParams();
  const { user } = useAuth();
  const [items, setItems] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [{ data: rows }, { data: p }] = await Promise.all([
      supabase.from("partner_metrics").select("*").eq("partner_id", partnerId).order("created_at", { ascending: false }),
      supabase.from("partners").select("owner_id").eq("id", partnerId).maybeSingle(),
    ]);
    setItems((rows ?? []) as Metric[]);
    setIsOwner(!!user && p?.owner_id === user.id);
    setLoading(false);
  }, [partnerId, user]);

  useEffect(() => { void refresh(); }, [refresh]);

  const totals = useMemo(() => {
    const sum = (k: keyof Metric) => items.reduce((a, m) => a + (Number(m[k]) || 0), 0);
    const latestMrr = items.reduce<number | null>((acc, m) => acc ?? (m.mrr != null ? Number(m.mrr) : null), null);
    return {
      mrr: latestMrr,
      dealsOpen: sum("deals_open"),
      dealsOpenValue: sum("deals_open_value"),
      dealsWon: sum("deals_won"),
      dealsWonValue: sum("deals_won_value"),
      trained: sum("trained_people"),
    };
  }, [items]);

  const remove = async (id: string) => {
    if (!confirm("Delete this snapshot?")) return;
    const { error } = await supabase.from("partner_metrics").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); refresh(); }
  };

  if (loading) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold">Commercial Metrics</h2>
          <p className="text-sm text-muted-foreground">Track MRR, pipeline, and enablement over time.</p>
        </div>
        {isOwner && (
          <div className="flex gap-2">
            <button onClick={() => setShowImport(true)} className="rounded-lg border border-border bg-surface px-4 py-2 text-sm hover:bg-surface-2">
              Import data
            </button>
            <button onClick={() => setShowNew(true)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-ring">
              + Add snapshot
            </button>
          </div>
        )}
      </div>

      {/* Summary tiles */}
      <div className="mt-5 grid grid-cols-2 lg:grid-cols-6 gap-3">
        <Tile label="Latest MRR" value={fmtMoney(totals.mrr)} accent="octa-1" />
        <Tile label="Open deals" value={fmtNum(totals.dealsOpen)} accent="octa-4" />
        <Tile label="Open value" value={fmtMoney(totals.dealsOpenValue || null)} accent="octa-4" />
        <Tile label="Won deals" value={fmtNum(totals.dealsWon)} accent="octa-5" />
        <Tile label="Won value" value={fmtMoney(totals.dealsWonValue || null)} accent="octa-5" />
        <Tile label="Trained" value={fmtNum(totals.trained)} accent="octa-7" />
      </div>

      {/* Table */}
      <div className="mt-6 rounded-2xl bg-card border border-border/60 card-elev overflow-hidden">
        {items.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No snapshots yet. Add one or import data.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2/50 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">Period</th>
                  <th className="text-right px-4 py-3">MRR</th>
                  <th className="text-right px-4 py-3">Open</th>
                  <th className="text-right px-4 py-3">Open €</th>
                  <th className="text-right px-4 py-3">Won</th>
                  <th className="text-right px-4 py-3">Won €</th>
                  <th className="text-right px-4 py-3">Trained</th>
                  <th className="text-right px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {items.map((m) => (
                  <tr key={m.id} className="hover:bg-surface/40">
                    <td className="px-4 py-3">
                      <div className="font-medium">{m.period ?? new Date(m.created_at).toLocaleDateString()}</div>
                      {m.notes && <div className="text-xs text-muted-foreground">{m.notes}</div>}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{fmtMoney(m.mrr != null ? Number(m.mrr) : null)}</td>
                    <td className="px-4 py-3 text-right font-mono">{fmtNum(m.deals_open)}</td>
                    <td className="px-4 py-3 text-right font-mono">{fmtMoney(m.deals_open_value != null ? Number(m.deals_open_value) : null)}</td>
                    <td className="px-4 py-3 text-right font-mono">{fmtNum(m.deals_won)}</td>
                    <td className="px-4 py-3 text-right font-mono">{fmtMoney(m.deals_won_value != null ? Number(m.deals_won_value) : null)}</td>
                    <td className="px-4 py-3 text-right font-mono">{fmtNum(m.trained_people)}</td>
                    <td className="px-4 py-3 text-right">
                      {isOwner && <button onClick={() => remove(m.id)} className="text-xs text-destructive hover:underline">Delete</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showNew && user && (
        <SnapshotDialog
          partnerId={partnerId}
          userId={user.id}
          onClose={() => setShowNew(false)}
          onSaved={() => { setShowNew(false); refresh(); }}
        />
      )}
      {showImport && user && (
        <ImportDialog
          partnerId={partnerId}
          userId={user.id}
          onClose={() => setShowImport(false)}
          onDone={() => { setShowImport(false); refresh(); }}
        />
      )}
    </div>
  );
}

function Tile({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl bg-card border border-border/60 px-4 py-3 card-elev">
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-xl font-display font-semibold mt-1" style={{ color: `var(--${accent})` }}>{value}</div>
    </div>
  );
}

function SnapshotDialog({
  partnerId, userId, onClose, onSaved,
}: { partnerId: string; userId: string; onClose: () => void; onSaved: () => void }) {
  const [vals, setVals] = useState<Record<FieldKey, string>>(() =>
    Object.fromEntries(FIELDS.map((f) => [f.key, ""])) as Record<FieldKey, string>
  );
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const payload: MetricInsert = { partner_id: partnerId, user_id: userId };
    for (const f of FIELDS) {
      const v = vals[f.key].trim();
      if (!v) continue;
      if (f.type === "number") {
        const n = Number(v);
        if (!Number.isNaN(n)) (payload as Record<string, unknown>)[f.key] = n;
      } else {
        (payload as Record<string, unknown>)[f.key] = v;
      }
    }
    const { error } = await supabase.from("partner_metrics").insert(payload);
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Snapshot added"); onSaved(); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-xl rounded-2xl bg-card border border-border/60 p-6 card-elev" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold">Add metrics snapshot</h2>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {FIELDS.map((f) => (
            <label key={f.key} className={f.key === "notes" ? "col-span-2 block" : "block"}>
              <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{f.label}</span>
              {f.key === "notes" ? (
                <textarea value={vals[f.key]} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} className="input mt-1 min-h-[60px]" maxLength={500} />
              ) : (
                <input type={f.type === "number" ? "number" : "text"} value={vals[f.key]} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} className="input mt-1" placeholder={(f as { hint?: string }).hint} />
              )}
            </label>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg border border-border bg-surface px-4 py-2 text-sm hover:bg-surface-2">Cancel</button>
          <button onClick={save} disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-ring disabled:opacity-40">Save</button>
        </div>
      </div>
    </div>
  );
}

/* ───────────── Import Dialog ───────────── */

type ParsedRow = Record<string, unknown>;

function ImportDialog({
  partnerId, userId, onClose, onDone,
}: { partnerId: string; userId: string; onClose: () => void; onDone: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [mapping, setMapping] = useState<Record<FieldKey, string>>(() =>
    Object.fromEntries(FIELDS.map((f) => [f.key, ""])) as Record<FieldKey, string>
  );
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<"upload" | "map">("upload");

  const guessMapping = (cols: string[]): Record<FieldKey, string> => {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const result = Object.fromEntries(FIELDS.map((f) => [f.key, ""])) as Record<FieldKey, string>;
    const hints: Record<FieldKey, string[]> = {
      period: ["period", "month", "quarter", "date"],
      mrr: ["mrr", "monthlyrecurring", "totalmrr"],
      deals_open: ["dealsopen", "openpipeline", "opendealscount", "opencount"],
      deals_open_value: ["openvalue", "opendealsvalue", "opendealsamount", "pipelinevalue"],
      deals_won: ["dealswon", "wonscount", "closedwon"],
      deals_won_value: ["wonvalue", "wonamount", "closedwonvalue", "revenuewon"],
      trained_people: ["trained", "certified", "people", "trainedpeople"],
      revenue: ["revenue", "totalrevenue"],
      notes: ["notes", "comment", "comments"],
    };
    for (const f of FIELDS) {
      const targets = hints[f.key].map(norm);
      const match = cols.find((c) => targets.some((t) => norm(c).includes(t)));
      if (match) result[f.key] = match;
    }
    return result;
  };

  const onFile = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<ParsedRow>(ws, { defval: null });
      if (!json.length) { toast.error("File is empty"); return; }
      const cols = Object.keys(json[0]);
      setHeaders(cols);
      setRows(json);
      setMapping(guessMapping(cols));
      setStep("map");
    } catch (e) {
      toast.error("Failed to read file: " + (e as Error).message);
    }
  };

  const importNow = async () => {
    setBusy(true);
    const inserts: MetricInsert[] = rows.map((r) => {
      const out: MetricInsert = { partner_id: partnerId, user_id: userId };
      for (const f of FIELDS) {
        const col = mapping[f.key];
        if (!col) continue;
        const raw = r[col];
        if (raw == null || raw === "") continue;
        if (f.type === "number") {
          const n = typeof raw === "number" ? raw : Number(String(raw).replace(/[^\d.\-]/g, ""));
          if (!Number.isNaN(n)) (out as Record<string, unknown>)[f.key] = n;
        } else {
          (out as Record<string, unknown>)[f.key] = String(raw);
        }
      }
      return out;
    }).filter((o) => Object.keys(o).length > 2); // more than partner_id + user_id

    if (!inserts.length) { toast.error("Nothing to import — check your column mapping"); setBusy(false); return; }
    const { error } = await supabase.from("partner_metrics").insert(inserts);
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success(`Imported ${inserts.length} row${inserts.length === 1 ? "" : "s"}`); onDone(); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-card border border-border/60 p-6 card-elev max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold">Import metrics</h2>
        <p className="text-sm text-muted-foreground mt-1">Upload an XLSX or CSV with one row per period. You'll map columns next.</p>

        {step === "upload" ? (
          <div className="mt-6">
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-border/60 bg-surface/40 hover:bg-surface-2 transition p-10 text-center"
            >
              <div className="text-sm font-semibold">Click to upload XLSX or CSV</div>
              <div className="text-xs text-muted-foreground mt-1">First sheet, first row = headers</div>
            </button>
            <div className="mt-4 text-xs text-muted-foreground">
              Suggested columns: <span className="font-mono">period, mrr, deals_open, deals_open_value, deals_won, deals_won_value, trained_people, revenue, notes</span>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-5 rounded-lg bg-surface/40 border border-border/60 p-3 text-xs text-muted-foreground">
              Detected <span className="text-foreground font-medium">{rows.length}</span> row{rows.length === 1 ? "" : "s"} and <span className="text-foreground font-medium">{headers.length}</span> column{headers.length === 1 ? "" : "s"}. Match each field to a column from your file.
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FIELDS.map((f) => (
                <label key={f.key} className="block">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{f.label}</span>
                  <select
                    value={mapping[f.key]}
                    onChange={(e) => setMapping({ ...mapping, [f.key]: e.target.value })}
                    className="input mt-1"
                  >
                    <option value="">— Skip —</option>
                    {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </label>
              ))}
            </div>
            <div className="mt-6 flex justify-between gap-3">
              <button onClick={() => setStep("upload")} className="text-xs text-muted-foreground hover:text-foreground">← Choose another file</button>
              <div className="flex gap-3">
                <button onClick={onClose} className="rounded-lg border border-border bg-surface px-4 py-2 text-sm hover:bg-surface-2">Cancel</button>
                <button onClick={importNow} disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-ring disabled:opacity-40">
                  {busy ? "Importing…" : `Import ${rows.length} row${rows.length === 1 ? "" : "s"}`}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}