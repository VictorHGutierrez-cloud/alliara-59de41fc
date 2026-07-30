import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { CompanionId } from "@/lib/companion";
import {
  applyCompanionState,
  getCompanionForSync,
  hasChosenCompanionForSync,
} from "@/lib/companion";

const PROGRESS_KEY = "kept-academy-progress";
const LAST_STUDY_KEY = "kept-academy-last-study";
const STUDY_DATES_KEY = "kept-academy-study-dates";
const QUIZ_RESULTS_KEY = "kept-academy-quiz-results";

export interface LastStudy {
  type: "track" | "material";
  slug: string;
  title: string;
  at: string;
}

export interface StudyStreak {
  current: number;
  longest: number;
  studiedToday: boolean;
}

export interface QuizResult {
  score: number;
  passed: boolean;
  at: string;
  /** correct answers count */
  correct?: number;
  total?: number;
}

export type QuizResultsMap = Record<string, QuizResult>;

export interface AcademyProgressState {
  completedSlugs: string[];
  lastStudy: LastStudy | null;
  studyDates: string[];
  companion: CompanionId | null;
  companionChosen: boolean;
  quizResults: QuizResultsMap;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadStudyDates(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STUDY_DATES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveStudyDates(dates: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STUDY_DATES_KEY, JSON.stringify(dates));
  } catch {
    /* ignore */
  }
}

export function recordStudyActivity(): StudyStreak {
  const today = todayKey();
  const dates = new Set(loadStudyDates());
  dates.add(today);
  const sorted = [...dates].sort();
  saveStudyDates(sorted);
  return computeStreak(sorted);
}

export function computeStreak(dates: string[]): StudyStreak {
  if (dates.length === 0) {
    return { current: 0, longest: 0, studiedToday: false };
  }

  const set = new Set(dates);
  const today = todayKey();
  const studiedToday = set.has(today);

  let current = 0;
  const cursor = new Date();
  if (!studiedToday) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (!set.has(key)) break;
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const sorted = [...set].sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    if (!prev) {
      run = 1;
    } else {
      const diff =
        (Date.parse(d) - Date.parse(prev)) / (24 * 60 * 60 * 1000);
      run = diff === 1 ? run + 1 : 1;
    }
    longest = Math.max(longest, run);
    prev = d;
  }

  return { current, longest, studiedToday };
}

export function getStudyStreak(): StudyStreak {
  return computeStreak(loadStudyDates());
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

export function completeMaterial(slug: string): { completed: boolean; justCompleted: boolean } {
  const wasDone = isMaterialCompleted(slug);
  const completed = toggleMaterialCompleted(slug);
  if (!wasDone && completed) {
    recordStudyActivity();
  }
  return { completed, justCompleted: !wasDone && completed };
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
    recordStudyActivity();
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

function parseQuizResults(raw: unknown): QuizResultsMap {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: QuizResultsMap = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== "object") continue;
    const v = value as Record<string, unknown>;
    if (typeof v.score !== "number" || typeof v.passed !== "boolean" || typeof v.at !== "string") {
      continue;
    }
    out[key] = {
      score: v.score,
      passed: v.passed,
      at: v.at,
      ...(typeof v.correct === "number" ? { correct: v.correct } : {}),
      ...(typeof v.total === "number" ? { total: v.total } : {}),
    };
  }
  return out;
}

export function loadQuizResults(): QuizResultsMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(QUIZ_RESULTS_KEY);
    return raw ? parseQuizResults(JSON.parse(raw)) : {};
  } catch {
    return {};
  }
}

function saveQuizResults(results: QuizResultsMap) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(QUIZ_RESULTS_KEY, JSON.stringify(results));
  } catch {
    /* ignore */
  }
}

export function getQuizResult(trackId: string): QuizResult | null {
  return loadQuizResults()[trackId] ?? null;
}

export function isQuizPassed(trackId: string): boolean {
  return Boolean(getQuizResult(trackId)?.passed);
}

export function saveQuizResult(
  trackId: string,
  result: Omit<QuizResult, "at"> & { at?: string },
): QuizResult {
  const stored: QuizResult = {
    score: result.score,
    passed: result.passed,
    at: result.at ?? new Date().toISOString(),
    ...(result.correct !== undefined ? { correct: result.correct } : {}),
    ...(result.total !== undefined ? { total: result.total } : {}),
  };
  const all = loadQuizResults();
  all[trackId] = stored;
  saveQuizResults(all);
  if (stored.passed) recordStudyActivity();
  return stored;
}

