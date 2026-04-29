import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AXES, type Level } from "@/content/octa";

export type ScoreMap = Record<string, number>; // axis_key -> 1..5 (can be float from diagnostic averaging)

export interface AssessmentRow {
  id: string;
  scores: ScoreMap;
  overall: number;
  created_at: string;
}

export interface CompletionRow {
  axis_key: string;
  lesson_key: string;
  xp_awarded: number;
  completed_at: string;
}

export function useOctaData(userId: string | undefined) {
  const [latest, setLatest] = useState<AssessmentRow | null>(null);
  const [history, setHistory] = useState<AssessmentRow[]>([]);
  const [completions, setCompletions] = useState<CompletionRow[]>([]);
  const [profile, setProfile] = useState<{ display_name: string | null; total_xp: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const [{ data: a }, { data: c }, { data: p }] = await Promise.all([
      supabase.from("assessments").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("lesson_completions").select("axis_key, lesson_key, xp_awarded, completed_at"),
      supabase.from("profiles").select("display_name, total_xp").eq("id", userId).maybeSingle(),
    ]);
    const rows = (a ?? []) as unknown as AssessmentRow[];
    setHistory(rows);
    setLatest(rows[0] ?? null);
    setCompletions((c ?? []) as CompletionRow[]);
    setProfile(p ?? { display_name: null, total_xp: 0 });
    setLoading(false);
  }, [userId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const totalXp = (completions.reduce((s, r) => s + r.xp_awarded, 0));

  const saveAssessment = useCallback(async (scores: ScoreMap) => {
    if (!userId) return null;
    const vals = Object.values(scores);
    const overall = vals.reduce((a, b) => a + b, 0) / vals.length;
    const { data, error } = await supabase
      .from("assessments")
      .insert({ user_id: userId, scores, overall: Number(overall.toFixed(2)) })
      .select("*")
      .single();
    if (error) throw error;
    await refresh();
    return data as unknown as AssessmentRow;
  }, [userId, refresh]);

  const completeLesson = useCallback(async (axisKey: string, lessonKey: string, xp = 25) => {
    if (!userId) return;
    const exists = completions.find((c) => c.axis_key === axisKey && c.lesson_key === lessonKey);
    if (exists) return;
    const { error } = await supabase.from("lesson_completions").insert({
      user_id: userId, axis_key: axisKey, lesson_key: lessonKey, xp_awarded: xp,
    });
    if (error) throw error;
    // bump profile XP
    await supabase.from("profiles").update({ total_xp: (profile?.total_xp ?? 0) + xp }).eq("id", userId);
    await refresh();
  }, [userId, completions, profile, refresh]);

  const lessonsByAxis = (axisKey: string) =>
    completions.filter((c) => c.axis_key === axisKey).map((c) => c.lesson_key);

  const axisCompletionPct = (axisKey: string) => {
    const axis = AXES.find((a) => a.key === axisKey);
    if (!axis) return 0;
    const done = lessonsByAxis(axisKey).length;
    return Math.round((done / axis.lessons.length) * 100);
  };

  return {
    profile, latest, history, completions, totalXp, loading,
    refresh, saveAssessment, completeLesson, lessonsByAxis, axisCompletionPct,
  };
}

export function levelFromAvg(avg: number): Level {
  return Math.max(1, Math.min(5, Math.round(avg))) as Level;
}
