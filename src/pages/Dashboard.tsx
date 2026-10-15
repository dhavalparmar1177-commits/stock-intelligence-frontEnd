import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowRight,
  RefreshCw,
  BarChart3,
  ShieldAlert,
} from "lucide-react";
import api from "../api/client";
import { marketApi } from "../api/market";
import { useLang } from "../i18n/LanguageContext";
import { Card } from "../components/ui/Card";
import { MarketCard } from "../components/ui/MarketCard";
import { VixGauge } from "../components/ui/VixGauge";
import { MarketStatus } from "../components/ui/MarketStatus";
import { MarketStatusCard } from "../components/ui/MarketStatusCard";
import { StatChip } from "../components/ui/StatChip";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { SkeletonCard, SkeletonRow } from "../components/ui/Skeleton";
import MarketChart from "../components/MarketChart";
import AiMarketBrief from "../components/AiMarketBrief";
import WatchlistSection from "../components/WatchlistSection";
import QuoteRow from "../components/QuoteRow";
import { SectorHeatmap } from "../components/daily/SectorHeatmap";
import { formatPriceINR } from "../design/tokens";

function getGreeting(t: any): string {
  const h = new Date().getHours();
  if (h < 12) return t.dash.greetMorning || "Good morning";
  if (h < 17) return t.dash.greetAfternoon || "Good afternoon";
  return t.dash.greetEvening || "Good evening";
}

