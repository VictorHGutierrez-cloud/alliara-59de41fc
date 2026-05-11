import type { KeptIllustrationVariant } from "@/components/brand/KeptIllustration";

export interface OnboardingStep {
  id: string;
  index: number;
  eyebrow: string;
  title: string;
  summary: string;
  bullets: string[];
  variant: KeptIllustrationVariant;
  cta?: { label: string; to: string };
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    index: 1,
    eyebrow: "Welcome",
    title: "Welcome to Alliara",
    summary:
      "Alliara is the Partner Development Manager's cockpit. Organize partners, qualify leads, measure maturity, plan actions and track results — with Kept, your copilot, always nearby.",
    bullets: [
      "Built for PDMs running a portfolio of partners.",
      "Every screen exists to give you clarity or remove repetitive work.",
      "You can come back to this tour any time.",
    ],
    variant: "bringsCalm",
  },
  {
    id: "kept",
    index: 2,
    eyebrow: "Your copilot",
    title: "Meet Kept",
    summary:
      "Kept is the assistant living in the corner of the screen. Open the chat to ask anything — from 'how is partner X doing?' to co-sell strategy.",
    bullets: [
      "Knows your portfolio: can talk about partners by name.",
      "Use it for questions, ideas, or to sanity-check a decision.",
      "Clear, human answers — no corporate jargon.",
    ],
    variant: "keepsContext",
    cta: { label: "Ask a question now", to: "/kept/ask" },
  },
  {
    id: "portfolio",
    index: 3,
    eyebrow: "Portfolio",
    title: "Your partner portfolio",
    summary:
      "In Partners you register each partner with tier, status, type and stakeholders (PAE and PMM). It's the foundation: assessments, plans and reports all read from here.",
    bullets: [
      "Create a partner with name, company and type (referral, reseller, etc).",
      "Add PAE (Partner Account Executive) and PMM (Partner Marketing Manager).",
      "Email stakeholders directly from the partner page.",
    ],
    variant: "remindsGently",
    cta: { label: "Open Portfolio", to: "/partners" },
  },
  {
    id: "qualification",
    index: 4,
    eyebrow: "Qualification",
    title: "Lead qualification",
    summary:
      "Before becoming a partner, every lead goes through qualification. You score fit, expertise and selling capacity — then decide whether to promote to an active partner.",
    bullets: [
      "Centralize everyone in the new-partner funnel.",
      "Score consistently, the same way for everyone.",
      "Promote to a full partner record with one click.",
    ],
    variant: "keepsContext",
    cta: { label: "Open Qualification", to: "/qualification" },
  },
  {
    id: "diagnostic",
    index: 5,
    eyebrow: "Diagnostic",
    title: "Partner maturity map",
    summary:
      "For each partner, you run a diagnostic across 8 axes (relationship, enablement, marketing, sales, operations, etc). The result shows where to invest your energy.",
    bullets: [
      "Score each axis 1 to 5 based on evidence, not gut feel.",
      "Re-run the diagnostic later to measure progress.",
      "Results feed Coach and Reports.",
    ],
    variant: "noticesDrift",
  },
  {
    id: "plan",
    index: 6,
    eyebrow: "Action plan",
    title: "Tasks and priorities",
    summary:
      "In Plan you create tasks per partner: what to do, priority, due date. It's your partner-success agenda — and what shows up in the portfolio summary.",
    bullets: [
      "Edit any task when context changes.",
      "Use priority and due date to focus the week.",
      "Mark as done when delivered.",
    ],
    variant: "jbpStanding",
  },
  {
    id: "coach",
    index: 7,
    eyebrow: "Coach (AI)",
    title: "AI-powered recommendations",
    summary:
      "Coach reads the partner's diagnostic and generates specific recommendations. You review, keep what makes sense and discard the rest — nothing becomes a task without your OK.",
    bullets: [
      "Use it after every new diagnostic.",
      "Save the good ones as guidance history.",
      "You always have the final call.",
    ],
    variant: "contextBeforeCall",
  },
  {
    id: "intel",
    index: 8,
    eyebrow: "Intel & Metrics",
    title: "Partner signals and numbers",
    summary:
      "Intel stores snapshots and qualitative data. Metrics stores the numbers (revenue, open deals, closed deals, people trained). Together, they show the real pulse of the partner.",
    bullets: [
      "Update metrics when you close a period.",
      "Use Intel to capture what you learned on a call.",
      "This data shows up in Reports.",
    ],
    variant: "notifySomethingToCheck",
  },
  {
    id: "reports",
    index: 9,
    eyebrow: "Reports",
    title: "Portfolio and leadership view",
    summary:
      "Reports brings everything together: average maturity, tier mix, pipeline, revenue, health by PDM. Useful for you and essential for leadership.",
    bullets: [
      "Filter by period, tier, status and type.",
      "Export when you need to share it.",
      "Leadership sees the consolidated view across all PDMs.",
    ],
    variant: "radarLooking",
    cta: { label: "Open Reports", to: "/reports" },
  },
  {
    id: "certification",
    index: 10,
    eyebrow: "Certification",
    title: "Issuing certificates",
    summary:
      "When the partner completes the journey, you generate an official certificate with the Factorial logo (and the partner's logo, if you want). Polished, ready to deliver.",
    bullets: [
      "Factorial logo comes by default.",
      "You can add the partner's logo next to it.",
      "Each certificate has a unique ID.",
    ],
    variant: "bringsCalm",
  },
  {
    id: "ready",
    index: 11,
    eyebrow: "Ready",
    title: "You're ready to go",
    summary:
      "This is the loop: add partner → diagnose → plan → execute → measure → repeat. Kept is here to help at any point.",
    bullets: [
      "Start by creating your first partner (or opening an existing one).",
      "Ask Kept whenever you get stuck.",
      "Come back to this tour any time you want a refresher.",
    ],
    variant: "everythingOnTrack",
    cta: { label: "Go to Portfolio", to: "/partners" },
  },
];

export const ONBOARDING_PROGRESS_KEY = "alliara-onboarding-progress";