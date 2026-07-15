const PROGRESS_KEY = "kept-academy-progress";
const LAST_STUDY_KEY = "kept-academy-last-study";

export interface LastStudy {
  type: "track" | "material";
  slug: string;
  title: string;
  at: string;
}

export function loadCompletedSlugs(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(list);
  } catch {
    return new Set();
  }
}

export function isMaterialCompleted(slug: string): boolean {
  return loadCompletedSlugs().has(slug);
}

export function toggleMaterialCompleted(slug: string): boolean {
  const set = loadCompletedSlugs();
  if (set.has(slug)) set.delete(slug);
  else set.add(slug);
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
  return set.has(slug);
}

export function trackCompletionPercent(materialSlugs: string[]): number {
  if (materialSlugs.length === 0) return 0;
  const done = loadCompletedSlugs();
  const completed = materialSlugs.filter((s) => done.has(s)).length;
  return Math.round((completed / materialSlugs.length) * 100);
}

export function saveLastStudy(entry: Omit<LastStudy, "at">) {
  try {
    localStorage.setItem(
      LAST_STUDY_KEY,
      JSON.stringify({ ...entry, at: new Date().toISOString() } satisfies LastStudy),
    );
  } catch {
    /* ignore */
  }
}

export function loadLastStudy(): LastStudy | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAST_STUDY_KEY);
    return raw ? (JSON.parse(raw) as LastStudy) : null;
  } catch {
    return null;
  }
}
