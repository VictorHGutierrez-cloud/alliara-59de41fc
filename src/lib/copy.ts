/** Central product copy for Kept Executive Academy. */

export const COPY = {
  kept: {
    label: "Kept",
    ambientTitle: "Ask the coach",
  },

  landing: {
    metaTitle: "Kept · Executive Academy for B2B sellers",
    metaDescription:
      "Study playbooks, ask situational questions, and follow learning tracks — built for sales executives who sell in 2026.",
    heroEyebrow: "Executive Academy",
    heroTitle: "Executive academy for people who sell in 2026",
    heroBody:
      "Playbooks, situational coach, and structured tracks in one place. Study between calls, not after the quarter ends.",
    pillLibrary: "Library",
    pillCoach: "Coach",
    pillTracks: "Tracks",
    ctaPrimary: "Create free account",
    ctaSecondary: "Sign in",
    heroEmailPlaceholder: "Work email",
    heroEmailHelper: "Next step is signup. Add your name and a password there.",
    pillarsEyebrow: "Three pillars",
    pillarsTitle: "Everything you need to stay sharp",
    pillarsIntro:
      "The same surfaces you use after login — library for depth, coach for the moment, tracks for progression.",
    pillarLibraryTitle: "Library",
    pillarLibraryBody:
      "Psychology, MEDDPICC playbooks, demo stories, and battle cards — open inside the app.",
    pillarCoachTitle: "Coach",
    pillarCoachBody:
      "Ask what to do when the buyer goes quiet, you need a champion, or competition shows up.",
    pillarTracksTitle: "Tracks",
    pillarTracksBody:
      "Follow curated paths in order. Mark materials complete and pick up where you left off.",
    previewEyebrow: "From the library",
    previewTitle: "Materials your team already uses",
    coachExampleEyebrow: "Example question",
    coachExampleTitle: "The buyer went quiet after the demo — what do I do?",
    coachExampleBody:
      "The coach names the blocker, gives 2–3 next steps, and points to the weakest MEDDPICC letter — not a feature tour.",
    coachExampleCta: "Try the coach",
    finalCtaTitle: "Start studying today",
    finalCtaBody:
      "Create an account, open your first track, and ask the coach when a deal gets stuck.",
    finalCtaPrimary: "Create account",
    finalCtaSecondary: "Sign in",
    trustEyebrow: "Built for the field",
    trustBlurb: "Factorial playbooks, MEDDPICC, champion development, and demo mastery — organized for daily use.",
    trustStats: [
      { value: "7+", label: "curated resources" },
      { value: "4", label: "learning tracks" },
      { value: "1", label: "situational coach" },
    ] as const,
  },

  introTour: {
    metaTitle: "Meet Kept · Executive Academy intro",
    metaDescription:
      "Five quick screens on library, coach, and learning tracks inside Kept Executive Academy.",
    heroCta: "How it works",
    skip: "Skip intro",
    next: "Next",
    back: "Back",
    finishSignedIn: "Open Academy",
    finishSignedOut: "Create free account",
    finishHome: "Back to home",
    checkingSession: "Checking session…",
    progress: ({ step, total }: { step: number; total: number }) => `Step ${step} of ${total}`,
    slides: [
      {
        variant: "bringsCalm",
        title: "Welcome to Executive Academy",
        body: "Kept is your study home for B2B sales — playbooks, situational coach, and tracks you can follow between calls.",
      },
      {
        variant: "keepsContext",
        title: "Library — depth when you need it",
        body: "Open psychology, enterprise and SMB playbooks, demo stories, and battle cards without hunting through folders.",
      },
      {
        variant: "contextBeforeCall",
        title: "Coach — help in the moment",
        body: "Describe what is happening in the deal. The coach gives next steps grounded in MEDDPICC, champion strategy, and your curriculum.",
      },
      {
        variant: "everythingOnTrack",
        title: "Tracks — study in order",
        body: "Learning tracks group materials into paths. Mark items complete and see progress per track.",
      },
      {
        variant: "remindsGently",
        title: "Your next step",
        body: "Start with Buyer psychology foundations or ask the coach a real question from an open deal.",
      },
    ] as const,
  },

  auth: {
    signIn: "Sign in",
    signOutLabel: "Sign out",
    getStarted: "Start free",
    openWorkspaceCta: "Open Academy",
    signedInHint: "Signed in",
    headerAcademyCta: "Academy",
    rootMetaTitle: "Kept · Executive Academy",
    rootMetaDescription:
      "Sales library, situational coach, and learning tracks for B2B executives.",
    ogTitle: "Kept · Executive Academy",
    ogDescription:
      "Study playbooks, ask situational questions, and follow structured tracks.",
    logoAltWordmark: "Kept",
    notFoundTitle: "This page isn't here",
    notFoundHint:
      "The link may be old, or the address has a typo. Head home and we'll get you oriented.",
    homeCtaLabel: "Back to home",
    attributionByline: "Crafted with care by Victor Gutierrez",
  },

  academy: {
    pageMetaTitle: "Executive Academy · Kept",
    pageMetaDescription:
      "Sales library, situational coach, and learning tracks for executives.",
    eyebrow: "Executive Academy",
    pageTitle: "Executive Academy",
    intro:
      "Your curriculum, situational coach, and learning tracks in one place. Study playbooks, ask what to do in a stuck deal, and grow track by track.",
    libraryCardTitle: "Library",
    libraryCardBody: "Playbooks, psychology, battle cards, and demo stories — ready to read.",
    askCardTitle: "Ask the coach",
    askCardBody:
      "Stuck on a deal? Ask what to do now — MEDDPICC gaps, champion, demos, objections.",
    askCardMeta: "Situational AI",
    learnCardTitle: "Learning tracks",
    learnCardBody: "Structured paths with progress. Pick up where you left off.",
    briefingCardTitle: "Briefing",
    briefingCardBody:
      "Daily sales news — summarized and linked to your playbooks and psychology curriculum.",
    briefingCardMeta: "RSS + search",
    briefingMetaTitle: "Briefing · Executive Academy",
    briefingEyebrow: "Sales reading",
    briefingTitle: "Daily briefing",
    briefingIntro:
      "Fresh articles from the sales world, summarized for executives. Each piece points you to related Academy materials when they fit.",
    briefingFilterToday: "Today",
    briefingFilterWeek: "This week",
    briefingFilterAll: "All",
    briefingEmpty:
      "No briefs yet for this range. The daily job fills this feed — check back soon, or widen the filter.",
    briefingLoadError: "Could not load the briefing. Try again in a moment.",
    briefingRelatedLabel: "Related in Academy",
    briefingReadArticle: "Read article",
    briefingAskCoach: "Ask the coach",
    continueTitle: "Continue studying",
    continueBody: "Jump back to your last track or material.",
    continueCta: "Resume",
    continueEmpty: "No recent activity yet. Open a track or library resource to start.",
    situationTitle: "In a tough moment right now?",
    situationBody:
      "Describe the situation — who went quiet, which stage, what you tried. The coach gives next steps, not a feature tour.",
    situationCta: "Ask what to do now",
    browseLibraryCta: "Browse library",
    backToHub: "Back to Academy",
    backToLibrary: "Back to library",
    libraryMetaTitle: "Library · Executive Academy",
    libraryTitle: "Curriculum library",
    libraryIntro:
      "Open any resource inside the app or in a new tab. Search by topic or filter by type.",
    librarySearchPlaceholder: "Search playbooks, MEDDPICC, champion…",
    libraryEmpty: "No resources match. Try another filter or search term.",
    readerNotFound: "This resource was not found.",
    readerLoading: "Loading…",
    readerLoadError: "Could not load this file.",
    openNewTab: "Open in new tab",
    askAboutThis: "Ask the coach",
    markComplete: "Mark as completed",
    markIncomplete: "Mark as not completed",
    askMetaTitle: "Ask coach · Executive Academy",
    askTitle: "Executive coach",
    askSubtitle: "Situational help — MEDDPICC, champion, demos, objections.",
    askEmptyHint: "Describe your deal or question. Example situations below.",
    askSuggestions: [
      "The buyer went quiet after demo — what do I do?",
      "How do I find my champion in this account?",
      "They want to see every module — how do I push back?",
      "HiBob is on the shortlist — what's my opening?",
    ],
    askPlaceholder: "What's happening in this deal?",
    askNewChat: "New chat",
    askThinking: "Thinking…",
    askSendAria: "Send question",
    askErrorGeneric: "Something went wrong. Try again.",
    learnMetaTitle: "Learning tracks · Executive Academy",
    learnTitle: "Learning tracks",
    learnIntro:
      "Tracks group library content into paths. Mark materials complete as you go — progress is saved on this device.",
    trackComingSoon: "Coming soon",
    trackEmpty: "Content will be added to this track.",
    trackProgress: (pct: number) => `${pct}% complete`,
    lmsFutureTitle: "More coming",
    lmsFutureBody:
      "Quizzes, team assignments, and cloud sync are on the roadmap. Library, coach, and local progress are live now.",
    dockLabel: "Home",
    dockLibrary: "Library",
    dockCoach: "Coach",
    dockTracks: "Tracks",
    coachDockTitle: "Open coach",
  },

  settings: {
    pageMetaTitle: "Settings · Kept",
    eyebrow: "Settings",
    pageTitle: "Your account",
    pageIntro: "Profile details and sign out. No integrations — just your study space.",
    profileSection: "Profile",
    nameLabel: "Display name",
    emailLabel: "Email",
    emailHint: "Email is managed by your sign-in provider.",
    tourLink: "Replay onboarding tour",
    tourLinkHint: "Walk through library, coach, and tracks again.",
    signOutCta: "Sign out",
    savedToast: "Profile updated",
    saveError: "Could not save profile. Try again.",
  },

  appShell: {
    goToAcademy: "Go to Academy",
    dockHome: "Home",
    dockLibrary: "Library",
    dockCoach: "Coach",
    dockTracks: "Tracks",
    dockBriefing: "Briefing",
    dockSettings: "Settings",
    dockSignOut: "Sign out",
    dockApprovals: "Approvals",
    footerCredit: "Kept · Executive Academy",
  },

  onboarding: {
    eyebrow: "Quick start",
    title: "New to Executive Academy?",
    bodyLead:
      "Five steps to find the library, ask the coach, and start your first track.",
    replayCta: "Replay tour",
  },
} as const;
