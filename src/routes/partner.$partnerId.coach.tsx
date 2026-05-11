import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  usePartner,
  levelFromAvg,
  type AiRecRow,
  type PartnerMetricRow,
} from "../lib/partners-store";
import { AXES } from "../content/octa";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirmDialog } from "@/components/ui/confirm-provider";
import { COPY } from "@/lib/copy";
import { KeptIllustration } from "@/components/brand/KeptIllustration";
import { KeptPromptBar, resolveKeptPromptVariant } from "@/components/kept/KeptPromptBar";
import { AgentTaskCard, type AgentTask } from "@/components/ui/agent-plan";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/partner/$partnerId/coach")({
  validateSearch: (search: Record<string, unknown>) => ({
    autorun: search.autorun === "1" ? "1" : undefined,
  }),
  head: () => ({ meta: [{ title: COPY.kept.coachPageMetaTitle }] }),
  component: PartnerCoach,
});

interface CoachContent {
  summary: string;
  recommendations: {
    axis_key: string;
    title: string;
    why: string;
    how: string;
    expected_outcome: string;
    priority: "low" | "medium" | "high";
    target_level: number;
  }[];
  action_items: {
    axis_key: string;
    title: string;
    description?: string;
    priority: "low" | "medium" | "high";
    target_level: number;
  }[];
}

function normalizeCoachContent(raw: unknown): CoachContent {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const rawRecs = Array.isArray(obj.recommendations)
    ? obj.recommendations
    : Array.isArray(obj.recommendation_items)
      ? obj.recommendation_items
      : [];

  const rawActions = Array.isArray(obj.action_items)
    ? obj.action_items
    : Array.isArray(obj.actions)
      ? obj.actions
      : [];

  const recommendations: CoachContent["recommendations"] = rawRecs
    .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
    .map((r) => ({
      axis_key: String(r.axis_key ?? ""),
      title: String(r.title ?? "Untitled recommendation"),
      why: String(r.why ?? ""),
      how: String(r.how ?? ""),
      expected_outcome: String(r.expected_outcome ?? r.outcome ?? ""),
      priority: r.priority === "high" || r.priority === "low" ? r.priority : "medium",
      target_level: Number(r.target_level ?? 0) || 0,
    }));

  const action_items: CoachContent["action_items"] = rawActions
    .filter((a): a is Record<string, unknown> => !!a && typeof a === "object")
    .map((a) => ({
      axis_key: String(a.axis_key ?? ""),
      title: String(a.title ?? "Untitled move"),
      description: a.description ? String(a.description) : undefined,
      priority: a.priority === "high" || a.priority === "low" ? a.priority : "medium",
      target_level: Number(a.target_level ?? 0) || 0,
    }));

  return {
    summary: String(obj.summary ?? "No summary available for this run."),
    recommendations,
    action_items,
  };
}

/** Compact lines for ai-coach (self-reported partner_metrics only). */
function formatMetricsForCoach(rows: PartnerMetricRow[]): string | null {
  if (rows.length === 0) return null;
  return rows
    .map((m, i) => {
      const bits: string[] = [`Snapshot ${i + 1}`];
      if (m.period) bits.push(`period ${m.period}`);
      bits.push(`recorded ${String(m.created_at).slice(0, 10)}`);
      const nums: string[] = [];
      if (m.mrr != null) nums.push(`MRR ${m.mrr}`);
      if (m.revenue != null) nums.push(`revenue ${m.revenue}`);
      if (m.deals_open != null) nums.push(`open deals ${m.deals_open}`);
      if (m.deals_open_value != null) nums.push(`open value ${m.deals_open_value}`);
      if (m.deals_won != null) nums.push(`won deals ${m.deals_won}`);
      if (m.deals_won_value != null) nums.push(`won value ${m.deals_won_value}`);
      if (m.trained_people != null) nums.push(`trained ${m.trained_people}`);
      if (nums.length) bits.push(nums.join(", "));
      if (m.notes?.trim()) bits.push(`notes: ${m.notes.trim()}`);
      return bits.join(" · ");
    })
    .join("\n");
}

