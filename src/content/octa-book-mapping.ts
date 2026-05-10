/**
 * Reference: Tubino & Guimarães, «Ecossistema de Parceiros» (Octo methodology).
 *
 * The eight «Prognóstico de maturidade» sections in the book (PDF text extraction via PyMuPDF):
 * 1 Visão e estratégia · 2 Design e modelos · 3 Atração e recrutamento · 4 Capacitação ·
 * 5 Co-GTM · 6 Programa de parceiros · 7 Time de parceiros · 8 Gestão do ecossistema
 *
 * App `axis_key` values are stable for the database. Mapping below ties each key to the closest
 * book chapter; two dimensions share «Capacitação» with different facets (`bookAspectPt` in octa.ts).
 * `offer` also lists book «Atração e recrutamento» as related.
 */
export const OCTO_BOOK_CHAPTERS_PT = [
  "Visão e estratégia",
  "Design e modelos",
  "Atração e recrutamento",
  "Capacitação",
  "Co-GTM",
  "Programa de parceiros",
  "Time de parceiros",
  "Gestão do ecossistema",
] as const;

/** axis_key → book chapter index (1-based), aligned to content */
export const AXIS_KEY_BOOK_CHAPTER: Record<
  "strategy" | "offer" | "recruit" | "enable" | "cosell" | "operate" | "growth" | "success",
  number
> = {
  strategy: 1,
  offer: 2,
  recruit: 4,
  enable: 5,
  cosell: 4,
  operate: 6,
  growth: 7,
  success: 8,
};
