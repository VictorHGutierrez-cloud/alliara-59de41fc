/** Central product copy groups + legacy shorthand fields used across the app. */

export type BriefingQuietKind = "mine" | "all";

export const COPY = {
  role: {
    short: "PDM",
    full: "Partner Development Manager",
  },

  diagnostic: {
    noun: "Diagnostic",
    cta: "Run Diagnostic",
    rerun: "Re-run Diagnostic",
    hubTitle: "Run diagnostics inside workspaces",
    hubMetaTitle: "Diagnostics — Alliara",
    partnerWorkspaceMetaTitle: "Partner diagnostics — Alliara",
    hubCtaWithPartner: "Open Diagnostic →",
    hubCtaPortfolio: "Create partner workspace",
    hubSecondaryCta: "Open portfolio",
    emptyPartnerOverviewTitle: "Ground the partnership in OCTA signals",
    emptyPartnerOverviewBody:
      "This diagnostic keeps everyone honest about maturity so Joint Business Plans and Copilot nudges feel personal, not scripted.",
    answerAllQuestions: "Answer every OCTA prompt before saving.",
    savedToast: "Diagnostic saved · maturity refreshed",
    readOnlyRuns:
      "You're visiting as a collaborator—only the owning Partner Development Manager can launch diagnostics here.",
    saveCta: "Save Diagnostic",
    progressLabel: (current: number, total: number) => `Prompt ${current} of ${total}`,
  },

  jbp: {
    full: "Joint Business Plan",
    short: "JBP",
    item: "Move",
    itemPlural: "Moves",
    emptyPlanTitle: "Draft the first commits together",
    emptyPlanBody:
      "Log what you owe each other—or open Copilot to translate diagnostics into Moves you can pressure-test live.",
    newMoveTitle: "New move",
    addMoveCta: "+ Log move",
    planPageMetaTitle: "Joint Business Plan — Alliara",
  },

  copilot: {
    label: "Copilot",
    modes: {
      plan: "Plan",
      read: "Read",
    },
    subtitleForPartner:
      "Coaching tethered to diagnostics and partner notes—you stay the human accountable for follow-up.",
    needDiagnosticFirst:
      "Kick off Diagnostic first—we need OCTA grounding before scripting guidance.",
    goToDiagnosticLink: "Open Diagnostic",
    emptyTitleOwner: "Awaiting your first Copilot pass",
    emptyBodyOwner:
      "Generate prompts now, keep what resonates, discard what doesn't—Partners feel the refinement.",
    emptyBodyViewer:
      "The owning Partner Development Manager has not minted Copilot guidance for this ally yet.",
    busyLabel: "Drafting guidance…",
    generateLabel: "Draft guidance",
    regenerateLabel: "Refresh guidance",
    addedToPlanToast: "Captured on Joint Business Plan",
    deliveredToast: "Copilot briefing ready",
    coachPageMetaTitle: "Partner Copilot — Alliara",
    sectionRecommendationsEyebrow: "Recommendations",
    sectionMovesEyebrow: "Ready-to-commit moves",
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

  landing: {
    metaTitle: "Alliara — Weekly clarity for alliance managers",
    metaDescription:
      "Partner Development Managers use Alliara to diagnose alliances, steward Joint Business Plans, and reinforce human follow-through—with OCTO as the lingua franca.",
    heroEyebrow: "Command center rituals for Partner Development Managers",
    heroTitle: "Every partner gets a humane weekly tempo.",
    heroBody:
      "Eight OCTA lenses keep diagnoses crisp, Moves keep commitments legible, and Copilot reinforces what you promised on Zoom.",
    pillDiagnostic: "Eight-axis Diagnostics",
    pillJbp: "Joint Business Plan cadence",
    pillCopilot: "Copilot for follow-through",
    ctaPrimary: "Begin free workspace",
    ctaSecondary: "Sign in",
    trustEyebrow: "Operational truth",
    trustBlurb:
      "Weekly diagnostics, clear Joint Business Plans, revenue reviews—all mapped to Partner Development rhythms instead of slideware fantasy.",
    trustStatAxes: "OCTO axes tracked",
    trustStatCenter: "single cockpit",
    trustStatFocus: "partner-centric",
    productEyebrow: "Product glimpses",
    productTitle: "What your Monday cockpit actually renders",
    productIntro:
      "Live charts plus in-product fidelity—fewer frantic spreadsheets during leadership syncs.",
    showcase: {
      radarTitle: "Radar that earns trust quickly",
      radarBody:
        "Visualize drifting allies, correlate OCTO axes with revenue stories, teleport into the corrective conversation.",
      revenueTitle: "Revenue conversations partners trust",
      revenueBody:
        "Stack-rank Open MMR, snapshot leadership asks, anchor narrative in partner-reported telemetry.",
      mixTitle: "Tier mix informs coaching minutes",
      mixBody:
        "See imbalance between marquee logos and experimenting allies before resources scatter.",
    },
    manifestoEyebrow: "Belief",
    manifestoLeading: "We keep partnering ",
    manifestoTyping: [
      "human-first.",
      "evidence-backed.",
      "weekly-reset.",
      "earnest.",
      "focused on ally outcomes.",
    ],
    portfolioEyebrow: "Portfolio",
    portfolioTitle: "One truthful roster for every steward",
    portfolioIntro:
      "Statuses, tiers, OCTA overlays—signals you skim before hopping between relationship calls.",
    axesEyebrow: "Eight OCTA axes · OCTO",
    axesTitle: "Teach alliances a shared dialect",
    axesIntro:
      "Each axis maps to conversational prompts so diagnostics feel collaborative, not evaluative.",
    jbpEyebrow: "Joint Business Plans",
    jbpDemoTitle: "Moves mirrored to how you steer partners weekly",
    jbpDemoIntro:
      "Flip statuses Planned → Doing → Delivered—or expand checklist depth so recap meetings stay crisp.",
    finalCtaTitle: "Invite your alliances into disciplined warmth",
    finalCtaBody:
      "If you shepherd revenue through partners—diagnose, align, commit, follow up—all without losing the bedside manner.",
    finalCtaPrimary: "Activate workspace",
    finalCtaSecondary: "Sign back in",
    donutCenterPartners: "PARTNERS",
  },

  portfolio: {
    pageMetaTitle: "Portfolio — Alliara",
    loadErrorTitle: "Portfolio unreachable right now",
    retry: "Try again",
    briefingQuietMine:
      "Portfolio noise is low today—reuse the focus to rerun a Diagnostic or revive a stalled Joint Business Plan.",
    briefingQuietAll:
      "Across {scope} everyone looks steady—celebrate briefly, then invest in deepening two marquee allies.",
    weeklyDigestHeading: ({ date }: { date: string }) => `Weekly cockpit · ${date}`,
    kickerAllPartners: "Fleet view",
    kickerPortfolioMine: "Your portfolio",
    reportsCardEyebrow: "Deep analytics migrated",
    reportsCardTitle: "Head to Reports for MRR dashboards + exports",
    reportsCardBody:
      "Snapshots, segmentation, CSV / PNG bundles—purpose-built narratives for CFO or channel chief asks.",
    reportsCardCta: "Explore Reports →",
    qualQueueEyebrow: "Qualification queue",
    qualPendingIppSuffix: "awaiting Ideal Partner Score",
    qualQueueEmptyCopy: "Queue serene—celebrate airtight follow-through.",
    qualReviewCta: "Jump to qualification inbox →",
    churnAlert: ({ n }: { n: number }) =>
      `Check in with ${n} churn-risk ${n === 1 ? "partner" : "partners"}`,
    qualifyLeadsChip: ({ n }: { n: number }) => `Qualify ${n} inbound lead${n === 1 ? "" : "s"} →`,
    overdueNudge: ({ n }: { n: number }) =>
      `${n} Joint Business Plan Move${n === 1 ? "" : "s"} behind schedule →`,
    initiativesTitleIdle: "Outstanding Joint Business Plan moves",
    initiativesTitleFocus: "Laser focus · top three Moves",
    initiativesBodyIdle:
      "Harvested automatically from teammate-owned Moves—prioritizes overdue allies first.",
    initiativesBodyFocus:
      "Close these before onboarding new urgencies—Partners respect boundaries when you honor them publicly.",
    focusModeEnter: "Enter focus mode",
    focusModeExit: "Leave focus mode",
    initiativesEmptyWide:
      "Nothing scheduled here yet—jump into any partner Joint Business Plan to carve three commitments.",
    initiativesEmptyAxis:
      "Filtered axis is quiet today—widening filters reveals other commitments.",
    loadingInitiatives: "Hydrating Moves…",
    weeklyReviewEyebrow: "Monday ritual scaffold",
    weeklyReviewTitle: "Five-minute stewardship script",
    weeklyReviewBody:
      "Surface churn risk, finish three Moves, Slack/email leadership with receipts already formatted.",
    exportSlack: "Copy Slack-friendly recap",
    exportEmail: "Copy email recap",
    rosterEyebrow: "Alliance roster",
    rosterTitle: "Partners you materially support",
    addPartnerCta: "+ Invite partner workspace",
    filterEmptyTitle: "Filters narrowed to zero allies",
    filterEmptyBody:
      "Loosen constraints or onboard a workspace so Diagnostics and Moves stay visible inside one cockpit.",
  },

  partnerWorkspace: {
    pageMetaTitle: "Partner — Alliara",
    notFoundTitle: "Partner workspace missing",
    notFoundBody: "It may live under another teammate or archived territory.",
    backToPortfolioCta: "Return to portfolio cockpit",
    backCrumbLabel: "← Portfolio",
    readOnlyBadge: "Collaborator view",
    editPartnerHint: "Edit ally profile",
    scoreUndiagnosed: "Diagnostic not captured yet",
    maturityRadarHeading: "Maturity radar",
    growthLeversTitle: "Where coaching lands fastest",
    growthLeversBlurb:
      "Axes with the lowest Diagnostics highlight human conversations worth scheduling this sprint.",
    growthLeversLink: "Open Copilot →",
    diagHistoryHeading: "Diagnostic history",
    partnerUpdatedToast: "Partner refreshed",
    partnerDeletedToast: "Partner workspace deleted",
    deletePartnerBody:
      "Deletes diagnostics, Joint Business Plan, and Copilot history for this ally—only do this if the relationship formally ended.",
    deleteDiagConfirmTitle: "Delete this Diagnostic snapshot?",
    deleteDiagConfirmHint: "Historical scores for this audit vanish permanently.",
    tabs: {
      overview: "Overview",
      axes: "Axes",
      stakeholders: "Stakeholders",
      metrics: "Metrics",
      intel: "Intel",
    },
  },

  qualification: {
    pageMetaTitle: "Qualification — Alliara",
    eyebrow: "Lead qualification cockpit",
    title: "Nurture prospects before committing workspace",
    intro:
      "Score Ideal Partner Fit before escalating—Partners trust PDM honesty when introductions stay selective.",
    addLeadCta: "+ Log inbound opportunity",
    loadingFallback: "Loading qualification cockpit…",
  },

  methodology: {
    pageMetaTitle: "Methodology — OCTO — Alliara",
    pageMetaDescription:
      "Eight OCTA axes translated for alliance conversations—objectives, levers, KPIs, and mistakes worth naming.",
    ogTitle: "OCTO field guide · eight OCTA axes",
    ogDescription:
      "Operational depth for OCTA so Diagnostics and Joint Business Plans stay human-readable.",
    eyebrowSuffix: "OCTO playbook",
    pageTitle: "Arm yourself with conversational OCTA depth",
    intro: "Each axis catalogs objectives, pitfalls, drills—grab one takeaway before ally summits.",
    statsRunDiagnosticHint: "Kick off Diagnostics from workspaces you shepherd.",
    statsFullCoverageHint: "Eight-axis coverage unlocked",
    statsPendingAxes: "{n} axes still unanswered",
    centralModelEyebrow: "System thinking",
    centralModelTitle: "Shared scaffolding for alliances",
    ctaFirstPartner: "Bootstrap first partner cockpit",
    ctaFirstDiag: "Kick off Diagnostics",
    axesSectionEyebrow: "Eight axes explorer",
    axesSectionTitle: "Browse mastery paths before facilitation",
    axesSectionHint:
      "Each card dives into drills, KPIs, and mistakes—preload context for partner calls.",
    openAxisCta: "Inspect axis blueprint",
    yourLevel: "Current OCTA footing",
    statOverallLabel: "Portfolio maturity pulse",
    statAxesLabel: "Diagnosed OCTA axes",
    statLessonsLabel: "Micro-lessons logged",
    statXpLabel: "XP banked",
    statXpHint: "Lifetime curiosity fuel",
    loadingTitleFallback: "",
  },

  reports: {
    pageMetaTitle: "Reports — Alliara",
    loadErrorTitle: "Reports stalled loading data",
    retry: "Reload reports",
    eyebrow: "Portfolio intelligence",
    pageTitle: "Evidence partners and execs recognize",
    intro:
      "Filter by stewardship, tiers, eras—CSV or PNG snapshots for finance or alliances leadership pings.",
    customSoonBadge: "+ Custom builder (soon)",
  },

  auth: {
    signIn: "Sign in",
    signOutLabel: "Sign out",
    getStarted: "Start free",
    openWorkspaceCta: "Jump to cockpit",
    signedInHint: "Active session",
    rootMetaTitle: "Alliara — Partner stewardship workspace",
    rootMetaDescription:
      "Eight-axis Diagnostics, Joint Business Plans, Copilot—all tuned by Partner Development Managers for weekly rhythm.",
    ogTitle: "Alliara — Partner Development cockpit · OCTO",
    ogDescription:
      "Alliance diagnostics plus Moves that reinforce human rapport—purpose-built OCTO choreography.",
    logoAltWordmark: "Alliara — stewardship for Partner Development Managers",
    notFoundTitle: "That screen is not routed here",
    notFoundHint: "Double-check bookmarks or glide back home.",
    homeCtaLabel: "Fly home",
    attributionByline: "Crafted thoughtfully by Victor Gutierrez",
  },

  appShell: {
    dockPortfolio: "Portfolio",
    dockQualification: "Qualification",
    dockReports: "Reports",
    dockMethodology: "Methodology",
    dockPulse: "Diagnostics hub",
    dockSettings: "Settings",
    dockSignOut: "Sign out",
    footerCredit: "Alliara · Partner stewardship workspace with OCTO heart",
    teamPulseEyebrow: "People signals",
    teamPulseTitle: "How team load aligns with Diagnostics depth",
    teamPulseSubtitle:
      "Balances portfolio weight with diagnosed maturity coverage—coach leaders before burnout whispers.",
    tablePdmCol: "Partner manager",
    tableLoadCol: "Active allies",
    tableMaturityAvg: "Avg maturity",
    tableDiagnosedCovered: "Diagnostics coverage",
  },

  toast: {
    reassignedPartner: ({ name }: { name: string }) => `Reassigned to ${name}`,
    bulkReassignedPartners: ({ n }: { n: number }) =>
      `${n} partner${n === 1 ? "" : "s"} reassigned`,
    partnersUpdated: ({ count, label }: { count: number; label: string }) =>
      `${count} partner${count === 1 ? "" : "s"} updated → ${label}`,
    partnersDeleted: ({ count }: { count: number }) =>
      `${count} partner${count === 1 ? "" : "s"} removed`,
    diagDeleted: "Diagnostic deleted",
    digestEmail: "Email recap copied",
    digestSlack: "Slack recap copied",
    partnerCreated: ({ name }: { name: string }) => `${name} workspace live`,
    moveAdded: "Move captured",
    partnerProfileSaved: "Partner profile saved",
    partnerWorkspaceRemoved: "Partner workspace removed",
    addedToJbp: "Added to Joint Business Plan",
    moveMarkedDone: ({ title }: { title: string }) => `Marked complete · "${title}"`,
  },

  onboarding: {
    eyebrow: "Momentum primer",
    title: "Empty portfolio—you're one workspace away",
    bodyLead:
      "Each alliance deserves humane cadence—Diagnostics clarify reality, Moves carry accountability, Copilot nudges follow-through.",
    stepAddTitle: "Stand up workspace",
    stepAddBody: "Name ally, friction, aspiration—everything Copilot needs to stay grounded.",
    stepDiagTitleRuns: ({ noun }: { noun: string }) => `Launch ${noun}`,
    stepDiagBody: "Score OCTA transparently—the partner should recognize themselves in results.",
    stepCopilotTitle: ({ copilot }: { copilot: string }) => `Open ${copilot}`,
    stepCopilotBody:
      "Generate suggested Moves, tighten language with ally language, paste into commitments.",
    methodologyCta: "Review OCTO methodology",
  },

  focusCopy: {
    hiddenMoreMoves: ({ n }: { n: number }) =>
      `${n} more Moves hidden • finish surfaced work first`,
    onlyTheseMoves: "Only these Moves remain publicly—celebrate completions loudly.",
    unknownStakeholderLabel: "Unassigned teammate",
  },
} as const;

export function movesLabel(count: number) {
  return `${count} ${count === 1 ? COPY.jbp.item : COPY.jbp.itemPlural}`;
}

export function partnerScoreSubtitle(level: number, runs: number): string {
  return `Level ${level} · ${runs} Diagnostic${runs === 1 ? "" : "s"}`;
}

export function methodologyLessonsBadge(done: number, totalAxisLessons: number): string {
  if (done > 0) {
    return `${done}/${totalAxisLessons} lessons practiced`;
  }
  return `${totalAxisLessons} lessons available`;
}

export function diagnosticHubDescription(): string {
  return `Diagnostics hug a specific partner cockpit so Moves, ${COPY.copilot.label}, and revenue reviews stay tethered to the same narrative.`;
}

export function buildPortfolioBriefingText(input: {
  atRisk: number;
  overdue: number;
  leads: number;
  highPriority: number;
  scope: BriefingQuietKind;
  ownerLabel: string;
}): string {
  const parts: string[] = [];

  if (input.atRisk > 0) {
    parts.push(`${input.atRisk} partner${input.atRisk === 1 ? "" : "s"} trending toward churn`);
  }
  if (input.overdue > 0) {
    parts.push(
      `${input.overdue} overdue commitment${input.overdue === 1 ? "" : "s"} across Joint Business Plans`,
    );
  }
  if (input.highPriority > 0 && input.overdue === 0) {
    parts.push(
      `${input.highPriority} high-priority move${input.highPriority === 1 ? "" : "s"} awaiting closure`,
    );
  }
  if (input.leads > 0) {
    parts.push(
      `${input.leads} inbound lead${input.leads === 1 ? "" : "s"} awaiting Ideal Partner scoring`,
    );
  }

  if (parts.length === 0) {
    return input.scope === "mine"
      ? COPY.portfolio.briefingQuietMine
      : COPY.portfolio.briefingQuietAll.replace("{scope}", input.ownerLabel);
  }

  const last = parts.pop()!;
  const joined = parts.length > 0 ? `${parts.join(", ")}, and ${last}` : last;

  const prefixHead =
    input.scope === "mine" ? "You have " : `Across ${input.ownerLabel}, leaders see `;

  return `${prefixHead}${joined}. Triage what's flashing red-tagged before layering new ambitions.`;
}
