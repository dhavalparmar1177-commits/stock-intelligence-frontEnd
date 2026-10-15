import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatPct } from "../../design/tokens";

interface StatChipProps {
  value?: number | null;
  format?: "pct" | "abs";
  prefix?: string;
  className?: string;
  size?: "sm" | "md";
}

/**
 * Premium FinTech delta badge with semantic arrow and tinted background.
 */
export function StatChip({
  value,
  format = "pct",
  prefix = "",
  className = "",
  size = "md",
}: StatChipProps) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-slate-500 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
        <Minus className="w-3 h-3" />
        <span>—</span>
      </span>
    );
  }

  const n = Number(value);
  const isZero = Math.abs(n) < 0.0001;
  const isUp = n > 0;

  const colorStyles = isZero
    ? "bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-[#A3AEC7] border-slate-200/80 dark:border-white/[0.08]"
    : isUp
    ? "bg-emerald-50 dark:bg-[#2BD67B]/[0.12] text-emerald-700 dark:text-[#2BD67B] border-emerald-200/80 dark:border-[#2BD67B]/25"
    : "bg-rose-50 dark:bg-[#FF5C6C]/[0.12] text-rose-700 dark:text-[#FF5C6C] border-rose-200/80 dark:border-[#FF5C6C]/25";

  const sizeStyles = size === "sm" ? "text-[11px] px-1.5 py-0.5" : "text-xs px-2.5 py-0.5";
  const iconSize = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";

  const display = format === "pct" ? formatPct(n) : `${isUp ? "+" : ""}${prefix}${n.toFixed(2)}`;

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold border rounded-full si-numeric whitespace-nowrap transition-colors ${colorStyles} ${sizeStyles} ${className}`}
    >
      {isZero ? (
        <Minus className={iconSize} />
      ) : isUp ? (
        <TrendingUp className={iconSize} />
      ) : (
        <TrendingDown className={iconSize} />
      )}
      <span>{display}</span>
    </span>
  );
}

export default StatChip;
