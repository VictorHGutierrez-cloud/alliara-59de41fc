export type SalesMaterialKind = "html" | "markdown" | "text" | "video";

export type SalesMaterialCategory =
  | "psychology"
  | "playbook"
  | "demo"
  | "competitive"
  | "reference"
  | "product-demo";

export interface SalesMaterial {
  slug: string;
  title: string;
  summary: string;
  category: SalesMaterialCategory;
  kind: SalesMaterialKind;
  /**
   * Relative path under /enablement/ for html/md, or under /videos/ for video
   * (use assetBase to choose prefix).
   */
  assetPath: string;
  durationMin?: number;
  tags: string[];
}

export const SALES_MATERIAL_CATEGORIES: Record<
  SalesMaterialCategory,
  { label: string; description: string }
> = {
  psychology: {
    label: "Purchase psychology",
    description: "How buyers decide in 2026 — risk, fatigue, Dark Funnel.",
  },
  playbook: {
    label: "Playbooks",
    description: "MEDDPICC, SPIN, bundles, and call structure.",
  },
  demo: {
    label: "Demo & story",
    description: "Narrative demos instead of feature tours.",
  },
  competitive: {
    label: "Battle cards",
    description: "Positioning vs alternatives and status quo.",
  },
  reference: {
    label: "Reference",
    description: "Mockups and deep-dive notes.",
  },
  "product-demo": {
    label: "Product demos",
    description: "Short Factorial product videos for seller demos and discovery.",
  },
};

export const SALES_LIBRARY: SalesMaterial[] = [
  {
    slug: "sales-psychology",
    title: "Sales psychology training (2026)",
    summary:
      "Why features lost, how to lead with risk, cognitive empathy, committee mapping, and curated demos.",
    category: "psychology",
    kind: "html",
    assetPath: "sales-psychology.html",
    durationMin: 30,
    tags: ["risk", "dark funnel", "decision fatigue", "champion", "empathy", "trust", "cognitive empathy"],
  },
  {
    slug: "enterprise-playbook",
    title: "Enterprise sales playbook",
    summary:
      "MEDDPICC scoring, SPIN discovery, bundles, champion enablement, and 14-day practice plan.",
    category: "playbook",
    kind: "html",
    assetPath: "factorial-sales-playbook.html",
    durationMin: 30,
    tags: ["meddpicc", "champion", "spin", "enterprise"],
  },
  {
    slug: "smb-playbook",
    title: "SMB sales playbook",
    summary: "Fast qualification, 20-minute demo, land bundles, and objection scripts.",
    category: "playbook",
    kind: "html",
    assetPath: "factorial-smb-playbook.html",
    durationMin: 20,
    tags: ["smb", "qualify", "demo", "close"],
  },
  {
    slug: "people-path",
    title: "The People Path (interactive demo story)",
    summary: "Walk Lena's year — the demo spine. Eight beats, not forty menus.",
    category: "demo",
    kind: "html",
    assetPath: "people-path-story.html",
    durationMin: 15,
    tags: ["demo", "story", "lifecycle"],
  },
  {
    slug: "us-caribbean-battlecards",
    title: "US & Caribbean battle cards",
    summary: "Scripts vs HiBob, Personio, and champion one-liners.",
    category: "competitive",
    kind: "html",
    assetPath: "factorial-us-caribbean-battlecards.html",
    durationMin: 15,
    tags: ["hibob", "personio", "competition", "champion"],
  },
  {
    slug: "sales-psychology-md",
    title: "Sales psychology (markdown source)",
    summary: "Markdown source of the Sales Psychology trainer — optional copy/paste and AI context (HTML trainer is the main track item).",
    category: "psychology",
    kind: "markdown",
    assetPath: "sales-psychology.md",
    durationMin: 30,
    tags: ["reference", "curriculum", "empathy"],
  },
  {
    slug: "hr-mockup",
    title: "HR workspace mockup",
    summary: "Visual reference for product-led conversations.",
    category: "reference",
    kind: "html",
    assetPath: "factorial-hr-mockup.html",
    tags: ["mockup", "product"],
  },
  {
    slug: "video-next-one-activation",
    title: "Factorial NEXT — Activation",
    summary: "Product activation walkthrough — great opener before a story-led demo.",
    category: "product-demo",
    kind: "video",
    assetPath: "next-one-activation.mp4",
    durationMin: 3,
    tags: ["activation", "next", "demo"],
  },
  {
    slug: "video-next-one-ask",
    title: "Factorial NEXT — Ask",
    summary: "AI Ask in product — pair with the Academy coach when buyers ask about AI.",
    category: "product-demo",
    kind: "video",
    assetPath: "next-one-ask.mp4",
    durationMin: 4,
    tags: ["ask", "ai", "next"],
  },
  {
    slug: "video-next-one-analytics",
    title: "Factorial NEXT — Analytics",
    summary: "Analytics moments you can show after discovery on reporting pain.",
    category: "product-demo",
    kind: "video",
    assetPath: "next-one-analytics.mp4",
    durationMin: 3,
    tags: ["analytics", "insights", "next"],
  },
  {
    slug: "video-next-one-surveys",
    title: "Factorial NEXT — Surveys",
    summary: "Surveys & engagement — useful in People Path develop beats.",
    category: "product-demo",
    kind: "video",
    assetPath: "next-one-surveys.mp4",
    durationMin: 3,
    tags: ["surveys", "engagement", "next"],
  },
  {
    slug: "video-next-one-ats",
    title: "Factorial NEXT — ATS / Recruit",
    summary: "Recruitment ATS clip for Attract / career-page conversations.",
    category: "product-demo",
    kind: "video",
    assetPath: "next-one-ats.mp4",
    durationMin: 3,
    tags: ["ats", "recruit", "next"],
  },
  {
    slug: "video-next-one-1-1",
    title: "Factorial NEXT — 1:1 meetings",
    summary: "1:1 meeting flow for performance and manager enablement demos.",
    category: "product-demo",
    kind: "video",
    assetPath: "next-one-1-1-meeting.mp4",
    durationMin: 5,
    tags: ["1:1", "performance", "next"],
  },
  {
    slug: "video-crm-quotes",
    title: "CRM & Quotes",
    summary: "CRM + quotes in one flow — core clip for commercial discovery.",
    category: "product-demo",
    kind: "video",
    assetPath: "crm-quotes.mp4",
    durationMin: 4,
    tags: ["crm", "quotes", "sales"],
  },
  {
    slug: "video-quote-builder",
    title: "Quote builder",
    summary: "Build and send quotes without leaving the conversation.",
    category: "product-demo",
    kind: "video",
    assetPath: "quote-builder.mp4",
    durationMin: 5,
    tags: ["quotes", "commercial", "sales"],
  },
  {
    slug: "video-profitability",
    title: "Profitability",
    summary: "Project profitability view — strong finance-buyer moment.",
    category: "product-demo",
    kind: "video",
    assetPath: "profitability.mp4",
    durationMin: 4,
    tags: ["finance", "profitability", "projects"],
  },
  {
    slug: "video-talent-analytics",
    title: "Talent analytics",
    summary: "Talent analytics for people-leader stakeholders.",
    category: "product-demo",
    kind: "video",
    assetPath: "talent-analytics.mp4",
    durationMin: 4,
    tags: ["talent", "analytics", "hr"],
  },
  {
    slug: "video-project-planning",
    title: "Project planning — real-time capacity",
    summary: "Capacity planning for ops / projects conversations.",
    category: "product-demo",
    kind: "video",
    assetPath: "project-planning-capacity.mp4",
    durationMin: 3,
    tags: ["projects", "capacity", "ops"],
  },
  {
    slug: "video-training-surveys",
    title: "Satisfaction surveys in trainings",
    summary: "Training feedback loop — pair with Learning / People Path.",
    category: "product-demo",
    kind: "video",
    assetPath: "training-surveys.mp4",
    durationMin: 2,
    tags: ["training", "surveys", "learning"],
  },
];

