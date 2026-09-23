import { useCallback, useEffect, useState } from "react";

const DONE_KEY = "si-academy-done";
const QUIZ_KEY = "si-academy-quiz";

function readArr(key: string): string[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function readScores(): Record<string, number> {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(QUIZ_KEY) || "{}");
    if (v && typeof v === "object") {
      const out: Record<string, number> = {};
      for (const [k, n] of Object.entries(v as Record<string, unknown>)) {
        if (typeof n === "number") out[k] = n;
      }
      return out;
    }
    return {};
  } catch {
    return {};
  }
}

/** Local-only academy progress: completed lessons + best quiz scores. */
export function useAcademyProgress() {
  const [done, setDone] = useState<string[]>(() => readArr(DONE_KEY));
  const [scores, setScores] = useState<Record<string, number>>(readScores);

  useEffect(() => {
    try {
      localStorage.setItem(DONE_KEY, JSON.stringify(done));
    } catch {
      /* ignore */
    }
  }, [done]);

  useEffect(() => {
    try {
      localStorage.setItem(QUIZ_KEY, JSON.stringify(scores));
    } catch {
      /* ignore */
    }
  }, [scores]);

  const toggleDone = useCallback((id: string) => {
    setDone((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }, []);

  const recordQuiz = useCallback((id: string, pct: number) => {
    setScores((p) => ({ ...p, [id]: Math.max(p[id] ?? 0, pct) }));
  }, []);

  return { done, scores, toggleDone, recordQuiz };
}

export default useAcademyProgress;
