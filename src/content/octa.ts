// OCTA Methodology — content model for the OCTA OS platform.
// Synthesized from "Ecossistema de Parceiros — Método OCTA" (Tubino & Guimarães)
// and standard B2B partnership operating frameworks.

export type Level = 1 | 2 | 3 | 4 | 5;

export interface MaturityLevel {
  level: Level;
  name: string;
  summary: string;
  signals: string[];
  nextStep: string;
}

export interface Lesson {
  key: string;
  title: string;
  minutes: number;
  body: string;
  exercise: string;
}

export interface DiagnosticQuestion {
  key: string;
  prompt: string;
  // 5 options mapped to maturity 1..5
  options: string[];
}

export interface Axis {
  key: string;
  letter: string;
  name: string;
  tagline: string;
  color: string; // CSS var token, e.g. "octa-1"
  icon: string;  // lucide icon name
  mentalModel: string;
  objectives: string[];
  levers: string[];
  metrics: string[];
  commonMistakes: string[];
  examples: string[];
  levels: MaturityLevel[];
  lessons: Lesson[];
  diagnostic: DiagnosticQuestion[];
}

export const CENTRAL_MENTAL_MODEL = `No company scales B2B distribution alone. Sustainable growth comes from a
deliberately designed partner ecosystem that compounds reach, trust, and
delivery capacity. OCTA is the operating system that turns partnerships from
ad-hoc deals into a predictable, measurable growth engine — across eight
interlocking axes that must move together.`;

export const OCTA_FULL_NAME = "Operating model for Channel and Tech Orchestration";

const lvl = (
  level: Level,
  name: string,
  summary: string,
  signals: string[],
  nextStep: string,
): MaturityLevel => ({ level, name, summary, signals, nextStep });

