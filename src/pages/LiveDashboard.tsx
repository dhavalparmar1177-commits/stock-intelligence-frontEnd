import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { marketApi } from "../api/market";
import { useLang } from "../i18n/LanguageContext";
import { useMarketSocket } from "../hooks/useMarketSocket";
import { Alert } from "../components/ui/Alert";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { MarketCard } from "../components/ui/MarketCard";
import { SkeletonCard, SkeletonRow } from "../components/ui/Skeleton";
import { Grid2to4, Grid1to3, PageHeader } from "../components/layout/primitives";
import QuoteRow from "../components/QuoteRow";
import SectorStocks from "../components/sector/SectorStocks";
import ConnectionStatus from "../components/ConnectionStatus";

export default function LiveDashboard() {
  const { t } = useLang();
  const [data, setData] = useState<any>(null);
  const [moves, setMoves] = useState<any>(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState("");

  // WebSocket for real-time connection status (indices/movers use REST).
  const { status: wsStatus, isStale } = useMarketSocket([]);

  const load = async () => {
    try {
      const [idx, mv] = await Promise.all([marketApi.indices(), marketApi.movers()]);
      setData(idx);
      setMoves(mv);
      setUpdated(new Date().toLocaleTimeString());
      setError("");
    } catch (e: any) {
      setError(e.response?.data?.error || t.live.feedFail);
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, []);

  const doSearch = async (v: string) => {
    setQ(v);
    if (!v) {
      setResults([]);
      return;
    }
    try {
      const r = await marketApi.search(v);
      setResults(r.results || []);
    } catch {}
  };

  const row = (x: any) => <QuoteRow key={x.symbol} x={x} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <div className="flex items-center gap-2.5">
            <span>{t.live.title}</span>
            <Badge tone="live" dot>{t.live.liveBadge}</Badge>
          </div>
        }
        description={
          <div className="flex items-center gap-3">
            {updated && <span>{t.common.updated} {updated} · {t.common.autoRefresh}</span>}
            <ConnectionStatus status={wsStatus} isStale={isStale} />
          </div>
        }
        actions={
          <button
            onClick={load}
            className="text-xs sm:text-sm px-3.5 py-2 border border-slate-200/90 dark:border-slate-800/80 rounded-xl bg-white dark:bg-[#0e1626] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-card font-medium transition-all"
          >
            ↻ {t.common.refreshNow}
          </button>
        }
      />

      {error && (
        <Alert tone="danger" title={error}>
          <button onClick={load} className="underline font-semibold text-xs mt-1">
            {t.common.retry}
          </button>
        </Alert>
      )}

      {/* Fast Live Search */}
      <div className="relative">
        <div className="relative">
          <span aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            🔍
          </span>
          <input
            value={q}
            onChange={(e) => doSearch(e.target.value)}
            placeholder={t.live.searchPh}
            aria-label={t.live.searchPh}
            className="w-full border border-slate-200/90 dark:border-slate-800/80 rounded-2xl pl-10 pr-4 py-3 text-sm bg-white dark:bg-[#0e1626] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-card"
          />
        </div>
        {results.length > 0 && (
          <div className="absolute z-30 w-full bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl mt-1.5 shadow-pop max-h-64 overflow-auto p-1.5 space-y-0.5">
            {results.map((s: any) => (
              <Link
                key={s.symbol}
                to={`/stocks/${s.appSymbol || s.symbol}`}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 text-sm transition-colors"
              >
                <div className="min-w-0">
                  <span className="font-bold text-slate-900 dark:text-slate-100 mr-2">
                    {s.appSymbol || s.symbol}
                  </span>
                  <span className="text-xs text-slate-500 truncate">{s.name}</span>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {s.exchange}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Index ticker cards */}
      <Grid2to4>
        {(data?.indices || []).map((i: any) => (
          <MarketCard
            key={i.symbol}
            market={{ name: i.name, value: i.price, changePct: i.changePct, unavailable: i.unavailable }}
          />
        ))}
        {!data && !error && [0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </Grid2to4>

      {/* Market movers */}
      <Grid1to3>
        <Card title={t.live.gainers} subtitle={moves?.universe} padded={false}>
          <div className="p-3.5 sm:p-4 divide-y divide-slate-100 dark:divide-slate-800/80">
            {moves?.gainers?.map(row) || [0, 1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
          </div>
        </Card>
        <Card title={t.live.losers} padded={false}>
          <div className="p-3.5 sm:p-4 divide-y divide-slate-100 dark:divide-slate-800/80">
            {moves?.losers?.map(row) || [0, 1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
          </div>
        </Card>
        <Card title={t.live.active} padded={false}>
          <div className="p-3.5 sm:p-4 divide-y divide-slate-100 dark:divide-slate-800/80">
            {moves?.mostActive?.map(row) || [0, 1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
          </div>
        </Card>
      </Grid1to3>

      {/* Market Regime & Sector Constituents */}
      <SectorStocks />

      {/* Data Source Footnote */}
      <div className="bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
        <span aria-hidden="true">ℹ️</span>
        <span>{t.live.datasource}</span>
      </div>
    </div>
  );
}

