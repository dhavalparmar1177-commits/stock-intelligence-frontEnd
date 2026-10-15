import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Star, Plus, X, ArrowRight, BookmarkPlus } from "lucide-react";
import { marketApi } from "../api/market";
import { useWatchlist } from "../hooks/useWatchlist";
import { useLang } from "../i18n/LanguageContext";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { ErrorState } from "./ui/ErrorState";
import { SkeletonRow } from "./ui/Skeleton";
import QuoteRow from "./QuoteRow";

const POPULAR_SUGGESTIONS = ["RELIANCE", "TCS", "HDFCBANK", "INFY"];

/**
 * Modern FinTech Watchlist Section with instant ticker add, friendly empty state,
 * and quick-add chips for popular NSE stocks.
 */
export function WatchlistSection() {
  const { t } = useLang();
  const { symbols, add, remove } = useWatchlist();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [input, setInput] = useState("");
  const [hint, setHint] = useState("");
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!symbols.length) {
      setQuotes([]);
      return;
    }
    let alive = true;
    setLoading(true);
    setError("");
    marketApi
      .quotes(symbols)
      .then((r) => {
        if (alive) setQuotes(r.quotes || []);
      })
      .catch(() => {
        if (alive) setError(t.gen.unableToLoad);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [symbols.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const doAdd = async (tickerToAdd?: string) => {
    const v = (tickerToAdd || input).trim().toUpperCase();
    if (!v || adding) return;
    setAdding(true);
    setHint("");
    try {
      const r = await marketApi.search(v);
      const hit = (r.results || []).find(
        (h: any) => (h.appSymbol || h.symbol || "").toUpperCase() === v
      );
      if (hit) {
        add(hit.appSymbol || hit.symbol);
        setInput("");
      } else {
        setHint(t.dash.watchNoMatch);
      }
    } catch {
      setHint(t.dash.watchNoMatch);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500/20" />
          <span>{t.dash.watchTitle || "Personal Watchlist"}</span>
        </span>
      }
      subtitle={symbols.length ? `${symbols.length} tracked stocks` : undefined}
      action={
        <Link
          to="/watchlist"
          className="text-xs sm:text-sm font-semibold text-violet-600 dark:text-[#7C5CFF] hover:underline flex items-center gap-1 group"
        >
          <span>Manage</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      }
    >
      {/* Input bar */}
      <div className="flex gap-2 mb-4">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doAdd()}
          placeholder={t.dash.watchAddPh || "Search symbol to add (e.g. RELIANCE)..."}
          aria-label={t.dash.watchAddPh || "Add stock to watchlist"}
          className="flex-1 min-w-0 border border-slate-200/90 dark:border-white/[0.08] rounded-[12px] px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-[#0D1424]/80 text-slate-900 dark:text-[#F4F6FB] placeholder:text-slate-400 dark:placeholder:text-[#6B7792] focus:border-[#7C5CFF] focus:ring-2 focus:ring-[#7C5CFF]/20 transition-all"
        />
        <Button
          variant="primary"
          onClick={() => doAdd()}
          disabled={adding || !input.trim()}
          loading={adding}
          className="shrink-0 text-xs px-3"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          <span>Add</span>
        </Button>
      </div>

      {hint && <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">{hint}</p>}

      {!symbols.length ? (
        /* Friendly empty state with "Add stock" CTA and quick suggestions */
        <div className="py-6 px-4 text-center rounded-[16px] bg-slate-50/80 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/[0.08]">
          <div className="w-10 h-10 rounded-full bg-violet-500/10 dark:bg-[#7C5CFF]/15 text-violet-600 dark:text-[#7C5CFF] flex items-center justify-center mx-auto mb-2.5">
            <BookmarkPlus className="w-5 h-5" />
          </div>
          <p className="font-semibold text-sm text-slate-900 dark:text-[#F4F6FB]">
            Your Watchlist is Empty
          </p>
          <p className="text-xs text-slate-500 dark:text-[#A3AEC7] max-w-xs mx-auto mt-1 leading-relaxed">
            Track key Indian equities in real-time with live session deltas and momentum alerts.
          </p>

          <div className="mt-3.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#6B7792] block mb-2">
              Popular quick add
            </span>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {POPULAR_SUGGESTIONS.map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => doAdd(sym)}
                  className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white dark:bg-[#131C30] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-[#A3AEC7] hover:border-[#7C5CFF] hover:text-[#7C5CFF] transition-colors"
                >
                  + {sym}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : loading && !quotes.length ? (
        <div role="status" aria-label={t.common.loading} className="space-y-1">
          {symbols.map((s) => (
            <SkeletonRow key={s} />
          ))}
        </div>
      ) : error && !quotes.length ? (
        <ErrorState
          title={error}
          onRetry={() => {
            setError("");
            setQuotes([]);
          }}
          retryLabel={t.common.retry}
        />
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
          {quotes.map((q: any) => (
            <div key={q.appSymbol || q.symbol} className="flex items-center gap-2 group">
              <div className="flex-1 min-w-0">
                <QuoteRow x={q} />
              </div>
              <button
                onClick={() => remove(q.appSymbol || q.symbol)}
                aria-label={`${t.dash.watchRemove} ${q.appSymbol || q.symbol}`}
                title={`${t.dash.watchRemove} ${q.appSymbol || q.symbol}`}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-400 hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-900 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default WatchlistSection;
