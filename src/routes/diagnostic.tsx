import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useOctoData } from "@/lib/octo-store";
import { AXES } from "@/content/octo";
import { toast } from "sonner";

export const Route = createFileRoute("/diagnostic")({
  head: () => ({ meta: [{ title: "Diagnostic — OCTO OS" }] }),
  component: Diagnostic,
});

interface Step { axisKey: string; qKey: string; prompt: string; options: string[]; color: string; axisName: string; }

function Diagnostic() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const data = useOctoData(user?.id);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({}); // qKey -> 1..5
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [loading, user, nav]);

  const steps: Step[] = useMemo(() => AXES.flatMap((a) =>
    a.diagnostic.map((q) => ({ axisKey: a.key, qKey: `${a.key}.${q.key}`, prompt: q.prompt, options: q.options, color: a.color, axisName: a.name }))
  ), []);

  if (loading || !user) return <div className="p-10 text-muted-foreground">Loading…</div>;

  const total = steps.length;
  const step = steps[idx];
  const pct = Math.round((idx / total) * 100);

  const choose = (val: number) => {
    setAnswers((a) => ({ ...a, [step.qKey]: val }));
    setTimeout(() => {
      if (idx < total - 1) setIdx(idx + 1);
    }, 120);
  };

  const submit = async () => {
    if (Object.keys(answers).length < total) {
      toast.error("Answer every question first.");
      return;
    }
    setSubmitting(true);
    try {
      const scores: Record<string, number> = {};
      for (const a of AXES) {
        const vals = a.diagnostic.map((q) => answers[`${a.key}.${q.key}`]);
        scores[a.key] = Number((vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2));
      }
      await data.saveAssessment(scores);
      toast.success("Diagnostic saved · maturity updated");
      nav({ to: "/dashboard" });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const isLast = idx === total - 1;
  const allAnswered = Object.keys(answers).length === total;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
        <span>Question {idx + 1} of {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-surface-2 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[var(--octo-1)] via-[var(--octo-4)] to-[var(--octo-5)] transition-all" style={{ width: `${(idx / total) * 100}%` }} />
      </div>

      {/* Question card */}
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

      {/* Nav */}
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
            {submitting ? "Saving…" : "See results"}
          </button>
        )}
      </div>
    </div>
  );
}
