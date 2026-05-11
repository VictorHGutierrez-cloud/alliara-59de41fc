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
      className="relative mx-auto aspect-[1.414/1] w-full max-w-3xl overflow-hidden rounded-2xl border border-border/60 bg-white p-10 sm:p-12 text-foreground"
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

      <div className="flex items-center justify-between gap-4">
        <div className="min-h-10 flex min-w-0 flex-1 items-center gap-4">
          <img
            src={factorialLogo}
            alt="Factorial"
            className="max-h-12 w-auto object-contain object-left"
            crossOrigin="anonymous"
          />
          {state.companyLogoDataUrl && (
            <>
              <span className="h-8 w-px bg-border/60" aria-hidden />
              <img
                src={state.companyLogoDataUrl}
                alt={COPY.certification.certPartnerLogoAlt}
                className="max-h-10 w-auto max-w-[min(180px,100%)] object-contain object-left"
                crossOrigin="anonymous"
              />
            </>
          )}
        </div>
        <p className="shrink-0 text-right text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
          {COPY.certification.eyebrow}
        </p>
      </div>

      <div className="mt-8 sm:mt-10">
        <p
          className="text-[11px] font-mono uppercase tracking-[0.24em]"
          style={{ color: "var(--primary)" }}
        >
          {COPY.certification.certIssuedToLabel}
        </p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl font-semibold tracking-tight">
          {state.recipientName}
        </h1>
        {state.recipientPosition && (
          <p className="mt-1 text-sm text-muted-foreground">{state.recipientPosition}</p>
        )}
      </div>

      <div className="mt-6">
        <p className="text-[11px] font-mono uppercase tracking-[0.24em] text-muted-foreground">
          {COPY.certification.certPartnerLabel}
        </p>
        <p className="mt-1 font-display text-xl font-semibold text-foreground">{state.partnerName}</p>
      </div>

      <h2 className="mt-8 font-display text-lg sm:text-xl font-semibold tracking-tight text-foreground">
        {COPY.certification.certTitle}
      </h2>
      <p
        className="mt-2 font-display text-base font-semibold tracking-tight"
        style={{ color: "var(--primary)" }}
      >
        {state.programLabel}
      </p>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-foreground/85">
        {COPY.certification.certBodyLine}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
        <Field label={COPY.certification.certProgramLabel} value={state.programLabel} />
        <Field
          label={COPY.certification.certDateLabel}
          value={formatCertificateDate(state.issuedAt)}
        />
        <Field label={COPY.certification.certIdLabel} value={state.certId} mono />
        <Field label={COPY.certification.certIssuerLabel} value={state.issuerName} />
      </div>

      <p className="mt-6 text-center text-[10px] leading-relaxed text-muted-foreground">
        {COPY.certification.certFooterFactorial}
      </p>
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
    <div>
      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 break-all text-sm font-semibold ${mono ? "font-mono text-[11px]" : ""} text-foreground`}>
        {value}
      </p>
    </div>
  );
}
