import { Link } from "@tanstack/react-router";
import { KeptIllustration, type KeptIllustrationVariant } from "@/components/brand/KeptIllustration";
import { COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";

export interface KeptWorkspaceRibbonProps {
  /** Defaults to a neutral peek; pass different poses per surface for variety. */
  variant?: KeptIllustrationVariant;
  /** Tighter padding and type — e.g. sticky page headers. */
  compact?: boolean;
  className?: string;
}

/** Slim contextual banner — portfolio / qualification — reinforces Kept without shouting. */
export function KeptWorkspaceRibbon({
  variant = "sidebarPeek",
  compact = false,
  className,
}: KeptWorkspaceRibbonProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-xl border border-primary/15 bg-primary/[0.06]",
        compact ? "gap-2 px-2.5 py-1.5 text-xs" : "gap-3 px-3 py-2.5 text-sm",
        className,
      )}
    >
      <KeptIllustration
        variant={variant}
        className={cn("w-auto shrink-0 object-contain", compact ? "h-8" : "h-11")}
        decorative
      />
      <p className="min-w-0 flex-1 text-muted-foreground">
        <span className="font-semibold text-foreground">{COPY.kept.label}</span>
        <span aria-hidden> · </span>
        {COPY.kept.ribbonBlurb}
      </p>
      <Link
        to="/intro"
        className={cn(
          "inline-flex shrink-0 items-center font-semibold text-primary underline-offset-4 hover:underline",
          compact ? "min-h-9 text-xs" : "min-h-11",
        )}
      >
        {COPY.introTour.heroCta}
      </Link>
    </div>
  );
}
