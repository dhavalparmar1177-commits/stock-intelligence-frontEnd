import { FALLBACK_TEXT, formatPct, isNonNegative } from "../../design/tokens";
import { Card } from "./Card";

export interface MarketCardData {
  name: string;
  value?: number | string | null;
  changePct?: number | string | null;
  note?: string | null;
  unavailable?: boolean;
  /** "Last updated" line, shown when provided (e.g. marketTime/asOf). */
  updated?: string | null;
}

/**
 * Institutional Market Index card (NIFTY 50, Sensex, BANK NIFTY, INDIA VIX).
 */
export function MarketCard({ market }: { market: MarketCardData }) {
  const missing = market.unavailable || market.value === null || market.value === undefined;
  const up = isNonNegative(market.changePct);
  const isVix = market.name.toUpperCase().includes("VIX");
  
  return (
    <div className="bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800/80 rounded-xl p-4 shadow-card hover:shadow-card-hover hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-150">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {market.name}
        </span>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Live data" />
      </div>

      {missing ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
          {FALLBACK_TEXT}
          {market.note ? ` — ${market.note}` : ""}
        </p>
      ) : (
        <>
          <div className="flex items-baseline justify-between gap-2 flex-wrap mt-1">
            <p className="text-xl sm:text-2xl font-bold si-numeric text-slate-900 dark:text-slate-100 tracking-tight">
              {Number(market.value).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            {market.changePct !== null && market.changePct !== undefined && (
              <span
                className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full si-numeric ${
                  isVix
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    : up
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60"
                    : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60"
                }`}
              >
                {formatPct(market.changePct)}
              </span>
            )}
          </div>
          {market.updated && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 border-t border-slate-100 dark:border-slate-800/80 pt-1.5 truncate">
              {market.updated}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default MarketCard;

