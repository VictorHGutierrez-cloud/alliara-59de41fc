import { cn } from "@/lib/utils";

import imgBringsCalm from "@/assets/kepta/kepta-brings-calm.png";
import imgRemindsGently from "@/assets/kepta/kepta-reminds-gently.png";
import imgKeepsContext from "@/assets/kepta/kepta-keeps-context.png";
import imgNoticesDrift from "@/assets/kepta/kepta-notices-drift.png";
import imgContextBeforeCall from "@/assets/kepta/kepta-context-before-call.png";
import imgEverythingOnTrack from "@/assets/kepta/kepta-everything-on-track.png";

export type KeptaIllustrationVariant =
  | "noticesDrift"
  | "remindsGently"
  | "keepsContext"
  | "bringsCalm"
  | "contextBeforeCall"
  | "everythingOnTrack";

const SRC: Record<KeptaIllustrationVariant, string> = {
  noticesDrift: imgNoticesDrift,
  remindsGently: imgRemindsGently,
  keepsContext: imgKeepsContext,
  bringsCalm: imgBringsCalm,
  contextBeforeCall: imgContextBeforeCall,
  everythingOnTrack: imgEverythingOnTrack,
};

const DEFAULT_ALT: Record<KeptaIllustrationVariant, string> = {
  noticesDrift: "Kepta noticing when study momentum slips",
  remindsGently: "Kepta offering a gentle reminder",
  keepsContext: "Kepta keeping your curriculum and context visible",
  bringsCalm: "Kepta, a calm presence beside your study rhythm",
  contextBeforeCall: "Kepta handing you context before a customer call",
  everythingOnTrack: "Kepta showing your learning path on track",
};

export interface KeptaIllustrationProps {
  variant: KeptaIllustrationVariant;
  className?: string;
  alt?: string;
  decorative?: boolean;
  onLightBackground?: boolean;
  imageLoading?: "eager" | "lazy";
}

export function KeptaIllustration({
  variant,
  className,
  alt,
  decorative = false,
  onLightBackground = false,
  imageLoading = "lazy",
}: KeptaIllustrationProps) {
  const resolvedAlt = decorative ? "" : (alt ?? DEFAULT_ALT[variant]);

  return (
    <img
      src={SRC[variant]}
      alt={resolvedAlt}
      aria-hidden={decorative ? true : undefined}
      loading={imageLoading}
      decoding="async"
      draggable={false}
      className={cn(
        "block h-auto w-auto max-w-full shrink-0 object-contain select-none",
        onLightBackground && "drop-shadow-[0_4px_18px_rgba(15,23,42,0.18)]",
        className,
      )}
    />
  );
}
