import { Link, useRouterState } from "@tanstack/react-router";
import { KeptIllustration } from "@/components/brand/KeptIllustration";
import { keptVariantForAppPath } from "@/lib/kept-route-variant";
import { COPY } from "@/lib/copy";

/**
 * Floating entry to the Executive Academy coach — opens the full /academy/ask surface.
 */
export function KeptChatDock() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const hidden = path === "/intro" || path.startsWith("/academy/ask");

  if (hidden) return null;

  const variant = keptVariantForAppPath(path);

  return (
    <div className="pointer-events-auto fixed bottom-5 right-5 z-[45] lg:bottom-8 lg:right-8">
      <Link
        to="/academy/ask"
        title={COPY.academy.coachDockTitle}
        className="flex min-h-[52px] items-center justify-center rounded-2xl border border-border/80 bg-card/95 p-2 shadow-lg backdrop-blur-sm transition hover:border-primary/35 hover:shadow-xl"
      >
        <KeptIllustration
          variant={variant}
          className="h-[52px] w-auto max-w-[76px] object-contain"
          decorative
        />
        <span className="sr-only">{COPY.academy.coachDockTitle}</span>
      </Link>
    </div>
  );
}
