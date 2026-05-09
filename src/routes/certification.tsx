import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, CircleDot, Lock } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { usePortfolio, type PortfolioItem } from "@/lib/partners-store";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { COPY } from "@/lib/copy";
import { KeptIllustration } from "@/components/brand/KeptIllustration";
import {
  EXPERT_CERT_TOTAL_SESSIONS,
  type CertificationSessionRow,
  type StakeholderRow,
} from "@/lib/certification-eligibility";

export const Route = createFileRoute("/certification")({
  head: () => ({
    meta: [
      { title: COPY.certification.pageMetaTitle },
      { name: "description", content: COPY.certification.pageMetaDescription },
    ],
  }),
  component: CertificationDirectoryPage,
});

interface PartnerProgress {
  item: PortfolioItem;
  sessionsDone: number;
  hasStakeholder: boolean;
}

function CertificationDirectoryPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const portfolio = usePortfolio(user?.id);
  const [stakeholderCounts, setStakeholderCounts] = useState<Record<string, number>>({});
  const [sessionCounts, setSessionCounts] = useState<Record<string, number>>({});
  const [progressLoading, setProgressLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const expertItems = useMemo<PortfolioItem[]>(
    () => portfolio.items.filter((it) => it.partner.partner_type === "expert"),
    [portfolio.items],
  );

  useEffect(() => {
    if (expertItems.length === 0) {
      setStakeholderCounts({});
      setSessionCounts({});
      setProgressLoading(false);
      return;
    }
    let active = true;
    setProgressLoading(true);
    void (async () => {
      const ids = expertItems.map((it) => it.partner.id);
      const [{ data: stake }, { data: sess }] = await Promise.all([
        supabase
          .from("partner_stakeholders")
          .select("partner_id")
          .in("partner_id", ids),
        supabase
          .from("partner_certification_sessions")
          .select("partner_id, session_number")
          .in("partner_id", ids),
      ]);
      if (!active) return;
      const sCounts: Record<string, number> = {};
      for (const row of (stake ?? []) as Pick<StakeholderRow, "partner_id">[]) {
        sCounts[row.partner_id] = (sCounts[row.partner_id] ?? 0) + 1;
      }
      const cCounts: Record<string, number> = {};
      const seen = new Map<string, Set<number>>();
      for (const row of (sess ?? []) as Pick<
        CertificationSessionRow,
        "partner_id" | "session_number"
      >[]) {
        const set = seen.get(row.partner_id) ?? new Set<number>();
        set.add(row.session_number);
        seen.set(row.partner_id, set);
      }
      seen.forEach((set, partnerId) => {
        cCounts[partnerId] = set.size;
      });
      setStakeholderCounts(sCounts);
      setSessionCounts(cCounts);
      setProgressLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [expertItems]);

  const progress = useMemo<PartnerProgress[]>(() => {
    return expertItems.map((item) => ({
      item,
      sessionsDone: sessionCounts[item.partner.id] ?? 0,
      hasStakeholder: (stakeholderCounts[item.partner.id] ?? 0) > 0,
    }));
  }, [expertItems, sessionCounts, stakeholderCounts]);

  const ready = progress.filter(
    (p) => p.sessionsDone >= EXPERT_CERT_TOTAL_SESSIONS && p.hasStakeholder,
  );
  const inProgress = progress.filter(
    (p) =>
      (p.sessionsDone > 0 && p.sessionsDone < EXPERT_CERT_TOTAL_SESSIONS) ||
      (p.sessionsDone >= EXPERT_CERT_TOTAL_SESSIONS && !p.hasStakeholder),
  );
  const notStarted = progress.filter((p) => p.sessionsDone === 0);

  const isLoading = loading || portfolio.loading || progressLoading;

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 pb-32">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-3.5 w-3.5 text-primary" aria-hidden />
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              {COPY.certification.eyebrow}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            {COPY.certification.pageTitle}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">{COPY.certification.intro}</p>
        </div>
        <KeptIllustration
          variant="bringsCalm"
          className="mx-auto h-[120px] w-auto shrink-0 object-contain opacity-95 lg:mx-0"
          decorative
        />
      </section>

      <section className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          label={COPY.certification.statsReadyLabel}
          value={String(ready.length)}
          accent="primary"
        />
        <StatCard
          label={COPY.certification.statsInProgressLabel}
          value={String(inProgress.length)}
          accent="octa-3"
        />
        <StatCard
          label={COPY.certification.statsNotStartedLabel}
          value={String(notStarted.length)}
          accent="octa-7"
        />
      </section>

      {isLoading ? (
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      ) : expertItems.length === 0 ? (
        <EmptyExpertState />
      ) : (
        <>
          <DirectorySection
            kind="ready"
            title={COPY.certification.sectionReadyTitle}
            subtitle={COPY.certification.sectionReadySubtitle}
            rows={ready}
          />
          <DirectorySection
            kind="in_progress"
            title={COPY.certification.sectionInProgressTitle}
            subtitle={COPY.certification.sectionInProgressSubtitle}
            rows={inProgress}
          />
          <DirectorySection
            kind="not_started"
            title={COPY.certification.sectionNotStartedTitle}
            subtitle={COPY.certification.sectionNotStartedSubtitle}
            rows={notStarted}
          />
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 card-elev relative overflow-hidden">
      <div
        className="absolute top-0 left-0 h-0.5 w-full"
        style={{ background: `linear-gradient(90deg, var(--${accent}), transparent)` }}
      />
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-display font-bold text-foreground">{value}</div>
    </div>
  );
}

function DirectorySection({
  kind,
  title,
  subtitle,
  rows,
}: {
  kind: "ready" | "in_progress" | "not_started";
  title: string;
  subtitle: string;
  rows: PartnerProgress[];
}) {
  if (rows.length === 0) return null;
  return (
    <div className="mt-10">
      <div className="flex flex-col gap-1">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {title}
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">{subtitle}</p>
      </div>
      <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map((p) => (
          <DirectoryCard key={p.item.partner.id} kind={kind} progress={p} />
        ))}
      </div>
    </div>
  );
}

function DirectoryCard({
  kind,
  progress,
}: {
  kind: "ready" | "in_progress" | "not_started";
  progress: PartnerProgress;
}) {
  const { item, sessionsDone, hasStakeholder } = progress;
  const partner = item.partner;
  const total = EXPERT_CERT_TOTAL_SESSIONS;
  const pct = Math.round((sessionsDone / total) * 100);
  const accent = kind === "ready" ? "primary" : kind === "in_progress" ? "octa-3" : "octa-7";

  return (
    <Link
      to="/partner/$partnerId/certification"
      params={{ partnerId: partner.id }}
      className="rounded-2xl border border-border/60 bg-card p-5 card-elev block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p
            className="text-[10px] font-mono uppercase tracking-widest"
            style={{ color: `var(--${accent})` }}
          >
            {kind === "ready"
              ? COPY.certification.cardReadyBadge
              : kind === "in_progress"
                ? COPY.certification.cardInProgressBadge({ done: sessionsDone, total })
                : COPY.certification.cardNotStartedBadge}
          </p>
          <h3 className="mt-1 text-base font-semibold leading-tight truncate">{partner.name}</h3>
          {partner.company && (
            <p className="text-xs text-muted-foreground truncate">{partner.company}</p>
          )}
        </div>
        {kind === "ready" ? (
          <BadgeCheck className="h-5 w-5 text-primary" aria-hidden />
        ) : kind === "in_progress" ? (
          <CircleDot className="h-5 w-5 text-muted-foreground" aria-hidden />
        ) : (
          <Lock className="h-5 w-5 text-muted-foreground" aria-hidden />
        )}
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-xs text-muted-foreground">
          {COPY.certification.cardSessionsLabel({ done: sessionsDone, total })}
        </p>
        <div className="h-1.5 w-full rounded-full bg-surface-2 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              background: `var(--${accent})`,
            }}
          />
        </div>
        {!hasStakeholder && kind !== "not_started" && (
          <p className="text-[11px] text-warning">
            {COPY.certification.cardMissingStakeholderHint}
          </p>
        )}
      </div>

      <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition">
        {COPY.certification.cardOpenCertTabCta}
        <ArrowRight className="h-3 w-3" aria-hidden />
      </span>
    </Link>
  );
}

function EmptyExpertState() {
  return (
    <div className="mt-10 rounded-2xl border border-dashed border-border/60 bg-surface/40 p-10 text-center">
      <KeptIllustration variant="idleAllClear" className="mx-auto h-28 w-auto object-contain opacity-95" decorative />
      <h2 className="mt-4 text-lg font-semibold">{COPY.certification.emptyExpertTitle}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        {COPY.certification.emptyExpertBody}
      </p>
      <Link
        to="/partners"
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-ring"
      >
        {COPY.certification.emptyExpertCta}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}
