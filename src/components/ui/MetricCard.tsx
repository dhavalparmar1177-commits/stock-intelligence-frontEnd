import { ReactNode } from "react";
import { FALLBACK_TEXT } from "../../design/tokens";
import { Tooltip } from "./Tooltip";

export interface MetricCardProps {
  label: string;
  value?: ReactNode;
  sub?: ReactNode;
  tip?: ReactNode;
  tone?: "neutral" | "positive" | "negative" | "warning" | "ai";
  className?: string;
}

/**
 * Modern FinTech KPI metric tile with tabular numerals and crisp typography.
 */
export function MetricCard({
  label,
  value,
  sub,
  tip,
  tone = "neutral",
  className = "",
}: MetricCardProps) {
  const tones: Record<string, string> = {
    neutral: "text-slate-900 dark:text-slate-100",
    positive: "text-emerald-600 dark:text-emerald-400",
    negative: "text-rose-600 dark:text-rose-400",
    warning: "text-amber-600 dark:text-amber-400",
    ai: "text-violet-600 dark:text-violet-400",
  };

  const display = value === null || value === undefined || value === "" ? FALLBACK_TEXT : value;

  return (
    <div
      className={`bg-white dark:bg-[#12192d] border border-slate-200/90 dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-card dark:shadow-card-dark transition-all duration-150 min-w-0 ${className}`}
    >
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
        <Tooltip tip={tip}>{label}</Tooltip>
      </p>
      <p className={`font-bold text-xl sm:text-2xl si-numeric tracking-tight mt-1 truncate ${tones[tone]}`}>
        {display}
      </p>
      {sub !== undefined && sub !== null && sub !== "" && (
        <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-1">{sub}</p>
      )}
    </div>
  );
}

export default MetricCard;
