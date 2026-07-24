import { ONBOARDING_PROGRESS_KEY, ONBOARDING_STEPS } from "@/content/onboarding";

const FIRST_RUN_COMPLETE_KEY = "kept-onboarding-first-run-complete";

/** True when the user finished or skipped the onboarding tour on this device. */
export function isOnboardingFirstRunComplete(): boolean {
  if (typeof window === "undefined") return true;
  try {
    if (localStorage.getItem(FIRST_RUN_COMPLETE_KEY) === "1") return true;
    const raw = localStorage.getItem(ONBOARDING_PROGRESS_KEY);
    if (!raw) return false;
    const done = JSON.parse(raw) as string[];
    return done.length >= ONBOARDING_STEPS.length;
  } catch {
    return false;
  }
}

export function markOnboardingFirstRunComplete(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FIRST_RUN_COMPLETE_KEY, "1");
  } catch {
    /* ignore */
  }
}
