import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { marketApi } from "../api/market";
import { useLang } from "../i18n/LanguageContext";
import { Card } from "../components/ui/Card";
import { MarketCard } from "../components/ui/MarketCard";
import { Badge, AIScoreBadge, SignalBadge, RiskBadge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { SkeletonCard, SkeletonRow } from "../components/ui/Skeleton";
import { Grid2to4, Grid1to3, PageHeader, Section } from "../components/layout/primitives";
import MarketChart from "../components/MarketChart";
import AiMarketBrief from "../components/AiMarketBrief";
import WatchlistSection from "../components/WatchlistSection";
import QuoteRow from "../components/QuoteRow";

function greetingFor(t: any): string {
  const h = new Date().getHours();
  if (h < 12) return t.dash.greetMorning;
  if (h < 17) return t.dash.greetAfternoon;
  return t.dash.greetEvening;
}

function fmtTime(v: unknown): string | null {
  if (!v) return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function OppCard({ o, i }: { o: any; i: number }) {
  const { t } = useLang();
  const up = (o.changePct ?? 0) >= 0;
  return (
    <Link
      to={`/stocks/${o.symbol}`}
      className="group block bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-card hover:shadow-card-hover hover:border-violet-400/80 dark:hover:border-violet-600/80 transition-all duration-200 relative overflow-hidden"
      aria-label={`${o.symbol}, score ${o.score ?? "unavailable"}, ${o.signal ?? ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 px-2 py-0.5 rounded-md">
              #{i + 1}
            </span>
            <span className="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
              {o.symbol}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
            {o.name || t.gen.dataUnavailable}
          </p>
        </div>
        <AIScoreBadge score={o.score} />
      </div>

      <div className="flex items-baseline justify-between gap-2 mt-3.5 flex-wrap">
        <p className="font-bold text-xl si-numeric text-slate-900 dark:text-slate-100 tracking-tight">
          {o.price != null ? `₹${Number(o.price).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : t.gen.dataUnavailable}
        </p>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full si-numeric ${
          up
            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60"
            : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60"
        }`}>
          {o.changePct != null ? `${up ? "+" : ""}${Number(o.changePct).toFixed(2)}%` : t.gen.dataUnavailable}
        </span>
      </div>

      <div className="flex items-center gap-1.5 mt-3 flex-wrap">
        <SignalBadge signal={o.signal} />
        <RiskBadge level={o.riskLevel} />
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {o.reasons?.[0] || o.mainReason || t.gen.dataUnavailable}
        </p>
      </div>
    </Link>
  );
}

/**
 * Institutional Fintech Dashboard.
 */
export default function Dashboard() {
  const { t, lang } = useLang();
  const [idx, setIdx] = useState<any>(null);
  const [extra, setExtra] = useState<any[]>([]);
  const [moves, setMoves] = useState<any>(null);
  const [opps, setOpps] = useState<any>(null);
  const [mkt, setMkt] = useState<any>(null);
  const [failed, setFailed] = useState({ idx: "", extra: "", moves: "", opps: "", mkt: "" });
  const [seq, setSeq] = useState(0);

  useEffect(() => {
    let alive = true;
    const fail = (k: "idx" | "extra" | "moves" | "opps" | "mkt", msg: string) =>
      alive && setFailed((p) => ({ ...p, [k]: msg }));
    marketApi.indices().then((r) => alive && (setIdx(r), setFailed((p) => ({ ...p, idx: "" })))).catch(() => fail("idx", t.gen.unableToLoad));
    marketApi.quotes(["^NSEBANK", "^INDIAVIX"]).then((r) => alive && (setExtra(r.quotes || []), setFailed((p) => ({ ...p, extra: "" })))).catch(() => fail("extra", t.gen.unableToLoad));
    marketApi.movers().then((r) => alive && (setMoves(r), setFailed((p) => ({ ...p, moves: "" })))).catch(() => fail("moves", t.gen.unableToLoad));
    api.get("/market/india/opportunities", { params: { limit: 6, lang } }).then((r) => alive && (setOpps(r.data), setFailed((p) => ({ ...p, opps: "" })))).catch(() => fail("opps", t.gen.unableToLoad));
    marketApi.indiaMarket(lang).then((r) => alive && (setMkt(r), setFailed((p) => ({ ...p, mkt: "" })))).catch(() => fail("mkt", t.gen.unableToLoad));
    return () => {
      alive = false;
    };
  }, [seq]);

  const retryAll = () => {
    setFailed({ idx: "", extra: "", moves: "", opps: "", mkt: "" });
    setSeq((s) => s + 1);
  };

  const cards = [
    { key: "^NSEI", app: "NIFTY50", label: "NIFTY 50" },
    { key: "^BSESN", app: "SENSEX", label: "SENSEX" },
    { key: "^NSEBANK", app: "BANKNIFTY", label: "BANK NIFTY" },
    { key: "^INDIAVIX", app: "INDIAVIX", label: "INDIA VIX" },
  ].map((c) => {
    const hit =
      (idx?.indices || []).find((i: any) => i.symbol === c.key || i.symbol === c.app) ||
      extra.find((q: any) => q.symbol === c.key || (q.appSymbol || q.symbol) === c.app);
    const t1 = fmtTime(hit?.marketTime) || fmtTime(idx?.asOf);
    return {
      label: c.label,
      name: c.label,
      value: hit?.price ?? null,
      changePct: hit?.changePct ?? null,
      unavailable: !hit || hit.unavailable || hit.price == null,
      updated: t1 ? `${t.dash.lastUpdated} ${t1}` : null,
    };
  });

  const moversLoading = !moves && !failed.moves;
  const oppsLoading = !opps && !failed.opps;
  const cardsLoading = !idx && !extra.length && !failed.idx && !failed.extra;
  const nothingLoaded = !idx && !extra.length && !moves && !opps && !mkt;
  const allFailed = nothingLoaded && failed.idx && failed.extra && failed.moves && failed.opps && failed.mkt;

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <div className="flex items-center gap-2.5">
            <span>{greetingFor(t)}</span>
            <span aria-hidden="true" className="text-xl sm:text-2xl">👋</span>
          </div>
        }
        description={t.dash.subtitle}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to="/daily"
              className="text-xs sm:text-sm px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 font-semibold shadow-sm transition-all"
            >
              {t.daily.title} →
            </Link>
            <Link
              to="/ipos"
              className="text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0e1626] text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 font-semibold shadow-card transition-all"
            >
              {t.ipo.title} →
            </Link>
            <button
              onClick={retryAll}
              className="text-xs sm:text-sm px-3 py-2 border border-slate-200/90 dark:border-slate-800/80 rounded-xl bg-white dark:bg-[#0e1626] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-card transition-all"
              title={t.common.refreshNow}
            >
              ↻ {t.common.refreshNow}
            </button>
          </div>
        }
      />

      {/* 1. Market index ticker cards */}
      {allFailed ? (
        <ErrorState title={t.gen.unableToLoad} onRetry={retryAll} retryLabel={t.common.retry} />
      ) : (
        <Grid2to4>
          {cardsLoading
            ? [0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)
            : cards.map((c) => <MarketCard key={c.label} market={c} />)}
        </Grid2to4>
      )}

      {/* 2. Interactive Market Chart */}
      <MarketChart />

      {/* 3. AI Ranked Opportunities */}
      <Section
        title={t.dash.oppTitle}
        badge={<Badge tone="ai" dot>AI · LIVE</Badge>}
        subtitle={opps ? `${opps.ranked} of ${opps.scanned} scanned` : undefined}
        action={
          <Link to="/opportunities" className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
            {t.dash.oppAll} →
          </Link>
        }
      >
        {oppsLoading ? (
          <Grid1to3>
            {[0, 1, 2].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </Grid1to3>
        ) : failed.opps ? (
          <ErrorState title={failed.opps} onRetry={retryAll} retryLabel={t.common.retry} />
        ) : opps?.opportunities?.length ? (
          <Grid1to3>
            {opps.opportunities.map((o: any, i: number) => (
              <OppCard key={o.symbol} o={o} i={i} />
            ))}
          </Grid1to3>
        ) : (
          <Card>
            <EmptyState icon="🤖" title={t.gen.dataUnavailable} />
          </Card>
        )}
      </Section>

      {/* 4. Market Movers (Gainers, Losers, Active) */}
      <Grid1to3>
        <Card title={t.dash.gainers} subtitle={moves?.universe} padded={false}>
          <div className="p-3.5 sm:p-4 divide-y divide-slate-100 dark:divide-slate-800/80">
            {moversLoading
              ? [0, 1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)
              : failed.moves
                ? <ErrorState title={failed.moves} onRetry={retryAll} retryLabel={t.common.retry} />
                : moves?.gainers?.length
                  ? moves.gainers.map((x: any) => <QuoteRow key={x.symbol} x={x} />)
                  : <EmptyState icon="📊" title={t.common.noData} />}
          </div>
        </Card>
        <Card title={t.dash.losers} padded={false}>
          <div className="p-3.5 sm:p-4 divide-y divide-slate-100 dark:divide-slate-800/80">
            {moversLoading
              ? [0, 1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)
              : failed.moves
                ? <ErrorState title={failed.moves} onRetry={retryAll} retryLabel={t.common.retry} />
                : moves?.losers?.length
                  ? moves.losers.map((x: any) => <QuoteRow key={x.symbol} x={x} />)
                  : <EmptyState icon="📊" title={t.common.noData} />}
          </div>
        </Card>
        <Card title={t.dash.active} padded={false}>
          <div className="p-3.5 sm:p-4 divide-y divide-slate-100 dark:divide-slate-800/80">
            {moversLoading
              ? [0, 1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)
              : failed.moves
                ? <ErrorState title={failed.moves} onRetry={retryAll} retryLabel={t.common.retry} />
                : moves?.mostActive?.length
                  ? moves.mostActive.map((x: any) => <QuoteRow key={x.symbol} x={x} />)
                  : <EmptyState icon="📊" title={t.common.noData} />}
          </div>
        </Card>
      </Grid1to3>

      {/* 5. AI Market Intelligence Brief */}
      <AiMarketBrief data={mkt} loading={!mkt && !failed.mkt} error={failed.mkt} onRetry={retryAll} />

      {/* 6. Quick Watchlist */}
      <WatchlistSection />
    </div>
  );
}

