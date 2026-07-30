import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { COPY } from "@/lib/copy";
import { LMS_TRACKS } from "@/content/sales-library";
import { getTrackQuiz, scoreQuiz } from "@/content/track-quizzes";
import {
  isQuizPassed,
  pushAcademyProgress,
  saveQuizResult,
} from "@/lib/academy-progress";
import { AcademyAuthSkeleton } from "@/components/academy/AcademyAuthSkeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/academy/learn/$trackId/quiz")({
  head: () => ({ meta: [{ title: COPY.academy.quizMetaTitle }] }),
  component: TrackQuizPage,
});

function TrackQuizPage() {
  const { trackId } = Route.useParams();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const track = LMS_TRACKS.find((t) => t.id === trackId);
  const quiz = getTrackQuiz(trackId);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [passedBefore] = useState(() => isQuizPassed(trackId));

  useEffect(() => {
    if (!loading && !user) void nav({ to: "/login" });
  }, [loading, user, nav]);

  const result = useMemo(() => {
    if (!quiz || !submitted) return null;
    return scoreQuiz(quiz, answers);
  }, [quiz, answers, submitted]);

  if (loading || !user) return <AcademyAuthSkeleton />;

  if (!track || !quiz) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        <p className="text-sm text-muted-foreground">Quiz not found for this track.</p>
        <Link to="/academy/learn" className="mt-4 inline-flex text-sm font-semibold text-primary">
          {COPY.academy.quizBackToTracks}
        </Link>
      </div>
    );
  }

  function selectAnswer(questionId: string, index: number) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: index }));
  }

  function onSubmit() {
    if (!quiz) return;
    const allAnswered = quiz.questions.every((q) => answers[q.id] !== undefined);
    if (!allAnswered) return;
    const scored = scoreQuiz(quiz, answers);
    setSubmitted(true);
    saveQuizResult(trackId, {
      score: scored.percent,
      passed: scored.passed,
      correct: scored.score,
      total: scored.total,
    });
    if (user) void pushAcademyProgress(user.id);
  }

  const allAnswered = quiz.questions.every((q) => answers[q.id] !== undefined);

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 pb-32">
      <Link
        to="/academy/learn"
        className="inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {COPY.academy.quizBackToTracks}
      </Link>

      <header className="mt-4">
        <p className="page-eyebrow">Quiz</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {COPY.academy.quizTitle(track.title)}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{COPY.academy.quizIntro}</p>
        {passedBefore && !submitted ? (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" aria-hidden />
            {COPY.academy.quizPassedBadge}
          </p>
        ) : null}
      </header>

      <ol className="mt-8 space-y-6">
        {quiz.questions.map((q, qi) => {
          const selected = answers[q.id];
          const showExplain = submitted;
          return (
            <li key={q.id} className="rounded-2xl border border-border bg-card p-5">
              <p className="text-sm font-semibold">
                {qi + 1}. {q.prompt}
              </p>
              <div className="mt-3 space-y-2">
                {q.choices.map((choice, ci) => {
                  const isCorrect = ci === q.correctIndex;
                  const isSelected = selected === ci;
                  return (
                    <button
                      key={ci}
                      type="button"
                      disabled={submitted}
                      onClick={() => selectAnswer(q.id, ci)}
                      className={cn(
                        "flex w-full min-h-11 items-start rounded-xl border px-3.5 py-2.5 text-left text-sm transition",
                        !submitted && isSelected && "border-foreground bg-foreground text-background",
                        !submitted && !isSelected && "border-border hover:bg-surface-2",
                        submitted && isCorrect && "border-primary bg-primary/10 font-medium",
                        submitted && isSelected && !isCorrect && "border-destructive/50 bg-destructive/5",
                        submitted && !isSelected && !isCorrect && "border-border opacity-70",
                      )}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>
              {showExplain ? (
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-foreground">{COPY.academy.quizExplanation}: </span>
                  {q.explanation}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>

      {!submitted ? (
        <Button
          type="button"
          className="mt-8 min-h-11 rounded-xl"
          disabled={!allAnswered}
          onClick={onSubmit}
        >
          {COPY.academy.quizSubmit}
        </Button>
      ) : result ? (
        <div className="mt-8 rounded-2xl border border-border bg-surface-2/60 p-5">
          <p className="text-base font-semibold">
            {COPY.academy.quizScore(result.score, result.total)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {result.passed ? COPY.academy.quizPassed : COPY.academy.quizFailed}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild className="min-h-11 rounded-xl">
              <Link to="/academy/learn">{COPY.academy.quizBackToTracks}</Link>
            </Button>
            {!result.passed ? (
              <Button
                type="button"
                variant="outline"
                className="min-h-11 rounded-xl"
                onClick={() => {
                  setAnswers({});
                  setSubmitted(false);
                }}
              >
                {COPY.academy.quizRetakeCta}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
