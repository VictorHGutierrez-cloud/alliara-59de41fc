import type { RefObject } from "react";
import { COPY } from "@/lib/copy";
import { formatCertificateDate } from "@/lib/certification-eligibility";
import factorialLogo from "@/assets/factorial-logo.png";

export interface CertificateBodyState {
  partnerName: string;
  recipientName: string;
  recipientPosition: string | null;
  issuedAt: Date;
  certId: string;
  issuerName: string;
  programLabel: string;
  /** Data URL from uploaded partner company logo (PNG/JPEG/WebP). */
  companyLogoDataUrl: string | null;
}

export function CertificateBody({
  innerRef,
  state,
}: {
  innerRef: RefObject<HTMLDivElement | null>;
  state: CertificateBodyState;
}) {
  return (
    <div
      ref={innerRef}
      className="relative mx-auto flex aspect-[1.414/1] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border/60 bg-white px-8 py-8 text-foreground sm:px-9 sm:pb-9 sm:pt-8"
      style={{
        backgroundImage:
          "linear-gradient(135deg, color-mix(in oklab, var(--primary) 6%, white) 0%, white 45%, color-mix(in oklab, var(--octa-3) 5%, white) 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--primary)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full opacity-25 blur-3xl"
        style={{ background: "var(--octa-3)" }}
        aria-hidden
      />

      {/* z-index keeps copy above blobs; tight vertical rhythm fits A4-landscape without clipping */}
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between gap-3">
          <div className="flex min-h-9 min-w-0 flex-1 items-center gap-3">
            <img
              src={factorialLogo}
              alt="Factorial"
              className="max-h-10 w-auto shrink-0 object-contain object-left sm:max-h-11"
              crossOrigin="anonymous"
            />
            {state.companyLogoDataUrl ? (
              <>
                <span className="h-7 w-px shrink-0 bg-border/60" aria-hidden />
                <img
                  src={state.companyLogoDataUrl}
                  alt={COPY.certification.certPartnerLogoAlt}
                  className="max-h-9 w-auto max-w-[min(168px,100%)] object-contain object-left sm:max-h-10"
                  crossOrigin="anonymous"
                />
              </>
            ) : null}
          </div>
          <p className="max-w-[11rem] shrink-0 text-right text-[10px] font-mono uppercase leading-snug tracking-[0.18em] text-muted-foreground">
            {COPY.certification.eyebrow}
          </p>
        </div>

        <div className="mt-5 flex min-h-0 flex-1 flex-col gap-4 sm:gap-[1.125rem]">
          <section>
            <p
              className="text-[11px] font-mono uppercase tracking-[0.24em]"
              style={{ color: "var(--primary)" }}
            >
              {COPY.certification.certIssuedToLabel}
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-[2.125rem]">
              {state.recipientName}
            </h1>
            {state.recipientPosition ? (
              <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
                {state.recipientPosition}
              </p>
            ) : null}
          </section>

          <section>
            <p className="text-[11px] font-mono uppercase tracking-[0.24em] text-muted-foreground">
              {COPY.certification.certPartnerLabel}
            </p>
            <p className="mt-1 font-display text-lg font-semibold leading-snug text-foreground sm:text-xl">
              {state.partnerName}
            </p>
          </section>

          <section className="min-w-0">
            <h2 className="font-display text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {COPY.certification.certTitle}
            </h2>
            <p
              className="mt-1 font-display text-sm font-semibold tracking-tight sm:text-base"
              style={{ color: "var(--primary)" }}
            >
              {state.programLabel}
            </p>
            <p className="mt-2 max-w-xl text-sm leading-snug text-foreground/85">
              {COPY.certification.certBodyLine}
            </p>
          </section>

          <div className="grid grid-cols-1 gap-x-3 gap-y-2.5 border-t border-border/40 pt-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
            <Field label={COPY.certification.certProgramLabel} value={state.programLabel} />
            <Field
              label={COPY.certification.certDateLabel}
              value={formatCertificateDate(state.issuedAt)}
            />
            <Field label={COPY.certification.certIdLabel} value={state.certId} mono />
            <Field label={COPY.certification.certIssuerLabel} value={state.issuerName} />
          </div>

          <p className="pb-1 text-center text-[10px] leading-snug text-muted-foreground">
            {COPY.certification.certFooterFactorial}
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 break-words font-semibold leading-snug ${mono ? "font-mono text-[10px] sm:text-[11px]" : "text-sm"} text-foreground`}
      >
        {value}
      </p>
    </div>
  );
}
