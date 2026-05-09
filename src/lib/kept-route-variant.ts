import type { KeptIllustrationVariant } from "@/components/brand/KeptIllustration";

/**
 * Picks a Kept pose that fits the screen the user is on—same assistant, different emotional beat.
 * More specific paths must run before generic `/partner/…` rules.
 */
export function keptVariantForAppPath(pathname: string): KeptIllustrationVariant {
  if (pathname.includes("/coach")) return "contextBeforeCall";
  if (pathname.includes("/plan")) return "jbpStanding";
  if (pathname.includes("/intel")) return "notifySomethingToCheck";
  if (pathname.includes("/diagnostic")) return "noticesDrift";
  if (pathname.startsWith("/qualification")) return "keepsContext";
  if (pathname.startsWith("/reports")) return "radarLooking";
  if (pathname.startsWith("/certification")) return "bringsCalm";
  if (pathname.startsWith("/methodology") || pathname.startsWith("/axis")) return "idleAllClear";
  if (pathname.startsWith("/dashboard")) return "everythingOnTrack";
  if (pathname.startsWith("/diagnostic")) return "noticesDrift";
  if (pathname.startsWith("/partners")) return "remindsGently";
  if (pathname.startsWith("/settings")) return "sidebarPeek";
  if (pathname.startsWith("/partner/")) return "sidebarPeek";
  return "sidebarPeek";
}