function PartnerCoach() {
  const { partnerId } = Route.useParams();
  const search = Route.useSearch();
  const { user } = useAuth();
  const data = usePartner(partnerId);
  const confirmDialog = useConfirmDialog();
  const [focus, setFocus] = useState<string>("");
  const [sessionContext, setSessionContext] = useState("");
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isOwner = !!user && data.partner?.owner_id === user.id;
  const hasDiagnostic = !!data.latest;

  const addSuggestedCoachAction = useCallback(
    async (item: CoachContent["action_items"][number]) => {
      if (!user) return;
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
        toast.success(COPY.toast.addedToJbp);
      } catch (e) {
        toast.error((e as Error).message);
      }
    },
    [user, data],
  );

  const deleteGuidanceRun = useCallback(
    async (recId: string) => {
      const ok = await confirmDialog({
        title: COPY.kept.deleteGuidanceConfirmTitle,
        description: COPY.kept.deleteGuidanceConfirmDescription,
        actionLabel: COPY.kept.deleteGuidanceConfirmAction,
      });
      if (!ok) return;
      setDeletingId(recId);
      try {
        await data.deleteRecommendation(recId);
        toast.success(COPY.kept.guidanceDeletedToast);
      } catch (e) {
        console.error("[PartnerCoach - deleteGuidanceRun]:", e);
        toast.error((e as Error).message);
      } finally {
        setDeletingId(null);
      }
    },
    [confirmDialog, data],
  );

  const generate = async () => {
    if (!user || !data.partner || !data.latest) {
      toast.error(COPY.kept.needDiagnosticFirst);
      return;
    }
    setBusy(true);
    try {
      const scores = data.latest!.scores as Record<string, number>;
      const axesPayload = AXES.map((a) => {
        const score = scores[a.key] ?? 0;
        const lvl = score ? levelFromAvg(score) : 0;
        const nextLevel = a.levels.find((l) => l.level === lvl);
        return {
          key: a.key,
          name: a.name,
          score,
          level: lvl,
          mentalModel: a.mentalModel,
          commonMistakes: a.commonMistakes,
          levers: a.levers,
          nextLevelStep: nextLevel?.nextStep,
        };
      });

      const metricsSummary = formatMetricsForCoach(data.metricSnapshots);

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
          sessionContext: sessionContext.trim() || null,
          metricsSummary: metricsSummary || null,
        },
      });
      if (error) throw error;
      if (!resp?.ok) throw new Error(resp?.error ?? "Coach failed");

      await data.saveRecommendation(focus || null, resp.content, resp.model ?? "");
      toast.success(COPY.kept.deliveredToast);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (search.autorun !== "1") return;
    if (!isOwner || !hasDiagnostic || busy || data.recs.length > 0) return;
    void generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.autorun, isOwner, hasDiagnostic, busy, data.recs.length]);

  if (data.loading || !user) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }
  if (!data.partner) return null;

  return (
    <div>
      <div className="rounded-2xl bg-card border border-border/60 p-6 card-elev">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-1 gap-4">
            <KeptIllustration
              variant={hasDiagnostic ? "contextBeforeCall" : "notifySomethingToCheck"}
              className="mx-auto h-[104px] w-auto shrink-0 object-contain sm:mx-0 sm:h-24"
              decorative
            />
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold">{COPY.kept.label}</h2>
              <p className="text-sm text-muted-foreground mt-1">{COPY.kept.subtitleForPartner}</p>
            </div>
          </div>
          {isOwner && (
            <KeptPromptBar
              variant={resolveKeptPromptVariant()}
              focus={focus}
              onFocusChange={setFocus}
              context={sessionContext}
              onContextChange={setSessionContext}
              onGenerate={() => void generate()}
              busy={busy}
              hasDiagnostic={hasDiagnostic}
              isOwner={isOwner}
              axes={AXES}
              hasExistingRecs={data.recs.length > 0}
              labels={{
                overallOption: COPY.kept.coachOverallPlanOption,
                focusPrefix: COPY.kept.coachFocusOptionPrefix,
                contextLabel: COPY.kept.promptContextLabel,
                contextPlaceholder: COPY.kept.promptContextPlaceholder,
                toggleContextShow: COPY.kept.promptToggleContextShow,
                toggleContextHide: COPY.kept.promptToggleContextHide,
                generate: COPY.kept.generateLabel,
                regenerate: COPY.kept.regenerateLabel,
                busy: COPY.kept.busyLabel,
              }}
            />
          )}
        </div>
        {!hasDiagnostic && (
          <div className="mt-4 text-sm text-muted-foreground">
            {COPY.kept.needDiagnosticFirst}{" "}
            <Link
              to="/partner/$partnerId/diagnostic"
              params={{ partnerId }}
              className="text-primary underline"
            >
              {COPY.kept.goToDiagnosticLink}
            </Link>
          </div>
        )}
      </div>

      {data.recs.length === 0 ? (
        hasDiagnostic && (
          <div className="mt-6 rounded-2xl border border-dashed border-border/60 bg-surface/40 p-10 text-center">
            <KeptIllustration variant="bringsCalm" className="mx-auto h-24 w-auto object-contain opacity-95" decorative />
            <h3 className="mt-4 text-lg font-semibold">{COPY.kept.emptyTitleOwner}</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              {isOwner ? COPY.kept.emptyBodyOwner : COPY.kept.emptyBodyViewer}
            </p>
          </div>
        )
      ) : (
        <div className="mt-6 space-y-4">
          <RecommendationCard
            key={data.recs[0]!.id}
            rec={data.recs[0]!}
            isOwner={isOwner}
            variant="default"
            onAddAction={addSuggestedCoachAction}
            onDelete={isOwner ? () => void deleteGuidanceRun(data.recs[0]!.id) : undefined}
            deleteBusy={deletingId === data.recs[0]!.id}
          />
          {data.recs.length > 1 ? (
            <details className="group rounded-2xl border border-border/60 bg-surface/30">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="underline-offset-2 group-open:underline">
                  {COPY.kept.earlierKeptRunsSummary({ n: data.recs.length - 1 })}
                </span>
              </summary>
              <div className="space-y-4 border-t border-border/50 px-3 pb-4 pt-3 sm:px-4">
                {data.recs.slice(1).map((r) => (
                  <RecommendationCard
                    key={r.id}
                    rec={r}
                    isOwner={isOwner}
                    variant="archive"
                    onAddAction={addSuggestedCoachAction}
                    onDelete={isOwner ? () => void deleteGuidanceRun(r.id) : undefined}
                    deleteBusy={deletingId === r.id}
                  />
                ))}
              </div>
            </details>
          ) : null}
        </div>
      )}
    </div>
  );
}

