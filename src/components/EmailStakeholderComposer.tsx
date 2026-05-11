import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { COPY } from "@/lib/copy";

type StakeholderRow = {
  id: string;
  name: string;
  email: string | null;
};

function buildMailtoUrl(to: string, subject: string, body: string): string {
  const trimmed = to.trim();
  const params = new URLSearchParams();
  if (subject.trim()) params.set("subject", subject.trim());
  if (body.trim()) params.set("body", body.trimEnd());
  const q = params.toString();
  return `mailto:${trimmed}${q ? `?${q}` : ""}`;
}

export function EmailStakeholderComposer({
  partnerId,
  defaultSubject,
  defaultBody,
  onClose,
}: {
  partnerId: string;
  defaultSubject?: string;
  defaultBody?: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [people, setPeople] = useState<StakeholderRow[]>([]);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState(defaultSubject ?? "");
  const [body, setBody] = useState(defaultBody ?? "");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const { data, error } = await supabase
        .from("partner_stakeholders")
        .select("id,name,email")
        .eq("partner_id", partnerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as StakeholderRow[];
      setPeople(rows);
      const firstWithEmail = rows.find((p) => p.email?.trim());
      if (firstWithEmail?.email) setTo(firstWithEmail.email.trim());
    } catch (e) {
      console.error("[EmailStakeholderComposer - load]:", e);
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setSubject(defaultSubject ?? "");
    setBody(defaultBody ?? "");
  }, [defaultSubject, defaultBody, partnerId]);

  const mailtoHref = useMemo(() => {
    if (!to.trim()) return "";
    try {
      return buildMailtoUrl(to, subject, body);
    } catch {
      return "";
    }
  }, [to, subject, body]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-composer-heading"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card-elev max-h-[min(90vh,640px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-border/60 bg-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="email-composer-heading" className="text-xl font-semibold">
          {COPY.emailComposer.title}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">{COPY.emailComposer.subtitleBlurb}</p>

        {loading ? (
          <p className="mt-6 text-sm text-muted-foreground">Loading contacts…</p>
        ) : (
          <>
            {loadFailed && (
              <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-muted-foreground">
                {COPY.emailComposer.loadErrorHint}
              </p>
            )}
            {!loadFailed && people.length > 0 && people.every((p) => !p.email?.trim()) && (
              <p className="mt-3 rounded-lg border border-border/60 bg-surface/50 px-3 py-2 text-xs text-muted-foreground">
                {COPY.emailComposer.emptyStakeholdersHint}
              </p>
            )}
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                  {COPY.emailComposer.toLabel}
                </span>
                <input
                  type="email"
                  className="input mt-1 min-h-11 w-full font-mono text-sm"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder={COPY.emailComposer.toPlaceholder}
                  autoComplete="email"
                  aria-label={COPY.emailComposer.toLabel}
                />
                {people.some((p) => p.email?.trim()) ? (
                  <div
                    className="mt-2 flex flex-wrap gap-2"
                    role="group"
                    aria-label="Choose saved contact"
                  >
                    {people
                      .filter((p) => p.email?.trim())
                      .map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setTo(p.email!.trim())}
                          className="min-h-9 rounded-full border border-border/60 bg-surface px-3 py-1 text-xs hover:bg-surface-2"
                        >
                          {p.name}
                        </button>
                      ))}
                  </div>
                ) : null}
              </label>
              <label className="block">
                <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                  {COPY.emailComposer.subjectLabel}
                </span>
                <input
                  className="input mt-1 min-h-11 w-full"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                  {COPY.emailComposer.bodyLabel}
                </span>
                <textarea
                  className="input mt-1 min-h-[120px] w-full"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </label>
            </div>
          </>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-lg border border-border bg-surface px-4 py-2 text-sm hover:bg-surface-2"
          >
            {COPY.jbp.cancelCta}
          </button>
          <a
            href={mailtoHref || undefined}
            onClick={(e) => {
              if (!mailtoHref) e.preventDefault();
            }}
            className={`inline-flex min-h-11 items-center justify-center rounded-lg px-5 py-2 text-sm font-semibold ${
              mailtoHref
                ? "bg-primary text-primary-foreground glow-ring"
                : "pointer-events-none bg-muted text-muted-foreground opacity-60"
            }`}
          >
            {COPY.emailComposer.openMailClientCta}
          </a>
        </div>
      </div>
    </div>
  );
}
