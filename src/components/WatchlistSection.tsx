import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { marketApi } from "../api/market";
import { useWatchlist } from "../hooks/useWatchlist";
import { useLang } from "../i18n/LanguageContext";
import { Card } from "./ui/Card";
import { EmptyState } from "./ui/EmptyState";
import { ErrorState } from "./ui/ErrorState";
import { SkeletonRow } from "./ui/Skeleton";
import QuoteRow from "./QuoteRow";

/**
 * Dashboard watchlist section with fast ticker add and real-time prices.
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
        if (alive) setError("Unable to load market data.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [symbols.join(",")]);

  const doAdd = async () => {
    const v = input.trim().toUpperCase();
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
      title={t.dash.watchTitle}
      action={
        <Link
          to="/watchlist"
          className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          Manage Watchlist →
        </Link>
      }
    >
      <div className="flex gap-2 mb-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doAdd()}
          placeholder={t.dash.watchAddPh}
          aria-label={t.dash.watchAddPh}
          className="flex-1 min-w-0 border border-slate-200/90 dark:border-slate-800/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm bg-slate-50/80 dark:bg-[#0e1626] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
        <button
          onClick={doAdd}
          disabled={adding || !input.trim()}
          className="text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 shrink-0 shadow-sm transition-all"
        >
          {adding ? "…" : t.dash.watchAdd}
        </button>
      </div>
      {hint && <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">{hint}</p>}
      {!symbols.length ? (
        <EmptyState icon="⭐" title={t.dash.watchEmpty} />
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
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {quotes.map((q: any) => (
            <div key={q.appSymbol || q.symbol} className="flex items-center gap-2 group">
              <div className="flex-1 min-w-0">
                <QuoteRow x={q} />
              </div>
              <button
                onClick={() => remove(q.appSymbol || q.symbol)}
                aria-label={`${t.dash.watchRemove} ${q.appSymbol || q.symbol}`}
                title={`${t.dash.watchRemove} ${q.appSymbol || q.symbol}`}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-xs p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-600 hover:border-rose-200 dark:hover:border-rose-900 shrink-0"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default WatchlistSection;

