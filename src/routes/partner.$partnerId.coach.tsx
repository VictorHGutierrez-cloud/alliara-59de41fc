import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { usePartner, levelFromAvg, type AiRecRow } from "../lib/partners-store";
import { AXES } from "../content/octa";
import { toast } from "sonner";

export const Route = createFileRoute("/partner/$partnerId/coach")({
  head: () => ({ meta: [{ title: "Ecosystem Copilot — Alliara" }] }),
  component: PartnerCoach,
});

interface CoachContent {
  summary: string;
  recommendations: {
    axis_key: string; title: string; why: string; how: string;
    expected_outcome: string; priority: "low" | "medium" | "high"; target_level: number;
  }[];
  action_items: {
    axis_key: string; title: string; description?: string;
    priority: "low" | "medium" | "high"; target_level: number;
  }[];
}

function PartnerCoach() {
  const { partnerId } = Route.useParams();
  const { user } = useAuth();
  const data = usePartner(partnerId);
  const [focus, setFocus] = useState<string>("");
  const [busy, setBusy] = useState(false);

  if (data.loading || !user) return <div className="text-muted-foreground">Loading…</div>;
  if (!data.partner) return null;

  const isOwner = data.partner.owner_id === user.id;
  const hasDiagnostic = !!data.latest;

  const generate = async () => {
    if (!hasDiagnostic) { toast.error("Run the diagnostic first"); return; }
    setBusy(true);
    try {
      const scores = data.latest!.scores as Record<string, number>;
      const axesPayload = AXES.map((a) => {
        const score = scores[a.key] ?? 0;
        const lvl = score ? levelFromAvg(score) : 0;
        const nextLevel = a.levels.find((l) => l.level === lvl);
        return {
          key: a.key, name: a.name, score, level: lvl,
          mentalModel: a.mentalModel,
          commonMistakes: a.commonMistakes,
          levers: a.levers,
          nextLevelStep: nextLevel?.nextStep,
        };
      });

      const { data: resp, error } = await supabase.functions.invoke("ai-coach", {
        body: {
          partner: {
            name: data.partner!.name,
            company: data.partner!.company,
            segment: data.partner!.segment,
            tier: data.partner!.tier,
            status: data.partner!.status,
            notes: data.partner!.notes,
          },
          overall: Number(data.latest!.overall),
          axes: axesPayload,
          focusAxisKey: focus || null,
        },
      });
      if (error) throw error;
      if (!resp?.ok) throw new Error(resp?.error ?? "Coach failed");

      await data.saveRecommendation(focus || null, resp.content, resp.model ?? "");
      toast.success("Ecosystem Copilot delivered new guidance");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="rounded-2xl bg-card border border-border/60 p-6 card-elev">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-semibold">Ecosystem Copilot</h2>
            <p className="text-sm text-muted-foreground mt-1">Personalized guidance for {data.partner.name}, grounded in their OCTA scores and your PDM notes.</p>
          </div>
          {isOwner && (
            <div className="flex flex-wrap items-center gap-2">
              <select value={focus} onChange={(e) => setFocus(e.target.value)} className="input w-auto">
                <option value="">Overall plan</option>
                {AXES.map((a) => <option key={a.key} value={a.key}>Focus: {a.name}</option>)}
              </select>
              <button
                onClick={generate}
                disabled={busy || !hasDiagnostic}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-ring disabled:opacity-40"
              >
                {busy ? "Coaching…" : data.recs.length ? "Regenerate" : "Generate"}
              </button>
            </div>
          )}
        </div>
        {!hasDiagnostic && (
          <div className="mt-4 text-sm text-muted-foreground">
            Run the Readiness Assessment first → <Link to="/partner/$partnerId/diagnostic" params={{ partnerId }} className="text-primary underline">go to assessment</Link>
          </div>
        )}
      </div>

      {data.recs.length === 0 ? (
        hasDiagnostic && (
          <div className="mt-6 rounded-2xl border border-dashed border-border/60 bg-surface/40 p-10 text-center">
            <h3 className="text-lg font-semibold">No copilot guidance yet</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              {isOwner ? "Generate the first set of guidance for this partner." : "The owning PDM hasn't generated copilot guidance yet."}
            </p>
          </div>
        )
      ) : (
        <div className="mt-6 space-y-4">
          {data.recs.map((r) => (
            <RecommendationCard
              key={r.id}
              rec={r}
              isOwner={isOwner}
              onAddAction={async (item) => {
                try {
                  await data.addAction({
                    userId: user.id,
                    axisKey: item.axis_key,
                    title: item.title,
                    description: item.description,
                    priority: item.priority,
                    targetLevel: item.target_level,
                    source: "ai",
                  });
                  toast.success("Added to action plan");
                } catch (e) { toast.error((e as Error).message); }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RecommendationCard({
  rec, isOwner, onAddAction,
}: {
  rec: AiRecRow;
  isOwner: boolean;
  onAddAction: (item: CoachContent["action_items"][number]) => void;
}) {
  const c = rec.content as unknown as CoachContent;
  const focusAxis = rec.axis_key ? AXES.find((a) => a.key === rec.axis_key) : null;

  return (
    <div className="rounded-2xl bg-card border border-border/60 p-6 card-elev">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="font-mono uppercase tracking-widest">
          {focusAxis ? `Focus: ${focusAxis.name}` : "Overall plan"} · {new Date(rec.created_at).toLocaleString()}
        </div>
        {rec.model && <div className="font-mono">{rec.model}</div>}
      </div>

      <p className="mt-3 text-base font-medium">{c.summary}</p>

      <div className="mt-5">
        <h4 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Recommendations</h4>
        <div className="mt-2 space-y-3">
          {c.recommendations.map((r, i) => {
            const ax = AXES.find((a) => a.key === r.axis_key);
            return (
              <div key={i} className="rounded-xl bg-surface/60 border border-border/60 p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {ax && (
                      <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ background: `color-mix(in oklab, var(--${ax.color}) 22%, transparent)`, color: `var(--${ax.color})` }}>
                        {ax.letter} · {ax.name}
                      </span>
                    )}
                    <span className={`text-[10px] font-mono uppercase tracking-widest ${r.priority === "high" ? "text-warning" : r.priority === "medium" ? "" : "text-muted-foreground"}`}>{r.priority}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">→ L{r.target_level}</span>
                  </div>
                </div>
                <div className="mt-2 font-semibold text-sm">{r.title}</div>
                <p className="mt-1 text-sm text-muted-foreground"><span className="text-foreground/70 font-medium">Why:</span> {r.why}</p>
                <p className="mt-1 text-sm text-muted-foreground"><span className="text-foreground/70 font-medium">How:</span> {r.how}</p>
                <p className="mt-1 text-sm text-muted-foreground"><span className="text-foreground/70 font-medium">Outcome:</span> {r.expected_outcome}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <h4 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Ready-to-add action items</h4>
        <div className="mt-2 grid sm:grid-cols-2 gap-2">
          {c.action_items.map((it, i) => {
            const ax = AXES.find((a) => a.key === it.axis_key);
            return (
              <div key={i} className="rounded-xl border border-border/60 bg-surface/40 p-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {ax && (
                      <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ background: `color-mix(in oklab, var(--${ax.color}) 22%, transparent)`, color: `var(--${ax.color})` }}>
                        {ax.letter}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-muted-foreground">{it.priority} · L{it.target_level}</span>
                  </div>
                  <div className="mt-1 text-sm font-medium">{it.title}</div>
                  {it.description && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{it.description}</div>}
                </div>
                {isOwner && (
                  <button
                    onClick={() => onAddAction(it)}
                    className="shrink-0 text-xs rounded-md bg-primary px-2.5 py-1 font-semibold text-primary-foreground hover:opacity-90"
                  >
                    + Add
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}