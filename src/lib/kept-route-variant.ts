import type { KeptIllustrationVariant } from "@/components/brand/KeptIllustration";

/** Picks a Kept pose that fits the academy screen the user is on. */
export function keptVariantForAppPath(pathname: string): KeptIllustrationVariant {
  if (pathname.startsWith("/academy/ask")) return "contextBeforeCall";
  if (pathname.startsWith("/academy/learn")) return "everythingOnTrack";
  if (pathname.startsWith("/academy/library")) return "keepsContext";
  if (pathname.startsWith("/academy/briefing")) return "radarLooking";
  if (pathname.startsWith("/academy")) return "bringsCalm";
  if (pathname.startsWith("/settings")) return "sidebarPeek";
  if (pathname.startsWith("/onboarding")) return "remindsGently";
  return "sidebarPeek";
}
