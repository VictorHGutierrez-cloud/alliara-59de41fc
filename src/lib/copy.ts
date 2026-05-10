/** Central product copy groups + legacy shorthand fields used across the app. */

export type BriefingQuietKind = "mine" | "all";

export const COPY = {
  role: {
    short: "PDM",
    full: "Partner Development Manager",
  },

  diagnostic: {
    noun: "Diagnostic",
    cta: "Run diagnostic",
    rerun: "Run diagnostic again",
    updateCta: "Update diagnostic",
    hubTitle: "Run diagnostics from each workspace",
    hubMetaTitle: "Diagnostics · Alliara",
    partnerWorkspaceMetaTitle: "Partner diagnostics · Alliara",
    hubCtaWithPartner: "Open diagnostic →",
    hubCtaPortfolio: "Create partner workspace",
    hubSecondaryCta: "Open portfolio",
    emptyPartnerOverviewTitle: "Start from a clear read on this partnership",
    emptyPartnerOverviewBody:
      "A quick diagnostic snapshot helps everyone see the same channel-maturity story for this relationship. Joint plans and Kept suggestions stay grounded, not generic.",
    answerAllQuestions: "Answer each prompt so the save reflects the full picture.",
    savedToast: "Diagnostic saved. Scores updated.",
    readOnlyRuns:
      "You're in as a collaborator. Only the lead Partner Development Manager can start diagnostics in this workspace.",
    saveCta: "Save diagnostic",
    progressLabel: (current: number, total: number) => `Prompt ${current} of ${total}`,
  },

  jbp: {
    full: "Partner tasks",
    short: "Tasks",
    item: "Task",
    itemPlural: "Tasks",
    emptyPlanTitle: "Sketch your first tasks together",
    emptyPlanBody:
      "Note what each side owes, or open Kept to turn diagnostics into tasks you can talk through on the next call.",
    newMoveTitle: "New task",
    addMoveCta: "+ Add a task",
    planPageMetaTitle: "Tasks · Alliara",
  },

  kept: {
    label: "Kept",
    modes: {
      plan: "Plan",
      read: "Read",
    },
    subtitleForPartner:
      "Kept reads your diagnostics and notes, drafts suggestions quickly, and leaves the final call on what ships with you.",
    needDiagnosticFirst:
      "Run a diagnostic first so suggestions match what you logged for this partnership.",
    ribbonBlurb:
      "Same context as diagnostics and plans. Tap when you want the two minute intro.",
    ambientTitle: "Meet Kept · intro tour",
    goToDiagnosticLink: "Open diagnostic",
    emptyTitleOwner: "Your first Kept draft lands here",
    emptyBodyOwner:
      "Generate suggestions, keep what sounds like your partner, drop the rest. Small edits build real trust.",
    emptyBodyViewer:
      "The lead Partner Development Manager has not generated Kept guidance for this partner yet.",
    busyLabel: "Drafting suggestions…",
    generateLabel: "Draft guidance",
    regenerateLabel: "Refresh guidance",
    addedToPlanToast: "Added to tasks",
    hubMetaTitle: "Kept · Alliara",
    hubTitle: "Kept",
    hubIntro: "Choose a partner to open AI guidance built from the latest diagnostic.",
    hubSearchPlaceholder: "Search by partner or company",
    hubEmpty: "No partners match your search.",
    hubOpenCoachCta: "Open Kept",
    hubBackToPortfolio: "Back to portfolio",
    deliveredToast: "Kept briefing is ready",
    coachPageMetaTitle: "Kept · Alliara",
    sectionRecommendationsEyebrow: "Recommendations",
    sectionMovesEyebrow: "Tasks worth committing",
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
    metaTitle: "Alliara: Partner workspace for PDMs who live in weekly reviews",
    metaDescription:
      "One workspace for reviews, joint plans, and follow ups. The next partner call picks up from what you already wrote, not whoever remembers best.",
    heroEyebrow: "For Partner Development Managers",
    heroTitle: "Partner drift is rarely loud. It is usually quiet.",
    heroBody:
      "Health, joint plans, and commitments in one workspace. Pick up last week’s thread without rebuilding it from decks and Slack.",
    pillDiagnostic: "Reviews with a spine",
    pillJbp: "Joint plans you reopen",
    pillKept: "Nudges tied to what you promised",
    ctaPrimary: "Create free workspace",
    ctaSecondary: "Sign in",
    heroEmailPlaceholder: "Work email",
    heroEmailHelper: "Next step is signup. Add your name and a password there.",
    /** Text-only logo row: fictional names; no third-party marks. */
    heroSocialProofEyebrow: "Placeholder partners from the product tour",
    heroSocialProofNames: ["Northwind", "Helix", "Bluepeak", "Orbit"] as const,
    heroCarousel: [
      {
        title: "Partner radar",
        subtitle: "Who’s sliding before the QBR deck says so",
        visual: "radar" as const,
        imgAlt: "Alliara channel maturity radar and eight-dimension overview",
      },
      {
        title: "Revenue snapshot",
        subtitle: "Partner sourced MRR you can defend in five minutes",
        visual: "revenue" as const,
        imgAlt: "Demo bar chart of partner sourced MRR by partner",
      },
      {
        title: "Tier mix",
        subtitle: "Where the calendar quietly stole coaching time",
        visual: "mix" as const,
        imgAlt: "Demo donut chart of partner tier mix",
      },
      {
        title: "Joint business rhythm",
        subtitle: "Statuses and owners that survive the recap call",
        visual: "skeleton" as const,
        imgAlt: "Placeholder preview for joint business plan rhythm",
      },
    ] as const,
    trustEyebrow: "Between partner calls",
    trustBlurb:
      "Readable joint plans, light weekly checkpoints, and revenue context when finance pings you mid week.",
    trustStats: [
      { value: "8", label: "axes tracked" },
      { value: "1", label: "one workspace" },
      { value: "100%", label: "built around allies" },
    ] as const,
    productEyebrow: "Inside the workspace",
    productTitle: "Monday without explaining the portfolio again",
    productIntro:
      "Charts stay tied to what partners told you. Leadership syncs need fewer emergency spreadsheets.",
    showcase: {
      radarTitle: "A radar partners recognize",
      radarBody:
        "Catch softness early, thread dimension signals into pipeline stories, and walk into the next touchpoint with the same facts your counterpart has.",
      revenueTitle: "Numbers you don’t have to rebuild overnight",
      revenueBody:
        "Sort open MRR, draft short asks for execs, and keep the story anchored to what partners reported, not what you wish had happened.",
      mixTitle: "Tier mix that tells you where time went",
      mixBody:
        "Notice when a few logos eat the calendar while newer partners stall waiting for answers.",
    },
    manifestoEyebrow: "What we believe",
    manifestoLeading: "We keep partnering ",
    manifestoTyping: [
      "human first.",
      "grounded in evidence.",
      "steady week to week.",
      "honest.",
      "focused on ally outcomes.",
    ],
    portfolioEyebrow: "Portfolio",
    portfolioTitle: "One roster you skim before you dial",
    portfolioIntro:
      "Statuses, tiers, and dimension notes land in one place. The first five minutes of a call are not archaeology.",
    axesEyebrow: "Eight axes",
    axesTitle: "A shared language for alliances",
    axesIntro:
      "Each dimension is a prompt, not a verdict. Good diagnostics sound like planning together, not handing out grades.",
    jbpEyebrow: "Joint Business Plans",
    jbpDemoTitle: "Moves that match how you steer the week",
    jbpDemoIntro:
      "Slide statuses from Planned to In Motion to Delivered, or keep checklists tight so recap calls do not turn into status theater.",
    finalCtaTitle: "Give the weekly cadence a place to live",
    finalCtaBody:
      "You already align, commit, and follow up with partners. Alliara keeps that work visible without turning alliances into paperwork theater.",
    finalCtaPrimary: "Create workspace",
    finalCtaSecondary: "Sign in",
    donutCenterPartners: "PARTNERS",
  },

  introTour: {
    metaTitle: "Meet Kept · Intro to Alliara",
    metaDescription:
      "Eight quick screens on partner rhythm, diagnostics on every dimension, joint plans, and how Kept keeps context.",
    heroCta: "How Kept works",
    emptyPortfolioHint: "New to Alliara? Take the two minute intro tour with Kept.",
    emptyPortfolioCta: "Start intro tour",
    skip: "Skip intro",
    next: "Next",
    back: "Back",
    finishSignedIn: "Open portfolio",
    finishSignedOut: "Create free workspace",
    finishHome: "Back to home",
    checkingSession: "One moment…",
    progress: ({ step, total }: { step: number; total: number }) => `Step ${step} of ${total}`,
    slides: [
      {
        variant: "bringsCalm",
        title: "Meet Kept",
        body:
          "Kept is not a mascot or a bossy bot. It is a steady presence that watches partner momentum and protects the story you already wrote down.",
      },
      {
        variant: "remindsGently",
        title: "Curiosity without noise",
        body:
          "Kept surfaces gentle prompts from diagnostics and plans so you remember what mattered on last week’s call, without blowing up your inbox.",
      },
      {
        variant: "keepsContext",
        title: "Plans that survive the recap",
        body:
          "Joint Business Plans stay readable: statuses, owners, and commitments stay tied to dimension scores so decks stop rewriting themselves every Monday.",
      },
      {
        variant: "noticesDrift",
        title: "Spot drift early",
        body:
          "Eight axes give you a shared language with partners. Diagnostics highlight where coaching time pays off before pipeline stories go sideways.",
      },
      {
        variant: "notifySomethingToCheck",
        title: "Small nudges, big leverage",
        body:
          "When something needs a glance, Kept flags it in context: fewer surprises in leadership syncs and fewer “I thought they were fine” moments.",
      },
      {
        variant: "atRisk",
        title: "Honest when momentum slips",
        body:
          "Churn risk and stalled moves rise to the top without shame. You decide what to do next; Kept keeps the facts visible for the conversation.",
      },
      {
        variant: "contextBeforeCall",
        title: "Walk in prepared",
        body:
          "Intel and summaries stay beside the partner record so you reopen the thread with receipts, not improvisation, when finance or execs lean in.",
      },
      {
        variant: "everythingOnTrack",
        title: "Ready when you are",
        body:
          "When portfolios calm down, Kept rests too. Create a workspace, run a diagnostic, and let the weekly rhythm compound.",
      },
    ] as const,
  },

  portfolio: {
    pageMetaTitle: "Portfolio · Alliara",
    loadErrorTitle: "We couldn't load your portfolio just now",
    retry: "Try again",
    briefingQuietMine:
      "Looks calm today. Nice moment to rerun a diagnostic or revive a quiet task list.",
    briefingQuietAll:
      "Across {scope} things look steady. Take a breath, then maybe deepen two key allies.",
    kickerPortfolioMine: "Your portfolio",
    stickyHeroTitle: "Your Partner Portfolio",
    stickyHeroSubtitle:
      "Start with the partners who need your attention most today.",
    startWeeklyReviewCta: "Start weekly review",
    stickyAddPartnerCta: "Add partner",
    reportsCardEyebrow: "Reporting lives here",
    reportsCardTitle: "Open Reports for MRR views and exports",
    reportsCardBody:
      "Snapshots, segments, CSV or PNG bundles, ready when finance or leadership asks for receipts.",
    reportsCardCta: "Explore Reports →",
    qualQueueEyebrow: "Qualification queue",
    qualPendingIppSuffix: "awaiting Ideal Partner Score",
    qualQueueEmptyCopy: "Queue is clear. Nice work keeping follow through tight.",
    qualReviewCta: "Jump to qualification inbox →",
    churnAlert: ({ n }: { n: number }) =>
      `Check in with ${n} churn risk ${n === 1 ? "partner" : "partners"}`,
    qualifyLeadsChip: ({ n }: { n: number }) => `Qualify ${n} inbound lead${n === 1 ? "" : "s"} →`,
    overdueNudge: ({ n }: { n: number }) =>
      `${n} task${n === 1 ? "" : "s"} behind schedule →`,
    openTasksEyebrow: "Open tasks",
    openTasksEmpty: "No open tasks in this roster view.",
    openTasksShowingCap: ({ n }: { n: number }) => `Showing first ${n} tasks. Open a partner for the full list.`,
    initiativesEyebrow: "Partner tasks",
    initiativesTitleIdle: "Open partner tasks",
    initiativesTitleFocus: "Focus mode, top three tasks",
    initiativesBodyIdle:
      "Pulled from what teammates own. Overdue partners float up first.",
    initiativesBodyFocus:
      "Finish these before new fires land. Partners notice when you protect what you already promised.",
    focusModeEnter: "Enter focus mode",
    focusModeExit: "Leave focus mode",
    initiativesEmptyWide:
      "Nothing here yet. Open any partner workspace and add a few clear tasks.",
    initiativesEmptyAxis:
      "This filter is quiet today. Broaden filters to see other commitments.",
    loadingInitiatives: "Loading your tasks…",
    rosterTitle: "Partners you support day to day",
    addPartnerCta: "+ Invite partner workspace",
    filterEmptyTitle: "No partners match these filters",
    filterEmptyBody:
      "Widen filters or add a workspace so diagnostics and moves stay easy to find.",
    rowOpenCue: "Open",
    rowOpenAria: ({ name }: { name: string }) => `Open ${name} workspace`,
    statusFilterLegend: "Filter by health",
    statusFilterAll: "All",
    statusFilterScaling: "Scaling",
    statusFilterDeveloping: "Developing",
    statusFilterAtRisk: "At risk",
    bulkSelectionActiveHint:
      "Filters stay locked while you have partners selected to keep the bulk action safe.",
    paginationLabel: "Roster pagination",
    paginationRange: ({ start, end, total }: { start: number; end: number; total: number }) =>
      `Showing ${start} to ${end} of ${total}`,
    paginationPrev: "Previous page",
    paginationNext: "Next page",
    paginationRowsLabel: "Rows per page",
  },

  partnerWorkspace: {
    pageMetaTitle: "Partner · Alliara",
    notFoundTitle: "We can't find this partner workspace",
    notFoundBody: "It might belong to another teammate or be archived.",
    backToPortfolioCta: "Back to portfolio",
    backCrumbLabel: "← Portfolio",
    readOnlyBadge: "Collaborator view",
    editPartnerHint: "Edit partner profile",
    scoreUndiagnosed: "No diagnostic yet",
    maturityRadarHeading: "Channel maturity radar",
    growthLeversTitle: "Where coaching lands fastest",
    growthLeversBlurb:
      "Lower scores on a dimension often mean a conversation worth scheduling soon. Lead with empathy, not a lecture.",
    growthLeversLink: "Open Kept →",
    diagHistoryHeading: "Diagnostic history",
    partnerUpdatedToast: "Partner updated",
    partnerDeletedToast: "Partner workspace removed",
    deletePartnerBody:
      "This removes diagnostics, tasks, and Kept history for this partner. Only use it when the relationship has truly ended.",
    deleteDiagConfirmTitle: "Delete this diagnostic snapshot?",
    deleteDiagConfirmHint: "Older scores from this run will be gone for good.",
    ownerLabel: "Owner",
    ownerUnassigned: "Unassigned",
    ownerLoading: "Loading owner…",
    changeOwnerCta: "Change",
    changeOwnerHint: "Reassign this partner to another Partner Development Manager.",
    changeOwnerDialogTitle: "Reassign partner ownership",
    changeOwnerSameTargetError: "Pick a different teammate to reassign to.",
    tabs: {
      overview: "Overview",
      axes: "Axes",
      stakeholders: "Stakeholders",
      metrics: "Numbers",
      intel: "Files and insights",
      certification: "Factorial certs",
    },
    metricsPageTitle: "Your numbers",
    metricsPageSubtitle: "You log each period yourself: MRR, pipeline, and training snapshots.",
    metricsPageMetaTitle: "Numbers · Alliara",
    intelPageIntro:
      "Upload files or short notes. The AI readout can also use the numbers you already saved on the Numbers tab.",
    intelPageMetaTitle: "Files and insights · Alliara",
  },

  qualification: {
    pageMetaTitle: "Qualification · Alliara",
    eyebrow: "Lead qualification",
    title: "Work the opportunity before it becomes a full workspace",
    intro:
      "Add a simple fit score before you open a full partner record. That keeps first steps thoughtful and trustworthy. When someone graduates here, Kept keeps the same steady rhythm in their workspace.",
    addLeadCta: "Add Partner Opportunity",
    loadingFallback: "Loading…",
  },

  methodology: {
    pageMetaTitle: "Methodology · Channel dimensions · Alliara",
    pageMetaDescription:
      "Guides for all eight dimensions of channel maturity: what good looks like, what to watch for, and small drills before your next collaborator call.",
    ogTitle: "Channel dimension guides",
    ogDescription:
      "Readable guides so diagnostics and plans stay clear and kind.",
    eyebrowSuffix: "Channel dimensions",
    pageTitle: "Guides for each maturity dimension",
    intro:
      "Each dimension explains what matters in your indirect motion with this relationship, where deals wobble, and a small drill you can try. Read one before a call so you stay clear and human.",
    statsRunDiagnosticHint: "Run a diagnostic when you're ready; we'll map levels together.",
    statsFullCoverageHint: "You have surfaced every dimension. Nice coverage.",
    statsPendingAxes: "{n} dimensions still waiting for a first pass",
    centralModelEyebrow: "Big picture",
    centralModelTitle: "One shared frame for channel and partner-ecosystem maturity",
    bookChapterLine: (args: { titlePt: string; n: string; aspect?: string }) =>
      args.aspect
        ? `Book · Cap. ${args.n}: ${args.titlePt} — ${args.aspect}`
        : `Book · Cap. ${args.n}: ${args.titlePt}`,
    ctaFirstPartner: "Create your first partner workspace",
    ctaFirstDiag: "Run your first diagnostic",
    axesSectionEyebrow: "Eight dimensions",
    axesSectionTitle: "Choose a dimension to explore",
    axesSectionHint:
      "Badges are 1–8 (product order). Each card links to the closest «Prognóstico de maturidade» chapter in Ecossistema de Parceiros where wording differs.",
    openAxisCta: "Open the guide",
    axisLetterEyebrow: (letter: string) => `Dimension ${letter}`,
    axisCardAriaLabel: (axisName: string) => `Open the ${axisName} guide`,
    yourLevel: "Where you show up on this dimension",
    statOverallLabel: "Portfolio channel maturity",
    statAxesLabel: "Dimensions you've diagnosed",
    statLessonsLabel: "Micro lessons you have tried",
    statXpLabel: "XP you've collected",
    statXpHint: "A small high five for curiosity",
    loadingTitleFallback: "",
  },

  methodologyAxis: {
    backLink: "Back to methodology overview",
    axisEyebrow: "Dimension",
    statYourLevel: "Your level",
    statLessons: "Lessons",
    statProgress: "Progress",
    tabOverview: "Overview",
    tabLevels: "Levels",
    tabLessons: "Lessons",
    toastLessonDone: "+25 XP · Lesson complete",
    overviewSectionTitle: "The idea in plain language",
    sectionObjectives: "What good looks like",
    sectionLevers: "Moves that actually help",
    sectionMetrics: "Numbers worth watching",
    commonMistakesTitle: "Common slips (we've all been there)",
    examplesTitle: "Examples from real alliances",
    levelsSignals: "Signals",
    levelsMoveNext: "What helps you level up",
    badgeYouAreHere: "You're here",
    lessonExerciseLabel: "Try this",
    lessonCompleted: "Done",
    markCompleteCta: "Mark complete · +25 XP",
    notFoundTitle: "We can't find that dimension.",
    notFoundDashboardLink: "Back to dashboard",
    loading: "Loading…",
    lessonMetaLine: ({ minutes, done }: { minutes: number; done: boolean }) =>
      `${minutes} min · +25 XP${done ? " · Done" : ""}`,
    expandLessonAria: (title: string, expanded: boolean) =>
      `${expanded ? "Collapse" : "Expand"} lesson: ${title}`,
    levelsHiddenHeading: "How maturity steps show up on this dimension",
    lessonsHiddenHeading: "Micro lessons you can try",
    statsGroupAriaLabel: "Snapshot for this dimension",
  },

  reports: {
    pageMetaTitle: "Reports · Alliara",
    loadErrorTitle: "Reports paused while loading",
    retry: "Reload reports",
    eyebrow: "Portfolio reports",
    pageTitle: "Numbers your team can share",
    intro:
      "Filter by how you manage accounts, tier, or date. Export a CSV or image when finance or leadership asks.",
    customSoonBadge: "+ Custom builder (soon)",
  },

  auth: {
    signIn: "Sign in",
    signOutLabel: "Sign out",
    getStarted: "Start free",
    openWorkspaceCta: "Go to workspace",
    signedInHint: "Signed in",
    headerKeptCta: "Kept",
    rootMetaTitle: "Alliara · Partner workspace with heart",
    rootMetaDescription:
      "Eight dimensions of channel maturity, joint business plans, and Kept—built for Partner Development Managers and steady collaborator rhythm.",
    ogTitle: "Alliara · Partner cockpit",
    ogDescription:
      "Alliance diagnostics and moves that keep rapport at the center: steady rhythm without the cold corporate vibe.",
    logoAltWordmark: "Alliara · partner work kept in focus",
    notFoundTitle: "This page isn't here",
    notFoundHint:
      "The link may be old, or the address has a typo. Head home and we'll get you oriented.",
    homeCtaLabel: "Back to home",
    attributionByline: "Crafted with care by Victor Gutierrez",
  },

  appShell: {
    goToPortfolio: "Go to portfolio",
    dockPortfolio: "Portfolio",
    dockQualification: "Qualify",
    dockReports: "Reports",
    dockMethodology: "Guides",
    dockCertification: "Certs",
    dockPulse: "Diagnostics",
    dockSettings: "Settings",
    dockSignOut: "Sign out",
    dockApprovals: "Approvals",
    footerCredit: "Alliara · Partner workspace with diagnostics, axes, and Kept in rhythm",
    teamPulseEyebrow: "Team signals",
    teamPulseTitle: "Who has how many partners, and how many already have a diagnostic",
    teamPulseSubtitle:
      "Each person's row shows their partner count and how many of those partners already have a diagnostic. Use it to notice overload before people get swamped.",
    tablePdmCol: "Partner manager",
    tableLoadCol: "Active allies",
    tableMaturityAvg: "Avg maturity",
    tableDiagnosedCovered: "Partners diagnosed",
  },

  toast: {
    reassignedPartner: ({ name }: { name: string }) => `Now assigned to ${name}`,
    bulkReassignedPartners: ({ n }: { n: number }) =>
      `${n} partner${n === 1 ? "" : "s"} reassigned`,
    partnersUpdated: ({ count, label }: { count: number; label: string }) =>
      `${count} partner${count === 1 ? "" : "s"} updated · ${label}`,
    partnersDeleted: ({ count }: { count: number }) =>
      `${count} partner${count === 1 ? "" : "s"} removed`,
    diagDeleted: "Diagnostic removed",
    partnerCreated: ({ name }: { name: string }) => `${name} workspace is live`,
    moveAdded: "Move saved",
    partnerProfileSaved: "Partner profile saved",
    partnerWorkspaceRemoved: "Partner workspace removed",
    addedToJbp: "On the task list",
  },

  certification: {
    pageMetaTitle: "Certification · Factorial",
    pageMetaDescription:
      "Track each Expert partner's five session Factorial program and issue a Factorial certificate when the journey is complete.",
    eyebrow: "Factorial · Expert partner",
    pageTitle: "Track each Expert ally's Factorial certification journey",
    intro:
      "Each Expert partner has its own session checklist inside their workspace. This portfolio view shows who is ready for a Factorial certificate, who is mid program, and who has not started yet.",

    sectionReadyTitle: "Ready to certify",
    sectionReadySubtitle:
      "All five sessions are checked and a stakeholder is mapped. Open the partner to issue the Factorial certificate.",
    sectionInProgressTitle: "In progress",
    sectionInProgressSubtitle:
      "Sessions ticked but not yet 5/5, or a stakeholder still missing. Keep nudging.",
    sectionNotStartedTitle: "Not started",
    sectionNotStartedSubtitle:
      "These Expert partners haven't ticked any session yet. Open one to mark Session 1 as done.",

    emptyExpertTitle: "No Expert partners yet",
    emptyExpertBody:
      "Open a partner and set the type to Expert. The Factorial certification tab will appear inside their workspace.",
    emptyExpertCta: "Open the portfolio",

    statsReadyLabel: "Ready",
    statsInProgressLabel: "In progress",
    statsNotStartedLabel: "Not started",

    cardReadyBadge: "5/5 ready",
    cardInProgressBadge: ({ done, total }: { done: number; total: number }) =>
      `${done}/${total} done`,
    cardNotStartedBadge: "0/5",
    cardOpenWorkspaceCta: "Open partner",
    cardOpenCertTabCta: "Open certification tab",
    cardMissingStakeholderHint: "Stakeholder missing",
    cardSessionsLabel: ({ done, total }: { done: number; total: number }) =>
      `${done} of ${total} sessions completed`,

    /* ---------- inside the partner workspace ---------- */
    tabIntroTitle: "Factorial Expert program · five sessions",
    tabIntroBody:
      "Tick each session as you finish it with this partner. When all five are done and a stakeholder is mapped, you can issue a Factorial certificate: pick the program, issue date, partner logo, then preview.",
    notExpertTitle: "Factorial certification is for Expert partners",
    notExpertBody:
      "Open the partner editor and switch the partner type to Expert to unlock the five session checklist and certificate tooling.",
    notExpertCta: "Edit partner profile",
    readOnlyHint:
      "You are visiting as a collaborator. Only the owning Partner Development contact or leadership can mark sessions or issue Factorial certificates here.",
    sessionLabel: ({ n }: { n: number }) => `Session ${n}`,
    sessionMarkDone: "Mark as completed",
    sessionUndo: "Undo",
    sessionDoneOn: ({ date }: { date: string }) => `Completed · ${date}`,
    sessionNotesLabel: "Notes (optional)",
    sessionNotesPlaceholder: "What did you cover, what stuck, anything to follow up on?",
    sessionNotesSaved: "Notes saved",
    sessionToggledOnToast: ({ n }: { n: number }) => `Session ${n} marked as completed`,
    sessionToggledOffToast: ({ n }: { n: number }) => `Session ${n} reopened`,
    sessionSaveError: "Could not save the session. Try again in a moment.",
    sessionSaveErrorWithDetail: (detail: string) =>
      `Could not save the session. Try again in a moment. (${detail})`,
    progressLabel: ({ done, total }: { done: number; total: number }) =>
      `${done} of ${total} sessions completed`,

    issueSectionTitle: "Issue the Factorial certificate",
    issueSectionSubtitleReady:
      "Choose the Factorial program, issue date, and upload the partner's company logo for the PDF. Then pick the stakeholder and preview.",
    issueSectionSubtitleGated:
      "Once all five sessions are checked and at least one stakeholder is mapped, you can issue the Factorial certificate here.",
    issueGatedReasonSessions: ({ done, total }: { done: number; total: number }) =>
      `Sessions: ${done}/${total} completed`,
    issueGatedReasonStakeholder: "No stakeholder mapped yet",
    issueGatedReasonNotExpert: "Partner is not marked as Expert",
    cardSelectProgramLabel: "Factorial program",
    cardIssueDateLabel: "Issue date",
    certCompanyLogoLabel: "Partner company logo",
    certCompanyLogoHint:
      "Upload their logo (PNG, JPEG, or WebP, max 2 MB). It appears in the top left on the certificate PDF.",
    certCompanyLogoButton: "Choose image…",
    certCompanyLogoClear: "Remove logo",
    logoRequiredForPreview: "Upload the partner company logo before previewing the certificate.",
    logoInvalidType: "Use an image file (PNG, JPEG, or WebP).",
    logoTooLarge: "Image is too large. Use a file under 2 MB.",
    cardSelectStakeholderLabel: "Certify on behalf of",
    cardSelectStakeholderPlaceholder: "Pick a stakeholder…",
    cardNoStakeholderHint: "Add a stakeholder first to fill the recipient name.",
    cardManageStakeholdersCta: "Manage stakeholders",
    cardPreviewCta: "Preview certificate",
    cardDownloadPdfCta: "Download PDF",
    cardDownloadingLabel: "Preparing…",

    /* ---------- shared certificate body ---------- */
    certTitle: "Expert partner certification",
    certProgramLabel: "Program",
    certBodyLine:
      "This certificate confirms that the named individual has completed the five session enablement track for the selected Factorial program, demonstrating readiness to grow the alliance together with Factorial.",
    certIssuedToLabel: "Issued to",
    certPartnerLabel: "Partner organisation",
    certPartnerLogoAlt: "Partner company logo",
    certLogoFallbackWordmark: "Factorial",
    certDateLabel: "Date issued",
    certIdLabel: "Certificate ID",
    certIssuerLabel: "Delivered by",
    certIssuerFallback: "Factorial Partner Development",
    certFooterFactorial:
      "This credential is issued by Factorial. The certificate ID above is unique to this issuance.",
    previewToastSuccess: "Factorial certificate downloaded.",
    previewToastError: "Could not export certificate. Try again in a moment.",
    previewCloseLabel: "Close preview",
  },

  onboarding: {
    eyebrow: "Quick start",
    title: "Empty portfolio? Add one workspace and you're moving.",
    bodyLead:
      "Diagnostics, plans, and small follow ups belong in one place. Kept drafts ideas in your tone. You still decide what ships.",
    stepAddTitle: "Create a workspace",
    stepAddBody: "Name the partner and what's actually going on. Honest notes keep suggestions useful.",
    stepDiagTitleRuns: ({ noun }: { noun: string }) => `Run the ${noun.toLowerCase()}`,
    stepDiagBody:
      "Walk the eight axes together until the picture matches what your partner would say.",
    stepKeptTitle: ({ kept }: { kept: string }) => `Open ${kept}`,
    stepKeptBody:
      "Treat drafts as a starting point: rewrite, trim, and carry only what you'll commit to.",
    methodologyCta: "Browse guides by dimension",
  },

  focusCopy: {
    hiddenMoreMoves: ({ n }: { n: number }) =>
      `${n} more move${n === 1 ? "" : "s"} hidden. Finish what is visible first.`,
    onlyTheseMoves: "Only these moves show for now. Celebrate wins out loud.",
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
    return `${done}/${totalAxisLessons} lessons tried`;
  }
  return `${totalAxisLessons} lessons ready when you are`;
}

export function methodologyStatLessonsTotalHint(total: number): string {
  if (total === 0) return "More lessons landing soon";
  return total === 1 ? "1 micro lesson to explore" : `${total} micro lessons to explore`;
}

export function methodologyPortfolioLevelHint(level: number): string {
  return `Level ${level} of 5`;
}

export function diagnosticHubDescription(): string {
  return `Diagnostics stay tied to a partner workspace so moves, ${COPY.kept.label}, and revenue reviews share one story.`;
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
      `${input.overdue} overdue commitment${input.overdue === 1 ? "" : "s"} across joint business plans`,
    );
  }
  if (input.highPriority > 0 && input.overdue === 0) {
    parts.push(
      `${input.highPriority} high priority move${input.highPriority === 1 ? "" : "s"} waiting to close`,
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
    input.scope === "mine" ? "You have " : `Across ${input.ownerLabel}, you'd notice `;

  return `${prefixHead}${joined}. Tend to what's loudest before stacking new goals.`;
}