export function loadProgressState(): AcademyProgressState {
  const companionChosen = hasChosenCompanionForSync();
  return {
    completedSlugs: [...loadCompletedSlugs()],
    lastStudy: loadLastStudy(),
    studyDates: loadStudyDates(),
    companion: companionChosen ? getCompanionForSync() : null,
    companionChosen,
    quizResults: loadQuizResults(),
  };
}

export function applyProgressState(state: AcademyProgressState) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(state.completedSlugs));
    if (state.lastStudy) {
      localStorage.setItem(LAST_STUDY_KEY, JSON.stringify(state.lastStudy));
    }
    saveStudyDates(state.studyDates);
    saveQuizResults(state.quizResults ?? {});
    applyCompanionState(state.companion, state.companionChosen);
  } catch {
    /* ignore */
  }
}

function mergeProgress(local: AcademyProgressState, remote: AcademyProgressState): AcademyProgressState {
  const completed = new Set([...local.completedSlugs, ...remote.completedSlugs]);
  const studyDates = [...new Set([...local.studyDates, ...remote.studyDates])].sort();

  let lastStudy = local.lastStudy;
  if (remote.lastStudy) {
    if (!lastStudy || Date.parse(remote.lastStudy.at) > Date.parse(lastStudy.at)) {
      lastStudy = remote.lastStudy;
    }
  }

  let companion = local.companion;
  let companionChosen = local.companionChosen;
  if (remote.companionChosen && remote.companion) {
    companion = remote.companion;
    companionChosen = true;
  } else if (!companionChosen && remote.companionChosen) {
    companion = remote.companion;
    companionChosen = remote.companionChosen;
  }

  const quizResults: QuizResultsMap = { ...remote.quizResults };
  for (const [trackId, localResult] of Object.entries(local.quizResults)) {
    const remoteResult = quizResults[trackId];
    if (!remoteResult || Date.parse(localResult.at) >= Date.parse(remoteResult.at)) {
      quizResults[trackId] = localResult;
    }
  }

  return {
    completedSlugs: [...completed],
    lastStudy,
    studyDates,
    companion,
    companionChosen,
    quizResults,
  };
}

export async function syncAcademyProgress(userId: string): Promise<void> {
  const local = loadProgressState();

  const { data, error } = await supabase
    .from("academy_progress")
    .select("completed_slugs, last_study, study_dates, companion, quiz_results, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[syncAcademyProgress - pull]:", error);
    return;
  }

  if (!data) {
    const { error: insertError } = await supabase.from("academy_progress").upsert({
      user_id: userId,
      completed_slugs: local.completedSlugs,
      last_study: local.lastStudy as Json | null,
      study_dates: local.studyDates,
      companion: local.companionChosen ? local.companion : null,
      quiz_results: local.quizResults as unknown as Json,
      updated_at: new Date().toISOString(),
    });
    if (insertError) console.error("[syncAcademyProgress - push]:", insertError);
    return;
  }

  const remoteCompanion =
    data.companion === "kept" || data.companion === "kepta" ? data.companion : null;

  const remote: AcademyProgressState = {
    completedSlugs: data.completed_slugs ?? [],
    lastStudy: (data.last_study as LastStudy | null) ?? null,
    studyDates: data.study_dates ?? [],
    companion: remoteCompanion,
    companionChosen: remoteCompanion !== null,
    quizResults: parseQuizResults(data.quiz_results),
  };

  const merged = mergeProgress(local, remote);
  applyProgressState(merged);

  const { error: upsertError } = await supabase.from("academy_progress").upsert({
    user_id: userId,
    completed_slugs: merged.completedSlugs,
    last_study: merged.lastStudy as Json | null,
    study_dates: merged.studyDates,
    companion: merged.companionChosen ? merged.companion : null,
    quiz_results: merged.quizResults as unknown as Json,
    updated_at: new Date().toISOString(),
  });

  if (upsertError) console.error("[syncAcademyProgress - upsert]:", upsertError);
}

export async function pushAcademyProgress(userId: string): Promise<void> {
  const state = loadProgressState();
  const { error } = await supabase.from("academy_progress").upsert({
    user_id: userId,
    completed_slugs: state.completedSlugs,
    last_study: state.lastStudy as Json | null,
    study_dates: state.studyDates,
    companion: state.companionChosen ? state.companion : null,
    quiz_results: state.quizResults as unknown as Json,
    updated_at: new Date().toISOString(),
  });
  if (error) console.error("[pushAcademyProgress]:", error);
}