export function getSalesMaterial(slug: string): SalesMaterial | undefined {
  return SALES_LIBRARY.find((m) => m.slug === slug);
}

export function salesMaterialUrl(material: SalesMaterial): string {
  if (material.kind === "video") {
    return `/videos/${material.assetPath}`;
  }
  return `/enablement/${material.assetPath}`;
}

export interface LmsTrack {
  id: string;
  title: string;
  description: string;
  status: "available" | "coming";
  order: number;
  materialSlugs: string[];
}

/** Executive learning tracks — ordered progression through the curriculum. */
export const LMS_TRACKS: LmsTrack[] = (
  [
  {
    id: "psychology-101",
    order: 1,
    title: "B2B buying fundamentals",
    status: "available" as const,
    materialSlugs: ["sales-psychology"],
    description: "Start here if the deal feels stuck or the buyer went dark.",
  },
  {
    id: "meddpicc-captain",
    order: 2,
    title: "MEDDPICC and champion",
    status: "available" as const,
    materialSlugs: ["enterprise-playbook"],
    description: "Qualify deals, score MEDDPICC, and develop an internal champion.",
  },
  {
    id: "demo-mastery",
    order: 3,
    title: "Demo mastery",
    status: "available" as const,
    materialSlugs: [
      "people-path",
      "smb-playbook",
      "video-next-one-activation",
      "video-next-one-ask",
      "video-crm-quotes",
      "video-quote-builder",
    ],
    description: "Story-led demos plus CRM/quotes clips for SMB and enterprise.",
  },
  {
    id: "competitive-field",
    order: 4,
    title: "Competitive field kit",
    status: "available" as const,
    materialSlugs: ["us-caribbean-battlecards"],
    description: "Battle cards and positioning under pressure.",
  },
  {
    id: "product-demos-kit",
    order: 5,
    title: "Product demos kit",
    status: "available" as const,
    materialSlugs: [
      "video-next-one-ats",
      "video-next-one-surveys",
      "video-next-one-analytics",
      "video-next-one-1-1",
      "video-profitability",
      "video-talent-analytics",
      "video-project-planning",
      "video-training-surveys",
    ],
    description: "Curated Factorial product videos for module-specific discovery.",
  },
  {
    id: "captain-agent",
    order: 6,
    title: "Champion finder (AI coach)",
    status: "coming" as const,
    materialSlugs: [],
    description: "AI that scores stakeholders and suggests who is your internal champion.",
  },
] satisfies LmsTrack[]
).sort((a, b) => a.order - b.order);
