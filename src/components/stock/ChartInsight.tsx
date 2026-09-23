import { useMemo } from "react";
import { useLang } from "../../i18n/LanguageContext";
import { describeTrend, InsightToken } from "./series";

/**
 * One-line plain-English read of the visible chart window.
 * Tokens come from describeTrend() — real computed numbers only.
 */
export function ChartInsight({ closes, intraday = false }: { closes: number[]; intraday?: boolean }) {
  const { t } = useLang();
  const tokens = useMemo(() => describeTrend(closes, { intraday }), [closes, intraday]);
  if (!tokens.length) return null;
  const label = (tk: InsightToken): string => {
    switch (tk) {
      case "up-strong": return t.chart.inUpStrong;
      case "down": return t.chart.inDown;
      case "flat": return t.chart.inFlat;
      case "above-sma50": return t.chart.inAboveSMA;
      case "below-sma50": return t.chart.inBelowSMA;
      case "rsi-hot": return t.chart.inRsiHot;
      case "rsi-cold": return t.chart.inRsiCold;
      default: return t.chart.inMomWeak;
    }
  };
  return (
    <p className="text-xs text-slate-600 dark:text-slate-300 mb-2" role="status">
      {tokens.slice(0, 3).map(label).join(" · ")}
    </p>
  );
}

export default ChartInsight;
