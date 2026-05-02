import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { usePartner } from "../lib/partners-store";
import { AXES } from "../content/octa";
import { toast } from "sonner";

export const Route = createFileRoute("/partner/$partnerId/intel")({
  head: () => ({ meta: [{ title: "Intel — Alliara" }] }),
  component: PartnerIntel,
});

const DOC_KINDS = [
  { v: "business_plan", l: "Business plan" },
  { v: "sales_data", l: "Sales data" },
  { v: "presentation", l: "Presentation" },
  { v: "contract", l: "Contract" },
  { v: "notes", l: "Meeting notes" },
  { v: "other", l: "Other" },
] as const;

interface DocRow {
  id: string;
  partner_id: string;
  user_id: string;
  filename: string;
  storage_path: string;
  mime: string;
  size_bytes: number;
  kind: string;
  description: string | null;
  extracted_text: string | null;
  created_at: string;
}

interface MetricRow {
  id: string;
  partner_id: string;
  user_id: string;
  period: string | null;
  revenue: number | null;
  deals_open: number | null;
  deals_won: number | null;
  trained_people: number | null;
  notes: string | null;
  created_at: string;
}

interface IntelOutput {
  executive_summary: string;
  red_flags: { title: string; evidence: string; severity: "low" | "medium" | "high" }[];
  signals_by_axis: { axis_key: string; observations: string; suggested_level: number; confidence: "low" | "medium" | "high" }[];
  suggested_actions: { axis_key: string; title: string; description: string; priority: "low" | "medium" | "high"; target_level: number }[];
}

interface RunRow {
  id: string;
  partner_id: string;
  user_id: string;
  model: string;
  input_summary: string | null;
  output: IntelOutput;
  created_at: string;
}

