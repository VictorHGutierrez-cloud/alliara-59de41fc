export type CompanionId = "kept" | "kepta";

const COMPANION_KEY = "kept-academy-companion";
const COMPANION_CHOSEN_KEY = "kept-academy-companion-chosen";

export function getCompanion(): CompanionId {
  if (typeof window === "undefined") return "kept";
  try {
    const raw = localStorage.getItem(COMPANION_KEY);
    return raw === "kepta" ? "kepta" : "kept";
  } catch {
    return "kept";
  }
}

export function hasChosenCompanion(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(COMPANION_CHOSEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function setCompanion(id: CompanionId): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COMPANION_KEY, id);
    localStorage.setItem(COMPANION_CHOSEN_KEY, "1");
    window.dispatchEvent(new CustomEvent("kept-companion-changed", { detail: id }));
  } catch {
    /* ignore */
  }
}

export function clearCompanionChoice(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(COMPANION_CHOSEN_KEY);
  } catch {
    /* ignore */
  }
}

export const COMPANION_META: Record<
  CompanionId,
  { name: string; tagline: string; description: string }
> = {
  kept: {
    name: "Kept",
    tagline: "Calm and direct",
    description: "Steady coach energy — great when you want clear, no-nonsense nudges between calls.",
  },
  kepta: {
    name: "Kepta",
    tagline: "Warm and curious",
    description: "Friendly guide energy — great when you want encouragement while you learn the playbooks.",
  },
};
