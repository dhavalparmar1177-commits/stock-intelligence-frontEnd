import { useCallback, useEffect, useState } from "react";

export type RiskType = "conservative" | "moderate" | "aggressive";

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  timelineYears: number;
  monthlySIP: number;
  expectedReturnPct: number;
  createdAt: string;
}

export interface InvestorProfile {
  riskType: RiskType | null;
  quizAnswers: Record<number, number>; // qIndex -> optionIndex
  completedAt: string | null;
  goals: Goal[];
}

const STORAGE_KEY = "si-investor-profile";

function readProfile(): InvestorProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.goals)) {
        return parsed;
      }
    }
  } catch {
    /* fallback */
  }
  return {
    riskType: null,
    quizAnswers: {},
    completedAt: null,
    goals: [],
  };
}

export function useInvestorProfile() {
  const [profile, setProfile] = useState<InvestorProfile>(readProfile);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      /* ignore storage error */
    }
  }, [profile]);

  const saveQuizResult = useCallback((answers: Record<number, number>, riskType: RiskType) => {
    setProfile((prev) => ({
      ...prev,
      quizAnswers: answers,
      riskType,
      completedAt: new Date().toISOString(),
    }));
  }, []);

  const addGoal = useCallback((goal: Omit<Goal, "id" | "createdAt">): Goal => {
    const newGoal: Goal = {
      ...goal,
      id: `gl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setProfile((prev) => ({
      ...prev,
      goals: [...prev.goals, newGoal],
    }));
    return newGoal;
  }, []);

  const removeGoal = useCallback((id: string) => {
    setProfile((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== id),
    }));
  }, []);

  const resetQuiz = useCallback(() => {
    setProfile((prev) => ({
      ...prev,
      riskType: null,
      quizAnswers: {},
      completedAt: null,
    }));
  }, []);

  return { profile, saveQuizResult, addGoal, removeGoal, resetQuiz };
}

export default useInvestorProfile;
