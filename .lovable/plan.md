## Context — what's already done

Looking at `partner.$partnerId.coach.tsx` and `supabase/functions/ai-coach/index.ts`, since the last review you already shipped:

- **Metrics passed in** (`metricsSummary` from `partner_metrics`: MRR, open/won deals, trained, notes).
- **History collapsed** — only the most recent run shows; older runs hide behind `<details>` ("earlier Kept runs").
- **Delete button per run.**
- **Narrow mode when notes exist** — schema drops to 2 recs + 2-3 actions and prompt says "tie every item to the PDM question first."

So Phases 2 and 3 from the previous plan are essentially done. The remaining problem is **quality**, not volume.

## Why it's still generic

The example you showed: you asked *"How can I make my partner go to my weeklys?"* and Kept replied with "Define 90-day Co-Marketing Plan", "Identify Technical Team for Certification", "Pilot Independent POC". That's three unrelated growth-plan moves — none answers the actual question.

Three concrete causes:

1. **Wrong output shape for a question.** Notes mode still forces the generic `summary + recommendations[] + action_items[]` schema across multiple axes. The model treats your question as a hint to "tune emphasis" of a standard plan, not as the deliverable. There is no field called "answer to your question."
2. **Schema rewards breadth.** `axis_key` is required on every item, so the model spreads suggestions across axes (cosell, enable, growth) instead of staying inside the one axis the question lives in (here: operating cadence / co-sell rituals).
3. **Model + temperature.** `gemini-2.5-flash` with no temperature override defaults to creative output and frequently ignores "max ~22 words" / "two steps only" constraints. We see that in your screenshot.

## Proposed fix — Q&A mode

When `sessionContext` is non-empty, treat the run as a **direct question to Kept**, not a plan generation. Implementation in three small edits, all in `supabase/functions/ai-coach/index.ts`:

### 1. New tool schema for question mode

A separate tool `answer_pdm_question` returned only when notes are present:

```text
{
  question_restated: string         // one short line — proves Kept understood it
  short_answer: string              // 1–2 sentences, max ~40 words, directly answers
  why_it_works: string              // 1 sentence, grounded in scores/metrics
  next_moves: [                     // exactly 2, both about the SAME axis
    { title, owner_hint, when, axis_key }
  ]
  if_they_say_no: string            // 1 sentence fallback
}
```

No `summary`, no multi-axis recommendation array, no target_level wall. The UI for these runs renders this shape directly (compact card: question → answer → 2 moves → fallback).

### 2. Prompt change

Replace "tune emphasis" wording with: *"The PDM is asking you a specific question. Your entire output must answer it. Pick the single dimension this question lives in. Do not propose work in other dimensions. Use scores and metrics only as evidence."*

Add 3–4 worked examples in the system prompt covering the common question types (cadence/attendance, pipeline pushing, training, escalation) so the model has a pattern to follow.

### 3. Model + temperature for question mode

Switch question mode to `google/gemini-2.5-pro` with `temperature: 0.3`. Plan-generation mode stays on flash. The cost delta is negligible (one call per click) and Pro respects length and focus constraints far better.

### Frontend (small)

`partner.$partnerId.coach.tsx` `RecommendationCard` gets a branch: if `rec.content` has `question_restated`, render the Q&A layout; otherwise render the existing plan layout. The "+ Add" button on `next_moves` reuses `addSuggestedCoachAction` with `axis_key` and `title` from each move.

### Out of scope (not doing now)

- No DB schema change — Q&A payload still stored in `ai_recommendations.content` jsonb.
- No change to plan-generation mode (no notes → same behavior as today).
- No history grouping by question.

### Verification

Re-run your exact prompt *"How can I make my partner going to my weeklys?"* on the Actabl partner. Expected: a card titled with that question, a 1–2 sentence answer about cadence/agenda/owner, two moves both inside the operate or cosell axis, and a fallback line for when they no-show. No mention of certification, MDF, or 90-day GTM plans.
