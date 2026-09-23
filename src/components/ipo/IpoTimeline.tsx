import React from "react";

export interface TimelineStep {
  key: string;
  label: string;
  date: string | null;
  status: "completed" | "current" | "upcoming";
}

interface Props {
  steps: TimelineStep[];
  title?: string;
}

function formatDate(iso: string | null): string {
  if (!iso) return "To be announced";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function IpoTimeline({ steps, title }: Props) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="w-full">
      {title && <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">{title}</h3>}
      <div className="relative">
        {/* Desktop / Tablet horizontal flow */}
        <div className="hidden sm:grid sm:grid-cols-6 gap-2 relative">
          {/* Connector line */}
          <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 dark:bg-slate-700 -z-0" />

          {steps.map((step, idx) => {
            const isDone = step.status === "completed";
            const isCur = step.status === "current";

            return (
              <div key={step.key || idx} className="flex flex-col items-center text-center relative z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 shadow-sm transition-all ${
                    isDone
                      ? "bg-green-600 border-green-600 text-white"
                      : isCur
                      ? "bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/40 animate-pulse"
                      : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400"
                  }`}
                >
                  {isDone ? "✓" : idx + 1}
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                  {step.label}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium si-numeric">
                  {formatDate(step.date)}
                </p>
              </div>
            );
          })}
        </div>

        {/* Mobile vertical flow */}
        <div className="sm:hidden space-y-3 relative pl-4 border-l-2 border-slate-200 dark:border-slate-700 ml-3">
          {steps.map((step, idx) => {
            const isDone = step.status === "completed";
            const isCur = step.status === "current";

            return (
              <div key={step.key || idx} className="relative flex items-start gap-3">
                <div
                  className={`absolute -left-[23px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                    isDone
                      ? "bg-green-600 border-green-600 text-white"
                      : isCur
                      ? "bg-blue-600 border-blue-600 text-white ring-2 ring-blue-200"
                      : "bg-white dark:bg-slate-800 border-slate-400 text-slate-400"
                  }`}
                >
                  {isDone ? "✓" : idx + 1}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {step.label}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 si-numeric">
                    {formatDate(step.date)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
