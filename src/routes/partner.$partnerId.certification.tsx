import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  Circle,
  Download,
  Eye,
  Lock,
  X as XIcon,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { COPY } from "@/lib/copy";
import { useLeadership } from "@/lib/use-leadership";
import { downloadPdfFromNode, slugifyForFile } from "@/lib/report-export";
import {
  CertificateBody,
  type CertificateBodyState,
} from "@/components/certification/CertificateBody";
import {
  EXPERT_CERT_TOTAL_SESSIONS,
  buildCertificateId,
  buildEligibilityFromSessions,
  formatCertificateDate,
  type CertificationSessionRow,
  type StakeholderRow,
} from "@/lib/certification-eligibility";
import type { Database } from "@/integrations/supabase/types";

type PartnerRow = Database["public"]["Tables"]["partners"]["Row"];

function supabaseClientErrorDetail(e: unknown): string {
  if (typeof e !== "object" || e === null) return "Unknown error";
  const rec = e as { message?: unknown; code?: unknown };
  const msg = typeof rec.message === "string" ? rec.message.trim() : "";
  const code = typeof rec.code === "string" ? rec.code.trim() : "";
  if (msg && code) return `${code}: ${msg}`;
  if (msg) return msg;
  return "Unknown error";
}

export const Route = createFileRoute("/partner/$partnerId/certification")({
  head: () => ({ meta: [{ title: "Certification — Alliara" }] }),
  component: PartnerCertificationPage,
});

