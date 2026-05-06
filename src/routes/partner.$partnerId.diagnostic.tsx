import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { usePartner } from "../lib/partners-store";
import { AXES } from "../content/octa";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/partner/$partnerId/diagnostic")({
  head: () => ({ meta: [{ title: "Diagnostic — Alliara" }] }),
  component: PartnerDiagnostic,
});

interface Step { axisKey: string; qKey: string; prompt: string; options: string[]; color: string; axisName: string; }

function PartnerDiagnostic() {
  const { partnerId } = Route.useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const data = usePartner(partnerId);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [canRunForOthers, setCanRunForOthers] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (cancelled) return;
      setCanRunForOthers((roles ?? []).some((r) => r.role === "leadership" || r.role === "admin"));
    })();
    return () => { cancelled = true; };
  }, [user]);

  const steps: Step[] = useMemo(() =>
    AXES.flatMap((a) => a.diagnostic.map((q) => ({
      axisKey: a.key, qKey: `${a.key}.${q.key}`, prompt: q.prompt, options: q.options, color: a.color, axisName: a.name,
    }))), []);

  if (!user) return null;
  if (data.loading || !data.partner) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-52 w-full rounded-2xl" />
      </div>
    );
  }

  if (data.partner.owner_id !== user.id && !canRunForOthers) {
    return <div className="rounded-2xl border border-border/60 bg-surface/40 p-8 text-center text-muted-foreground">You're viewing this partner read-only. Only the owning PDM can run a Diagnostic.</div>;
  }

  const total = steps.length;
  const step = steps[idx];
  const pct = Math.round((idx / total) * 100);

  const choose = (val: number) => {
    setAnswers((a) => ({ ...a, [step.qKey]: val }));
    setTimeout(() => { if (idx < total - 1) setIdx(idx + 1); }, 120);
  };

  const submit = async () => {
    if (Object.keys(answers).length < total) { toast.error("Answer every question first."); return; }
    setSubmitting(true);
    try {
      const scores: Record<string, number> = {};
      for (const a of AXES) {
        const vals = a.diagnostic.map((q) => answers[`${a.key}.${q.key}`]);
        scores[a.key] = Number((vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2));
      }
      await data.saveAssessment(scores, user.id);
      toast.success("Diagnostic saved · partner maturity updated");
      nav({ to: "/partner/$partnerId/coach", params: { partnerId }, search: { autorun: "1" } });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const isLast = idx === total - 1;
  const allAnswered = Object.keys(answers).length === total;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
        <span>Question {idx + 1} of {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-surface-2 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[var(--octa-1)] via-[var(--octa-4)] to-[var(--octa-5)] transition-all" style={{ width: `${(idx / total) * 100}%` }} />
      </div>

      <div className="mt-6 rounded-2xl bg-card border border-border/60 p-8 card-elev" style={{ borderColor: `color-mix(in oklab, var(--${step.color}) 35%, var(--border))` }}>
        <p className="text-xs font-mono uppercase tracking-widest" style={{ color: `var(--${step.color})` }}>{step.axisName}</p>
        <h2 className="mt-2 text-2xl font-semibold">{step.prompt}</h2>

        <div className="mt-6 space-y-2">
          {step.options.map((opt, i) => {
            const lvl = i + 1;
            const selected = answers[step.qKey] === lvl;
            return (
              <button
                key={opt}
                onClick={() => choose(lvl)}
                className={`w-full text-left rounded-xl border px-4 py-3 transition flex items-center gap-3 ${
                  selected
                    ? "border-[var(--axis-color)] bg-[color-mix(in_oklab,var(--axis-color)_15%,transparent)]"
                    : "border-border/60 bg-surface/50 hover:bg-surface-2"
                }`}
                style={{ ["--axis-color" as never]: `var(--${step.color})` }}
              >
                <span className="h-6 w-6 shrink-0 rounded-full border border-border/80 flex items-center justify-center text-xs font-mono" style={selected ? { background: `var(--${step.color})`, color: "var(--background)", borderColor: "transparent" } : {}}>
                  {lvl}
                </span>
                <span className="text-sm">{opt}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setIdx(Math.max(0, idx - 1))}
          disabled={idx === 0}
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm hover:bg-surface-2 disabled:opacity-40"
        >
          ← Back
        </button>
        {!isLast ? (
          <button
            onClick={() => setIdx(Math.min(total - 1, idx + 1))}
            disabled={!answers[step.qKey]}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={!allAnswered || submitting}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground glow-ring disabled:opacity-40"
          >
            {submitting ? "Saving…" : "Save Diagnostic"}
          </button>
        )}
      </div>
    </div>
  );
}