function PartnerIntel() {
  const { partnerId } = Route.useParams();
  const { user } = useAuth();
  const data = usePartner(partnerId);

  const [docs, setDocs] = useState<DocRow[]>([]);
  const [metrics, setMetrics] = useState<MetricRow[]>([]);
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [freeText, setFreeText] = useState("");
  const [deletingRunId, setDeletingRunId] = useState<string | null>(null);

  const isOwner = !!data.partner && !!user && data.partner.owner_id === user.id;

  const refresh = useCallback(async () => {
    setLoading(true);
    const [{ data: d }, { data: m }, { data: r }] = await Promise.all([
      supabase.from("partner_documents").select("*").eq("partner_id", partnerId).order("created_at", { ascending: false }),
      supabase.from("partner_metrics").select("*").eq("partner_id", partnerId).order("created_at", { ascending: false }),
      supabase.from("partner_intel_runs").select("*").eq("partner_id", partnerId).order("created_at", { ascending: false }),
    ]);
    setDocs((d ?? []) as DocRow[]);
    setMetrics((m ?? []) as MetricRow[]);
    setRuns((r ?? []) as unknown as RunRow[]);
    setLoading(false);
  }, [partnerId]);

  useEffect(() => { void refresh(); }, [refresh]);

  if (data.loading || !data.partner) return <div className="text-muted-foreground">Loading…</div>;

  const deleteRun = async (id: string) => {
    if (!confirm("Delete this decoded signal run? This cannot be undone.")) return;
    setDeletingRunId(id);
    try {
      const { error } = await supabase.from("partner_intel_runs").delete().eq("id", id);
      if (error) throw error;
      toast.success("Run deleted");
      await refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDeletingRunId(null);
    }
  };

  const clearAllRuns = async () => {
    if (runs.length === 0) return;
    if (!confirm(`Delete all ${runs.length} decoded signal run${runs.length === 1 ? "" : "s"} for this partner? This cannot be undone.`)) return;
    try {
      const { error } = await supabase.from("partner_intel_runs").delete().eq("partner_id", partnerId);
      if (error) throw error;
      toast.success("All runs cleared");
      await refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const generate = async () => {
    if (!isOwner) return;
    if (docs.length === 0 && metrics.length === 0 && !freeText.trim()) {
      toast.error("Add at least one document, metric, or note before generating insights.");
      return;
    }
    setGenerating(true);
    try {
      const scores = (data.latest?.scores ?? {}) as Record<string, number>;
      const payload = {
        partner: {
          name: data.partner!.name,
          company: data.partner!.company,
          segment: data.partner!.segment,
          tier: data.partner!.tier,
          status: data.partner!.status,
          notes: data.partner!.notes,
        },
        axes: AXES.map((a) => ({ key: a.key, name: a.name, current_score: scores[a.key] ?? 0 })),
        documents: docs.map((d) => ({
          filename: d.filename,
          kind: d.kind,
          description: d.description,
          excerpt: d.extracted_text,
        })),
        metrics: metrics.map((m) => ({
          period: m.period,
          revenue: m.revenue,
          deals_open: m.deals_open,
          deals_won: m.deals_won,
          trained_people: m.trained_people,
          notes: m.notes,
        })),
        freeText: freeText.trim() || null,
      };

      const { data: resp, error } = await supabase.functions.invoke("partner-intel", { body: payload });
      if (error) throw error;
      if (!resp?.ok) throw new Error(resp?.error ?? "AI failed");

      const inputSummary = `${docs.length} doc(s), ${metrics.length} metric set(s)${freeText.trim() ? ", + notes" : ""}`;
      const { error: insErr } = await supabase.from("partner_intel_runs").insert({
        partner_id: partnerId,
        user_id: user!.id,
        model: resp.model,
        input_summary: inputSummary,
        output: resp.content,
      });
      if (insErr) throw insErr;

      setFreeText("");
      toast.success("Insights generated");
      await refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <DocumentsCard
          partnerId={partnerId}
          isOwner={isOwner}
          docs={docs}
          onChange={refresh}
          userId={user?.id}
        />
        <MetricsCard
          partnerId={partnerId}
          isOwner={isOwner}
          metrics={metrics}
          onChange={refresh}
          userId={user?.id}
        />

        <div className="rounded-2xl bg-card border border-border/60 p-5 card-elev">
          <h2 className="font-semibold">Notes for this decode</h2>
          <p className="text-xs text-muted-foreground mt-1">One-shot context the AI uses for the next decode only — not saved to the partner profile. Recent calls, deal context, market shifts…</p>
          <textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            disabled={!isOwner}
            placeholder={isOwner ? "e.g. Sold R$ 480k in last 6 months, lost 2 reps last quarter, exploring vertical X…" : "Read-only"}
            className="mt-3 input min-h-[100px]"
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={generate}
              disabled={!isOwner || generating}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground glow-ring disabled:opacity-40"
            >
              {generating ? "Decoding signals…" : "Decode Partner Signals"}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl bg-card border border-border/60 p-5 card-elev">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-semibold">Decoded Partner Signals</h2>
              <p className="text-xs text-muted-foreground mt-1">Each decode is saved to the partner's signal history.</p>
            </div>
            {isOwner && runs.length > 0 && (
              <button
                onClick={clearAllRuns}
                className="text-xs text-destructive hover:underline shrink-0"
                title="Delete all decoded runs"
              >
                Clear all
              </button>
            )}
          </div>
          {loading ? (
            <div className="mt-4 text-sm text-muted-foreground">Loading…</div>
          ) : runs.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-border/60 bg-surface/40 p-6 text-center text-sm text-muted-foreground">
              No signals decoded yet. Add docs/metrics and click <span className="font-medium">Decode Partner Signals</span>.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {runs.map((r) => (
                <RunCard
                  key={r.id}
                  run={r}
                  partnerId={partnerId}
                  isOwner={isOwner}
                  onDelete={() => deleteRun(r.id)}
                  deleting={deletingRunId === r.id}
                  onAddAction={async (a) => {
                    if (!user) return;
                    try {
                      await data.addAction({
                        userId: user.id,
                        axisKey: a.axis_key,
                        title: a.title,
                        description: a.description,
                        priority: a.priority,
                        targetLevel: a.target_level,
                        source: "ai_intel",
                      });
                      toast.success("Added to action plan");
                    } catch (e) {
                      toast.error((e as Error).message);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── Documents ─────────────────────── */

function DocumentsCard({
  partnerId, isOwner, docs, onChange, userId,
}: {
  partnerId: string; isOwner: boolean; docs: DocRow[]; onChange: () => Promise<void>; userId: string | undefined;
}) {
  const [uploading, setUploading] = useState(false);
  const [kind, setKind] = useState<string>("business_plan");
  const [description, setDescription] = useState("");

  const onFile = async (file: File) => {
    if (!userId) return;
    setUploading(true);
    try {
      // Try to extract text from plain-text formats client-side; binary files just get stored.
      let extracted: string | null = null;
      const lowerName = file.name.toLowerCase();
      const isText = file.type.startsWith("text/")
        || lowerName.endsWith(".txt") || lowerName.endsWith(".md")
        || lowerName.endsWith(".csv") || lowerName.endsWith(".json");
      if (isText && file.size < 2_000_000) {
        try { extracted = await file.text(); } catch { /* ignore */ }
      }

      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${partnerId}/${Date.now()}_${safe}`;
      const { error: upErr } = await supabase.storage.from("partner-docs").upload(path, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
      if (upErr) throw upErr;

      const { error: dbErr } = await supabase.from("partner_documents").insert({
        partner_id: partnerId,
        user_id: userId,
        filename: file.name,
        storage_path: path,
        mime: file.type || "application/octet-stream",
        size_bytes: file.size,
        kind,
        description: description.trim() || null,
        extracted_text: extracted,
      });
      if (dbErr) throw dbErr;

      setDescription("");
      toast.success(`Uploaded ${file.name}`);
      await onChange();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const onDelete = async (d: DocRow) => {
    if (!confirm(`Delete ${d.filename}?`)) return;
    try {
      await supabase.storage.from("partner-docs").remove([d.storage_path]);
      const { error } = await supabase.from("partner_documents").delete().eq("id", d.id);
      if (error) throw error;
      await onChange();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const download = async (d: DocRow) => {
    const { data, error } = await supabase.storage.from("partner-docs").createSignedUrl(d.storage_path, 60);
    if (error) { toast.error(error.message); return; }
    window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="rounded-2xl bg-card border border-border/60 p-5 card-elev">
      <h2 className="font-semibold">Documents</h2>
      <p className="text-xs text-muted-foreground mt-1">Business plans, sales data, decks, contracts, notes — anything about this partner.</p>

      {isOwner && (
        <div className="mt-4 rounded-xl border border-dashed border-border/60 bg-surface/40 p-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Kind</span>
              <select value={kind} onChange={(e) => setKind(e.target.value)} className="input mt-1">
                {DOC_KINDS.map((k) => <option key={k.v} value={k.v}>{k.l}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Short description (optional)</span>
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. FY26 plan v2" className="input mt-1" />
            </label>
          </div>
          <label className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2 cursor-pointer hover:bg-surface-2">
            <input
              type="file"
              className="hidden"
              disabled={uploading}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); e.target.value = ""; }}
            />
            <span className="text-sm">{uploading ? "Uploading…" : "Choose file to upload"}</span>
            <span className="text-[10px] font-mono text-muted-foreground ml-auto">Plain-text files (.txt, .md, .csv) auto-extract content</span>
          </label>
        </div>
      )}

      <ul className="mt-4 space-y-2">
        {docs.length === 0 && <li className="text-sm text-muted-foreground">No documents yet.</li>}
        {docs.map((d) => (
          <li key={d.id} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-surface/50 px-4 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-md bg-surface-2 text-muted-foreground">{d.kind.replace("_", " ")}</span>
                <button onClick={() => download(d)} className="text-sm font-medium underline-offset-2 hover:underline truncate">{d.filename}</button>
                {d.extracted_text && <span className="text-[10px] font-mono text-success">text extracted</span>}
              </div>
              {d.description && <p className="text-xs text-muted-foreground mt-1">{d.description}</p>}
              <p className="text-[10px] font-mono text-muted-foreground mt-1">
                {(d.size_bytes / 1024).toFixed(0)} KB · {new Date(d.created_at).toLocaleDateString()}
              </p>
            </div>
            {isOwner && (
              <button onClick={() => onDelete(d)} className="text-xs text-destructive hover:underline shrink-0">Delete</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─────────────────────── Metrics ─────────────────────── */

function MetricsCard({
  partnerId, isOwner, metrics, onChange, userId,
}: {
  partnerId: string; isOwner: boolean; metrics: MetricRow[]; onChange: () => Promise<void>; userId: string | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState("");
  const [revenue, setRevenue] = useState("");
  const [dealsOpen, setDealsOpen] = useState("");
  const [dealsWon, setDealsWon] = useState("");
  const [trained, setTrained] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => { setPeriod(""); setRevenue(""); setDealsOpen(""); setDealsWon(""); setTrained(""); setNotes(""); };

  const save = async () => {
    if (!userId) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("partner_metrics").insert({
        partner_id: partnerId,
        user_id: userId,
        period: period.trim() || null,
        revenue: revenue ? Number(revenue) : null,
        deals_open: dealsOpen ? Number(dealsOpen) : null,
        deals_won: dealsWon ? Number(dealsWon) : null,
        trained_people: trained ? Number(trained) : null,
        notes: notes.trim() || null,
      });
      if (error) throw error;
      reset();
      setOpen(false);
      toast.success("Metrics saved");
      await onChange();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this metric entry?")) return;
    const { error } = await supabase.from("partner_metrics").delete().eq("id", id);
    if (error) toast.error(error.message); else await onChange();
  };

  return (
    <div className="rounded-2xl bg-card border border-border/60 p-5 card-elev">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Quick metrics</h2>
          <p className="text-xs text-muted-foreground mt-1">Numbers the AI can reason over directly.</p>
        </div>
        {isOwner && (
          <button onClick={() => setOpen((v) => !v)} className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs hover:bg-surface-2">
            {open ? "Cancel" : "+ Add metrics"}
          </button>
        )}
      </div>

      {open && isOwner && (
        <div className="mt-4 rounded-xl border border-border/60 bg-surface/40 p-4 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Period (e.g. 2026-Q1, last 6 months)"><input value={period} onChange={(e) => setPeriod(e.target.value)} className="input" /></Field>
            <Field label="Revenue (any currency)"><input type="number" value={revenue} onChange={(e) => setRevenue(e.target.value)} className="input" /></Field>
            <Field label="Deals open"><input type="number" value={dealsOpen} onChange={(e) => setDealsOpen(e.target.value)} className="input" /></Field>
            <Field label="Deals won"><input type="number" value={dealsWon} onChange={(e) => setDealsWon(e.target.value)} className="input" /></Field>
            <Field label="People trained"><input type="number" value={trained} onChange={(e) => setTrained(e.target.value)} className="input" /></Field>
          </div>
          <Field label="Notes"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input min-h-[60px]" /></Field>
          <div className="flex justify-end">
            <button disabled={busy} onClick={save} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40">Save metrics</button>
          </div>
        </div>
      )}

      <ul className="mt-4 space-y-2">
        {metrics.length === 0 && <li className="text-sm text-muted-foreground">No metrics yet.</li>}
        {metrics.map((m) => (
          <li key={m.id} className="rounded-xl border border-border/60 bg-surface/50 px-4 py-3">
            <div className="flex items-start justify-between">
              <div className="text-sm">
                <div className="font-medium">{m.period ?? "—"}</div>
                <div className="mt-1 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {m.revenue != null && <span>Revenue: <b className="text-foreground">{m.revenue.toLocaleString()}</b></span>}
                  {m.deals_open != null && <span>Open deals: <b className="text-foreground">{m.deals_open}</b></span>}
                  {m.deals_won != null && <span>Won: <b className="text-foreground">{m.deals_won}</b></span>}
                  {m.trained_people != null && <span>Trained: <b className="text-foreground">{m.trained_people}</b></span>}
                </div>
                {m.notes && <p className="mt-2 text-xs text-muted-foreground">{m.notes}</p>}
              </div>
              {isOwner && (
                <button onClick={() => onDelete(m.id)} className="text-xs text-destructive hover:underline shrink-0">Delete</button>
              )}
            </div>
            <p className="text-[10px] font-mono text-muted-foreground mt-2">{new Date(m.created_at).toLocaleDateString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─────────────────────── Run card ─────────────────────── */

function RunCard({
  run, partnerId, isOwner, onAddAction, onDelete, deleting,
}: {
  run: RunRow;
  partnerId: string;
  isOwner: boolean;
  onAddAction: (a: IntelOutput["suggested_actions"][number]) => Promise<void>;
  onDelete: () => Promise<void>;
  deleting: boolean;
}) {
  const [open, setOpen] = useState(false);
  const out = run.output;

  return (
    <div className="rounded-xl border border-border/60 bg-surface/50">
      <div className="relative">
        <button onClick={() => setOpen((v) => !v)} className="w-full p-4 text-left hover:bg-surface-2 transition rounded-xl">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-16">
              <div className="text-xs font-mono text-muted-foreground">{new Date(run.created_at).toLocaleString()}</div>
              <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Ecosystem Executive Vision</div>
              <div className="mt-1 text-sm font-medium line-clamp-2">{out.executive_summary}</div>
            </div>
            <span className="text-muted-foreground ml-2">{open ? "−" : "+"}</span>
          </div>
          <div className="mt-2 text-[10px] font-mono text-muted-foreground">
            {run.input_summary ?? ""} · {run.model}
          </div>
        </button>
        {isOwner && (
          <button
            onClick={(e) => { e.stopPropagation(); void onDelete(); }}
            disabled={deleting}
            title="Delete this run"
            className="absolute top-3 right-9 text-[11px] text-destructive hover:underline disabled:opacity-40"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        )}
      </div>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-border/60 pt-4">
          {out.red_flags.length > 0 && (
            <div>
              <h3 className="text-xs font-mono uppercase tracking-widest text-warning">Red flags</h3>
              <ul className="mt-2 space-y-2">
                {out.red_flags.map((f, i) => (
                  <li key={i} className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-md bg-warning/20 text-warning">{f.severity}</span>
                      <span className="font-medium">{f.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{f.evidence}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Signals by Growth Axis</h3>
            <div className="mt-2 grid sm:grid-cols-2 gap-2">
              {out.signals_by_axis.map((s) => {
                const ax = AXES.find((a) => a.key === s.axis_key);
                if (!ax) return null;
                return (
                  <div key={s.axis_key} className="rounded-lg border border-border/60 bg-card p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-md flex items-center justify-center text-xs font-display font-bold" style={{ background: `color-mix(in oklab, var(--${ax.color}) 22%, transparent)`, color: `var(--${ax.color})` }}>
                          {ax.letter}
                        </div>
                        <span className="text-sm font-medium">{ax.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-display font-bold" style={{ color: `var(--${ax.color})` }}>L{s.suggested_level}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">{s.confidence}</div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{s.observations}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">High-Impact Initiatives</h3>
            <ul className="mt-2 space-y-2">
              {out.suggested_actions.map((a, i) => {
                const ax = AXES.find((x) => x.key === a.axis_key);
                return (
                  <li key={i} className="rounded-lg border border-border/60 bg-card p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {ax && <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-md" style={{ background: `color-mix(in oklab, var(--${ax.color}) 22%, transparent)`, color: `var(--${ax.color})` }}>{ax.name}</span>}
                          <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-md bg-surface-2 text-muted-foreground">{a.priority}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">→ L{a.target_level}</span>
                        </div>
                        <div className="mt-1 text-sm font-medium">{a.title}</div>
                        <p className="text-xs text-muted-foreground mt-1">{a.description}</p>
                      </div>
                      {isOwner && (
                        <button
                          onClick={() => onAddAction(a)}
                          className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                        >
                          + Add
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <p className="text-[10px] font-mono text-muted-foreground">Partner: {partnerId.slice(0, 8)}…</p>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}