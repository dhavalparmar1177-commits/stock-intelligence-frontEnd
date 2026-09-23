import { ReactNode } from "react";
import { FALLBACK_TEXT } from "../../design/tokens";
import { Tooltip } from "./Tooltip";

/**
 * Single KPI cell. Value is already-resolved display text from real
 * data; pass null/undefined value to render "Data unavailable".
 */
export function MetricCard({
  label,
  value,
  sub,
  tip,
  tone = "neutral",
}: {
  label: string;
  value?: ReactNode;
  sub?: ReactNode;
  tip?: ReactNode;
  tone?: "neutral" | "positive" | "negative" | "warning" | "ai";
}) {
  const tones: Record<string, string> = {
    neutral: "text-slate-900 dark:text-slate-100",
    positive: "text-emerald-600 dark:text-emerald-400",
    negative: "text-rose-600 dark:text-rose-400",
    warning: "text-amber-600 dark:text-amber-400",
    ai: "text-violet-600 dark:text-violet-400",
  };
  const display = value === null || value === undefined || value === "" ? FALLBACK_TEXT : value;
  return (
    <div className="bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800/80 rounded-xl p-3 sm:p-3.5 shadow-card min-w-0 transition-colors">
      <p className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
        <Tooltip tip={tip}>{label}</Tooltip>
      </p>
      <p className={`font-bold text-base sm:text-lg si-numeric tracking-tight mt-0.5 truncate ${tones[tone]}`}>
        {display}
      </p>
      {sub !== undefined && sub !== null && sub !== "" && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{sub}</p>
      )}
    </div>
  );
}

export default MetricCard;