function PartnerCertificationPage() {
  const { partnerId } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { isLeadership } = useLeadership(user?.id);

  const [partner, setPartner] = useState<PartnerRow | null>(null);
  const [partnerLoading, setPartnerLoading] = useState(true);
  const [stakeholders, setStakeholders] = useState<StakeholderRow[]>([]);
  const [sessions, setSessions] = useState<CertificationSessionRow[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [busySession, setBusySession] = useState<number | null>(null);
  const [selectedStakeholderId, setSelectedStakeholderId] = useState<string>("");
  const [issuerName, setIssuerName] = useState<string>("");
  const [preview, setPreview] = useState<CertificateBodyState | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  const refresh = useCallback(async () => {
    if (!partnerId) return;
    setDataLoading(true);
    const [{ data: p }, { data: stake }, { data: sess }] = await Promise.all([
      supabase.from("partners").select("*").eq("id", partnerId).maybeSingle(),
      supabase
        .from("partner_stakeholders")
        .select("*")
        .eq("partner_id", partnerId)
        .order("created_at", { ascending: false }),
      supabase
        .from("partner_certification_sessions")
        .select("*")
        .eq("partner_id", partnerId)
        .order("session_number", { ascending: true }),
    ]);
    setPartner((p as PartnerRow | null) ?? null);
    setPartnerLoading(false);
    const stakeRows = (stake ?? []) as StakeholderRow[];
    setStakeholders(stakeRows);
    setSessions((sess ?? []) as CertificationSessionRow[]);
    if (!selectedStakeholderId && stakeRows[0]) {
      setSelectedStakeholderId(stakeRows[0].id);
    }
    setDataLoading(false);
  }, [partnerId, selectedStakeholderId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();
      if (!active) return;
      const name = (data?.display_name ?? "").trim();
      setIssuerName(name || COPY.certification.certIssuerFallback);
    })();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const isOwner = Boolean(user?.id && partner?.owner_id === user.id);
  const canEdit = isOwner || isLeadership;

  const eligibility = useMemo(() => {
    if (!partner) return null;
    return buildEligibilityFromSessions(partner, stakeholders, sessions);
  }, [partner, stakeholders, sessions]);

  const sessionByNumber = useMemo(() => {
    const map = new Map<number, CertificationSessionRow>();
    for (const s of sessions) map.set(s.session_number, s);
    return map;
  }, [sessions]);

  const toggleSession = async (n: number) => {
    if (!canEdit || !user?.id || busySession !== null) return;
    const existing = sessionByNumber.get(n);
    setBusySession(n);
    try {
      if (existing) {
        const { error } = await supabase
          .from("partner_certification_sessions")
          .delete()
          .eq("id", existing.id);
        if (error) throw error;
        toast.success(COPY.certification.sessionToggledOffToast({ n }));
      } else {
        const { error } = await supabase.from("partner_certification_sessions").insert({
          partner_id: partnerId,
          session_number: n,
          completed_by: user.id,
        });
        if (error) throw error;
        toast.success(COPY.certification.sessionToggledOnToast({ n }));
      }
      await refresh();
    } catch (e) {
      console.error("[Certification - toggleSession]:", e);
      toast.error(COPY.certification.sessionSaveErrorWithDetail(supabaseClientErrorDetail(e)));
    } finally {
      setBusySession(null);
    }
  };

  const saveNotes = async (n: number, notes: string) => {
    if (!canEdit) return;
    const existing = sessionByNumber.get(n);
    if (!existing) return;
    const trimmed = notes.trim();
    if ((existing.notes ?? "") === trimmed) return;
    try {
      const { error } = await supabase
        .from("partner_certification_sessions")
        .update({ notes: trimmed || null })
        .eq("id", existing.id);
      if (error) throw error;
      toast.success(COPY.certification.sessionNotesSaved);
      await refresh();
    } catch (e) {
      console.error("[Certification - saveNotes]:", e);
      toast.error(COPY.certification.sessionSaveErrorWithDetail(supabaseClientErrorDetail(e)));
    }
  };

  const openPreview = () => {
    if (!eligibility?.isEligible || !partner) return;
    const stakeholder =
      stakeholders.find((s) => s.id === selectedStakeholderId) ?? stakeholders[0];
    if (!stakeholder) return;
    const issuedAt = new Date();
    setPreview({
      partnerName: partner.company || partner.name,
      recipientName: stakeholder.name,
      recipientPosition: stakeholder.position,
      issuedAt,
      certId: buildCertificateId({
        partnerId: partner.id,
        stakeholderId: stakeholder.id,
        issuedAt,
      }),
      issuerName: issuerName || COPY.certification.certIssuerFallback,
    });
  };

  if (authLoading || partnerLoading || dataLoading || !user) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!partner) {
    return (
      <p className="text-sm text-muted-foreground">{COPY.partnerWorkspace.notFoundBody}</p>
    );
  }

  if (partner.partner_type !== "expert") {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-surface/40 p-10 text-center">
        <BadgeCheck className="mx-auto h-8 w-8 text-muted-foreground/70" aria-hidden />
        <h2 className="mt-3 text-lg font-semibold">{COPY.certification.notExpertTitle}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {COPY.certification.notExpertBody}
        </p>
        <Link
          to="/partner/$partnerId"
          params={{ partnerId }}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-ring"
        >
          {COPY.certification.notExpertCta}
        </Link>
      </div>
    );
  }

  const sessionsDone = eligibility?.sessionsDone ?? 0;
  const isEligible = eligibility?.isEligible ?? false;

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border/60 bg-card p-6 card-elev">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              {COPY.certification.eyebrow}
            </p>
            <h2 className="mt-1 text-xl font-semibold">{COPY.certification.tabIntroTitle}</h2>
            <p className="mt-2 max-w-2xl text-sm text-foreground/85 leading-relaxed">
              {COPY.certification.tabIntroBody}
            </p>
          </div>
          <ProgressPill done={sessionsDone} total={EXPERT_CERT_TOTAL_SESSIONS} />
        </div>
        {!canEdit && (
          <p className="mt-4 rounded-lg border border-border/70 bg-surface/40 px-3 py-2 text-xs text-muted-foreground">
            {COPY.certification.readOnlyHint}
          </p>
        )}
      </section>

      <section aria-label="Session checklist" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: EXPERT_CERT_TOTAL_SESSIONS }, (_, i) => i + 1).map((n) => (
          <SessionCard
            key={n}
            n={n}
            row={sessionByNumber.get(n) ?? null}
            disabled={!canEdit || busySession !== null}
            busy={busySession === n}
            onToggle={() => void toggleSession(n)}
            onSaveNotes={(notes) => void saveNotes(n, notes)}
          />
        ))}
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-6 card-elev">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              {COPY.certification.cardPreviewCta}
            </p>
            <h2 className="mt-1 text-xl font-semibold">{COPY.certification.issueSectionTitle}</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground leading-relaxed">
              {isEligible
                ? COPY.certification.issueSectionSubtitleReady
                : COPY.certification.issueSectionSubtitleGated}
            </p>
          </div>
          {isEligible ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-mono uppercase tracking-widest"
              style={{
                background: "color-mix(in oklab, var(--primary) 18%, transparent)",
                color: "var(--primary)",
              }}
            >
              <BadgeCheck className="h-3 w-3" aria-hidden />
              {COPY.certification.cardReadyBadge}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-surface px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              <Lock className="h-3 w-3" aria-hidden />
              {COPY.certification.cardInProgressBadge({
                done: sessionsDone,
                total: EXPERT_CERT_TOTAL_SESSIONS,
              })}
            </span>
          )}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="block">
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              {COPY.certification.cardSelectStakeholderLabel}
            </span>
            <select
              className="input mt-1.5"
              value={selectedStakeholderId}
              onChange={(e) => setSelectedStakeholderId(e.target.value)}
              disabled={stakeholders.length === 0 || !canEdit}
            >
              {stakeholders.length === 0 && (
                <option value="">{COPY.certification.cardNoStakeholderHint}</option>
              )}
              {stakeholders.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.position ? ` — ${s.position}` : ""}
                </option>
              ))}
            </select>
          </label>
          <Link
            to="/partner/$partnerId/stakeholders"
            params={{ partnerId }}
            className="inline-flex items-center justify-center rounded-lg border border-border/70 bg-surface px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-2 transition"
          >
            {COPY.certification.cardManageStakeholdersCta}
          </Link>
        </div>

        {!isEligible && (
          <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
            {sessionsDone < EXPERT_CERT_TOTAL_SESSIONS && (
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-warning" aria-hidden />
                {COPY.certification.issueGatedReasonSessions({
                  done: sessionsDone,
                  total: EXPERT_CERT_TOTAL_SESSIONS,
                })}
              </li>
            )}
            {stakeholders.length === 0 && (
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-warning" aria-hidden />
                {COPY.certification.issueGatedReasonStakeholder}
              </li>
            )}
          </ul>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openPreview}
            disabled={!isEligible || !canEdit}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-ring disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Eye className="h-4 w-4" aria-hidden />
            {COPY.certification.cardPreviewCta}
          </button>
        </div>
      </section>

      {preview && (
        <CertificatePreviewDialog state={preview} onClose={() => setPreview(null)} />
      )}
    </div>
  );
}

