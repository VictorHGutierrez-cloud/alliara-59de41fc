import { Link, useRouterState } from "@tanstack/react-router";
import { Compass, MessageCircleQuestion } from "lucide-react";
import { KeptIllustration } from "@/components/brand/KeptIllustration";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { COPY } from "@/lib/copy";
import { keptVariantForAppPath } from "@/lib/kept-route-variant";

/**
 * Fixed "quiet agent" entry — visible across the logged-in shell except on the intro tour
 * and on the Ask Kept page itself. Clicking opens two options: meet Kept (intro tour) or ask Kept anything.
 */
export function KeptAmbientPresence() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (path === "/intro" || path === "/kept/ask") return null;

  const variant = keptVariantForAppPath(path);

  return (
    <div className="pointer-events-auto fixed bottom-5 right-5 z-[45] lg:bottom-8 lg:right-8">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            title={COPY.kept.ambientTitle}
            className="flex min-h-[52px] items-center justify-center rounded-2xl border border-border/80 bg-card/95 p-2 shadow-lg backdrop-blur-sm transition hover:border-primary/35 hover:shadow-xl"
          >
            <KeptIllustration variant={variant} className="h-[52px] w-auto max-w-[76px] object-contain" decorative />
            <span className="sr-only">Open Kept</span>
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" align="end" className="w-64 p-2">
          <Link
            to="/intro"
            className="flex items-start gap-3 rounded-lg p-2.5 transition hover:bg-surface"
          >
            <Compass className="mt-0.5 h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Conheça o Kept</p>
              <p className="text-xs text-muted-foreground">Tour rápido pelo seu copiloto.</p>
            </div>
          </Link>
          <Link
            to="/kept/ask"
            className="flex items-start gap-3 rounded-lg p-2.5 transition hover:bg-surface"
          >
            <MessageCircleQuestion className="mt-0.5 h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Faça uma pergunta</p>
              <p className="text-xs text-muted-foreground">Pergunte qualquer coisa ao Kept.</p>
            </div>
          </Link>
        </PopoverContent>
      </Popover>
    </div>
  );
}
