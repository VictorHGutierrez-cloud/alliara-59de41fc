export const COPY = {
  role: {
    short: "PDM",
    full: "Partner Development Manager",
  },
  diagnostic: {
    noun: "Diagnostic",
    cta: "Run Diagnostic",
    rerun: "Re-run Diagnostic",
  },
  jbp: {
    full: "Joint Business Plan",
    short: "JBP",
    item: "Move",
    itemPlural: "Moves",
  },
  copilot: {
    label: "Copilot",
    modes: {
      plan: "Plan",
      read: "Read",
    },
  },
  ipp: {
    short: "IPP score",
    full: "Ideal Partner Profile (IPP) score",
  },
  status: {
    active: "Scaling",
    nurturing: "Developing",
    at_risk: "Churn Risk",
    paused: "Paused",
    archived: "Archived",
  },
  tier: {
    strategic: "Strategic",
    core: "Core",
    emerging: "Emerging",
    long_tail: "Long tail",
  },
} as const;

export function movesLabel(count: number) {
  return `${count} ${count === 1 ? COPY.jbp.item : COPY.jbp.itemPlural}`;
}