function ProgressPill({ done, total }: { done: number; total: number }) {
  const pct = Math.round((done / total) * 100);
  const ready = done >= total;
  return (
    <div className="flex flex-col items-end gap-1">
      <span
        className="rounded-md px-2 py-1 text-[10px] font-mono uppercase tracking-widest"
        style={
          ready
            ? {
                background: "color-mix(in oklab, var(--primary) 18%, transparent)",
                color: "var(--primary)",
              }
            : {
                background: "color-mix(in oklab, var(--octa-3) 18%, transparent)",
                color: "var(--octa-3)",
              }
        }
      >
        {COPY.certification.progressLabel({ done, total })}
      </span>
      <div className="h-1.5 w-40 rounded-full bg-surface-2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: ready ? "var(--primary)" : "var(--octa-3)",
          }}
        />
      </div>
    </div>
  );
}

function SessionCard({
  n,
  row,
  disabled,
  busy,
  onToggle,
  onSaveNotes,
}: {
  n: number;
  row: CertificationSessionRow | null;
  disabled: boolean;
  busy: boolean;
  onToggle: () => void;
  onSaveNotes: (notes: string) => void;
}) {
  const [notes, setNotes] = useState<string>(row?.notes ?? "");
  useEffect(() => {
    setNotes(row?.notes ?? "");
  }, [row?.id, row?.notes]);

  const done = !!row;
  return (
    <div
      className={`rounded-2xl border p-5 card-elev transition ${
        done ? "border-primary/40 bg-card" : "border-border/60 bg-card"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="text-[10px] font-mono uppercase tracking-widest"
            style={{ color: done ? "var(--primary)" : "var(--muted-foreground)" }}
          >
            {COPY.certification.sessionLabel({ n })}
          </p>
          {done && row?.completed_at && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              {COPY.certification.sessionDoneOn({
                date: formatCertificateDate(new Date(row.completed_at)),
              })}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          aria-pressed={done}
          aria-label={
            done
              ? `${COPY.certification.sessionUndo} · ${COPY.certification.sessionLabel({ n })}`
              : `${COPY.certification.sessionMarkDone} · ${COPY.certification.sessionLabel({ n })}`
          }
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition disabled:opacity-50 disabled:cursor-not-allowed ${
            done
              ? "border-primary/40 bg-primary text-primary-foreground"
              : "border-border/70 bg-surface text-muted-foreground hover:bg-surface-2"
          }`}
        >
          {busy ? (
            <span
              className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden
            />
          ) : done ? (
            <CheckCircle2 className="h-4 w-4" aria-hidden />
          ) : (
            <Circle className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>

      <label className="mt-4 block">
        <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
          {COPY.certification.sessionNotesLabel}
        </span>
        <textarea
          className="input mt-1.5 min-h-[64px]"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => done && onSaveNotes(notes)}
          placeholder={COPY.certification.sessionNotesPlaceholder}
          disabled={disabled || !done}
          maxLength={500}
        />
      </label>
    </div>
  );
}

function CertificatePreviewDialog({
  state,
  onClose,
}: {
  state: CertificateBodyState;
  onClose: () => void;
}) {
  const certRef = useRef<HTMLDivElement | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const onDownload = async () => {
    if (!certRef.current || downloading) return;
    setDownloading(true);
    try {
      const filename = `alliara-certificate-${slugifyForFile(state.partnerName)}-${slugifyForFile(state.recipientName)}.pdf`;
      await downloadPdfFromNode(certRef.current, filename);
      toast.success(COPY.certification.previewToastSuccess);
    } catch (err) {
      console.error("[Certification - download]:", err);
      toast.error(COPY.certification.previewToastError);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={COPY.certification.cardPreviewCta}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-2xl bg-card border border-border/60 p-4 sm:p-6 card-elev"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">{COPY.certification.cardPreviewCta}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={COPY.certification.previewCloseLabel}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-surface text-muted-foreground hover:bg-surface-2 transition"
          >
            <XIcon className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="mt-4 max-h-[70vh] overflow-auto rounded-xl bg-surface/40 p-4">
          <CertificateBody innerRef={certRef} state={state} />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center rounded-lg border border-border/70 bg-surface px-4 py-2 text-sm hover:bg-surface-2 transition"
          >
            {COPY.certification.previewCloseLabel}
          </button>
          <button
            type="button"
            onClick={onDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-ring disabled:opacity-60"
          >
            <Download className="h-4 w-4" aria-hidden />
            {downloading
              ? COPY.certification.cardDownloadingLabel
              : COPY.certification.cardDownloadPdfCta}
          </button>
        </div>
      </div>
    </div>
  );
}
