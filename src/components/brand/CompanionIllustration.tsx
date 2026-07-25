import { useCompanion } from "@/lib/companion-context";
import { KeptIllustration, type KeptIllustrationVariant } from "@/components/brand/KeptIllustration";
import { KeptaIllustration, type KeptaIllustrationVariant } from "@/components/brand/KeptaIllustration";

const KEPTA_VARIANT: Record<KeptIllustrationVariant, KeptaIllustrationVariant> = {
  noticesDrift: "noticesDrift",
  remindsGently: "remindsGently",
  keepsContext: "keepsContext",
  bringsCalm: "bringsCalm",
  notifySomethingToCheck: "remindsGently",
  atRisk: "noticesDrift",
  contextBeforeCall: "contextBeforeCall",
  everythingOnTrack: "everythingOnTrack",
  sidebarPeek: "remindsGently",
  jbpStanding: "keepsContext",
  radarLooking: "noticesDrift",
  idleAllClear: "bringsCalm",
};

export type { KeptIllustrationVariant as CompanionIllustrationVariant };

export interface CompanionIllustrationProps {
  variant: KeptIllustrationVariant;
  className?: string;
  alt?: string;
  decorative?: boolean;
  onLightBackground?: boolean;
  imageLoading?: "eager" | "lazy";
  /** Force a specific companion (e.g. choose-companion preview cards). */
  forceCompanion?: "kept" | "kepta";
}

export function CompanionIllustration({
  variant,
  forceCompanion,
  ...props
}: CompanionIllustrationProps) {
  const { companion } = useCompanion();
  const who = forceCompanion ?? companion;

  if (who === "kepta") {
    return <KeptaIllustration variant={KEPTA_VARIANT[variant]} {...props} />;
  }

  return <KeptIllustration variant={variant} {...props} />;
}
