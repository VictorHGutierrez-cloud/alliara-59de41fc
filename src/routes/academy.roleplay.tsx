import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { COPY } from "@/lib/copy";
import {
  createSession,
  roleplayPersonaLabel,
  roleplayScenarioLabel,
  ROLEPLAY_DIFFICULTIES,
  ROLEPLAY_PERSONAS,
  ROLEPLAY_SCENARIOS,
} from "@/lib/coach-sessions";
import { AcademyPageShell } from "@/components/academy/AcademyPageShell";
import { AcademyAuthSkeleton } from "@/components/academy/AcademyAuthSkeleton";
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
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/academy/roleplay")({
  head: () => ({ meta: [{ title: COPY.academy.roleplayMetaTitle }] }),
  component: RoleplaySetupPage,
});

function RoleplaySetupPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [persona, setPersona] = useState("");
  const [scenario, setScenario] = useState<string>("discovery");
  const [difficulty, setDifficulty] = useState<string>("realistic");
  const [dealName, setDealName] = useState("");
  const [competitor, setCompetitor] = useState("");
  const [situation, setSituation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) void nav({ to: "/login" });
  }, [loading, user, nav]);

  if (loading || !user) return <AcademyAuthSkeleton />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || busy) return;
    if (!persona) {
      setError(COPY.academy.roleplayPersonaRequired);
      return;
    }
    setBusy(true);
    setError(null);
    const title = [roleplayPersonaLabel(persona), roleplayScenarioLabel(scenario)]
      .filter(Boolean)
      .join(" · ");
    const { session, error: createError } = await createSession(user.id, {
      mode: "roleplay",
      title: title || "Roleplay",
      deal_name: dealName.trim() || null,
      competitor: competitor.trim() || null,
      situation: situation.trim(),
      persona,
      scenario,
      difficulty,
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
      eyebrow={COPY.academy.roleplayEyebrow}
      title={COPY.academy.roleplayTitle}
      subtitle={COPY.academy.roleplayIntro}
      illustration={
        <CompanionIllustration variant="contextBeforeCall" className="h-20 w-auto" decorative />
      }
    >
      <form onSubmit={(e) => void onSubmit(e)} className="mt-8 max-w-2xl space-y-6">
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{COPY.academy.roleplayPersonaLabel}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {ROLEPLAY_PERSONAS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPersona(p.value)}
                aria-pressed={persona === p.value}
                className={cn(
                  "min-h-11 rounded-xl border px-4 py-3 text-left transition",
                  persona === p.value
                    ? "border-primary bg-accent shadow-[inset_0_0_0_1px_var(--primary)]"
                    : "border-border bg-card hover:bg-surface-2",
                )}
              >
                <span className="block text-sm font-semibold">{p.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground leading-relaxed">
                  {p.description}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="space-y-2">
          <Label>{COPY.academy.roleplayScenarioLabel}</Label>
          <Select value={scenario} onValueChange={setScenario}>
            <SelectTrigger className="min-h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLEPLAY_SCENARIOS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{COPY.academy.roleplayDifficultyLabel}</legend>
          <div className="flex flex-wrap gap-2">
            {ROLEPLAY_DIFFICULTIES.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setDifficulty(d.value)}
                aria-pressed={difficulty === d.value}
                className={cn(
                  "min-h-11 rounded-xl border px-3.5 text-sm font-semibold transition",
                  difficulty === d.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-surface-2",
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="space-y-2">
          <Label htmlFor="rp-deal">{COPY.academy.situationFormDealLabel}</Label>
          <Input
            id="rp-deal"
            value={dealName}
            onChange={(e) => setDealName(e.target.value)}
            placeholder={COPY.academy.situationFormDealPlaceholder}
            maxLength={120}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rp-competitor">{COPY.academy.situationFormCompetitorLabel}</Label>
          <Input
            id="rp-competitor"
            value={competitor}
            onChange={(e) => setCompetitor(e.target.value)}
            placeholder={COPY.academy.situationFormCompetitorPlaceholder}
            maxLength={80}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rp-context">{COPY.academy.roleplayContextLabel}</Label>
          <Textarea
            id="rp-context"
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            placeholder={COPY.academy.roleplayContextPlaceholder}
            rows={3}
            maxLength={600}
            className="min-h-[90px] resize-y"
          />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="submit" disabled={busy} className="min-h-11 rounded-xl px-5">
            {busy ? COPY.academy.situationFormSaving : COPY.academy.roleplaySubmit}
          </Button>
          <Button type="button" variant="outline" className="min-h-11 rounded-xl" asChild>
            <Link to="/academy">{COPY.academy.situationFormCancel}</Link>
          </Button>
        </div>
      </form>
    </AcademyPageShell>
  );
}
