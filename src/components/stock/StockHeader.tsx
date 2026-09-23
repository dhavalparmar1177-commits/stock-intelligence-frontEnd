import { Link } from "react-router-dom";
import { useLang } from "../../i18n/LanguageContext";
import { Button } from "../ui/Button";
import { Badge, AIScoreBadge, SignalBadge, RiskBadge } from "../ui/Badge";
import { fmtINR, fmtPct } from "./utils";

export interface HeaderQuote {
  price?: number | null;
  change?: number | null;
  changePct?: number | null;
  currency?: string | null;
  marketTime?: string | null;
}

/**
 * Top stock header: identity, live price, AI badges, actions.
 */
export function StockHeader({
  symbol,
  name,
  exchange,
  quote,
  quoteError,
  analysis,
  watched,
  onToggleWatch,
  analyzing,
  canAnalyze,
  onAnalyze,
}: {
  symbol: string;
  name?: string | null;
  exchange?: string | null;
  quote: HeaderQuote | null;
  quoteError: string;
  analysis: { score?: number | null; signal?: string | null; riskLevel?: string | null } | null;
  watched: boolean;
  onToggleWatch: () => void;
  analyzing: boolean;
  canAnalyze: boolean;
  onAnalyze: () => void;
}) {
  const { t } = useLang();
  const up = (quote?.changePct ?? 0) >= 0;

  return (
    <div className="bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-card">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-display">
              {symbol.toUpperCase()}
            </h1>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
              {exchange || "NSE · BSE"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 truncate max-w-md">
            {name || t.gen.dataUnavailable}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Button
            variant={watched ? "primary" : "secondary"}
            size="sm"
            onClick={onToggleWatch}
            aria-pressed={watched}
            aria-label={watched ? t.stock.watchAdded : t.stock.watchAdd}
            className="rounded-xl shadow-sm"
          >
            <span>{watched ? "★" : "☆"}</span>
            <span>{watched ? t.stock.watchAdded : t.stock.watchAdd}</span>
          </Button>

          <Link
            to={`/compare?symbols=${symbol.toUpperCase()},NIFTY50`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-[#131d31] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-card"
          >
            <span>⚖️</span>
            <span>{t.stock.compare}</span>
          </Link>

          {canAnalyze && (
            <Button
              variant="ai"
              size="sm"
              onClick={onAnalyze}
              disabled={analyzing}
              loading={analyzing}
              className="rounded-xl shadow-sm"
            >
              <span>✦</span>
              <span>{analyzing ? t.stock.analyzing : t.stock.analyze}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Price & Change Strip */}
      <div className="flex items-baseline gap-3 mt-4 flex-wrap">
        {quoteError && !quote ? (
          <p className="text-sm text-slate-400">{quoteError}</p>
        ) : (
          <>
            <p className="text-3xl sm:text-4xl font-bold si-numeric text-slate-900 dark:text-slate-100 tracking-tight">
              {quote ? fmtINR(quote.price) : t.gen.dataUnavailable}
            </p>
            {quote && (
              <span
                className={`inline-flex items-center gap-1 font-semibold text-xs sm:text-sm px-2.5 py-1 rounded-full si-numeric ${
                  up
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60"
                    : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60"
                }`}
              >
                <span>{quote.change != null ? `${up ? "+" : ""}${Number(quote.change).toFixed(2)}` : "—"}</span>
                <span>({fmtPct(quote.changePct)})</span>
              </span>
            )}
            {quote?.currency && <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">{quote.currency}</span>}
          </>
        )}
      </div>

      {/* Intelligence Badges */}
      <div className="flex items-center gap-2 mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex-wrap">
        <AIScoreBadge score={analysis?.score} />
        <SignalBadge signal={analysis ? analysis.signal : undefined} />
        <RiskBadge level={analysis ? analysis.riskLevel : undefined} />
      </div>
    </div>
  );
}

export default StockHeader;

