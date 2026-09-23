import { Link } from "react-router-dom";
import { FALLBACK_TEXT, formatPct, isNonNegative } from "../../design/tokens";
import { AIScoreBadge, SignalBadge } from "./Badge";

export interface StockCardData {
  symbol: string;
  name?: string | null;
  exchange?: string | null;
  price?: number | string | null;
  changePct?: number | string | null;
  score?: number | string | null;
  signal?: string | null;
}

/**
 * Institutional stock card with hover elevation, tabular price, and badges.
 */
export function StockCard({ stock, detailHref }: { stock: StockCardData; detailHref?: string }) {
  const to = detailHref || `/stocks/${stock.symbol}`;
  const up = isNonNegative(stock.changePct);
  const pct = stock.changePct === null || stock.changePct === undefined ? FALLBACK_TEXT : formatPct(stock.changePct);
  const price =
    stock.price === null || stock.price === undefined || stock.price === ""
      ? FALLBACK_TEXT
      : `₹${Number(stock.price).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Link
      to={to}
      aria-label={`${stock.symbol}${stock.name ? `, ${stock.name}` : ""}, price ${price}, ${pct}`}
      className="group block bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800/80 rounded-xl p-4 shadow-card hover:shadow-card-hover hover:border-blue-300 dark:hover:border-blue-900/60 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {stock.symbol || FALLBACK_TEXT}
            </span>
            {stock.exchange && (
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                {stock.exchange}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {stock.name || " "}
          </p>
        </div>
        {stock.score !== undefined && <AIScoreBadge score={stock.score} />}
      </div>

      <div className="flex items-baseline justify-between gap-2 mt-3 flex-wrap">
        <p className="font-bold text-lg si-numeric text-slate-900 dark:text-slate-100">{price}</p>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full si-numeric ${
            up
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60"
          }`}
        >
          {pct}
        </span>
      </div>

      {stock.signal !== undefined && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <SignalBadge signal={stock.signal} />
          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium group-hover:underline">
            View details →
          </span>
        </div>
      )}
    </Link>
  );
}

export default StockCard;

