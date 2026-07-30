import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, ExternalLink, Newspaper, Phone } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { COPY } from "@/lib/copy";
import { getSalesMaterial } from "@/content/sales-library";
import { Skeleton } from "@/components/ui/skeleton";
import { AcademyAuthSkeleton } from "@/components/academy/AcademyAuthSkeleton";
import { CompanionIllustration } from "@/components/brand/CompanionIllustration";
import { AcademyPageShell } from "@/components/academy/AcademyPageShell";
import { cn } from "@/lib/utils";
import { createSession, DEAL_STAGES } from "@/lib/coach-sessions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/academy/briefing")({
  head: () => ({ meta: [{ title: COPY.academy.briefingMetaTitle }] }),
  component: AcademyBriefingPage,
});

type BriefRow = {
  id: string;
  title: string;
  url: string;
  source_name: string;
  published_at: string | null;
  summary: string;
  topics: string[];
  related_slugs: string[];
  created_at: string;
};

type RangeFilter = "all" | "week" | "today";

function AcademyBriefingPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [briefs, setBriefs] = useState<BriefRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<RangeFilter>("week");
  const [activeBrief, setActiveBrief] = useState<BriefRow | null>(null);
  const [dealName, setDealName] = useState("");
  const [stage, setStage] = useState("");
  const [applyNote, setApplyNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) void nav({ to: "/login" });
  }, [loading, user, nav]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      setError(null);
      try {
        const { data, error: err } = await supabase
          .from("sales_briefs")
          .select("id,title,url,source_name,published_at,summary,topics,related_slugs,created_at")
          .order("published_at", { ascending: false, nullsFirst: false })
          .limit(40);
        if (err) throw err;
        if (!cancelled) setBriefs((data ?? []) as BriefRow[]);
      } catch (e) {
        console.error("[AcademyBriefingPage]:", e);
        if (!cancelled) {
          setBriefs([]);
          setError(e instanceof Error ? e.message : COPY.academy.briefingLoadError);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  function openUseOnCall(brief: BriefRow) {
    setActiveBrief(brief);
    setDealName("");
    setStage("");
    setApplyNote(
      `Article: "${brief.title}". ${brief.summary.slice(0, 280)}${brief.summary.length > 280 ? "…" : ""}`,
    );
    setFormError(null);
  }

  async function submitUseOnCall() {
    if (!user || !activeBrief || saving) return;
    setSaving(true);
    setFormError(null);
    const { session, error: createError } = await createSession(user.id, {
      mode: "briefing",
      title: activeBrief.title,
      deal_name: dealName.trim() || null,
      stage: stage || null,
      situation: applyNote.trim() || activeBrief.title,
      source: "briefing",
      slug: activeBrief.related_slugs[0] ?? null,
    });
    setSaving(false);
    if (!session) {
      setFormError(createError || COPY.academy.situationFormError);
      return;
    }
    setActiveBrief(null);
    void nav({
      to: "/academy/ask",
      search: { session: session.id },
    });
  }

  const filtered = useMemo(() => {
    if (!briefs) return null;
    if (range === "all") return briefs;
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const maxAge = range === "today" ? dayMs : 7 * dayMs;
    return briefs.filter((b) => {
      const t = b.published_at ? Date.parse(b.published_at) : Date.parse(b.created_at);
      if (Number.isNaN(t)) return true;
      return now - t <= maxAge;
    });
  }, [briefs, range]);

  if (loading || !user) return <AcademyAuthSkeleton />;

  return (
    <AcademyPageShell
      backToAcademy
      eyebrow={COPY.academy.briefingEyebrow}
      title={COPY.academy.briefingTitle}
      subtitle={COPY.academy.briefingIntro}
    >
      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Time range">
        {(
          [
            { id: "today" as const, label: COPY.academy.briefingFilterToday },
            { id: "week" as const, label: COPY.academy.briefingFilterWeek },
            { id: "all" as const, label: COPY.academy.briefingFilterAll },
          ] as const
        ).map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={range === f.id}
            onClick={() => setRange(f.id)}
            className={cn(
              "min-h-11 rounded-xl border px-3.5 text-xs font-semibold transition",
              range === f.id
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-foreground hover:bg-surface-2",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className="mt-6 space-y-4">
        {filtered === null && (
          <>
            <BriefSkeleton />
            <BriefSkeleton />
            <BriefSkeleton />
          </>
        )}

        {filtered && filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-background p-8 text-center">
            <CompanionIllustration variant="remindsGently" className="mx-auto h-24 w-auto" decorative />
            <Newspaper className="mx-auto mt-4 h-8 w-8 text-muted-foreground" aria-hidden />
            <p className="mt-3 text-sm text-muted-foreground">{COPY.academy.briefingEmpty}</p>
          </div>
        )}

        {filtered?.map((b) => (
          <article
            key={b.id}
            className="rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-card)]"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/80">{b.source_name || "Source"}</span>
              {b.published_at && (
                <>
                  <span aria-hidden>·</span>
                  <time dateTime={b.published_at}>
                    {new Date(b.published_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </time>
                </>
              )}
            </div>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">{b.title}</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-foreground/90">{b.summary}</p>

            {b.topics.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {b.topics.slice(0, 6).map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            {b.related_slugs.length > 0 && (
              <div className="mt-4">
                <p className="page-eyebrow mb-2">{COPY.academy.briefingRelatedLabel}</p>
                <div className="flex flex-wrap gap-2">
                  {b.related_slugs.map((slug) => {
                    const mat = getSalesMaterial(slug);
                    if (!mat) return null;
                    return (
                      <Link
                        key={slug}
                        to="/academy/library/$slug"
                        params={{ slug }}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-surface-2/60 px-3 text-xs font-semibold hover:bg-surface-2"
                      >
                        <BookOpen className="h-3.5 w-3.5" aria-hidden />
                        {mat.title}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={b.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                <ExternalLink className="h-4 w-4" aria-hidden />
                {COPY.academy.briefingReadArticle}
              </a>
              <button
                type="button"
                onClick={() => openUseOnCall(b)}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border px-4 text-sm font-semibold hover:bg-surface-2"
              >
                <Phone className="h-4 w-4" aria-hidden />
                {COPY.academy.briefingUseOnCall}
              </button>
            </div>
          </article>
        ))}
      </div>

      <Dialog open={Boolean(activeBrief)} onOpenChange={(open) => !open && setActiveBrief(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{COPY.academy.briefingUseOnCallTitle}</DialogTitle>
            <DialogDescription>{COPY.academy.briefingUseOnCallBody}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="brief-deal">{COPY.academy.situationFormDealLabel}</Label>
              <Input
                id="brief-deal"
                value={dealName}
                onChange={(e) => setDealName(e.target.value)}
                placeholder={COPY.academy.situationFormDealPlaceholder}
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <Label>{COPY.academy.situationFormStageLabel}</Label>
              <Select value={stage || undefined} onValueChange={setStage}>
                <SelectTrigger className="min-h-11">
                  <SelectValue placeholder={COPY.academy.situationFormStagePlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {DEAL_STAGES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brief-apply">How does this apply?</Label>
              <Textarea
                id="brief-apply"
                value={applyNote}
                onChange={(e) => setApplyNote(e.target.value)}
                rows={4}
                maxLength={800}
              />
            </div>
            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setActiveBrief(null)}>
              {COPY.academy.briefingUseOnCallCancel}
            </Button>
            <Button type="button" disabled={saving} onClick={() => void submitUseOnCall()}>
              {saving ? COPY.academy.situationFormSaving : COPY.academy.briefingUseOnCallSubmit}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AcademyPageShell>
  );
}

function BriefSkeleton() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-5 w-4/5" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-9 w-36 rounded-xl" />
    </div>
  );
}
