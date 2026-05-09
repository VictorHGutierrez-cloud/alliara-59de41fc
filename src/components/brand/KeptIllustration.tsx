import { cn } from "@/lib/utils";

import imgBringsCalm from "@/assets/kept/kept-brings-calm.png";
import imgRemindsGently from "@/assets/kept/kept-reminds-gently.png";
import imgKeepsContext from "@/assets/kept/kept-keeps-context.png";
import imgNoticesDrift from "@/assets/kept/kept-notices-drift.png";
import imgNotifySomethingToCheck from "@/assets/kept/kept-notify-something-to-check.png";
import imgAtRisk from "@/assets/kept/kept-at-risk.png";
import imgContextBeforeCall from "@/assets/kept/kept-context-before-call.png";
import imgEverythingOnTrack from "@/assets/kept/kept-everything-on-track.png";

export type KeptIllustrationVariant =
  | "noticesDrift"
  | "remindsGently"
  | "keepsContext"
  | "bringsCalm"
  | "notifySomethingToCheck"
  | "atRisk"
  | "contextBeforeCall"
  | "everythingOnTrack"
  | "sidebarPeek"
  | "jbpStanding"
  | "radarLooking"
  | "idleAllClear";

/** Eight Kept poses (light backgrounds); variants sidebarPeek, jbpStanding, radarLooking, idleAllClear reuse masters until bespoke art ships. */
const SRC: Record<KeptIllustrationVariant, string> = {
  noticesDrift: imgNoticesDrift,
  remindsGently: imgRemindsGently,
  keepsContext: imgKeepsContext,
  bringsCalm: imgBringsCalm,
  notifySomethingToCheck: imgNotifySomethingToCheck,
  atRisk: imgAtRisk,
  contextBeforeCall: imgContextBeforeCall,
  everythingOnTrack: imgEverythingOnTrack,
  sidebarPeek: imgNotifySomethingToCheck,
  jbpStanding: imgKeepsContext,
  radarLooking: imgNoticesDrift,
  idleAllClear: imgBringsCalm,
};

const DEFAULT_ALT: Record<KeptIllustrationVariant, string> = {
  noticesDrift: "Kept noticing drift across partner work",
  remindsGently: "Kept offering a gentle reminder",
  keepsContext: "Kept keeping commitments and context visible",
  bringsCalm: "Kept, a calm presence beside your partner rhythm",
  notifySomethingToCheck: "Kept flagging something to review",
  atRisk: "Kept surfacing a partner that needs attention",
  contextBeforeCall: "Kept handing you context before a partner call",
  everythingOnTrack: "Kept showing partnerships on track",
  sidebarPeek: "Kept peeking from the workspace sidebar",
  jbpStanding: "Kept beside joint plan updates",
  radarLooking: "Kept reading partner radar signals",
  idleAllClear: "Kept resting while nothing is drifting",
};

export interface KeptIllustrationProps {
  variant: KeptIllustrationVariant;
  className?: string;
  /** Override accessible name when not decorative */
  alt?: string;
  /** When true: hides from assistive tech and clears alt */
  decorative?: boolean;
  /** Subtle shadow so dark silhouettes read on cream/light hero backgrounds */
  onLightBackground?: boolean;
  /** Use eager on above-the-fold intro slides */
  imageLoading?: "eager" | "lazy";
}

export function KeptIllustration({
  variant,
  className,
  alt,
  decorative = false,
  onLightBackground = false,
  imageLoading = "lazy",
}: KeptIllustrationProps) {
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