function RecommendationCard({
  rec,
  isOwner,
  variant = "default",
  onAddAction,
  onDelete,
  deleteBusy,
}: {
  rec: AiRecRow;
  isOwner: boolean;
  variant?: "default" | "archive";
  onAddAction: (item: CoachContent["action_items"][number]) => void;
  onDelete?: () => void;
  deleteBusy?: boolean;
}) {
  const c = normalizeCoachContent(rec.content);
  const focusAxis = rec.axis_key ? AXES.find((a) => a.key === rec.axis_key) : null;
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [recDetailOpen, setRecDetailOpen] = useState<Record<number, boolean>>({});
  const summaryLong = variant === "archive" ? c.summary.length > 100 : c.summary.length > 200;
  const summaryClamp =
    variant === "archive"
      ? !summaryExpanded && c.summary.length > 0
      : !summaryExpanded && summaryLong;
  const toggleRecDetail = (i: number) => {
    setRecDetailOpen((prev) => ({ ...prev, [i]: !prev[i] }));
  };

  return (
    <div
      className={cn(
        "rounded-2xl bg-card border border-border/60 card-elev",
        variant === "archive" ? "p-4" : "p-6",
      )}
    >
      <div
        className={cn(
          "flex flex-wrap items-start justify-between gap-2 text-muted-foreground",
          variant === "archive" ? "text-[10px]" : "text-xs",
        )}
      >
        <div className="min-w-0 font-mono uppercase tracking-widest">
          {focusAxis
            ? `${COPY.kept.coachFocusOptionPrefix} ${focusAxis.name}`
            : COPY.kept.coachOverallPlanOption}{" "}
          ·{" "}
          {new Date(rec.created_at).toLocaleString()}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {rec.model ? <div className="font-mono">{rec.model}</div> : null}
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={deleteBusy}
              aria-busy={deleteBusy}
              aria-label={COPY.kept.deleteGuidanceCta}
              className="min-h-9 rounded-md border border-destructive/40 bg-destructive/10 px-2.5 py-1 text-[11px] font-semibold text-destructive hover:bg-destructive/15 disabled:opacity-50"
            >
              {deleteBusy ? COPY.kept.deleteGuidanceBusyLabel : COPY.kept.deleteGuidanceCta}
            </button>
          ) : null}
        </div>
      </div>

      <p
        className={cn(
          "mt-3 font-medium",
          variant === "archive" ? "text-sm" : "text-base",
          summaryClamp && (variant === "archive" ? "line-clamp-2" : "line-clamp-3"),
        )}
      >
        {c.summary}
      </p>
      {summaryLong ? (
        <button
          type="button"
          onClick={() => setSummaryExpanded((e) => !e)}
          className="mt-1.5 text-sm font-medium text-primary hover:underline"
        >
          {summaryExpanded ? COPY.kept.summaryCollapseCta : COPY.kept.summaryExpandCta}
        </button>
      ) : null}

      <div className="mt-5">
        <h4 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          {COPY.kept.sectionRecommendationsEyebrow}
        </h4>
        <div className="mt-2 space-y-3">
          {c.recommendations.map((r, i) => {
            const ax = AXES.find((a) => a.key === r.axis_key);
            const detailsOpen = !!recDetailOpen[i];
            return (
              <div key={i} className="rounded-xl bg-surface/60 border border-border/60 p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {ax && (
                      <span
                        className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded"
                        style={{
                          background: `color-mix(in oklab, var(--${ax.color}) 22%, transparent)`,
                          color: `var(--${ax.color})`,
                        }}
                      >
                        {ax.letter} · {ax.name}
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-mono uppercase tracking-widest ${r.priority === "high" ? "text-warning" : r.priority === "medium" ? "" : "text-muted-foreground"}`}
                    >
                      {r.priority}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      → L{r.target_level}
                    </span>
                  </div>
                </div>
                <div className="mt-2 font-semibold text-sm">{r.title}</div>
                <button
                  type="button"
                  onClick={() => toggleRecDetail(i)}
                  className="mt-2 text-xs font-medium text-primary hover:underline"
                >
                  {detailsOpen
                    ? COPY.kept.recommendationDetailCollapseCta
                    : COPY.kept.recommendationDetailExpandCta}
                </button>
                {detailsOpen ? (
                  <>
                    <p className="mt-2 text-sm text-muted-foreground">
                      <span className="text-foreground/70 font-medium">{COPY.kept.recommendationWhyLabel}:</span>{" "}
                      {r.why}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <span className="text-foreground/70 font-medium">{COPY.kept.recommendationHowLabel}:</span>{" "}
                      {r.how}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <span className="text-foreground/70 font-medium">{COPY.kept.recommendationOutcomeLabel}:</span>{" "}
                      {r.expected_outcome}
                    </p>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <h4 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          {COPY.kept.sectionMovesEyebrow}
        </h4>
        <ul className="mt-2 space-y-2 list-none p-0 m-0">
          {c.action_items.map((it, i) => {
            const task: AgentTask = {
              id: `kept-suggest-${rec.id}-${i}`,
              title: it.title,
              description: it.description,
              status: "todo",
              priority: it.priority,
              axisKey: it.axis_key,
              targetLevel: it.target_level || null,
              source: "ai",
            };
            return (
              <li key={task.id}>
                <AgentTaskCard
                  task={task}
                  isOwner={isOwner}
                  compact
                  suggestionAction={
                    isOwner
                      ? {
                          label: COPY.kept.addSuggestedTaskCta,
                          onClick: () => onAddAction(it),
                        }
                      : undefined
                  }
                />
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
