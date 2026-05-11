import { KeptChatDock } from "@/components/kept/KeptChatDock";

/**
 * Fixed "quiet agent" entry — renders the floating Kept chat dock across the
 * logged-in shell. The dock itself handles route-based hiding (intro / /kept/ask).
 */
export function KeptAmbientPresence() {
  return <KeptChatDock />;
}
