export type TrackQuizQuestion = {
  id: string;
  prompt: string;
  choices: string[];
  /** Zero-based index of the correct choice */
  correctIndex: number;
  explanation: string;
};

export type TrackQuiz = {
  trackId: string;
  passPercent: number;
  questions: TrackQuizQuestion[];
};

export const TRACK_QUIZZES: Record<string, TrackQuiz> = {
  "psychology-101": {
    trackId: "psychology-101",
    passPercent: 70,
    questions: [
      {
        id: "psy-1",
        prompt: "In 2026 B2B buying, what usually beats a feature tour?",
        choices: [
          "Listing every module in the product",
          "Risk-first framing and loss aversion",
          "Sending a longer deck after the call",
          "Matching the buyer’s emotional tone",
        ],
        correctIndex: 1,
        explanation:
          "Buyers are overloaded. Leading with risk and what they lose by waiting works better than feature lists.",
      },
      {
        id: "psy-2",
        prompt: "Cognitive empathy means you primarily…",
        choices: [
          "Mirror the buyer’s anxiety so they feel heard",
          "Map the buyer’s constraints, politics, and decision risks",
          "Agree with every objection to build rapport",
          "Talk less so the buyer fills the silence",
        ],
        correctIndex: 1,
        explanation:
          "Cognitive empathy maps constraints and committee dynamics. Affective empathy (mirroring anxiety) can stall deals.",
      },
      {
        id: "psy-3",
        prompt: "When a buying committee is large, the “Dark Funnel” reminds you that…",
        choices: [
          "Only the Economic Buyer matters",
          "Much research happens without you in the room",
          "Demos should cover every stakeholder in one call",
          "Email is obsolete",
        ],
        correctIndex: 1,
        explanation:
          "Stakeholders research and align offline. You need a champion who sells when you are not there.",
      },
      {
        id: "psy-4",
        prompt: "Decision fatigue in buyers is best handled by…",
        choices: [
          "Offering more options and pricing tiers",
          "Narrowing the next decision to one clear ask",
          "Scheduling a longer discovery call",
          "Sending three case studies at once",
        ],
        correctIndex: 1,
        explanation:
          "Reduce choices. One clear next decision beats a menu of paths.",
      },
    ],
  },
  "meddpicc-captain": {
    trackId: "meddpicc-captain",
    passPercent: 70,
    questions: [
      {
        id: "med-1",
        prompt: "A Champion is best described as…",
        choices: [
          "The person who signs the contract",
          "An internal ally who sells for you when you leave the room",
          "Anyone who likes the demo",
          "The procurement lead",
        ],
        correctIndex: 1,
        explanation:
          "Champion ≠ Economic Buyer. The champion has influence and advocates internally.",
      },
      {
        id: "med-2",
        prompt: "If you cannot name Decision Criteria, the deal risk is mainly…",
        choices: [
          "You may be selling on features the committee does not score",
          "You will never get a demo",
          "Legal will always block you",
          "Price is already too high",
        ],
        correctIndex: 0,
        explanation:
          "Without Decision Criteria you cannot shape how the committee evaluates options.",
      },
      {
        id: "med-3",
        prompt: "Identify Pain should connect to…",
        choices: [
          "A generic industry trend slide",
          "Metrics and urgency the Economic Buyer cares about",
          "Only the IT admin’s wishlist",
          "Competitor feature gaps only",
        ],
        correctIndex: 1,
        explanation:
          "Pain without metrics or EB relevance rarely creates urgency.",
      },
      {
        id: "med-4",
        prompt: "Paper Process is weak when…",
        choices: [
          "You have a signed MSA already",
          "You do not know legal, security, and procurement steps or owners",
          "The champion is strong",
          "You discounted early",
        ],
        correctIndex: 1,
        explanation:
          "Paper Process maps how the deal actually gets signed — owners, steps, and timeline.",
      },
      {
        id: "med-5",
        prompt: "Competition in MEDDPICC includes…",
        choices: [
          "Only named SaaS rivals",
          "Named rivals and the status quo / do nothing",
          "Only the incumbent HRIS",
          "Only price comparisons",
        ],
        correctIndex: 1,
        explanation:
          "Status quo is often the real competitor. Score it explicitly.",
      },
    ],
  },
};

export function getTrackQuiz(trackId: string): TrackQuiz | undefined {
  return TRACK_QUIZZES[trackId];
}

export function scoreQuiz(
  quiz: TrackQuiz,
  answers: Record<string, number>,
): { score: number; total: number; percent: number; passed: boolean } {
  let score = 0;
  for (const q of quiz.questions) {
    if (answers[q.id] === q.correctIndex) score += 1;
  }
  const total = quiz.questions.length;
  const percent = total === 0 ? 0 : Math.round((score / total) * 100);
  return {
    score,
    total,
    percent,
    passed: percent >= quiz.passPercent,
  };
}