function fmtTime(v: unknown): string | null {
  if (!v) return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Compliance-Strict AI Scanner Stock Card.
 * Replaces BUY/HOLD/SELL and numeric scores with neutral descriptors:
 * "Momentum: Strong / Neutral / Weak" and "90-day trend: Up / Flat / Down".
 * Never uses promotional words like "recommend", "buy now", or "opportunity".
 */
function ScannerStockCard({ o }: { o: any }) {
  const { t } = useLang();

  const momentum = useMemo(() => {
    const rawScore = Number(o.score ?? 50);
    if (rawScore >= 65) {
      return {
        label: "Momentum: Strong",
        tone: "positive" as const,
        trend: "90-day trend: Up",
      };
    }
    if (rawScore >= 45) {
      return {
        label: "Momentum: Neutral",
        tone: "warning" as const,
        trend: "90-day trend: Flat",
      };
    }
    return {
      label: "Momentum: Weak",
      tone: "neutral" as const,
      trend: "90-day trend: Down",
    };
  }, [o.score]);

  return (
    <Link
      to={`/stocks/${o.symbol}`}
      className="group block bg-white/80 dark:bg-[#131C30]/70 backdrop-blur-[20px] border border-slate-200/80 dark:border-white/[0.06] rounded-[20px] p-5 sm:p-6 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-violet-400/80 dark:hover:border-[#7C5CFF]/60 hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden"
      aria-label={`${o.symbol}, ${momentum.label}, ${momentum.trend}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-slate-900 dark:text-[#F4F6FB] group-hover:text-violet-600 dark:group-hover:text-[#7C5CFF] transition-colors truncate font-display">
              {o.symbol}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-[#A3AEC7] bg-slate-100 dark:bg-white/[0.06] px-2 py-0.5 rounded-full">
              NSE
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#A3AEC7] truncate mt-1">
            {o.name || t.gen.dataUnavailable}
          </p>
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
            momentum.tone === "positive"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-[#2BD67B] border-emerald-500/20"
              : momentum.tone === "warning"
              ? "bg-amber-500/10 text-amber-600 dark:text-[#FFB84D] border-amber-500/20"
              : "bg-slate-500/10 text-slate-600 dark:text-[#A3AEC7] border-slate-500/20"
          }`}
        >
          {momentum.label}
        </span>
      </div>

      <div className="flex items-baseline justify-between gap-2 mt-4 flex-wrap">
        <p className="font-bold text-xl sm:text-2xl si-numeric text-slate-900 dark:text-[#F4F6FB] tracking-tight">
          {o.price != null ? `₹${formatPriceINR(o.price)}` : t.gen.dataUnavailable}
        </p>
        <StatChip value={o.changePct} format="pct" size="sm" />
      </div>

      <div className="flex items-center gap-2 mt-3 flex-wrap text-xs">
        <span className="font-medium text-slate-600 dark:text-[#A3AEC7] bg-slate-100 dark:bg-white/[0.05] px-2.5 py-0.5 rounded-full">
          {momentum.trend}
        </span>
        {o.rsi14 != null && (
          <span className="font-mono text-slate-500 dark:text-[#A3AEC7] bg-slate-100 dark:bg-white/[0.05] px-2.5 py-0.5 rounded-full">
            RSI {o.rsi14}
          </span>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
        <p className="text-xs text-slate-600 dark:text-[#A3AEC7] line-clamp-2 leading-relaxed">
          {o.reasons?.[0] || o.mainReason || "Technical alignment with current index regime."}
        </p>
        <p className="text-[11px] text-slate-400 dark:text-[#6B7792] italic mt-2">
          For information only. Not investment advice.
        </p>
      </div>
    </Link>
  );
}

/**
 * Institutional StockIntel Dashboard — Compliant FinTech Edition.
 * - Above the Fold: Header, Hero Chart (8 cols, 440px), Status & VIX (4 cols), 3 Index Tiles.
 * - Mid Section: NSE Sector Market-Cap Treemap with diverging scale.
 * - Lower Section: Movers with percentage bars, AI Scanner (neutral descriptors), AI Brief, Watchlist, IPOs.
 */
export default function Dashboard() {
  const { t, lang } = useLang();
  const [idx, setIdx] = useState<any>(null);
  const [extra, setExtra] = useState<any[]>([]);
  const [moves, setMoves] = useState<any>(null);
  const [opps, setOpps] = useState<any>(null);
  const [mkt, setMkt] = useState<any>(null);
  const [ipos, setIpos] = useState<any[]>([]);
  const [failed, setFailed] = useState({ idx: "", extra: "", moves: "", opps: "", mkt: "", ipos: "" });
  const [seq, setSeq] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // User name from profile / storage
  const userName = useMemo(() => {
    try {
      return localStorage.getItem("userName") || localStorage.getItem("user_name") || "";
    } catch {
      return "";
    }
  }, []);
  const greetingName = userName ? userName : "Investor";

  useEffect(() => {
    let alive = true;
    setRefreshing(true);
    const fail = (k: "idx" | "extra" | "moves" | "opps" | "mkt" | "ipos", msg: string) =>
      alive && setFailed((p) => ({ ...p, [k]: msg }));

    marketApi.indices()
      .then((r) => alive && (setIdx(r), setFailed((p) => ({ ...p, idx: "" }))))
      .catch(() => fail("idx", t.gen.unableToLoad));

    marketApi.quotes(["^NSEBANK", "^INDIAVIX"])
      .then((r) => alive && (setExtra(r.quotes || []), setFailed((p) => ({ ...p, extra: "" }))))
      .catch(() => fail("extra", t.gen.unableToLoad));

    marketApi.movers()
      .then((r) => alive && (setMoves(r), setFailed((p) => ({ ...p, moves: "" }))))
      .catch(() => fail("moves", t.gen.unableToLoad));

    api.get("/market/india/opportunities", { params: { limit: 6, lang } })
      .then((r) => alive && (setOpps(r.data), setFailed((p) => ({ ...p, opps: "" }))))
      .catch(() => fail("opps", t.gen.unableToLoad));

    marketApi.indiaMarket(lang)
      .then((r) => alive && (setMkt(r), setFailed((p) => ({ ...p, mkt: "" }))))
      .catch(() => fail("mkt", t.gen.unableToLoad));

    marketApi.ipos()
      .then((r) => alive && (setIpos(Array.isArray(r) ? r.slice(0, 4) : []), setFailed((p) => ({ ...p, ipos: "" }))))
      .catch(() => fail("ipos", "Unable to load IPOs"));

    setTimeout(() => {
      if (alive) setRefreshing(false);
    }, 600);

    return () => {
      alive = false;
    };
  }, [seq, lang]);

  const retryAll = () => {
    setFailed({ idx: "", extra: "", moves: "", opps: "", mkt: "", ipos: "" });
    setSeq((s) => s + 1);
  };

  // Authoritative shared timestamp
  const sharedTime = useMemo(() => {
    const raw = idx?.asOf || idx?.indices?.[0]?.marketTime || new Date().toISOString();
    return fmtTime(raw) || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [idx]);

  // One-line market headline summary from real provider data
  const marketSummary = useMemo(() => {
    const nifty = (idx?.indices || []).find((i: any) => i.symbol === "^NSEI" || i.symbol === "NIFTY50");
    if (!nifty || nifty.price == null) {
      return t.dash.subtitle || "Institutional intelligence across Indian markets.";
    }
    const up = (nifty.changePct ?? 0) >= 0;
    const breadth = mkt?.breadth;
    let text = `NIFTY 50 trading at ₹${formatPriceINR(nifty.price)} (${up ? "+" : ""}${Number(nifty.changePct).toFixed(2)}%)`;
    if (breadth?.advancers != null && breadth?.decliners != null) {
      text += ` · Breadth: ${breadth.advancers} advances / ${breadth.decliners} declines`;
    } else if (mkt?.regime) {
      text += ` · Market Regime: ${mkt.regime}`;
    }
    return text;
  }, [idx, mkt, t]);

  // 3 Compact Benchmark Indices for Row 3
  const indexCards = [
    { key: "^NSEI", app: "NIFTY50", label: "NIFTY 50" },
    { key: "^BSESN", app: "SENSEX", label: "SENSEX" },
    { key: "^NSEBANK", app: "BANKNIFTY", label: "BANK NIFTY" },
  ].map((c) => {
    const hit =
      (idx?.indices || []).find((i: any) => i.symbol === c.key || i.symbol === c.app) ||
      extra.find((q: any) => q.symbol === c.key || (q.appSymbol || q.symbol) === c.app);
    return {
      label: c.label,
      name: c.label,
      value: hit?.price ?? null,
      change: hit?.change ?? null,
      changePct: hit?.changePct ?? null,
      unavailable: !hit || hit.unavailable || hit.price == null,
    };
  });

  // INDIA VIX quote for Row 2 Fear/VIX gauge
  const vixQuote = useMemo(() => {
    const hit =
      (idx?.indices || []).find((i: any) => i.symbol === "^INDIAVIX" || i.symbol === "INDIAVIX") ||
      extra.find((q: any) => q.symbol === "^INDIAVIX" || (q.appSymbol || q.symbol) === "INDIAVIX");
    return hit || null;
  }, [idx, extra]);

  const moversLoading = !moves && !failed.moves;
  const oppsLoading = !opps && !failed.opps;
  const cardsLoading = !idx && !extra.length && !failed.idx && !failed.extra;
  const nothingLoaded = !idx && !extra.length && !moves && !opps && !mkt;
  const allFailed = nothingLoaded && failed.idx && failed.extra && failed.moves && failed.opps && failed.mkt;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="space-y-6 max-w-[1440px] mx-auto pb-8"
    >
      {/* ======================================================== */}
      {/* ROW 1: STREAMLINED HEADER                                */}
      {/* Greeting + 1 Connection Badge + 1 Last Updated Time     */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/[0.06] pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-[#F4F6FB] font-display">
              {getGreeting(t)}, {greetingName}
            </h1>
            <MarketStatus />
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-[#A3AEC7] mt-1 leading-relaxed">
            {marketSummary}
          </p>

          {/* Unified single-row status & timestamp */}
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-[#A3AEC7] flex-wrap">
            <span className="inline-flex items-center gap-1.5 font-semibold text-amber-600 dark:text-[#FFB84D] bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Delayed 15 min
            </span>
            <span>·</span>
            <span>Updated at {sharedTime} IST</span>
            <span className="hidden sm:inline">· NSE & BSE Market Hours</span>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <Link
            to="/daily"
            className="inline-flex items-center gap-2 text-xs sm:text-sm px-4 py-2.5 rounded-[12px] bg-gradient-to-r from-[#7C5CFF] via-[#4F8CFF] to-[#22D3EE] hover:brightness-105 text-white font-semibold shadow-[0_4px_20px_rgba(124,92,255,0.25)] hover:shadow-[0_4px_24px_rgba(124,92,255,0.4)] transition-all duration-150 active:scale-[0.98]"
          >
            <span>{t.daily.title || "Daily Intelligence"}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/ipos"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm px-3.5 py-2.5 rounded-[12px] border border-slate-200/90 dark:border-white/[0.08] bg-white/80 dark:bg-[#131C30]/80 hover:bg-slate-100/90 dark:hover:bg-[#1A2540] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] text-slate-700 dark:text-[#F4F6FB] font-semibold transition-all duration-150"
          >
            <Layers className="w-4 h-4 text-[#7C5CFF]" />
            <span>IPO Center</span>
          </Link>

          <button
            type="button"
            onClick={retryAll}
            disabled={refreshing}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/80 dark:bg-[#131C30]/80 backdrop-blur-md border border-slate-200/90 dark:border-white/[0.08] text-slate-700 dark:text-[#F4F6FB] hover:bg-slate-100/90 dark:hover:bg-[#1A2540] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-150"
            title={`Last synced: ${sharedTime}`}
            aria-label="Refresh Market Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#7C5CFF]" : ""}`} />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ROW 2: HERO CHART (8 COLS, 440PX) + STATUS & VIX (4 COLS)  */}
      {/* Above the Fold Primary Focal Point                       */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column (8 cols): Hero Chart */}
        <div className="lg:col-span-8 flex flex-col">
          <MarketChart className="h-full" />
        </div>

        {/* Right Column (4 cols): Stacked Market Status & Semicircle VIX Gauge */}
        <div className="lg:col-span-4 flex flex-col sm:grid sm:grid-cols-2 lg:flex lg:flex-col gap-6">
          <div className="flex-1 min-h-[185px]">
            <MarketStatusCard marketData={mkt} loading={!mkt && !failed.mkt} />
          </div>
          <div className="flex-1 min-h-[220px]">
            <VixGauge
              value={vixQuote?.price}
              change={vixQuote?.change}
              changePct={vixQuote?.changePct}
              loading={cardsLoading}
            />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ROW 3: 3 COMPACT BENCHMARK INDEX TILES (EQUAL HEIGHT)   */}
      {/* SENSEX, BANK NIFTY, NIFTY 50                            */}
      {/* ======================================================== */}
      {allFailed ? (
        <ErrorState title={t.gen.unableToLoad} onRetry={retryAll} retryLabel={t.common.retry} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cardsLoading
            ? [0, 1, 2].map((i) => <SkeletonCard key={i} />)
            : indexCards.map((c) => <MarketCard key={c.label} market={c} />)}
        </div>
      )}

      {/* ======================================================== */}
      {/* ROW 4: SECTOR MARKET-CAP TREEMAP (ABOVE AI SECTION)      */}
      {/* ======================================================== */}
      {mkt?.sectors && mkt.sectors.length > 0 ? (
        <SectorHeatmap sectors={mkt.sectors} />
      ) : !mkt && !failed.mkt ? (
        <div className="h-[360px] rounded-[20px] bg-slate-100 dark:bg-white/[0.03] animate-pulse" />
      ) : null}

      {/* ======================================================== */}
      {/* ROW 5: 12-COLUMN BENTO GRID                             */}
      {/* Left (8 cols): Top Movers + AI Scanner (View All)       */}
      {/* Right (4 cols): AI Market Brief + Watchlist + IPOs       */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 of 12 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Market Movers: Gainers and Losers with Percentage Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card
              title={
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#2BD67B]" />
                  <span>{t.dash.gainers || "Top Gainers"}</span>
                </span>
              }
              subtitle={moves?.universe}
              padded={false}
            >
              <div className="p-3 divide-y divide-slate-100 dark:divide-white/[0.05]">
                {moversLoading ? (
                  [0, 1, 2, 3].map((i) => <SkeletonRow key={i} />)
                ) : failed.moves ? (
                  <ErrorState title={failed.moves} onRetry={retryAll} retryLabel={t.common.retry} />
                ) : moves?.gainers?.length ? (
                  moves.gainers.slice(0, 5).map((x: any) => <QuoteRow key={x.symbol} x={x} showBar />)
                ) : (
                  <div className="p-6 text-center text-xs text-slate-500 dark:text-[#A3AEC7]">
                    Session data settling or exchange offline.
                  </div>
                )}
              </div>
            </Card>

            <Card
              title={
                <span className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-[#FF5C6C]" />
                  <span>{t.dash.losers || "Top Losers"}</span>
                </span>
              }
              padded={false}
            >
              <div className="p-3 divide-y divide-slate-100 dark:divide-white/[0.05]">
                {moversLoading ? (
                  [0, 1, 2, 3].map((i) => <SkeletonRow key={i} />)
                ) : failed.moves ? (
                  <ErrorState title={failed.moves} onRetry={retryAll} retryLabel={t.common.retry} />
                ) : moves?.losers?.length ? (
                  moves.losers.slice(0, 5).map((x: any) => <QuoteRow key={x.symbol} x={x} showBar />)
                ) : (
                  <div className="p-6 text-center text-xs text-slate-500 dark:text-[#A3AEC7]">
                    Session data settling or exchange offline.
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* AI Market Pattern Scanner (Neutral Descriptors, No Promotional Copy) */}
          <Card
            title={
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#7C5CFF]" />
                <span>AI Technical & Pattern Scanner</span>
              </span>
            }
            subtitle={
              opps
                ? `${opps.ranked} of ${opps.scanned} tracked equities analyzed · For information only`
                : "Quantitative momentum & indicator alignment"
            }
            action={
              <Link
                to="/opportunities"
                className="text-xs sm:text-sm font-semibold text-violet-600 dark:text-[#7C5CFF] hover:underline flex items-center gap-1 group"
              >
                <span>View all ({opps?.opportunities?.length || 6})</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            }
          >
            {oppsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[0, 1, 2, 3].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : failed.opps ? (
              <ErrorState title={failed.opps} onRetry={retryAll} retryLabel={t.common.retry} />
            ) : opps?.opportunities?.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {opps.opportunities.slice(0, 4).map((o: any) => (
                  <ScannerStockCard key={o.symbol} o={o} />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-[16px] bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10">
                <p className="text-sm font-semibold text-slate-700 dark:text-[#A3AEC7]">
                  No active technical patterns scanned in this session.
                </p>
                <p className="text-xs text-slate-400 dark:text-[#6B7792] mt-1">
                  Scanner runs algorithmic technical criteria across NSE liquid equities.
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (4 of 12 cols): AI Brief, Watchlist, Upcoming IPOs */}
        <div className="lg:col-span-4 space-y-6">
          {/* AI Market Brief */}
          <AiMarketBrief data={mkt} loading={!mkt && !failed.mkt} error={failed.mkt} onRetry={retryAll} />

          {/* Quick Watchlist Section */}
          <WatchlistSection />

          {/* Upcoming IPOs Card */}
          {ipos.length > 0 && (
            <Card
              title={
                <span className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#7C5CFF]" />
                  <span>Upcoming & Open IPOs</span>
                </span>
              }
              action={
                <Link
                  to="/ipos"
                  className="text-xs font-semibold text-violet-600 dark:text-[#7C5CFF] hover:underline flex items-center gap-1 group"
                >
                  <span>All IPOs</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              }
            >
              <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                {ipos.slice(0, 3).map((ipo) => (
                  <Link
                    key={ipo.symbol}
                    to={`/ipos/${ipo.symbol}`}
                    className="flex items-center justify-between py-3 px-1 hover:bg-slate-50 dark:hover:bg-white/[0.04] rounded-lg transition group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-slate-900 dark:text-[#F4F6FB] truncate group-hover:text-violet-600 dark:group-hover:text-[#7C5CFF] transition-colors">
                        {ipo.symbol}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-[#A3AEC7] truncate mt-0.5">
                        {ipo.name}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-[#A3AEC7]">
                        {ipo.status?.toUpperCase() || "UPCOMING"}
                      </span>
                      {ipo.gmp?.value && (
                        <p className="text-xs font-semibold text-[#2BD67B] si-numeric mt-1">
                          GMP: +₹{ipo.gmp.value}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
}
