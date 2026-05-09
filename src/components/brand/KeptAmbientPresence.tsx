import { Link, useRouterState } from "@tanstack/react-router";
import { KeptIllustration } from "@/components/brand/KeptIllustration";
import { COPY } from "@/lib/copy";
import { keptVariantForAppPath } from "@/lib/kept-route-variant";

/**
 * Fixed “quiet agent” entry — visible across the logged-in shell except on the intro tour itself.
 * Pose shifts by route so Kept feels present in context, not copy-pasted.
 */
export function KeptAmbientPresence() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (path === "/intro") return null;

  const variant = keptVariantForAppPath(path);

  return (
    <Link
      to="/intro"
      title={COPY.kept.ambientTitle}
      className="pointer-events-auto fixed bottom-5 right-5 z-[45] flex min-h-[52px] items-center justify-center rounded-2xl border border-border/80 bg-card/95 p-2 shadow-lg backdrop-blur-sm transition hover:border-primary/35 hover:shadow-xl lg:bottom-8 lg:right-8"
    >
      <KeptIllustration variant={variant} className="h-[52px] w-auto max-w-[76px] object-contain" decorative />
      <span className="sr-only">{COPY.introTour.heroCta}</span>
    </Link>
  );
}
