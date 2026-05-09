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

/** Stable-ish certificate id, e.g. `ALLI-20260509-A1B2C3`. Includes a deterministic
 *  hash of partner + stakeholder so re-issuing the same pair on the same day yields
 *  the same id (handy for support conversations) without any DB write. */
export function buildCertificateId(input: {
  partnerId: string;
  stakeholderId: string;
  issuedAt: Date;
}): string {
  const datePart = formatYmd(input.issuedAt);
  const hash = shortHash(`${input.partnerId}:${input.stakeholderId}:${datePart}`);
  return `ALLI-${datePart}-${hash}`;
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

function shortHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0;
  }
  return hash.toString(36).toUpperCase().padStart(6, "0").slice(0, 6);
}
