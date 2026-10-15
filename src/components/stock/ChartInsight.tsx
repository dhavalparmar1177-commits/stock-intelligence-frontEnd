import { useMemo } from "react";
import { TrendingUp, TrendingDown, Activity, Compass, AlertCircle } from "lucide-react";
import { useLang } from "../../i18n/LanguageContext";
import { describeTrend, InsightToken } from "./series";
import { formatPct } from "../../design/tokens";

interface ChartInsightProps {
  closes: number[];
  intraday?: boolean;
  className?: string;
  rangeLabel?: string;
}

/**
 * Highlighted institutional trend callout card showing computed DMA, momentum & period performance.
 */
export function ChartInsight({
  closes,
  intraday = false,
  className = "",
  rangeLabel,
}: ChartInsightProps) {
  const { t } = useLang();
  const tokens = useMemo(() => describeTrend(closes, { intraday }), [closes, intraday]);

  const periodDelta = useMemo(() => {
    if (!closes || closes.length < 2) return null;
    const first = closes[0];
    const last = closes[closes.length - 1];
    if (first <= 0) return null;
    return ((last - first) / first) * 100;
  }, [closes]);

  if (!tokens.length && periodDelta === null) return null;

  const label = (tk: InsightToken): string => {
    switch (tk) {
      case "up-strong":
        return t.chart.inUpStrong || "Strong uptrend";
      case "down":
        return t.chart.inDown || "Downtrend in view";
      case "flat":
        return t.chart.inFlat || "Consolidating / Sideways";
      case "above-sma50":
        return t.chart.inAboveSMA || "Trading above 50-day average";
      case "below-sma50":
        return t.chart.inBelowSMA || "Trading below 50-day average";
      case "rsi-hot":
        return t.chart.inRsiHot || "RSI overbought (>70)";
      case "rsi-cold":
        return t.chart.inRsiCold || "RSI oversold (<30)";
      default:
        return t.chart.inMomWeak || "Momentum softening";
    }
  };

  const isUp = periodDelta != null && periodDelta >= 0;
  const isStrongDown = tokens.includes("down") || tokens.includes("below-sma50");

  return (
    <div
      className={`flex items-center justify-between gap-3 p-3 rounded-xl border text-xs transition-colors flex-wrap ${
        isStrongDown
          ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/40 text-rose-900 dark:text-rose-200"
          : isUp
          ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200"
          : "bg-slate-50 dark:bg-[#17203a] border-slate-200/80 dark:border-white/[0.08] text-slate-800 dark:text-slate-200"
      } ${className}`}
      role="status"
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div
          className={`p-1.5 rounded-lg shrink-0 ${
            isStrongDown
              ? "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400"
              : isUp
              ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
              : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          }`}
        >
          {isStrongDown ? (
            <TrendingDown className="w-3.5 h-3.5" />
          ) : isUp ? (
            <TrendingUp className="w-3.5 h-3.5" />
          ) : (
            <Compass className="w-3.5 h-3.5" />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold truncate">
            {tokens.length ? tokens.map(label).join(" · ") : "Market in observation range"}
          </p>
        </div>
      </div>

      {periodDelta !== null && (
        <div className="flex items-center gap-1.5 shrink-0 text-xs font-semibold si-numeric">
          <span className="text-[11px] font-normal opacity-70">
            {rangeLabel ? `${rangeLabel} move:` : "Period move:"}
          </span>
          <span
            className={
              periodDelta >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }
          >
            {formatPct(periodDelta)}
          </span>
        </div>
      )}
    </div>
  );
}

export default ChartInsight;
