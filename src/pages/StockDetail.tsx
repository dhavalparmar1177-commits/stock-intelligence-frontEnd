import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/client";
import { marketApi } from "../api/market";
import { useLang } from "../i18n/LanguageContext";
import { useWatchlist } from "../hooks/useWatchlist";
import { useMarketSocket } from "../hooks/useMarketSocket";
import StockChart from "../components/stock/StockChart";
import { Tabs } from "../components/ui/Tabs";
import { Card } from "../components/ui/Card";
import { MetricCard } from "../components/ui/MetricCard";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { SkeletonText } from "../components/ui/Skeleton";
import StockHeader from "../components/stock/StockHeader";
import AiAnalysisTab from "../components/stock/AiAnalysisTab";
import PeerCompare from "../components/stock/PeerCompare";
import { FundamentalsTab, TechnicalsTab, NewsTab } from "../components/stock/InfoTabs";
import { isIndianSymbol, isForeignError, fmtINR } from "../components/stock/utils";
import ConnectionStatus from "../components/ConnectionStatus";

/**
 * Stock Detail (Phase 3): live header + Overview / AI Analysis /
 * Fundamentals / Technicals / News / Peers tabs. Real data only —
 * the demo-seed snapshot is gone; missing data renders
 * "Insufficient data", never estimates.
 */
