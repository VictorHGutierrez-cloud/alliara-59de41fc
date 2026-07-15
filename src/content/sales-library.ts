export type SalesMaterialKind = "html" | "markdown" | "text";

export type SalesMaterialCategory =
  | "psychology"
  | "playbook"
  | "demo"
  | "competitive"
  | "reference";

export interface SalesMaterial {
  slug: string;
  title: string;
  summary: string;
  category: SalesMaterialCategory;
  kind: SalesMaterialKind;
  /** Path under /enablement/ */
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
};

export const SALES_LIBRARY: SalesMaterial[] = [
  {
    slug: "sales-psychology",
    title: "Sales psychology training (2026)",
    summary:
      "Why features lost, how to lead with risk, committee mapping, and curated demos.",
    category: "psychology",
    kind: "html",
    assetPath: "sales-psychology.html",
    durationMin: 25,
    tags: ["risk", "dark funnel", "decision fatigue", "champion"],
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
    summary: "Same curriculum as the HTML trainer — handy for copy/paste and AI context.",
    category: "psychology",
    kind: "markdown",
    assetPath: "sales-psychology.md",
    durationMin: 25,
    tags: ["reference", "curriculum"],
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
];

export function getSalesMaterial(slug: string): SalesMaterial | undefined {
  return SALES_LIBRARY.find((m) => m.slug === slug);
}

export function salesMaterialUrl(material: SalesMaterial): string {
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
export const LMS_TRACKS: LmsTrack[] = [
  {
    id: "psychology-101",
    order: 1,
    title: "B2B buying fundamentals",
    status: "available",
    materialSlugs: ["sales-psychology", "sales-psychology-md"],
    description: "Start here if the deal feels stuck or the buyer went dark.",
  },
  {
    id: "meddpicc-captain",
    order: 2,
    title: "MEDDPICC and champion",
    status: "available",
    materialSlugs: ["enterprise-playbook"],
    description: "Qualify deals, score MEDDPICC, and develop an internal champion.",
  },
  {
    id: "demo-mastery",
    order: 3,
    title: "Demo mastery",
    status: "available",
    materialSlugs: ["people-path", "smb-playbook"],
    description: "Story-led demos for SMB and enterprise.",
  },
  {
    id: "competitive-field",
    order: 4,
    title: "Competitive field kit",
    status: "available",
    materialSlugs: ["us-caribbean-battlecards"],
    description: "Battle cards and positioning under pressure.",
  },
  {
    id: "captain-agent",
    order: 5,
    title: "Champion finder (AI coach)",
    status: "coming",
    materialSlugs: [],
    description: "AI that scores stakeholders and suggests who is your internal champion.",
  },
].sort((a, b) => a.order - b.order);
