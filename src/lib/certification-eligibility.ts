/**
 * Certification eligibility — partner-centric, session-based.
 *
 * Each Expert partner has its own checklist of 5 sessions, persisted in
 * `partner_certification_sessions`. A partner is ready to be certified when:
 *   - partner_type === "expert", AND
 *   - all 5 sessions are completed, AND
 *   - at least one stakeholder is mapped (so the certificate has a real recipient).
 *
 * No more dependency on the PDM's OCTA lesson progress — that was misleading.
 */

import type { Database } from "@/integrations/supabase/types";
import type { PartnerRow } from "@/lib/partners-store";

export type StakeholderRow = Database["public"]["Tables"]["partner_stakeholders"]["Row"];
export type CertificationSessionRow =
  Database["public"]["Tables"]["partner_certification_sessions"]["Row"];

/** Total number of sessions in the Expert program. */
export const EXPERT_CERT_TOTAL_SESSIONS = 5;

/** Factorial channel programs shown on the certificate (internal catalogue). */
export const FACTORIAL_CERT_PROGRAMS = [
  { id: "operations", label: "Factorial Operations" },
  { id: "performance", label: "Factorial Performance" },
  { id: "finance", label: "Factorial Finance" },
  { id: "core", label: "Factorial Core" },
] as const;

export type FactorialCertProgramId = (typeof FACTORIAL_CERT_PROGRAMS)[number]["id"];

export type EligibilityReason =
  | "not_expert"
  | "no_stakeholder"
  | "sessions_incomplete";

export interface PartnerEligibility {
  partner: PartnerRow;
  stakeholders: StakeholderRow[];
  isExpert: boolean;
  hasStakeholder: boolean;
  sessionsDone: number;
  sessionsRequired: number;
  doneSessionNumbers: number[];
  isEligible: boolean;
  reasons: EligibilityReason[];
}

export function isExpertPartner(partner: PartnerRow): boolean {
  return partner.partner_type === "expert";
}

export function buildEligibilityFromSessions(
  partner: PartnerRow,
  stakeholders: StakeholderRow[],
  sessions: CertificationSessionRow[],
): PartnerEligibility {
  const isExpert = isExpertPartner(partner);
  const hasStakeholder = stakeholders.length > 0;

  const doneSessionNumbers = Array.from(
    new Set(sessions.map((s) => s.session_number)),
  )
    .filter((n) => n >= 1 && n <= EXPERT_CERT_TOTAL_SESSIONS)
    .sort((a, b) => a - b);
  const sessionsDone = doneSessionNumbers.length;
  const sessionsOk = sessionsDone >= EXPERT_CERT_TOTAL_SESSIONS;

  const reasons: EligibilityReason[] = [];
  if (!isExpert) reasons.push("not_expert");
  if (!hasStakeholder) reasons.push("no_stakeholder");
  if (!sessionsOk) reasons.push("sessions_incomplete");

  return {
    partner,
    stakeholders,
    isExpert,
    hasStakeholder,
    sessionsDone,
    sessionsRequired: EXPERT_CERT_TOTAL_SESSIONS,
    doneSessionNumbers,
    isEligible: reasons.length === 0,
    reasons,
  };
}

/** Random unique certificate id for each issuance, e.g. `FAC-20260509-A1B2…`. */
export function generateRandomCertificateId(issuedAt: Date): string {
  const datePart = formatYmd(issuedAt);
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const randomPart = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return `FAC-${datePart}-${randomPart}`;
}

/** Local calendar date from an `<input type="date">` value (`yyyy-mm-dd`). */
export function parseIssueDateIsoLocal(isoDate: string): Date {
  const parts = isoDate.split("-").map((s) => Number(s));
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function todayIsoDateLocal(): string {
  const x = new Date();
  const y = x.getFullYear();
  const mo = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

export function formatCertificateDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}