export default function StockDetail() {
  const { t, lang } = useLang();
  const { symbol } = useParams<{ symbol: string }>();
  const sym = (symbol || "").toUpperCase();
  const indian = isIndianSymbol(sym);
  const { add, remove, has } = useWatchlist();
  const watched = has(sym);

  const [quote, setQuote] = useState<any>(null);
  const [quoteError, setQuoteError] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [track, setTrack] = useState<any>(null);
  const [bars, setBars] = useState<any[]>([]);
  const [anaLoading, setAnaLoading] = useState(false);
  const [anaError, setAnaError] = useState("");
  const [seq, setSeq] = useState(0);

  // Real-time quote via WebSocket with REST fallback.
  const { quotes: liveQuotes, status: wsStatus, isStale, subscribe, unsubscribe } = useMarketSocket([sym]);

  // Sync WebSocket quote into local state for backward compatibility.
  useEffect(() => {
    const live = liveQuotes.get(sym);
    if (live) {
      setQuote(live);
      setQuoteError("");
    }
  }, [liveQuotes, sym]);

  // Initial REST fetch for immediate display + fallback.
  useEffect(() => {
    let alive = true;
    marketApi
      .quotes([sym])
      .then((r) => alive && (setQuote(r.quotes?.[0] || null), setQuoteError("")))
      .catch(() => alive && !quote && setQuoteError(t.panels.liveQuoteFail));
    return () => { alive = false; };
  }, [sym]);

  // AI batch: always attempted — the backend is the final arbiter
  // of NSE/BSE support. A rejection naming "Only NSE and BSE" marks
  // the symbol foreign; anything else is a real error. Stale results
  // are cleared so switching symbols never shows old data.
  // One batch per symbol/run — no duplicate requests.
  useEffect(() => {
    if (!sym) return;
    let alive = true;
    setAnaLoading(true);
    setAnaError("");
    setAnalysis(null);
    setTrack(null);
    setBars([]);
    Promise.all([
      api.get(`/market/india/analysis/${sym}`, { params: { lang } }).then((r) => r.data),
      marketApi.history(sym, "1d", "6mo").catch(() => ({ bars: [] })),
      api.get(`/market/india/forecasts/${sym}`, { params: { lang } }).then((r) => r.data).catch(() => null),
    ])
      .then(([a, h, tr]) => {
        if (!alive) return;
        setAnalysis(a);
        setBars(h.bars || []);
        setTrack(tr);
      })
      .catch((e: any) => {
        if (alive) setAnaError(e.response?.data?.error || t.gen.unableToLoad);
      })
      .finally(() => {
        if (alive) setAnaLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [sym, seq]);

  const f = analysis?.forecast || {};
  const foreign = isForeignError(anaError);

  const overview = (
    <div className="space-y-3">
      <StockChart symbol={sym} />
      {foreign ? (
        <Card title={t.forecast.title}>
          <EmptyState icon="🤖" title={t.forecast.onlyIN} />
        </Card>
      ) : (
        anaLoading && !analysis ? (
          <Card title={t.forecast.title}>
            <SkeletonText lines={3} />
          </Card>
        ) : anaError && !analysis ? (
          <ErrorState title={anaError} onRetry={() => setSeq((s) => s + 1)} retryLabel={t.common.retry} />
        ) : analysis ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <MetricCard
                label={t.forecast.statRange}
                value={f.low != null && f.high != null ? `${fmtINR(f.low)} – ${fmtINR(f.high)}` : undefined}
              />
              <MetricCard
                label={t.forecast.statUD}
                value={f.upsidePct != null ? `+${f.upsidePct}% / −${f.downsidePct}%` : undefined}
              />
              <MetricCard
                label={t.forecast.statExpected}
                value={f.expectedPct != null ? `${f.expectedPct >= 0 ? "+" : ""}${f.expectedPct}%` : undefined}
              />
              <MetricCard label={t.forecast.confidence} value={analysis.confidence != null ? `${analysis.confidence}%` : undefined} />
            </div>
            <Card title={t.stock.whyRating}>
              <div className="text-sm space-y-1">
                {analysis.reasons?.[0] && (
                  <p><b className="text-green-700 dark:text-green-400">{t.forecast.sumWhy}:</b> {analysis.reasons[0]}</p>
                )}
                {analysis.keyRisks?.[0] && (
                  <p><b className="text-red-700 dark:text-red-400">{t.forecast.sumWatch}:</b> {analysis.keyRisks[0]}</p>
                )}
              </div>
            </Card>
          </>
        ) : null
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <StockHeader
        symbol={sym}
        name={analysis?.name}
        exchange={analysis?.exchange}
        quote={quote}
        quoteError={quoteError}
        analysis={analysis}
        watched={watched}
        onToggleWatch={() => (watched ? remove(sym) : add(sym))}
        analyzing={anaLoading}
        canAnalyze={indian}
        onAnalyze={() => setSeq((s) => s + 1)}
      />

      <Tabs
        label={`Stock detail sections for ${sym}`}
        defaultId="overview"
        tabs={[
          { id: "overview", label: t.stock.tabOverview, content: overview },
          {
            id: "ai",
            label: t.stock.tabAI,
            content: foreign ? (
              <EmptyState icon="🤖" title={t.forecast.onlyIN} />
            ) : (
              <AiAnalysisTab
                analysis={analysis}
                track={track}
                bars={bars}
                loading={anaLoading}
                error={anaError}
                onRetry={() => setSeq((s) => s + 1)}
              />
            ),
          },
          {
            id: "fund",
            label: t.stock.tabFund,
            content: foreign ? (
              <EmptyState icon="📊" title={t.stock.insufficient} />
            ) : anaLoading && !analysis ? (
              <Card title={t.stock.tabFund}><SkeletonText lines={4} /></Card>
            ) : anaError && !analysis ? (
              <ErrorState title={anaError} onRetry={() => setSeq((s) => s + 1)} retryLabel={t.common.retry} />
            ) : (
              <FundamentalsTab analysis={analysis} />
            ),
          },
          {
            id: "tech",
            label: t.stock.tabTech,
            content: foreign ? (
              <EmptyState icon="📈" title={t.stock.insufficient} />
            ) : anaLoading && !analysis ? (
              <Card title={t.stock.tabTech}><SkeletonText lines={4} /></Card>
            ) : anaError && !analysis ? (
              <ErrorState title={anaError} onRetry={() => setSeq((s) => s + 1)} retryLabel={t.common.retry} />
            ) : (
              <TechnicalsTab analysis={analysis} />
            ),
          },
          {
            id: "news",
            label: t.stock.tabNews,
            content: foreign ? (
              <EmptyState icon="📰" title={t.stock.insufficient} />
            ) : anaLoading && !analysis ? (
              <Card title={t.stock.tabNews}><SkeletonText lines={4} /></Card>
            ) : anaError && !analysis ? (
              <ErrorState title={anaError} onRetry={() => setSeq((s) => s + 1)} retryLabel={t.common.retry} />
            ) : (
              <NewsTab analysis={analysis} symbol={sym} />
            ),
          },
          {
            id: "peers",
            label: t.stock.tabPeers,
            content: indian || analysis ? (
              <PeerCompare symbol={sym} />
            ) : (
              <EmptyState icon="🏢" title={t.stock.peersOnlyIN} />
            ),
          },
        ]}
      />
    </div>
  );
}
