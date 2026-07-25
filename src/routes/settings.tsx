import { Link, useNavigate, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { COPY } from "@/lib/copy";
import { COMPANION_META } from "@/lib/companion";
import { useCompanion } from "@/lib/companion-context";
import { CompanionIllustration } from "@/components/brand/CompanionIllustration";
import { AcademyPageShell } from "@/components/academy/AcademyPageShell";
import { AcademyAuthSkeleton } from "@/components/academy/AcademyAuthSkeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: COPY.settings.pageMetaTitle },
      { name: "description", content: COPY.settings.pageIntro },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, loading, signOut } = useAuth();
  const nav = useNavigate();
  const { companion, setCompanion } = useCompanion();
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) void nav({ to: "/login" });
  }, [loading, user, nav]);

  useEffect(() => {
    if (user) {
      setDisplayName(
        (user.user_metadata?.full_name as string | undefined) ??
          (user.user_metadata?.name as string | undefined) ??
          "",
      );
    }
  }, [user]);

  async function saveProfile() {
    if (!user) return;
    setBusy(true);
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.auth.updateUser({
      data: { full_name: displayName.trim() || null },
    });
    setBusy(false);
    if (error) toast.error(COPY.settings.saveError);
    else toast.success(COPY.settings.savedToast);
  }

  if (loading || !user) return <AcademyAuthSkeleton />;

  return (
    <AcademyPageShell
      eyebrow={COPY.settings.eyebrow}
      title={COPY.settings.pageTitle}
      subtitle={COPY.settings.pageIntro}
      backToAcademy
    >
      <section className="mt-8 max-w-lg space-y-6">
        <div className="rounded-2xl border border-border/60 bg-card p-5 card-elev space-y-4">
          <h2 className="text-sm font-semibold">{COPY.settings.profileSection}</h2>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">{COPY.settings.nameLabel}</span>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            />
          </label>
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">{COPY.settings.emailLabel}</span>
            <p className="rounded-xl border border-border/60 bg-surface/50 px-3 py-2.5 text-sm text-muted-foreground">
              {user.email}
            </p>
            <p className="text-[11px] text-muted-foreground">{COPY.settings.emailHint}</p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void saveProfile()}
            className="inline-flex min-h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5 card-elev space-y-4">
          <h2 className="text-sm font-semibold">{COPY.companion.settingsTitle}</h2>
          <p className="text-sm text-muted-foreground">{COPY.companion.settingsBody}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["kept", "kepta"] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setCompanion(id);
                  toast.success(`${COMPANION_META[id].name} is now your study companion.`);
                }}
                className={cn(
                  "flex flex-col items-center rounded-xl border p-4 transition",
                  companion === id
                    ? "border-foreground bg-surface-2"
                    : "border-border hover:border-foreground/30",
                )}
              >
                <CompanionIllustration
                  forceCompanion={id}
                  variant="bringsCalm"
                  className="h-20 w-auto"
                  decorative
                />
                <span className="mt-2 text-sm font-semibold">{COMPANION_META[id].name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5 card-elev">
          <h2 className="text-sm font-semibold">{COPY.settings.tourLink}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{COPY.settings.tourLinkHint}</p>
          <Link
            to="/onboarding/welcome"
            className="mt-4 inline-flex min-h-10 items-center rounded-xl border border-border px-4 text-sm font-semibold hover:bg-surface-2"
          >
            {COPY.onboarding.replayCta}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => signOut()}
          className="inline-flex min-h-10 items-center rounded-xl border border-destructive/40 px-4 text-sm font-semibold text-destructive hover:bg-destructive/5"
        >
          {COPY.settings.signOutCta}
        </button>
      </section>
    </AcademyPageShell>
  );
}
