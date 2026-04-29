// rev: octa-partner-centric
// OCTA Methodology — content model for the OCTA OS platform.
// Partner-centric edition: every axis evaluates the PARTNER's capability,
// not the orchestrator's internal program. Used by the Readiness Assessment,
// the Joint Business Plan, the Partner Intel decoder, and the Ecosystem Copilot.

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

export const CENTRAL_MENTAL_MODEL = `Every partner is a unique growth engine. OCTA is the operating system that
lets a Partner Development Manager evaluate, decode, and orchestrate each
partnership individually — across eight axes that together describe a
partner's true revenue maturity. You don't manage a program; you orchestrate
a portfolio of partners, one Joint Business Plan at a time.`;

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
    name: "Strategic Alignment (Fit)",
    tagline: "Does this partner share our ICP, values, and ambition?",
    color: "octa-1",
    icon: "Compass",
    mentalModel:
      "A partner is only valuable if their strategy points in the same direction as ours. Evaluate whether their target customers, cultural values, and growth ambition compound with our own — or quietly compete with them.",
    objectives: [
      "Confirm the partner targets the same Ideal Customer Profile we do",
      "Validate cultural and operating-style fit at exec level",
      "Surface the partner's 1–3 year growth ambition and where we sit in it",
    ],
    levers: [
      "Joint ICP mapping workshop with partner leadership",
      "Mutual value-and-vision conversation (not a sales pitch)",
      "Strategic fit scorecard updated each quarter",
    ],
    metrics: [
      "% of partner pipeline inside our shared ICP",
      "Exec-to-exec touchpoints per quarter",
      "Strategic fit score (PDM-rated 1–5, reviewed quarterly)",
    ],
    commonMistakes: [
      "Assuming logo overlap = strategic fit",
      "Never meeting the partner's CEO or commercial leader",
      "Letting the partner pursue any lead, regardless of ICP",
    ],
    examples: [
      "A boutique SI whose top-3 verticals match our top-3 verticals — true compounding fit",
      "A reseller with broad horizontal coverage but zero focus on our ICP — high activity, low alignment",
    ],
    levels: [
      lvl(1, "Misaligned", "Partner's ICP, values, or ambition diverge from ours.", ["Random opportunities", "No exec contact"], "Run a joint ICP + ambition workshop with partner leadership."),
      lvl(2, "Curious", "Some overlap, no shared narrative.", ["Sporadic exec contact", "Generic deals"], "Document a 1-page strategic fit memo and review it together."),
      lvl(3, "Aligned", "Shared ICP and stated ambition, agreed in writing.", ["Quarterly exec sync", "Most pipeline inside ICP"], "Translate the alignment into a Joint Business Plan with shared targets."),
      lvl(4, "Co-invested", "Both sides invest people and budget against the joint ambition.", ["Named exec sponsors on both sides", "Joint OKRs"], "Codify the partner as a Tier-1 strategic account on both sides."),
      lvl(5, "Strategic Twin", "Indistinguishable strategic intent — partner is an extension of our GTM.", ["Joint multi-year plan", "Co-authored category narrative"], "Open category leadership and platform plays together."),
    ],
    lessons: [
      { key: "icp_fit", title: "Score this partner's ICP fit", minutes: 10, body: "Map the partner's last 20 wins against our ICP. Calculate fit %. Below 40% = misaligned, above 70% = highly aligned.", exercise: "Pull the partner's last 20 closed deals and tag each as in/out of ICP." },
      { key: "values_check", title: "Run a values + ambition conversation", minutes: 12, body: "A 45-min exec-to-exec conversation: who do we want to be in 3 years, and where do we win together? No demo, no pitch.", exercise: "Book the call this month and write a 1-page memo afterwards." },
      { key: "fit_score", title: "Build a strategic fit scorecard", minutes: 8, body: "Five inputs: ICP overlap, exec engagement, ambition alignment, cultural fit, mutual investment. Score 1–5 each, refresh quarterly.", exercise: "Score this partner today using the 5 inputs." },
    ],
    diagnostic: [
      { key: "fit_icp", prompt: "How well does this partner's customer base overlap with our Ideal Customer Profile?", options: ["No overlap — they sell into a different market", "Some logos overlap, mostly accidental", "Roughly half their pipeline matches our ICP", "Most of their pipeline matches our ICP", "Their entire growth motion is built around our ICP"] },
      { key: "fit_values", prompt: "Cultural and operating-style fit with this partner:", options: ["Constant friction in how we work together", "Workable but uneven across their teams", "Compatible — few surprises in joint motions", "Strong cultural alignment — they operate like an extension of our team", "Indistinguishable — same standards, same cadence, same expectations"] },
      { key: "fit_ambition", prompt: "How aligned is this partner's 1–3 year growth ambition with ours?", options: ["No visibility into their ambition", "Vague awareness, no shared narrative", "Stated ambition aligns on paper", "Joint ambition documented and reviewed yearly", "Joint multi-year plan with shared OKRs and exec sponsors"] },
    ],
  },
  {
    key: "offer",
    letter: "O",
    name: "Commercial & Operational Capacity",
    tagline: "Do they have the sales muscle and delivery bench to scale us?",
    color: "octa-2",
    icon: "Package",
    mentalModel:
      "Capacity is the silent ceiling on every partnership. Evaluate the size and structure of the partner's sales team, the maturity of their sales process, and the depth of their delivery / implementation bench. No capacity, no scale — no matter how aligned they are.",
    objectives: [
      "Map the partner's sales team size, structure, and quota coverage",
      "Assess their delivery / implementation bench by role and seniority",
      "Identify capacity bottlenecks blocking growth with us",
    ],
    levers: [
      "Capacity plan reviewed jointly each quarter",
      "Hiring co-investment (e.g. headcount tied to MDF or rev-share)",
      "Bench-building enablement (sales playbooks, delivery accelerators)",
    ],
    metrics: [
      "# of dedicated sellers and # of dedicated delivery FTEs on our solution",
      "Quota coverage of our line vs. partner total",
      "Delivery utilization & backlog (weeks)",
    ],
    commonMistakes: [
      "Counting a partner's total headcount instead of the few actually selling us",
      "Ignoring delivery capacity until projects start slipping",
      "Letting one champion seller carry the entire partnership",
    ],
    examples: [
      "A partner with 2 named AEs + a 4-person delivery pod dedicated to our stack — built to scale",
      "A 200-person SI where only 1 PM sells us occasionally — structural capacity gap",
    ],
    levels: [
      lvl(1, "Single point", "One person sells and delivers — partnership = that person.", ["Bus factor of 1"], "Identify a second seller and a second delivery lead inside the partner."),
      lvl(2, "Ad-hoc team", "A small unstructured group works on us when convenient.", ["No quota carrier", "Shared resources"], "Negotiate at least one named, quota-carrying seller."),
      lvl(3, "Dedicated pod", "Named sellers + named delivery resources with quota or utilization targets.", ["Quota coverage agreed", "Delivery bench mapped"], "Add capacity plan with hiring milestones."),
      lvl(4, "Scalable bench", "Structured sales + delivery org capable of multi-deal motion concurrently.", ["Multi-pod coverage", "Healthy backlog"], "Co-invest in capacity expansion (joint hiring plan)."),
      lvl(5, "Production engine", "Industrial-grade capacity — can absorb pipeline surges without breaking.", ["Multiple regions / verticals", "Delivery factory model"], "Treat the partner as a delivery & sales arm at scale."),
    ],
    lessons: [
      { key: "capacity_map", title: "Map the partner's true capacity", minutes: 12, body: "List by name: sellers selling us, pre-sales, delivery, support. Note % of their time on us. The org chart lies; this view tells the truth.", exercise: "Build the named capacity map this week." },
      { key: "quota_cov", title: "Quantify quota coverage", minutes: 10, body: "Sum the quotas (or revenue targets) the partner's sellers carry on our line. Compare to our shared revenue target.", exercise: "Calculate quota coverage % for this partner." },
      { key: "delivery_bench", title: "Audit the delivery bench", minutes: 10, body: "Roles, certifications, current utilization. A partner can sell beyond what they can deliver — and that kills CSAT.", exercise: "List delivery FTEs by role + utilization for the next 90 days." },
    ],
    diagnostic: [
      { key: "sales_team_size", prompt: "How many people inside this partner actively sell our solution?", options: ["Nobody dedicated — only opportunistic", "1 person carries the entire motion", "2–3 sellers occasionally pitching us", "A named pod (3–5+) selling us regularly", "Multiple structured sales teams across regions / verticals"] },
      { key: "sales_structure", prompt: "How structured is the partner's sales process around our solution?", options: ["No process — fully reactive", "A loose pitch, no qualification or stages", "Defined pitch + basic discovery", "Repeatable sales motion with stages and forecasting", "Industrialized motion with playbooks, plays, and quota coverage"] },
      { key: "delivery_capacity", prompt: "Implementation / delivery muscle for our solution at this partner:", options: ["No delivery capability — we deliver everything", "1 person delivers, single point of failure", "Small dedicated team (2–4)", "Structured delivery pod with utilization tracking", "Industrial delivery org capable of running many projects in parallel"] },
    ],
  },
  {
    key: "recruit",
    letter: "R",
    name: "Solution Mastery (Enablement)",
    tagline: "Can they pitch, demo, and sell our product without us?",
    color: "octa-3",
    icon: "GraduationCap",
    mentalModel:
      "A partner that depends on us in every meeting is a tax, not a multiplier. Evaluate how deeply their team understands the product, how many are certified, and whether they can lead a full sales cycle — discovery, demo, technical objection handling — independently.",
    objectives: [
      "Increase the number of certified contacts at the partner",
      "Push the partner's reps to run full discovery and demo solo",
      "Make sure technical objections are handled by the partner first, us second",
    ],
    levers: [
      "Role-based learning paths (sales, pre-sales, delivery)",
      "Certification gates tied to tier or co-sell eligibility",
      "Live office hours, sandbox access, and shadow-then-solo demos",
    ],
    metrics: [
      "# of certified contacts per role at the partner",
      "% of demos run solo by the partner",
      "Win rate when partner runs the cycle vs. when we run it",
    ],
    commonMistakes: [
      "Training one champion who then leaves the partner",
      "Certifications with no tangible benefit attached",
      "Letting the partner outsource discovery to us forever",
    ],
    examples: [
      "A partner with 6 certified reps running solo demos — a true force multiplier",
      "A partner with one 'expert' who escalates every technical question — single-point dependency",
    ],
    levels: [
      lvl(1, "Spectator", "They watch us pitch.", ["No certifications", "We do every demo"], "Enroll 2 reps in the sales certification path."),
      lvl(2, "Talker", "They can intro pitch, not run discovery.", ["1 certified contact"], "Train pre-sales and run shadow-then-solo demos."),
      lvl(3, "Doer", "They run discovery + demo with light support.", ["Sales + pre-sales certified"], "Add technical certification and POC ownership."),
      lvl(4, "Independent", "Full sales cycles solo, including technical objections.", ["Multi-role certified bench"], "Push them to mentor other partner reps."),
      lvl(5, "Teacher", "They train new reps and answer technical questions for peers.", ["Internal champion network"], "Promote them as a public reference and trainer."),
    ],
    lessons: [
      { key: "paths", title: "Map role-based learning paths", minutes: 10, body: "Sales, pre-sales, delivery. Outcomes per role. Generic training trains nobody.", exercise: "Draft a 3-role learning path for this partner this week." },
      { key: "shadow_solo", title: "Shadow-then-solo demos", minutes: 10, body: "First demo: they shadow us. Second: we shadow them. Third: solo. Track which reps reached 'solo' and how fast.", exercise: "Pick 2 partner reps and start the shadow-then-solo cycle." },
      { key: "winrate", title: "Compare win rate solo vs. supported", minutes: 8, body: "Compare close rate when the partner ran the cycle vs. when we did. The gap tells you how much enablement is worth.", exercise: "Run the comparison on the last 6 months of deals." },
    ],
    diagnostic: [
      { key: "certifications", prompt: "How many people at this partner are certified on our solution?", options: ["Zero certified", "1 certified individual", "A small core team (2–4) certified", "Certifications across multiple roles (sales + presales + delivery)", "Broad certified bench across teams and offices, kept current"] },
      { key: "independent_pitch", prompt: "Can this partner pitch and demo our solution without us?", options: ["No — every meeting needs us", "Only with us shadowing", "They can intro pitch, we still run real demos", "They run full discovery + demo with light support", "Fully autonomous on discovery, demo, POC, and technical objections"] },
      { key: "technical_depth", prompt: "Technical depth when handling customer objections:", options: ["Every technical question escalates to us", "They handle basic objections only", "They handle most objections, escalate edge cases", "They handle nearly everything; rare escalations", "They train other partner reps on technical depth"] },
    ],
  },
  {
    key: "enable",
    letter: "E",
    name: "Go-to-Market Strength (Pipeline)",
    tagline: "Can they generate Ecosystem Qualified Leads on their own?",
    color: "octa-4",
    icon: "TrendingUp",
    mentalModel:
      "A partner that never sources is a delivery shop, not a GTM partner. Evaluate the partner's ability to generate pipeline (EQLs), run co-marketing motions, and forecast. Predictable partner-sourced pipeline is the single highest-signal indicator of GTM strength.",
    objectives: [
      "Grow partner-sourced EQLs quarter over quarter",
      "Land repeatable co-marketing plays with measurable pipeline output",
      "Make partner pipeline forecast-grade (stages, dates, owners)",
    ],
    levers: [
      "Joint GTM plan with named plays (webinars, vertical campaigns, events)",
      "Co-investment (MDF) with claim-based ROI tracking",
      "Shared pipeline review cadence (monthly minimum)",
    ],
    metrics: [
      "# of EQLs sourced by partner / quarter",
      "Partner-sourced pipeline ($) and conversion rate",
      "Pipeline forecast accuracy on partner deals",
    ],
    commonMistakes: [
      "Counting any lead from the partner as 'sourced' — no EQL definition",
      "One-off webinars with no follow-up engine",
      "Reviewing the partner's pipeline once a quarter (too late)",
    ],
    examples: [
      "A partner generating 25 EQLs / quarter through a vertical content engine — predictable",
      "A partner who hasn't sourced a deal in 6 months despite weekly meetings — relationship without GTM",
    ],
    levels: [
      lvl(1, "Silent", "Partner sources nothing.", ["Zero inbound from them"], "Agree on an EQL definition + first joint play."),
      lvl(2, "Sparks", "Occasional referral, no engine.", ["Random leads"], "Run one repeatable play and measure pipeline output."),
      lvl(3, "Engine v1", "Quarterly motion producing EQLs.", ["Defined plays", "Tracked pipeline"], "Add MDF with ROI claims; tighten cadence."),
      lvl(4, "Forecastable", "Predictable pipeline contribution every quarter.", ["Forecast-grade", "Stage parity"], "Open multiple plays in parallel."),
      lvl(5, "Demand engine", "Always-on GTM engine producing significant pipeline.", ["Multi-channel", "Compounding"], "Productize the plays for other partners."),
    ],
    lessons: [
      { key: "eql_def", title: "Define an EQL with this partner", minutes: 10, body: "Ecosystem Qualified Lead: the criteria a partner-sourced lead must meet to be 'real'. Without this, sourcing is a vanity metric.", exercise: "Co-write the EQL definition with the partner this week." },
      { key: "first_play", title: "Pick one repeatable play", minutes: 12, body: "Webinar series, vertical campaign, executive roundtable. Pick one, run it 3 times, measure each.", exercise: "Schedule the first 3 runs of one play in the next 90 days." },
      { key: "pipeline_review", title: "Stand up a monthly pipeline review", minutes: 8, body: "Joint pipeline review monthly: stages, dates, blockers. Forecast accuracy improves only when both sides own it.", exercise: "Book a recurring monthly review with the partner's commercial lead." },
    ],
    diagnostic: [
      { key: "eql_generation", prompt: "How many Ecosystem Qualified Leads (EQLs) has this partner generated for us in the last quarter?", options: ["Zero — no sourced leads", "1–2 informal referrals", "A handful (3–10) of qualified leads", "Steady flow (10+) every quarter", "Significant predictable EQL volume that compounds quarter over quarter"] },
      { key: "comarketing_activity", prompt: "Co-marketing activity with this partner in the last 6 months:", options: ["None", "1 ad-hoc activity, no follow-up", "2–3 activities, some structure", "Quarterly funded plays with attribution", "Always-on joint marketing engine producing measurable pipeline"] },
      { key: "pipeline_predictability", prompt: "How predictable is the pipeline this partner brings us?", options: ["Unpredictable — feast or famine", "Anecdotal — we 'feel' they help", "Visible pipeline, hard to forecast", "Forecastable within ±25%", "Forecast-grade — partner pipeline is reviewed and trusted like our own"] },
    ],
  },
  {
    key: "cosell",
    letter: "C",
    name: "Delivery Quality & Value",
    tagline: "Do they deliver well and package services around us?",
    color: "octa-5",
    icon: "Handshake",
    mentalModel:
      "A bad implementation by a partner becomes our brand problem. Evaluate the quality of their delivery, the services and IP they wrap around our product, and the customer's experience post-sale. Great delivery partners create stickiness; poor ones create churn we never see coming.",
    objectives: [
      "Ensure consistently high-quality implementations of our solution",
      "Encourage the partner to package value-added services around us",
      "Surface delivery friction early via CSAT / NPS on implementations",
    ],
    levers: [
      "Implementation methodology + reference architectures shared with partner",
      "Joint kickoff & QA on the partner's first 3 implementations",
      "Post-implementation CSAT survey owned jointly",
    ],
    metrics: [
      "Implementation CSAT / NPS on partner-led projects",
      "On-time / on-budget delivery rate",
      "Attach rate of partner services on top of our SaaS",
    ],
    commonMistakes: [
      "Letting the partner improvise their first implementations",
      "Never measuring CSAT on partner-delivered projects",
      "Treating the partner purely as a reseller, ignoring services value",
    ],
    examples: [
      "A partner with a productized 30-day implementation package + change management add-on — premium delivery",
      "A partner whose customers churn at month 9 because onboarding was sloppy — silent churn driver",
    ],
    levels: [
      lvl(1, "Risky", "First implementations done blind, quality unknown.", ["No CSAT", "No methodology"], "Co-deliver the next 2 implementations and document the playbook."),
      lvl(2, "Inconsistent", "Some good, some bad — depends on the consultant.", ["Variable CSAT"], "Standardize methodology and pre-flight checklist."),
      lvl(3, "Reliable", "Consistent quality, predictable timelines.", ["CSAT measured", "Methodology used"], "Add value-added services and packaging."),
      lvl(4, "Premium", "Productized services with measurable customer outcomes.", ["High CSAT", "Service IP"], "Co-author case studies; raise services pricing."),
      lvl(5, "Outcome partner", "Sells outcomes, not implementations; expansion driven by delivery quality.", ["NPS > 60", "Land-and-expand pattern"], "Position partner as a flagship delivery reference."),
    ],
    lessons: [
      { key: "method", title: "Share the implementation methodology", minutes: 10, body: "Don't make every partner reinvent. Share phases, deliverables, sample plans, and pre-flight checklists.", exercise: "Hand the methodology to the partner's delivery lead this week." },
      { key: "co_deliver", title: "Co-deliver the first projects", minutes: 12, body: "On the first 2–3 projects, embed our solution architect. After that, certify them to fly solo.", exercise: "Schedule a co-delivery on the next implementation." },
      { key: "csat", title: "Measure CSAT on every implementation", minutes: 8, body: "A simple 3-question survey: scope met, on time, would recommend. Send 30 days post go-live.", exercise: "Define and send the CSAT survey on the next 2 partner-led projects." },
    ],
    diagnostic: [
      { key: "implementation_quality", prompt: "Quality of this partner's implementations of our solution:", options: ["Unknown — we don't measure", "Inconsistent — depends on the consultant", "Generally reliable, occasional misses", "High and consistent quality with measured CSAT", "Premium — repeatedly delivers measurable customer outcomes"] },
      { key: "services_packaging", prompt: "Services and IP this partner wraps around our solution:", options: ["None — pure resale", "Generic time-and-materials only", "Defined service offering on top of us", "Productized packages with clear scope and pricing", "Differentiated IP / accelerators that increase joint deal size"] },
      { key: "csat_on_delivery", prompt: "Customer satisfaction on partner-led implementations:", options: ["Not measured", "Mixed feedback, no formal score", "Average NPS / CSAT, room to grow", "Consistently high CSAT post go-live", "Outstanding NPS — customers cite the partner as a reason to stay"] },
    ],
  },
  {
    key: "operate",
    letter: "T",
    name: "Program Engagement",
    tagline: "Are they actually using the program we built for them?",
    color: "octa-6",
    icon: "Settings2",
    mentalModel:
      "A partner program is only as valuable as the partner's actual usage of it. Evaluate how actively the partner logs into the portal, claims MDF, completes tier requirements, and climbs through the levels. Engagement is a leading indicator of revenue.",
    objectives: [
      "Drive consistent partner portal usage",
      "Maximize MDF utilization with measurable ROI",
      "Move the partner up the tier ladder on a clear timeline",
    ],
    levers: [
      "Personalized onboarding to the portal (not a generic email)",
      "Quarterly tier review with partner leadership",
      "MDF playbook with pre-approved campaigns the partner can claim",
    ],
    metrics: [
      "Portal MAU at the partner",
      "MDF utilization % and ROI per claim",
      "Tier progression timeline (months in current tier)",
    ],
    commonMistakes: [
      "Building a program nobody uses, then blaming partners",
      "Letting MDF expire because nobody walked the partner through it",
      "Tiers that don't unlock anything tangible",
    ],
    examples: [
      "A partner using the portal weekly, claiming MDF on a clear plan, on track for tier upgrade — fully engaged",
      "A partner who hasn't logged in in 90 days and never touched MDF — dormant on paper, gone in reality",
    ],
    levels: [
      lvl(1, "Dormant", "Signed but invisible inside the program.", ["No portal usage", "No MDF claims"], "Run a re-onboarding session with the partner's commercial lead."),
      lvl(2, "Occasional", "Logs in for content only.", ["Low MAU"], "Walk the partner through deal reg + MDF mechanics."),
      lvl(3, "Active", "Uses portal monthly, claims some MDF.", ["Some MDF claims"], "Set a tier-upgrade plan with quarterly milestones."),
      lvl(4, "Power user", "Uses the full program, tier progression visible.", ["High MAU", "MDF fully used"], "Co-design the next tier requirements and benefits."),
      lvl(5, "Champion", "Top-tier partner driving program adoption with peers.", ["Public reference", "Top-tier benefits"], "Recruit them into advisory board / MVP program."),
    ],
    lessons: [
      { key: "reonboard", title: "Re-onboard a dormant partner", minutes: 10, body: "Don't assume they remember. A 30-min walkthrough of the portal, deal reg, and MDF brings most dormant partners back to life.", exercise: "Schedule a re-onboarding session with one dormant partner this month." },
      { key: "mdf_plan", title: "Build a 90-day MDF plan", minutes: 12, body: "Co-write a plan with 2–3 pre-approved campaigns + claim deadlines. Don't leave MDF as 'available, contact your PDM'.", exercise: "Draft a 90-day MDF plan template and share it with the partner." },
      { key: "tier_path", title: "Show the path to the next tier", minutes: 8, body: "Partners climb tiers when the path is visible and the benefits are concrete. Make both explicit.", exercise: "Send the partner a one-pager showing current tier, gaps, and upgrade benefits." },
    ],
    diagnostic: [
      { key: "portal_usage", prompt: "How actively does this partner use our partner portal?", options: ["Never logs in", "Logs in occasionally for content", "Monthly active across multiple users", "Weekly active across roles (sales, marketing, delivery)", "Power user — daily activity, deal reg, MDF, training all in-portal"] },
      { key: "mdf_uptake", prompt: "Marketing Development Funds (MDF) utilization with this partner:", options: ["No MDF used", "MDF approved but never claimed", "Some MDF claimed, no clear plan", "MDF used on a planned set of campaigns with claims", "MDF fully utilized with measurable pipeline ROI per claim"] },
      { key: "tier_progression", prompt: "Tier progression of this partner inside our program:", options: ["Stuck at entry tier indefinitely", "Slow progression, no clear plan", "On a documented path to next tier", "Recently upgraded or on track for upgrade this year", "Top-tier partner, sustained, recognized publicly"] },
    ],
  },
  {
    key: "growth",
    letter: "G",
    name: "Collaboration & Relationship",
    tagline: "Are they proactive, transparent, and easy to operate with?",
    color: "octa-7",
    icon: "Users",
    mentalModel:
      "Day-to-day collaboration is the thermometer of a partnership. Evaluate the partner's proactivity, the transparency of their pipeline, and the quality of communication with our PDMs ('Farmers'). Strong collaboration compounds; poor collaboration silently kills even strategic partnerships.",
    objectives: [
      "Make pipeline transparency the default (not the exception)",
      "Drive proactive partner-initiated conversations (not just our outreach)",
      "Sustain a high-trust, high-cadence working rhythm with the PDM",
    ],
    levers: [
      "Weekly or bi-weekly cadence with named owners on both sides",
      "Shared pipeline view (CRM, account-mapping tool) with mutual visibility",
      "Joint Business Plan as the operating doc (not a slide deck)",
    ],
    metrics: [
      "% of pipeline visible jointly (vs. opaque)",
      "Partner-initiated touchpoints per month",
      "Response SLA (time to reply on shared deals)",
    ],
    commonMistakes: [
      "All communication initiated by the PDM",
      "Pipeline lives in their CRM only — we see it after it closes (or doesn't)",
      "JBP signed once and never refreshed",
    ],
    examples: [
      "A partner that pings us first when something changes, with full pipeline visibility — true co-pilot",
      "A partner that goes silent for weeks, then surfaces a 'surprise' deal — relationship debt",
    ],
    levels: [
      lvl(1, "Reactive", "Only responds when chased.", ["Pipeline opaque"], "Set a recurring cadence and a shared pipeline view."),
      lvl(2, "Polite", "Cordial but transactional.", ["Surface-level updates"], "Introduce a Joint Business Plan as the operating doc."),
      lvl(3, "Collaborative", "Shared pipeline + regular cadence.", ["Mutual visibility"], "Push for partner-initiated conversations on key accounts."),
      lvl(4, "Proactive", "Partner brings opportunities and risks before being asked.", ["Frequent partner-initiated pings"], "Embed JBP into both companies' QBRs."),
      lvl(5, "Co-pilot", "Indistinguishable from an internal team — full transparency, full proactivity.", ["Daily collaboration", "Trusted forecast"], "Treat them as a top-tier internal stakeholder."),
    ],
    lessons: [
      { key: "cadence", title: "Set the operating cadence", minutes: 8, body: "Weekly or bi-weekly with named owners. No agenda = no value. Standing slots build trust.", exercise: "Book a recurring cadence with a written standing agenda this week." },
      { key: "pipeline_view", title: "Open pipeline visibility", minutes: 10, body: "Use account-mapping tooling or a shared deal sheet. Mutual visibility kills surprises.", exercise: "Agree on one shared pipeline view and start using it." },
      { key: "jbp_live", title: "Make the JBP a living doc", minutes: 12, body: "A JBP signed and shelved is worse than no JBP. Refresh quarterly with the partner's commercial lead.", exercise: "Schedule the next JBP refresh in your calendar now." },
    ],
    diagnostic: [
      { key: "proactivity", prompt: "Who initiates most communication in this partnership?", options: ["Always us — silence otherwise", "Mostly us, occasional partner pings", "Roughly balanced", "Partner often initiates", "Partner is the primary driver of the operating rhythm"] },
      { key: "pipeline_transparency", prompt: "Visibility we have into this partner's pipeline on shared accounts:", options: ["No visibility — we see deals only when they close (or don't)", "Anecdotal updates from calls", "Manual shared spreadsheet, refreshed sometimes", "Live shared pipeline view, refreshed regularly", "Full mutual transparency — same view, same data, in real time"] },
      { key: "comms_quality", prompt: "Quality and cadence of communication with this partner's team:", options: ["Sporadic, no rhythm", "Monthly catch-up, mostly status", "Bi-weekly working sessions with substance", "Weekly cadence + ad-hoc deal collaboration", "Daily collaboration on live deals + structured weekly reviews"] },
    ],
  },
  {
    key: "success",
    letter: "X",
    name: "Customer Success & Impact",
    tagline: "Do their end-customers retain, expand, and recommend us?",
    color: "octa-8",
    icon: "Sparkles",
    mentalModel:
      "The end-customer is the ultimate scoreboard. Evaluate the churn rate, retention, and NPS of customers brought in by this partner. A partner that lands customers who churn is destroying value, no matter how much they sell.",
    objectives: [
      "Reduce churn rate among partner-sourced customers",
      "Increase net retention (expansion) inside the partner's customer base",
      "Lift NPS / advocacy of customers brought in by this partner",
    ],
    levers: [
      "Joint customer health reviews (PDM + partner CSM)",
      "Hand-off playbook from partner Sales to partner CS",
      "Save plays triggered by health-score drops on partner-sourced accounts",
    ],
    metrics: [
      "Logo + revenue churn on partner-sourced customers",
      "Net Revenue Retention on the partner's book",
      "End-customer NPS / CSAT",
    ],
    commonMistakes: [
      "Celebrating the close, ignoring month 6 onward",
      "No visibility into partner-sourced customer health",
      "Treating churn as the partner's problem alone",
    ],
    examples: [
      "A partner with <5% annual logo churn and >115% NRR — compounding portfolio value",
      "A partner that closes deals fast, but 30% churn at renewal — net negative contribution",
    ],
    levels: [
      lvl(1, "Blind", "We don't track the health of partner-sourced customers.", ["No data"], "Build a joint customer health view for partner-sourced accounts."),
      lvl(2, "Symptomatic", "We see churn only at renewal.", ["Reactive saves"], "Add quarterly health reviews with the partner."),
      lvl(3, "Healthy", "Visible health + acceptable churn.", ["NPS measured"], "Run save plays + expansion plays jointly."),
      lvl(4, "Expanding", "Strong retention + measurable expansion.", ["NRR > 110%", "Low churn"], "Tie partner incentives to retention, not just acquisition."),
      lvl(5, "Compounding", "Partner-sourced book is the highest-quality cohort we have.", ["NRR > 120%", "Top-quartile NPS"], "Make partner a flagship CS reference and joint advocate."),
    ],
    lessons: [
      { key: "joint_health", title: "Build a joint customer health view", minutes: 12, body: "Combine product usage, support tickets, CS notes, and partner-side signals. One view, both teams.", exercise: "Draft the health view fields and share with the partner CSM." },
      { key: "save_play", title: "Define a save play", minutes: 10, body: "When a partner-sourced account turns red, who acts? When? With what offer? Pre-decide, don't improvise.", exercise: "Write the save play one-pager and run it on the next at-risk account." },
      { key: "nps", title: "Measure end-customer NPS by partner", minutes: 8, body: "Slice NPS by partner who sold the deal. The differences are stark — and predictive of renewals.", exercise: "Pull NPS by partner for the last 12 months." },
    ],
    diagnostic: [
      { key: "end_customer_churn", prompt: "Churn rate among customers brought in by this partner:", options: ["Unknown — we don't track it", "High churn (>20% annual)", "Moderate churn (10–20% annual)", "Low churn (<10% annual)", "Best-in-class churn (<5% annual)"] },
      { key: "end_customer_nps", prompt: "End-customer NPS / satisfaction on partner-sourced accounts:", options: ["Not measured", "Below average — known dissatisfaction", "Average NPS", "Above average NPS, customers happy", "Top-quartile NPS, customers actively advocate"] },
      { key: "expansion_within_base", prompt: "Expansion (upsell / cross-sell) inside this partner's customer base:", options: ["No expansion motion — pure new logo", "Occasional expansion, ad-hoc", "Defined expansion plays, modest results", "Healthy expansion (NRR > 110%)", "Strong compounding expansion (NRR > 120%) — best cohort we have"] },
    ],
  },
];

export const MAX_LEVEL: Level = 5;

export const overallLevelLabel = (avg: number): string => {
  if (avg < 1.5) return "Misaligned";
  if (avg < 2.5) return "Emerging";
  if (avg < 3.5) return "Productive";
  if (avg < 4.5) return "Strategic";
  return "Compounding";
};

export const overallLevelDescription = (avg: number): string => {
  if (avg < 1.5) return "This partner is misaligned. Start with strategic fit before investing further.";
  if (avg < 2.5) return "Foundations are forming. Document the JBP and unlock one growth axis.";
  if (avg < 3.5) return "A productive partner. Tighten capacity, enablement, and pipeline rhythm.";
  if (avg < 4.5) return "Strategically aligned and producing. Co-invest and push toward predictable scale.";
  return "A compounding partner. Treat as a flagship — co-author the category narrative.";
};

export const xpToLevel = (xp: number) => {
  // Player level curve: every 100 XP = +1 player level.
  return Math.floor(xp / 100) + 1;
};

export const xpProgressInLevel = (xp: number) => {
  const inLevel = xp % 100;
  return { current: inLevel, max: 100, pct: inLevel };
};
