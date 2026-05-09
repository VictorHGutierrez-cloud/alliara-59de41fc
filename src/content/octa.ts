// rev: octa-partner-centric
// OCTA Methodology — content model for the OCTA OS platform.
// Partner-centric edition: every axis evaluates the PARTNER's capability,
// not the orchestrator's internal program. Used by the Readiness Assessment,
// the Joint Business Plan, the Partner Intel decoder, and Kept (presence assistant).

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

export const CENTRAL_MENTAL_MODEL = `Think of each partner as its own little growth engine—messy, human, and worth understanding on its own terms.

OCTA gives you a shared language for that work: eight axes that spell out revenue maturity without turning people into spreadsheets. You're not running a generic program from HQ—you're orchestrating a portfolio of alliances, often one Joint Business Plan at a time.

When the frame is kind and clear, diagnostics and plans stay grounded—and partners recognize themselves in the story.`;

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
    tagline: "Are they aiming at the same customers—and the same future—you care about?",
    color: "octa-1",
    icon: "Compass",
    mentalModel:
      "Fit isn't logos on a slide. It's whether their Ideal Customer Profile, culture, and growth ambition pull in the same direction as yours—or quietly compete. You're checking alignment so nobody wastes empathy chasing the wrong deals.",
    objectives: [
      "Confirm they're hunting the same ICP you are—not just familiar logos",
      "Sense-check culture and working style with someone who can say yes at exec level",
      "Surface their 1–3 year ambition and where you honestly fit",
    ],
    levers: [
      "Run a joint ICP mapping session with their leaders—coffee, not theater",
      "Trade stories about vision and where you both win (skip the one-sided pitch)",
      "Keep a simple strategic-fit scorecard you revisit each quarter",
    ],
    metrics: [
      "% of their pipeline that actually sits inside your shared ICP",
      "Exec-to-exec touchpoints each quarter (quality over quantity)",
      "Your honest PDM fit score (1–5), refreshed quarterly",
    ],
    commonMistakes: [
      "Assuming overlap on paper means you're strategically aligned",
      "Never meeting their CEO or commercial leader—and guessing instead",
      "Letting them chase every lead even when it's miles outside your ICP",
    ],
    examples: [
      "Their top verticals match yours—you're compounding, not colliding",
      "They're busy everywhere except where you sell—high motion, low alignment",
    ],
    levels: [
      lvl(1, "Misaligned", "Their ICP, values, or ambition drift away from yours.", ["Random deals", "No exec relationship"], "Host a joint ICP + ambition working session with their leadership."),
      lvl(2, "Curious", "There's overlap, but no shared story yet.", ["Exec chats are sporadic", "Pipeline feels generic"], "Draft a one-page strategic-fit memo and read it together."),
      lvl(3, "Aligned", "Shared ICP and ambition—written down and believable.", ["Quarterly exec cadence", "Most pipeline respects the ICP"], "Turn the alignment into a Joint Business Plan with shared targets."),
      lvl(4, "Co-invested", "Both sides put people and budget behind the same bet.", ["Named sponsors both sides", "Joint OKRs exist"], "Treat each other as Tier-1 strategic accounts."),
      lvl(5, "Strategic Twin", "Your strategies feel like one narrative.", ["Multi-year plan together", "Category story co-authored"], "Go after category leadership and platform bets as true peers."),
    ],
    lessons: [
      { key: "icp_fit", title: "Score this partner's ICP fit", minutes: 10, body: "Pull their last ~20 wins and tag in/out of your ICP. Rough math: under 40% overlap feels misaligned; north of 70% feels strong.", exercise: "Tag those last 20 closes this week—no perfectionism, just honesty." },
      { key: "values_check", title: "Have the values + ambition chat", minutes: 12, body: "Book 45 minutes exec-to-exec: where do we want to be in three years, and where do we actually win together? No demo deck.", exercise: "Get it on the calendar this month and jot a one-page takeaway." },
      { key: "fit_score", title: "Keep a five-input fit scorecard", minutes: 8, body: "Score 1–5 on ICP overlap, exec engagement, ambition fit, culture, and mutual investment—refresh quarterly so stories don't drift.", exercise: "Score today's reality with those five inputs." },
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
    tagline: "Do they have real sales and delivery bench—or only good intentions?",
    color: "octa-2",
    icon: "Package",
    mentalModel:
      "Capacity is the ceiling nobody mentions until deals stall. Look at how many people actually sell your solution, how crisp their process is, and whether delivery can absorb wins. Alignment without bandwidth is just a hopeful spreadsheet.",
    objectives: [
      "Map sellers and overlay roles—names beat headcount totals",
      "Look at delivery depth by role and seniority, not job titles alone",
      "Name the bottlenecks that would break if pipeline doubled next quarter",
    ],
    levers: [
      "Review capacity together quarterly—make trade-offs explicit",
      "Explore hiring or MDF investments tied to shared targets",
      "Share enablement that grows bench strength (plays, accelerators, shadowing)",
    ],
    metrics: [
      "Dedicated sellers + dedicated delivery FTEs on your line",
      "How much of their quota bag covers your solution vs. everything else",
      "Delivery utilization and backlog (weeks of wait)",
    ],
    commonMistakes: [
      "Celebrating total partner headcount instead of people really covering you",
      "Discovering delivery gaps only when CSAT tanks",
      "Letting one heroic seller carry the whole motion",
    ],
    examples: [
      "Two named AEs plus a four-person delivery pod living your stack—built to scale",
      "A huge SI with one occasional seller—structurally thin no matter the logo",
    ],
    levels: [
      lvl(1, "Single point", "One person sells and delivers—the partnership rides on them.", ["Bus factor of 1"], "Name a second seller and a second delivery lead inside their shop."),
      lvl(2, "Ad-hoc team", "A loose handful helps when it's convenient.", ["No quota owner", "Shared resources only"], "Negotiate at least one named, quota-carrying seller."),
      lvl(3, "Dedicated pod", "Named sellers and delivery folks with real targets.", ["Quota agreement exists", "Bench mapped"], "Publish a hiring or bench plan with milestones."),
      lvl(4, "Scalable bench", "Structured teams can run multiple deals without chaos.", ["Several pods", "Backlog healthy"], "Co-invest in expansion—make hiring mutual."),
      lvl(5, "Production engine", "They absorb pipeline spikes without breaking customer trust.", ["Regional depth", "Repeatable factory"], "Treat them like an extension of your revenue engine."),
    ],
    lessons: [
      { key: "capacity_map", title: "Map who's actually on your deal", minutes: 12, body: "List sellers, pre-sales, delivery, support—with realistic % time on you. Org charts lie; names tell the truth.", exercise: "Draft that named map this week." },
      { key: "quota_cov", title: "Quantify quota coverage", minutes: 10, body: "Add up quotas or revenue targets tied to your line versus the joint goal—coverage gaps become obvious fast.", exercise: "Run the coverage math for this partner." },
      { key: "delivery_bench", title: "Audit delivery bandwidth", minutes: 10, body: "Roles, certs, utilization. Overselling an empty bench wrecks CSAT—better to know early.", exercise: "List delivery FTEs + utilization for the next 90 days." },
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
    tagline: "Can they run discovery and demos without you babysitting every slide?",
    color: "octa-3",
    icon: "GraduationCap",
    mentalModel:
      "If every meeting needs your SE, that's tax—not leverage. Notice depth of product fluency, certs, and whether they can finish cycles alone. You're cheering independence, not heroics from your side.",
    objectives: [
      "Grow certified contacts across roles that matter",
      "Get reps running discovery + demos solo with safety nets",
      "Push technical objections to them first—you jump in as backup, not default",
    ],
    levers: [
      "Role-based paths (sales, pre-sales, delivery) with clear outcomes",
      "Cert gates tied to tier or co-sell eligibility—fair and transparent",
      "Office hours, sandboxes, shadow-then-solo rituals",
    ],
    metrics: [
      "Certified contacts per role",
      "% of demos partner-led vs. you-led",
      "Win rate when they own the cycle vs. when you rescue it",
    ],
    commonMistakes: [
      "Training one superstar who might leave next quarter",
      "Certs that unlock nothing tangible—demotivating fast",
      "Letting discovery live only on your calendar forever",
    ],
    examples: [
      "Six certified reps running solo demos—real multiplication",
      "One tired expert escalating every technical ping—fragile dependency",
    ],
    levels: [
      lvl(1, "Spectator", "They mostly watch you pitch.", ["No certs", "You demo everything"], "Enroll two reps on the sales cert path this quarter."),
      lvl(2, "Talker", "They can warm up the room—not own discovery.", ["One certified contact"], "Train pre-sales and run shadow-then-solo demos."),
      lvl(3, "Doer", "They run discovery + demo with light backup.", ["Sales + pre-sales certified"], "Add technical cert + POC ownership."),
      lvl(4, "Independent", "Full cycles solo, objections included.", ["Bench of certified roles"], "Invite them to mentor other reps internally."),
      lvl(5, "Teacher", "They train peers and answer hard questions upstream.", ["Internal champion network"], "Spotlight them as reference trainers."),
    ],
    lessons: [
      { key: "paths", title: "Sketch role-specific learning paths", minutes: 10, body: "Sales vs. pre-sales vs. delivery—generic LMS playlists rarely stick.", exercise: "Draft three-role paths for this partner." },
      { key: "shadow_solo", title: "Try shadow-then-solo demos", minutes: 10, body: "Shadow you, then you shadow them, then solo—track who clears each stage.", exercise: "Pick two reps and start the ladder." },
      { key: "winrate", title: "Compare win rate: them vs. rescue mode", minutes: 8, body: "If solo closes lag hard, enablement gaps are obvious—and fixable.", exercise: "Slice the last six months of deals." },
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
    tagline: "Are they sourcing real EQLs—or mostly riding your pipeline coat-tails?",
    color: "octa-4",
    icon: "TrendingUp",
    mentalModel:
      "Partners who never originate pipeline behave like fulfillment shops. Look at EQL quality, repeatable co-marketing, and whether forecasts feel honest. Predictable partner-sourced pipe is one of the loudest signals they're truly in market with you.",
    objectives: [
      "Grow partner-sourced EQLs quarter over quarter—definitions matter",
      "Stand up co-marketing plays you can repeat and measure",
      "Make their pipeline forecast-grade with stages, dates, owners",
    ],
    levers: [
      "Joint GTM plan with named plays (webinars, vertical pushes, events)",
      "MDF with receipts—know what each dollar produced",
      "Monthly-ish pipeline huddle minimum—not quarterly surprises",
    ],
    metrics: [
      "EQLs sourced per quarter",
      "Partner-sourced pipeline $ and conversion",
      "Forecast accuracy on joint deals",
    ],
    commonMistakes: [
      "Calling every fuzzy referral an EQL—definitions slip",
      "One flashy webinar with no follow-through engine",
      "Reviewing pipeline once a quarter—far too late to steer",
    ],
    examples: [
      "~25 steady EQLs per quarter from a vertical content rhythm",
      "Weekly meetings but zero sourced deals for six months—relationship without GTM",
    ],
    levels: [
      lvl(1, "Silent", "Nothing sourced—yet.", ["Zero inbound from them"], "Agree what counts as an EQL and pick a first joint play."),
      lvl(2, "Sparks", "Occasional referrals, no engine.", ["Random leads"], "Run one repeatable play three times and track outcomes."),
      lvl(3, "Engine v1", "Quarterly rhythm producing qualified leads.", ["Named plays", "Pipeline tracked"], "Add MDF with ROI stories; tighten cadence."),
      lvl(4, "Forecastable", "You can plan around their contribution.", ["Forecast hygiene", "Stage parity"], "Launch parallel plays once the first works."),
      lvl(5, "Demand engine", "Always-on motions feeding meaningful pipe.", ["Multi-channel muscle"], "Package what worked so other partners can borrow it."),
    ],
    lessons: [
      { key: "eql_def", title: "Co-write the EQL definition", minutes: 10, body: "Spell what makes a partner lead real—budget, timing, buyer power—so nobody debates vanity metrics.", exercise: "Partner workshop this week; one paragraph definition." },
      { key: "first_play", title: "Pick one play and repeat it", minutes: 12, body: "Webinar, vertical sprint, exec dinner—run it three times, compare apples to apples.", exercise: "Schedule three runs inside 90 days." },
      { key: "pipeline_review", title: "Commit to a monthly pipeline touchpoint", minutes: 8, body: "Stages, dates, blockers—forecast accuracy loves rhythm.", exercise: "Recurring invite with their commercial lead." },
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
    tagline: "Do customers land well—and stay happy—when this partner delivers?",
    color: "octa-5",
    icon: "Handshake",
    mentalModel:
      "Their implementation becomes your reputation echo. Look at delivery craft, services wrapped around you, and honest CSAT. Solid delivery creates expansion; messy delivery leaks churn you never see on your own dashboards.",
    objectives: [
      "Keep partner-led implementations consistently strong",
      "Encourage packaged services that deepen value—not generic hours",
      "Surface friction early with lightweight CSAT/NPS loops",
    ],
    levers: [
      "Share implementation methodology + reference architectures generously",
      "Co-kickoff + QA their first few runs side by side",
      "Joint post-go-live survey both teams actually read",
    ],
    metrics: [
      "CSAT/NPS on partner-delivered projects",
      "On-time / on-budget delivery rate",
      "Attach rate of partner services on your SaaS",
    ],
    commonMistakes: [
      "Letting early implementations improvise with no safety rails",
      "Skipping CSAT on partner-led work—blind spots hurt everyone",
      "Ignoring services upside and treating them like pure resale",
    ],
    examples: [
      "Productized 30-day launch plus change-management add-on—premium delivery",
      "Customers churn around month nine after sloppy onboarding—silent leak",
    ],
    levels: [
      lvl(1, "Risky", "Early projects feel improvised—quality unknown.", ["No CSAT", "No playbook"], "Co-deliver the next two and capture the recipe."),
      lvl(2, "Inconsistent", "Hero consultants shine; average ones struggle.", ["Variable CSAT"], "Standardize methodology + pre-flight checklist."),
      lvl(3, "Reliable", "Delivery timelines and quality feel predictable.", ["CSAT tracked", "Playbook used"], "Layer packaged services with crisp scope."),
      lvl(4, "Premium", "Outcome-focused packages customers upsell into.", ["High CSAT", "Services IP"], "Co-write proof-point stories."),
      lvl(5, "Outcome partner", "Expansion rides on delivery excellence.", ["NPS hero territory"], "Feature them as flagship delivery."),
    ],
    lessons: [
      { key: "method", title: "Hand them your implementation recipe", minutes: 10, body: "Phases, deliverables, sample plans—don't make every partner reinvent from scratch.", exercise: "Send the packet to their delivery lead this week." },
      { key: "co_deliver", title: "Embed on the first projects", minutes: 12, body: "Two or three joint deliveries, then certify them to fly solo with checkpoints.", exercise: "Schedule the next joint implementation." },
      { key: "csat", title: "Measure CSAT every time", minutes: 8, body: "Three humble questions post go-live—scope, timing, recommend?", exercise: "Define the mini survey for the next two launches." },
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
    tagline: "Are they inside your portal, MDF, and tiers—or signed up and ghosting?",
    color: "octa-6",
    icon: "Settings2",
    mentalModel:
      "Programs only matter if partners actually use them. Notice portal habits, MDF claims, tier progression. Engagement is an early heartbeat for revenue—you'll feel momentum or drift here first.",
    objectives: [
      "Steady partner portal usage that isn't performative",
      "MDF spend that ties to measurable ROI stories",
      "Tier climbs with dates everyone understands",
    ],
    levers: [
      "White-glove portal onboarding—not a blast email",
      "Quarterly tier talk with someone who owns targets",
      "MDF cookbook with pre-approved plays they can claim fast",
    ],
    metrics: [
      "Monthly active portal users at the partner",
      "MDF utilization % and ROI per claim",
      "Months stuck in tier limbo",
    ],
    commonMistakes: [
      "Launching a gorgeous portal nobody adopts—then blaming partners",
      "MDF expiring because no one walked them through claims",
      "Tiers that promise perks that don't exist—trust dies",
    ],
    examples: [
      "Weekly portal habit, MDF on a plan, tier upgrade on track—fully alive",
      "No login for 90 days, MDF untouched—dormant in practice",
    ],
    levels: [
      lvl(1, "Dormant", "Signed—then quiet inside the program.", ["No portal use", "No MDF"], "Re-onboard with their commercial lead in plain language."),
      lvl(2, "Occasional", "Shows up for content drops only.", ["Low MAU"], "Walk deal reg + MDF mechanics together live."),
      lvl(3, "Active", "Monthly portal rhythm, some MDF traction.", ["MDF claims exist"], "Map tier milestones quarter by quarter."),
      lvl(4, "Power user", "Uses the full stack—tier story is visible.", ["Strong MAU", "MDF working"], "Co-design next-tier perks they'll feel."),
      lvl(5, "Champion", "Top tier—helps peers adopt.", ["Public shout-outs"], "Invite them into advisory / MVP circles."),
    ],
    lessons: [
      { key: "reonboard", title: "Revive a dormant partner gently", minutes: 10, body: "Assume amnesia—30 minutes on portal, MDF, deal reg revives most ghosts.", exercise: "Schedule one re-onboard this month." },
      { key: "mdf_plan", title: "Draft a 90-day MDF storyboard", minutes: 12, body: "Two or three approved campaigns + deadlines beats ‘MDF available, ping me.’", exercise: "Share a template they can fill with you." },
      { key: "tier_path", title: "Make tier jumps legible", minutes: 8, body: "Show current tier, gaps, perks—mystery ladders stall climbs.", exercise: "Send the one-pager today." },
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
    tagline: "Day-to-day: proactive, transparent, and actually pleasant to run?",
    color: "octa-7",
    icon: "Users",
    mentalModel:
      "Daily collaboration is the thermometer. You're noticing initiative, pipeline honesty, and whether working sessions feel mutual. Great rhythm compounds; ghosting quietly kills even strategic deals.",
    objectives: [
      "Default to shared pipeline—not mystery spreadsheets after closes",
      "See partner-initiated conversations, not only your pings",
      "Keep a humane cadence with their Farmers and yours",
    ],
    levers: [
      "Weekly or bi-weekly touchpoints with named owners both sides",
      "Shared pipeline views or mapping tools everyone trusts",
      "Living Joint Business Plan—not a PDF graveyard",
    ],
    metrics: [
      "% of pipeline you can see together vs. opaque",
      "Partner-started touches per month",
      "Reply SLA on live deals",
    ],
    commonMistakes: [
      "You initiate everything—they only react",
      "Pipeline trapped in their CRM until surprises arrive",
      "JBP signed once, never reopened",
    ],
    examples: [
      "They Slack first when reality shifts—full visibility feels like co-piloting",
      "Silent weeks then surprise deals—relationship debt mounts",
    ],
    levels: [
      lvl(1, "Reactive", "Only speaks when nudged.", ["Opaque pipeline"], "Book a steady cadence + shared pipeline view."),
      lvl(2, "Polite", "Friendly status pings—little substance.", ["Surface updates"], "Stand up a Joint Business Plan everyone edits."),
      lvl(3, "Collaborative", "Shared pipe + predictable rhythm.", ["Mutual visibility"], "Ask for partner-led conversations on key accounts."),
      lvl(4, "Proactive", "Surfaces risks and upside unprompted.", ["Frequent partner pings"], "Embed JBP into both companies' QBR rituals."),
      lvl(5, "Co-pilot", "Feels like one blended team.", ["Daily collaboration on deals"], "Treat them as top-tier internal stakeholders."),
    ],
    lessons: [
      { key: "cadence", title: "Lock the operating cadence", minutes: 8, body: "Weekly or bi-weekly slots with owners—no agenda, no trust.", exercise: "Book it with a standing outline." },
      { key: "pipeline_view", title: "Pick one shared pipeline truth", minutes: 10, body: "Mapping tool or shared sheet—mutual visibility kills nasty surprises.", exercise: "Agree the tool and start logging deals." },
      { key: "jbp_live", title: "Keep the JBP breathing", minutes: 12, body: "Shelf-worn JBPs hurt worse than none—refresh quarterly with their commercial lead.", exercise: "Drop the next refresh on your calendar now." },
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
    tagline: "Do customers they bring stick around—and grow—with warmth?",
    color: "octa-8",
    icon: "Sparkles",
    mentalModel:
      "End-customers are the honest scoreboard. Churn or weak expansion through a partner still lands on your category story. You're watching retention, NRR, and advocacy for logos they influenced—numbers should feel humane, not punitive.",
    objectives: [
      "Shrink churn on partner-sourced accounts with empathy-first saves",
      "Grow expansion inside their installed base",
      "Lift NPS/advocacy so referrals feel natural",
    ],
    levers: [
      "Joint customer health reviews (you + their CS leader)",
      "Clean handoffs from partner sales to partner CS",
      "Save plays when health scores dip—decided in advance",
    ],
    metrics: [
      "Logo + revenue churn on partner-sourced accounts",
      "Net revenue retention on their book",
      "End-customer NPS / CSAT slices",
    ],
    commonMistakes: [
      "Celebrating the close and ignoring month six onward",
      "Zero visibility into partner-sourced customer health",
      "Treating churn like ‘their problem’—customers disagree",
    ],
    examples: [
      "Low churn + strong NRR—portfolio quietly compounds",
      "Fast logos but ugly renewals—net drag hides in averages",
    ],
    levels: [
      lvl(1, "Blind", "Little/no tracking after handoff.", ["No shared health view"], "Create a joint health snapshot for partner-sourced logos."),
      lvl(2, "Symptomatic", "Problems surface only near renewal.", ["Reactive saves"], "Layer quarterly health reviews."),
      lvl(3, "Healthy", "Trend visible—churn acceptable.", ["NPS sampled"], "Run paired save + expansion plays."),
      lvl(4, "Expanding", "Retention strong—upsell motion humming.", ["NRR >110%", "Low churn"], "Align incentives with retention, not only bookings."),
      lvl(5, "Compounding", "Their cohort is your happiest.", ["NRR hero territory"], "Spotlight joint advocacy stories."),
    ],
    lessons: [
      { key: "joint_health", title: "Merge signals into one health snapshot", minutes: 12, body: "Usage + tickets + CS notes + partner color—one glance both teams trust.", exercise: "List fields and share with their CS counterpart." },
      { key: "save_play", title: "Pre-agree a save play", minutes: 10, body: "Who moves first? What offers help? Decide before midnight emergencies.", exercise: "Draft the one-pager before the next red account." },
      { key: "nps", title: "Slice NPS by partner", minutes: 8, body: "Variance across partners predicts renewals better than averages.", exercise: "Pull twelve trailing months." },
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
