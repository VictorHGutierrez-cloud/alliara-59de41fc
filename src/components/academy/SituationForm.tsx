import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { COPY } from "@/lib/copy";
import {
  createSession,
  DEAL_STAGES,
  type ChampionStatus,
  type CoachSessionMode,
} from "@/lib/coach-sessions";
import { AcademyPageShell } from "@/components/academy/AcademyPageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CompanionIllustration } from "@/components/brand/CompanionIllustration";

type SituationFormProps = {
  mode: "stuck" | "prep";
  eyebrow: string;
  title: string;
  intro: string;
  situationLabel: string;
  situationPlaceholder: string;
  submitLabel: string;
};

export function SituationForm({
  mode,
  eyebrow,
  title,
  intro,
  situationLabel,
  situationPlaceholder,
  submitLabel,
}: SituationFormProps) {
  const { user } = useAuth();
  const nav = useNavigate();
  const [dealName, setDealName] = useState("");
  const [stage, setStage] = useState("");
  const [champion, setChampion] = useState<ChampionStatus | "">("");
  const [competitor, setCompetitor] = useState("");
  const [situation, setSituation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || busy) return;
    const trimmed = situation.trim();
    if (!trimmed) {
      setError("Add a short note about the situation.");
      return;
    }
    setBusy(true);
    setError(null);
    const sessionMode: CoachSessionMode = mode;
    const titleParts = [
      dealName.trim() || null,
      mode === "stuck" ? "Deal stuck" : "Call prep",
    ].filter(Boolean);
    const { session, error: createError } = await createSession(user.id, {
      mode: sessionMode,
      title: titleParts.join(" · "),
      deal_name: dealName.trim() || null,
      stage: stage || null,
      has_champion: champion || null,
      competitor: competitor.trim() || null,
      situation: trimmed,
      source: "hub",
    });
    setBusy(false);
    if (!session) {
      setError(createError || COPY.academy.situationFormError);
      return;
    }
    void nav({
      to: "/academy/ask",
      search: { session: session.id },
    });
  }

  return (
    <AcademyPageShell
      backToAcademy
      eyebrow={eyebrow}
      title={title}
      subtitle={intro}
      illustration={
        <CompanionIllustration
          variant={mode === "stuck" ? "contextBeforeCall" : "keepsContext"}
          className="h-20 w-auto"
          decorative
        />
      }
    >
      <form onSubmit={(e) => void onSubmit(e)} className="mt-8 max-w-xl space-y-5">
        <div className="space-y-2">
          <Label htmlFor="deal-name">{COPY.academy.situationFormDealLabel}</Label>
          <Input
            id="deal-name"
            value={dealName}
            onChange={(e) => setDealName(e.target.value)}
            placeholder={COPY.academy.situationFormDealPlaceholder}
            maxLength={120}
          />
        </div>

        <div className="space-y-2">
          <Label>{COPY.academy.situationFormStageLabel}</Label>
          <Select value={stage || undefined} onValueChange={setStage}>
            <SelectTrigger className="min-h-11">
              <SelectValue placeholder={COPY.academy.situationFormStagePlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {DEAL_STAGES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{COPY.academy.situationFormChampionLabel}</legend>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: "yes" as const, label: COPY.academy.situationFormChampionYes },
                { id: "no" as const, label: COPY.academy.situationFormChampionNo },
                { id: "unsure" as const, label: COPY.academy.situationFormChampionUnsure },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setChampion(opt.id)}
                className={
                  champion === opt.id
                    ? "min-h-11 rounded-xl border border-foreground bg-foreground px-3.5 text-sm font-semibold text-background"
                    : "min-h-11 rounded-xl border border-border bg-card px-3.5 text-sm font-semibold hover:bg-surface-2"
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="space-y-2">
          <Label htmlFor="competitor">{COPY.academy.situationFormCompetitorLabel}</Label>
          <Input
            id="competitor"
            value={competitor}
            onChange={(e) => setCompetitor(e.target.value)}
            placeholder={COPY.academy.situationFormCompetitorPlaceholder}
            maxLength={80}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="situation">{situationLabel}</Label>
          <Textarea
            id="situation"
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            placeholder={situationPlaceholder}
            rows={4}
            maxLength={800}
            required
            className="min-h-[120px] resize-y"
          />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="submit" disabled={busy} className="min-h-11 rounded-xl px-5">
            {busy ? COPY.academy.situationFormSaving : submitLabel}
          </Button>
          <Button type="button" variant="outline" className="min-h-11 rounded-xl" asChild>
            <Link to="/academy">{COPY.academy.situationFormCancel}</Link>
          </Button>
        </div>
      </form>
    </AcademyPageShell>
  );
}
