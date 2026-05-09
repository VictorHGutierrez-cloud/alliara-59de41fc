import { Link } from "@tanstack/react-router";
import { KeptIllustration, type KeptIllustrationVariant } from "@/components/brand/KeptIllustration";
import { COPY } from "@/lib/copy";

export interface KeptWorkspaceRibbonProps {
  /** Defaults to a neutral peek; pass different poses per surface for variety. */
  variant?: KeptIllustrationVariant;
}

/** Slim contextual banner — portfolio / qualification — reinforces Kept without shouting. */
export function KeptWorkspaceRibbon({ variant = "sidebarPeek" }: KeptWorkspaceRibbonProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/15 bg-primary/[0.06] px-3 py-2.5 text-sm">
      <KeptIllustration variant={variant} className="h-11 w-auto shrink-0 object-contain" decorative />
      <p className="min-w-0 flex-1 text-muted-foreground">
        <span className="font-semibold text-foreground">{COPY.kept.label}</span>
        <span aria-hidden> · </span>
        {COPY.kept.ribbonBlurb}
      </p>
      <Link
        to="/intro"
        className="shrink-0 font-semibold text-primary underline-offset-4 hover:underline min-h-11 inline-flex items-center"
      >
        {COPY.introTour.heroCta}
      </Link>
    </div>
  );
}