export const AXES: Axis[] = [
  {
    key: "strategy",
    letter: "S",
    name: "Strategy & Vision",
    tagline: "Why partnerships exist and what they must deliver.",
    color: "octa-1",
    icon: "Compass",
    mentalModel:
      "Partnerships are a board-level growth lever, not a sales tactic. Every partner motion ties to a measurable contribution to ARR, market entry, or product reach.",
    objectives: [
      "Define the strategic role of the ecosystem (reach, capacity, trust, product gap)",
      "Set 1–3 year ecosystem targets tied to revenue and market share",
      "Earn executive sponsorship and budget",
    ],
    levers: [
      "Ecosystem thesis document",
      "Executive sponsor + quarterly review cadence",
      "Resourcing model (people, tooling, MDF budget)",
    ],
    metrics: [
      "% of new ARR sourced or influenced by partners",
      "Ecosystem coverage of target ICP",
      "Executive NPS toward the program",
    ],
    commonMistakes: [
      "Treating partnerships as a side project under sales",
      "No written ecosystem thesis — every quarter the goal shifts",
      "Counting logos instead of revenue contribution",
    ],
    examples: [
      "HubSpot tying Solutions Partner program to its flywheel and reporting partner-sourced ARR every quarter",
      "Snowflake building a partner-first GTM where SIs drive most enterprise wins",
    ],
    levels: [
      lvl(1, "Reactive", "Partnerships happen by accident.", ["No documented goals", "No owner", "No budget"], "Write a one-page ecosystem thesis with a single executive sponsor."),
      lvl(2, "Emerging", "An owner exists, no plan does.", ["One person assigned part-time", "Targets are vanity metrics"], "Set a 12-month revenue target tied to partners."),
      lvl(3, "Defined", "Documented strategy with KPIs.", ["Annual plan exists", "QBRs include partner ARR"], "Allocate budget for tooling and MDF."),
      lvl(4, "Aligned", "Cross-functional alignment, recurring exec review.", ["Marketing, product, CS plan with partners", "Partner ARR ≥15% of new ARR"], "Tie exec comp to partner contribution."),
      lvl(5, "Compounding", "Ecosystem is the growth engine.", ["Partner-sourced > direct in target segments", "Public ecosystem narrative"], "Open category leadership and platform plays."),
    ],
    lessons: [
      { key: "thesis", title: "Write your ecosystem thesis", minutes: 12, body: "A one-page document answering: Why us? Why partners? Which partner archetypes? What revenue role? What we will not do.", exercise: "Draft your thesis using the 5 questions and share it with one exec for feedback." },
      { key: "sponsor", title: "Secure an executive sponsor", minutes: 8, body: "Without an exec who defends the program in QBRs, ecosystem investments lose every prioritization battle.", exercise: "Identify your sponsor and book a recurring 30-min monthly review." },
      { key: "targets", title: "Set partner-sourced ARR targets", minutes: 10, body: "Move from logo counting to dollar contribution. Define sourced vs. influenced vs. delivered.", exercise: "Publish a definition doc and bake the metric into your CRM." },
    ],
    diagnostic: [
      { key: "thesis_doc", prompt: "Do you have a written ecosystem strategy?", options: ["No, partnerships happen ad hoc", "Verbal alignment only", "One-pager exists", "Annual plan with KPIs and budget", "Multi-year thesis tied to corporate strategy"] },
      { key: "exec_sponsor", prompt: "Executive sponsorship for partnerships:", options: ["None", "Tolerated by leadership", "One sponsor, occasional reviews", "Monthly exec reviews", "CEO/CRO actively champions ecosystem"] },
      { key: "revenue_target", prompt: "Revenue target tied to partners:", options: ["None", "Soft aspiration", "Documented annual target", "Target with quarterly tracking", "Partner ARR is a board metric"] },
    ],
  },
  {
    key: "offer",
    letter: "O",
    name: "Offer & Value Proposition",
    tagline: "What partners sell, deliver, and earn.",
    color: "octa-2",
    icon: "Package",
    mentalModel:
      "A partner-ready offer is productized: clear ICP, packaging, pricing tiers, margins, deliverables, and joint value props. If a partner cannot pitch you in 60 seconds, you do not have an offer.",
    objectives: [
      "Productize partner-sellable SKUs",
      "Define joint value propositions per partner archetype",
      "Set transparent economics (margin, rev-share, MDF)",
    ],
    levers: [
      "Partner-facing pitch deck and one-pager",
      "Pricing/margin matrix by tier",
      "Co-branded reference architectures",
    ],
    metrics: [
      "Average deal size via partners vs. direct",
      "Time from partner intro to first won deal",
      "Partner gross margin",
    ],
    commonMistakes: [
      "Offering partners the same direct pricing — no incentive to sell",
      "Letting partners invent the pitch",
      "No clarity on who delivers what (handoff chaos)",
    ],
    examples: [
      "Atlassian's tiered Solution Partner discounts that scale with certifications",
      "AWS Marketplace listings with partner-specific private offers",
    ],
    levels: [
      lvl(1, "Improvised", "No partner offer exists.", ["Direct pricing only", "No collateral"], "Build a partner pitch one-pager."),
      lvl(2, "Basic", "Margin discount, no packaging.", ["Flat % off", "Pitch varies"], "Define 2-3 partner SKUs."),
      lvl(3, "Productized", "Tiered offer with collateral.", ["Discount tiers", "Pitch deck", "Margin sheet"], "Design joint value props per archetype."),
      lvl(4, "Co-created", "Joint solutions and references.", ["Reference architectures", "Co-branded case studies"], "Add MDF + private marketplace offers."),
      lvl(5, "Platform", "Partners build on top of you.", ["Marketplace, app store, OEM"], "Open APIs and revenue-share economics."),
    ],
    lessons: [
      { key: "ppr", title: "Build a partner-ready pitch", minutes: 10, body: "60-second pitch + one-pager + 8-slide deck. Test it by having a partner present back to you.", exercise: "Record a partner pitching your product. Note every fumble." },
      { key: "tiers", title: "Design margin tiers", minutes: 12, body: "Tiers reward investment: certification, pipeline, delivery quality. Margins must be defendable vs. partner CAC.", exercise: "Draft a 3-tier margin matrix with thresholds." },
      { key: "jvp", title: "Joint value proposition canvas", minutes: 15, body: "Per archetype: who, problem, our part, partner part, proof, economics.", exercise: "Fill the canvas for your top 2 partner archetypes." },
    ],
    diagnostic: [
      { key: "pitch", prompt: "Partner pitch readiness:", options: ["Partners improvise", "Generic deck shared", "Partner-specific one-pager + deck", "Tiered collateral by archetype", "Partners can self-serve full enablement"] },
      { key: "economics", prompt: "Partner economics:", options: ["Same as direct", "Flat discount", "Tiered margins", "Tiered + MDF + co-sell incentives", "Marketplace/rev-share platform"] },
      { key: "jvp", prompt: "Joint value propositions:", options: ["None", "Verbal", "Documented per type", "Co-branded references", "Productized joint solutions"] },
    ],
  },
  {
    key: "recruit",
    letter: "R",
    name: "Recruitment & Targeting",
    tagline: "Right partners, on purpose.",
    color: "octa-3",
    icon: "Users",
    mentalModel:
      "Partner recruiting is sales: ICP, pipeline, conversion. The wrong partner costs more than no partner. Quality of fit beats quantity of logos every time.",
    objectives: [
      "Define an Ideal Partner Profile (IPP)",
      "Build a sourced pipeline of fit partners",
      "Convert with a structured onboarding deal",
    ],
    levers: [
      "IPP scorecard",
      "Outbound + inbound recruiting motion",
      "Mutual business plan as the close artifact",
    ],
    metrics: [
      "# of fit partners signed / quarter",
      "Recruit-to-first-deal time",
      "% of partners producing in 90 days",
    ],
    commonMistakes: [
      "Signing anyone who fills a form",
      "No IPP — every partner gets the same treatment",
      "Skipping the mutual business plan",
    ],
    examples: [
      "Salesforce ISV recruiting tied to vertical white-space mapping",
      "Datadog actively recruiting MSPs that already manage cloud workloads",
    ],
    levels: [
      lvl(1, "Opportunistic", "Anyone who shows up.", ["No filter"], "Write your IPP."),
      lvl(2, "Filtered", "Loose qualification.", ["Sales-led screening"], "Build a target list."),
      lvl(3, "Targeted", "Outbound to fit partners.", ["IPP + named accounts"], "Run a structured onboarding deal."),
      lvl(4, "Pipeline-driven", "Partner pipeline managed like sales pipeline.", ["Stages, SLAs, conversion KPIs"], "Add inbound + referral flywheel."),
      lvl(5, "Magnetic", "Partners come to you and self-qualify.", ["Brand pull, public tiers, waitlist"], "Curate, not chase."),
    ],
    lessons: [
      { key: "ipp", title: "Build your Ideal Partner Profile", minutes: 12, body: "Firmographics, capabilities, customer overlap, motivation, cultural fit. Score 1–5.", exercise: "Score your last 10 partners. Note correlation with revenue." },
      { key: "outbound", title: "Outbound partner recruiting", minutes: 10, body: "Treat recruiting like sales: list, sequence, calls, mutual close.", exercise: "Build a 25-account target list this week." },
      { key: "mbp", title: "Mutual business plan", minutes: 15, body: "The artifact that turns interest into commitment: shared targets, owners, dates.", exercise: "Use the MBP template with one new partner." },
    ],
    diagnostic: [
      { key: "ipp_doc", prompt: "Ideal Partner Profile:", options: ["None", "Loose criteria", "Documented IPP", "Scored IPP applied to all", "IPP + segmentation by archetype"] },
      { key: "pipeline", prompt: "Recruiting pipeline:", options: ["Inbound only, ad hoc", "Some target list", "Active outbound", "Stages, SLA, forecast", "Inbound flywheel + selective"] },
      { key: "mbp_use", prompt: "Mutual business plan use:", options: ["Never", "For top partners", "All tier-1 partners", "All tiered partners", "Refreshed quarterly"] },
    ],
  },
  {
    key: "enable",
    letter: "E",
    name: "Enablement & Certification",
    tagline: "Partners who can sell and deliver without you.",
    color: "octa-4",
    icon: "GraduationCap",
    mentalModel:
      "An enabled partner is a force multiplier; a confused partner is a brand liability. Enablement is a product — track adoption, completion, and impact on win rates.",
    objectives: [
      "Equip partners to sell, demo, and deliver independently",
      "Certify capability to protect the brand",
      "Continuously refresh as the product evolves",
    ],
    levers: [
      "Partner portal with role-based learning paths",
      "Certifications gating tier benefits",
      "Live office hours + sandbox access",
    ],
    metrics: [
      "% certified contacts per active partner",
      "Time-to-first-demo for new partner reps",
      "Win rate certified vs. uncertified",
    ],
    commonMistakes: [
      "PDF dump on a Drive folder",
      "Certifications with no benefit attached",
      "Training the same person who keeps leaving",
    ],
    examples: [
      "Hubspot Academy partner tracks tied to tier",
      "AWS partner certifications gating co-sell eligibility",
    ],
    levels: [
      lvl(1, "Self-serve dump", "Files in a folder.", ["No tracking"], "Pick a portal, structure paths."),
      lvl(2, "Linear curriculum", "One-size training.", ["Generic deck"], "Split sales vs. tech tracks."),
      lvl(3, "Role-based + certified", "Sales / pre-sales / delivery tracks.", ["Cert exam"], "Tie certs to tier benefits."),
      lvl(4, "Continuous", "Always-on enablement aligned to releases.", ["Quarterly refresh", "Office hours"], "Measure win-rate lift."),
      lvl(5, "Compounding", "Partners enable partners; community-led.", ["Champions, MVPs, peer training"], "Open contributor model."),
    ],
    lessons: [
      { key: "paths", title: "Design role-based learning paths", minutes: 12, body: "Sales, pre-sales, delivery, support. Map outcomes per role.", exercise: "Draft three paths for your top archetype." },
      { key: "certify", title: "Make certification meaningful", minutes: 10, body: "Tie certs to tangible benefits: tier upgrade, deal reg priority, lead routing.", exercise: "Map cert → benefit. Publish to partners." },
      { key: "winrate", title: "Measure enablement impact", minutes: 8, body: "Compare win rate of deals with certified vs. uncertified partner reps.", exercise: "Run the analysis on last quarter." },
    ],
    diagnostic: [
      { key: "portal", prompt: "Partner enablement delivery:", options: ["Email attachments", "Shared folder", "Portal with tracking", "Role-based paths + cert", "Continuous, community-led"] },
      { key: "cert_benefit", prompt: "Certifications:", options: ["None", "Optional, no benefit", "Tied to tier", "Tied to tier + co-sell", "Required for marketplace listing"] },
      { key: "impact_meas", prompt: "Enablement impact measurement:", options: ["Not measured", "Completion rates only", "Time-to-first-deal", "Win-rate by cert level", "Continuous A/B on content"] },
    ],
  },
  {
    key: "cosell",
    letter: "C",
    name: "Co-sell & Pipeline",
    tagline: "Joint motion that fills both pipelines.",
    color: "octa-5",
    icon: "Handshake",
    mentalModel:
      "Co-sell is the daily handshake between your sellers and partner sellers. Without rules of engagement, deal registration, and shared pipeline visibility, partners sit on the sidelines.",
    objectives: [
      "Establish deal registration and rules of engagement",
      "Run joint account planning and pipeline reviews",
      "Make it easy for sellers on both sides to swipe right",
    ],
    levers: [
      "Deal reg system (CRM workflow)",
      "Account-mapping tooling (Crossbeam/Reveal style)",
      "Joint pipeline review cadence",
    ],
    metrics: [
      "Partner-sourced pipeline ($)",
      "Partner-influenced ARR ($)",
      "Win rate co-sell vs. solo",
    ],
    commonMistakes: [
      "No deal reg → channel conflict and resentment",
      "Mapping accounts once and forgetting",
      "Internal sellers compensated against partners",
    ],
    examples: [
      "Microsoft Co-sell with structured incentives for AE-to-AE collaboration",
      "Crossbeam-driven account mapping as a daily rep workflow",
    ],
    levels: [
      lvl(1, "Conflict-prone", "No rules.", ["Channel collisions"], "Publish rules of engagement."),
      lvl(2, "Reactive", "Deal reg exists, ignored.", ["Sporadic use"], "Tie deal reg to comp."),
      lvl(3, "Operational", "Active deal reg + mapping.", ["Monthly joint reviews"], "Add joint account planning."),
      lvl(4, "Forecastable", "Partner pipeline is forecast-grade.", ["Stage parity with direct"], "Compensate sellers neutrally."),
      lvl(5, "Native", "Co-sell is the default motion.", ["Sellers default to checking partners first"], "Run joint plays at scale."),
    ],
    lessons: [
      { key: "roe", title: "Rules of engagement", minutes: 10, body: "Who owns the account, who registers, who gets paid, how conflicts resolve.", exercise: "Draft your one-page RoE and circulate." },
      { key: "mapping", title: "Account mapping that sticks", minutes: 12, body: "Mapping is daily, not annual. Tooling helps but discipline wins.", exercise: "Map your top 50 accounts with one partner this week." },
      { key: "comp", title: "Neutralize comp conflicts", minutes: 8, body: "If sellers lose money working with partners, no process will save you.", exercise: "Audit comp plan for anti-partner incentives." },
    ],
    diagnostic: [
      { key: "deal_reg", prompt: "Deal registration:", options: ["None", "Exists, rarely used", "Required for protection", "Required + integrated in CRM", "Enforced + tied to seller comp"] },
      { key: "mapping_freq", prompt: "Account mapping cadence:", options: ["Never", "Annually", "Quarterly", "Monthly", "Continuous via tooling"] },
      { key: "joint_review", prompt: "Joint pipeline reviews:", options: ["None", "Ad hoc", "Quarterly with top partners", "Monthly with all tiered partners", "Weekly per major partner"] },
    ],
  },
  {
    key: "operate",
    letter: "T",
    name: "Tech & Operations",
    tagline: "Systems that make the program scale.",
    color: "octa-6",
    icon: "Settings2",
    mentalModel:
      "Spreadsheets cap your program at ~50 partners. A real PRM, integrated with CRM and finance, is the difference between a hobby and a business.",
    objectives: [
      "Stand up a partner portal / PRM",
      "Integrate with CRM, finance, and enablement",
      "Automate deal reg, MDF, payouts, certifications",
    ],
    levers: [
      "PRM (Impartner, PartnerStack, Crossbeam, etc.)",
      "CRM workflows for partner deals",
      "Automated commission and MDF payouts",
    ],
    metrics: [
      "Partner self-service rate (% of asks resolved without manager)",
      "Cycle time from deal reg to approval",
      "Cost-to-serve per partner",
    ],
    commonMistakes: [
      "Buying a PRM before you have a process",
      "Not integrating with CRM → double entry",
      "No data model → no analytics",
    ],
    examples: [
      "PartnerStack handling end-to-end SaaS partner ops",
      "Snowflake Partner Network with deep CRM + marketplace integration",
    ],
    levels: [
      lvl(1, "Spreadsheets", "Tracking in Sheets.", ["No portal"], "Audit your top processes."),
      lvl(2, "Portal", "Basic PRM, manual flows.", ["Login + collateral"], "Wire deal reg to CRM."),
      lvl(3, "Integrated", "PRM ↔ CRM ↔ enablement.", ["Single source of truth"], "Automate MDF + payouts."),
      lvl(4, "Automated", "Self-service program.", ["Partners act without your team"], "Build analytics layer."),
      lvl(5, "Platform", "API-first, partner-as-developer.", ["Programmatic onboarding"], "Open ecosystem APIs."),
    ],
    lessons: [
      { key: "prm", title: "Choose the right PRM", minutes: 12, body: "Match tool to maturity. Don't over-buy. Pilot with 5 partners first.", exercise: "List your top 5 must-have workflows. Score 3 PRMs." },
      { key: "integrate", title: "PRM ↔ CRM integration", minutes: 10, body: "Deal reg, accounts, contacts must round-trip. Avoid double entry.", exercise: "Map the data flow on a whiteboard." },
      { key: "automate", title: "Automate the painful parts", minutes: 8, body: "MDF approvals, commission calc, certification status — automation buys back manager time.", exercise: "Pick one to automate this month." },
    ],
    diagnostic: [
      { key: "prm_state", prompt: "Partner tooling:", options: ["Spreadsheets + email", "Shared drive portal", "PRM, standalone", "PRM integrated with CRM", "Full automation + APIs"] },
      { key: "self_serve", prompt: "Partner self-service:", options: ["Everything via email", "Some collateral self-serve", "Deal reg self-serve", "Deal reg + MDF + training", "Full lifecycle self-serve"] },
      { key: "data", prompt: "Partner data & analytics:", options: ["No reporting", "Manual monthly report", "Live dashboard for team", "Dashboards shared with partners", "Predictive analytics + alerts"] },
    ],
  },
  {
    key: "growth",
    letter: "G",
    name: "Growth & Marketing",
    tagline: "Joint demand generation that compounds.",
    color: "octa-7",
    icon: "TrendingUp",
    mentalModel:
      "Marketing with partners is a multiplier on reach and trust — but only if you co-invest, co-create, and measure. MDF without rigor becomes a tax.",
    objectives: [
      "Run repeatable joint marketing plays",
      "Deploy MDF with measurable ROI",
      "Build a co-branded content engine",
    ],
    levers: [
      "MDF with claim-based payouts",
      "Joint webinars, events, content syndication",
      "Co-branded case studies and verticals",
    ],
    metrics: [
      "Pipeline generated per $ of MDF",
      "MQLs from joint campaigns",
      "Partner-attributed website traffic",
    ],
    commonMistakes: [
      "MDF as a discount in disguise",
      "One-off webinars, no follow-up engine",
      "No attribution → no learning",
    ],
    examples: [
      "Adobe + agency joint vertical campaigns",
      "Drift's partner-led content syndication motion",
    ],
    levels: [
      lvl(1, "Random acts", "Occasional joint event.", ["No plan"], "Pick 1 joint play, run repeatedly."),
      lvl(2, "Calendarized", "Annual co-marketing plan.", ["Few plays"], "Add MDF with claims."),
      lvl(3, "Programmatic", "Always-on joint motion.", ["MDF, webinars, content cadence"], "Tie MDF to pipeline ROI."),
      lvl(4, "Measured", "Attribution end-to-end.", ["Pipeline per $ MDF"], "Scale plays that work."),
      lvl(5, "Compounding", "Co-branded engine drives demand at scale.", ["Verticals, events, community"], "Open ecosystem brand."),
    ],
    lessons: [
      { key: "mdf", title: "Run MDF like a fund manager", minutes: 12, body: "Apply, plan, claim, measure. No ROI, no renewal.", exercise: "Build a one-page MDF claim template." },
      { key: "plays", title: "Pick 3 joint plays", minutes: 10, body: "Webinar series, vertical campaign, executive event. Repeat, don't reinvent.", exercise: "Schedule the next 90 days." },
      { key: "attribution", title: "Joint attribution model", minutes: 10, body: "UTMs, partner codes, deal reg. Stitch the funnel.", exercise: "Audit one campaign's full funnel." },
    ],
    diagnostic: [
      { key: "mdf_use", prompt: "MDF usage:", options: ["No MDF", "Discretionary, no rules", "Application + plan", "Claim-based + ROI tracked", "Performance-based renewal"] },
      { key: "joint_plays", prompt: "Joint marketing motion:", options: ["Random", "1-2 events/year", "Quarterly cadence", "Always-on calendar", "Programmatic + measured"] },
      { key: "attribution_q", prompt: "Attribution from partner marketing to ARR:", options: ["None", "Anecdotal", "Per-campaign", "End-to-end funnel", "Cohort + LTV analysis"] },
    ],
  },
  {
    key: "success",
    letter: "X",
    name: "Success & Lifecycle",
    tagline: "Partner experience that drives retention and growth.",
    color: "octa-8",
    icon: "Sparkles",
    mentalModel:
      "Treat partners like customers: onboard, activate, retain, expand, advocate. Partner churn is silent and expensive — it kills compounding.",
    objectives: [
      "Onboard partners to first revenue fast",
      "Run health scoring and proactive interventions",
      "Build a community of advocates",
    ],
    levers: [
      "90-day onboarding plan with milestones",
      "Partner health score (engagement + revenue)",
      "Advisory board, MVP program, community",
    ],
    metrics: [
      "Time-to-first-deal",
      "% active partners (definition matters)",
      "Partner NPS / satisfaction",
    ],
    commonMistakes: [
      "Sign and forget",
      "No definition of 'active' → vanity headcount",
      "Treating top partners the same as long tail",
    ],
    examples: [
      "Notion's Champion program for power users / partners",
      "GitLab's transparent partner roadmap collaboration",
    ],
    levels: [
      lvl(1, "Sign & forget", "No lifecycle.", ["No NPS"], "Build a 30/60/90 onboarding plan."),
      lvl(2, "Onboarding only", "Activation, then silence.", ["No health"], "Define 'active partner'."),
      lvl(3, "Lifecycle defined", "Onboard → activate → retain plays.", ["Quarterly check-ins"], "Add health scoring."),
      lvl(4, "Health-driven", "Proactive based on health score.", ["Auto alerts, save plays"], "Stand up community + advisory board."),
      lvl(5, "Community-led", "Partners advocate, recruit, support each other.", ["Advisory board, MVPs, peer support"], "Open partner-led category leadership."),
    ],
    lessons: [
      { key: "onboard", title: "Design the 90-day plan", minutes: 12, body: "Day 1, Day 30, Day 60, Day 90 outcomes. First deal by day 90 is the gold standard.", exercise: "Map your current onboarding to milestones." },
      { key: "health", title: "Build a partner health score", minutes: 10, body: "Combine engagement (logins, certs, deal reg) with revenue (pipeline, closed). Trigger plays by score.", exercise: "Draft a 5-input health score." },
      { key: "community", title: "Stand up a partner community", minutes: 10, body: "Slack, advisory board, MVP program. Peer learning beats vendor broadcasts.", exercise: "Pick a community format and recruit 5 founders." },
    ],
    diagnostic: [
      { key: "onboarding", prompt: "Partner onboarding:", options: ["None", "Welcome email", "30-day plan", "90-day plan with milestones", "Personalized lifecycle by archetype"] },
      { key: "health_score", prompt: "Partner health monitoring:", options: ["No tracking", "Manual gut feel", "Manual scorecard", "Automated health score", "Predictive churn + interventions"] },
      { key: "community_q", prompt: "Partner community:", options: ["None", "Newsletter", "Annual partner event", "Active community + advisory board", "Partner-led MVPs and content"] },
    ],
  },
];

export const MAX_LEVEL: Level = 5;

export const overallLevelLabel = (avg: number): string => {
  if (avg < 1.5) return "Reactive";
  if (avg < 2.5) return "Emerging";
  if (avg < 3.5) return "Defined";
  if (avg < 4.5) return "Aligned";
  return "Compounding";
};

export const overallLevelDescription = (avg: number): string => {
  if (avg < 1.5) return "Your ecosystem is ad hoc. Pick one axis and lead with strategy.";
  if (avg < 2.5) return "Foundations are forming. Document what works and resource it.";
  if (avg < 3.5) return "You have a real program. Tighten metrics and integrate the eight axes.";
  if (avg < 4.5) return "Aligned and accountable. Push into co-sell maturity and platform plays.";
  return "Your ecosystem compounds. Lead the category and open platform leverage.";
};

export const xpToLevel = (xp: number) => {
  // Player level curve: every 100 XP = +1 player level.
  return Math.floor(xp / 100) + 1;
};

export const xpProgressInLevel = (xp: number) => {
  const inLevel = xp % 100;
  return { current: inLevel, max: 100, pct: inLevel };
};
