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
    title: "Welcome to Executive Academy",
    summary:
      "Your study companion walks with you through B2B sales — playbooks, situational coach, and tracks you follow between calls.",
    bullets: [
      "Pick Kept or Kepta as your friend — change anytime in Settings.",
      "Every screen helps you study, ask, or track progress.",
      "You can replay this tour any time from Settings.",
    ],
    variant: "bringsCalm",
  },
  {
    id: "library",
    index: 2,
    eyebrow: "Library",
    title: "Curriculum library",
    summary:
      "Open psychology, enterprise and SMB playbooks, demo stories, and battle cards. Search or filter by topic.",
    bullets: [
      "Resources open inside the app or in a new tab.",
      "Use the library before calls and after lost deals.",
      "Each material links to the coach for situational help.",
    ],
    variant: "keepsContext",
    cta: { label: "Browse library", to: "/academy/library" },
  },
  {
    id: "coach",
    index: 3,
    eyebrow: "Coach",
    title: "Situational coach",
    summary:
      "Describe what is happening in a deal. The coach gives next steps grounded in MEDDPICC, champion strategy, and your playbooks.",
    bullets: [
      "Ask about stuck deals, weak champions, and competitive pressure.",
      "Clear, actionable answers — no corporate jargon.",
      "Tap the Kept icon anytime to open the full coach.",
    ],
    variant: "contextBeforeCall",
    cta: { label: "Ask the coach", to: "/academy/ask" },
  },
  {
    id: "tracks",
    index: 4,
    eyebrow: "Tracks",
    title: "Learning tracks",
    summary:
      "Tracks group materials into ordered paths. Mark items complete and see progress per track.",
    bullets: [
      "Start with Buyer psychology foundations if you are new.",
      "Progress saves on this device automatically.",
      "Open any material from a track with one click.",
    ],
    variant: "everythingOnTrack",
    cta: { label: "Open tracks", to: "/academy/learn" },
  },
  {
    id: "ready",
    index: 5,
    eyebrow: "Ready",
    title: "Your next step",
    summary:
      "Open your first track or ask the coach a real question from an open deal.",
    bullets: [
      "The floating Kept icon opens the coach from any screen.",
      "Come back to this tour from Settings whenever you want.",
      "Study a little every week — compounding beats cramming.",
    ],
    variant: "remindsGently",
    cta: { label: "Start track 1", to: "/academy/learn" },
  },
];

export const ONBOARDING_PROGRESS_KEY = "kept-onboarding-progress";
