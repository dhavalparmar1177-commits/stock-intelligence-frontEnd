import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { marketApi } from "../api/market";
import { useLang } from "../i18n/LanguageContext";
import { useWatchlists } from "../hooks/useWatchlist";
import { useAlerts, describeAlert } from "../hooks/useAlerts";
import { Alert } from "../components/ui/Alert";
import { Badge, AIScoreBadge, SignalBadge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { SkeletonCard, SkeletonText } from "../components/ui/Skeleton";
import { PageHeader } from "../components/layout/primitives";
import SourceTag from "../components/stock/SourceTag";
import AlertModal from "../components/AlertModal";
import SectorHeatmap from "../components/daily/SectorHeatmap";
import { normSym } from "../components/screener/useScreenerUniverse";

function fmtT(v: unknown): string | null {
  if (!v) return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d.toLocaleString();
}

/**
 * Daily Intelligence (no new backend): one batched load (indices,
 * movers, market, opportunities-5) plus a single quotes batch for
 * watchlist symbols. Every sentence cites its datum; missing data
 * omits the sentence or shows a fallback — never invented.
 */
export default function Daily() {
  const { t, lang } = useLang();
  const { lists } = useWatchlists();
  const { alerts, triggered } = useAlerts();

  const [idx, setIdx] = useState<any>(null);
  const [moves, setMoves] = useState<any>(null);
  const [mkt, setMkt] = useState<any>(null);
  const [opps, setOpps] = useState<any>(null);
  const [failed, setFailed] = useState({ idx: "", moves: "", mkt: "", opps: "", wl: "" });
  const [seq, setSeq] = useState(0);
  const [wlQuotes, setWlQuotes] = useState<any[]>([]);
  const [alertFor, setAlertFor] = useState<string | null>(null);

  const wlSyms = useMemo(
    () => [...new Set(lists.flatMap((l) => l.symbols))].slice(0, 25),
    [lists]
  );
  const wlKey = wlSyms.join(",");

  useEffect(() => {
    let alive = true;
    const fail = (k: keyof typeof failed, msg: string) =>
      alive && setFailed((p) => ({ ...p, [k]: msg }));
    const ok = (k: keyof typeof failed) => alive && setFailed((p) => ({ ...p, [k]: "" }));
    marketApi.indices().then((r) => alive && (setIdx(r), ok("idx"))).catch(() => fail("idx", t.gen.unableToLoad));
    marketApi.movers().then((r) => alive && (setMoves(r), ok("moves"))).catch(() => fail("moves", t.gen.unableToLoad));
    marketApi.indiaMarket(lang).then((r) => alive && (setMkt(r), ok("mkt"))).catch(() => fail("mkt", t.gen.unableToLoad));
    marketApi.opportunities(5, lang).then((r) => alive && (setOpps(r), ok("opps"))).catch(() => fail("opps", t.gen.unableToLoad));
    return () => {
      alive = false;
    };
  }, [seq]);

  useEffect(() => {
    if (!wlKey) {
      setWlQuotes([]);
      return;
    }
    let alive = true;
    marketApi
      .quotes(wlKey.split(","))
      .then((r) => alive && (setWlQuotes(r.quotes || []), setFailed((p) => ({ ...p, wl: "" }))))
      .catch(() => alive && setFailed((p) => ({ ...p, wl: t.gen.unableToLoad })));
    return () => {
      alive = false;
    };
  }, [wlKey, seq]);

  const retryAll = () => {
    setFailed({ idx: "", moves: "", mkt: "", opps: "", wl: "" });
    setSeq((s) => s + 1);
  };

  // Morning brief sentences — each guarded by its datum.
  const brief: string[] = [];
  if (mkt) {
    if (mkt.regime) brief.push(`${t.daily.marketRegime} ${mkt.regime}.`);
    if (mkt.nifty?.price != null) {
      brief.push(
        `NIFTY 50 at ${Number(mkt.nifty.price).toLocaleString("en-IN")} (${mkt.nifty.changePct != null ? `${mkt.nifty.changePct >= 0 ? "+" : ""}${mkt.nifty.changePct}%` : "change unavailable"}).`
      );
    }
    const b = mkt.breadth;
    if (b?.tracked != null) {
      brief.push(`Breadth: ${b.advancers ?? "—"} advancers vs ${b.decliners ?? "—"} decliners of ${b.tracked} tracked NSE stocks.`);
    }
  }
  if (idx?.indices?.length) {
    const parts = idx.indices
      .filter((i: any) => i.price != null)
      .map((i: any) => `${i.name} ${Number(i.price).toLocaleString("en-IN")} (${i.changePct != null ? `${i.changePct >= 0 ? "+" : ""}${i.changePct}%` : "—"})`);
    if (parts.length) brief.push(parts.join(" · ") + ".");
  }

  // Why moving: biggest verified movers + breadth direction.
  const why: string[] = [];
  const g0 = moves?.gainers?.[0];
  const l0 = moves?.losers?.[0];
  if (g0) why.push(`${t.daily.ledBy} ${g0.appSymbol || g0.symbol} (${g0.changePct != null ? `+${Number(g0.changePct).toFixed(2)}%` : "up"}).`);
  if (l0) why.push(`${t.daily.draggedBy} ${l0.appSymbol || l0.symbol} (${l0.changePct != null ? `${Number(l0.changePct).toFixed(2)}%` : "down"}).`);
  if (mkt?.breadth?.advancers != null && mkt?.breadth?.decliners != null) {
    const { advancers: a, decliners: d } = mkt.breadth;
    why.push(a > d ? `${t.daily.gainsBroad} (${a} vs ${d}).` : d > a ? `${t.daily.fallsBroad} (${d} vs ${a}).` : `${t.daily.breadthEven} (${a} vs ${d}).`);
  }
  const sectors = (mkt?.sectors || []).filter((s: any) => s?.momentum3mPct != null);
  if (sectors.length) {
    const sorted = [...sectors].sort((x: any, y: any) => (y.changePct ?? 0) - (x.changePct ?? 0));
    if (sorted[0]?.changePct != null) why.push(`${t.daily.strongestSector} ${sorted[0].sector} (${sorted[0].changePct >= 0 ? "+" : ""}${sorted[0].changePct}%).`);
  }

  // Watchlist what-changed: day movers within the user's lists.
  const changed = useMemo(() => {
    const rows = wlQuotes
      .map((q: any) => {
        const sym = q.appSymbol || q.symbol;
        const pct = q.changePct != null ? Number(q.changePct) : null;
        const flags: string[] = [];
        if (pct != null && Math.abs(pct) >= 3) flags.push(`${pct >= 0 ? "+" : ""}${pct.toFixed(2)}% ${t.daily.dayMove}`);
        if (q.price != null && q.week52High && q.price >= q.week52High * 0.98) flags.push(t.daily.near52wHigh);
        if (q.price != null && q.week52Low && q.price <= q.week52Low * 1.02) flags.push(t.daily.near52wLow);
        return { sym, name: q.name, price: q.price, pct, flags };
      })
      .filter((r) => r.sym);
    return rows.sort((a, b) => Math.abs(b.pct ?? -1) - Math.abs(a.pct ?? -1)).slice(0, 8);
  }, [wlQuotes]);

  const triggeredList = alerts.filter((a) => triggered[a.id]);
  const asOf = idx?.asOf || moves?.asOf || mkt?.asOf || opps?.asOf;
  const asOfText = fmtT(asOf);
  const firstPaint = !idx && !moves && !mkt && !opps && !failed.idx && !failed.moves && !failed.mkt && !failed.opps;

  return (
    <div className="space-y-4">
      <PageHeader
        title={t.daily.title}
        description={`${t.daily.subtitle}${asOfText ? ` · ${t.daily.asOf} ${asOfText}` : ""}`}
        actions={
          <button
            onClick={retryAll}
            className="text-sm px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
          >
            ↻ {t.common.refreshNow}
          </button>
        }
      />

      {firstPaint ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <>
          {/* Morning brief */}
          <Card title={t.daily.brief} action={<SourceTag kind="real" />}>
            {!mkt && !idx ? (
              failed.mkt && failed.idx ? (
                <ErrorState title={t.gen.unableToLoad} onRetry={retryAll} retryLabel={t.common.retry} />
              ) : (
                <SkeletonText lines={3} />
              )
            ) : brief.length ? (
              <ul className="space-y-1.5 text-sm">
                {brief.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span aria-hidden="true" className="text-blue-600">→</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon="🌅" title={t.gen.dataUnavailable} />
            )}
          </Card>

          {/* Why moving */}
          <Card title={t.daily.whyMoving} action={<SourceTag kind="real" />}>
            {!moves && !mkt ? (
              failed.moves && failed.mkt ? (
                <ErrorState title={t.gen.unableToLoad} onRetry={retryAll} retryLabel={t.common.retry} />
              ) : (
                <SkeletonText lines={3} />
              )
            ) : why.length ? (
              <ul className="space-y-1.5 text-sm">
                {why.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span aria-hidden="true" className="text-amber-600">→</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon="📊" title={t.daily.flat} />
            )}
          </Card>

          {/* Sector heatmap */}
          {failed.mkt && !mkt ? (
            <ErrorState title={t.gen.unableToLoad} onRetry={retryAll} retryLabel={t.common.retry} />
          ) : (
            <SectorHeatmap sectors={mkt?.sectors || []} />
          )}

          {/* Watchlist what changed */}
          <Card
            title={t.daily.watchChanged}
            action={<Link to="/watchlist" className="text-sm text-blue-700 dark:text-blue-400 hover:underline">{t.daily.viewAll} →</Link>}
          >
            {!wlKey ? (
              <EmptyState icon="⭐" title={t.daily.noWatchlists} />
            ) : !changed.length && !failed.wl ? (
              <SkeletonText lines={3} />
            ) : failed.wl ? (
              <ErrorState title={failed.wl} onRetry={retryAll} retryLabel={t.common.retry} />
            ) : changed.length ? (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {changed.map((r) => (
                  <li key={r.sym} className="flex items-center gap-2 py-2 text-sm flex-wrap">
                    <Link to={`/stocks/${r.sym}`} className="font-bold text-blue-700 dark:text-blue-400 hover:underline">
                      {r.sym}
                    </Link>
                    <span className="si-numeric font-semibold">
                      {r.price != null ? Number(r.price).toLocaleString("en-IN") : t.gen.na}
                    </span>
                    <span className={`si-numeric font-semibold ${r.pct != null && r.pct >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                      {r.pct != null ? `${r.pct >= 0 ? "+" : ""}${r.pct.toFixed(2)}%` : t.gen.na}
                    </span>
                    {r.flags.map((fl) => (
                      <Badge key={fl} tone="warning">{fl}</Badge>
                    ))}
                    <button
                      onClick={() => setAlertFor(normSym(r.sym))}
                      aria-label={`${t.daily.createAlertFor}${r.sym}`}
                      title={`${t.daily.createAlertFor}${r.sym}`}
                      className="ml-auto text-xs px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700"
                    >
                      🔔
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon="📊" title={t.daily.flat} />
            )}
          </Card>

          {/* Smart alerts */}
          <Card
            title={`${t.daily.alerts} (${triggeredList.length})`}
            action={<Link to="/watchlist" className="text-sm text-blue-700 dark:text-blue-400 hover:underline">{t.daily.viewAll} →</Link>}
          >
            {triggeredList.length ? (
              <ul className="space-y-1.5 text-sm">
                {triggeredList.map((a) => (
                  <li key={a.id} className="flex gap-2 items-center flex-wrap">
                    <Badge tone="negative">{t.alerts.triggered}</Badge>
                    <span className="flex-1">{describeAlert(a)}</span>
                    <span className="text-xs text-slate-500">{triggered[a.id].snapshot}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon="🔔" title={t.daily.noAlerts} />
            )}
          </Card>

          {/* Research ideas */}
          <Card
            title={t.daily.ideas}
            action={<span className="flex gap-1 items-center"><SourceTag kind="ai" /><Link to="/opportunities" className="text-sm text-blue-700 dark:text-blue-400 hover:underline">{t.daily.viewAll} →</Link></span>}
          >
            {!opps && !failed.opps ? (
              <SkeletonText lines={4} />
            ) : failed.opps ? (
              <ErrorState title={failed.opps} onRetry={retryAll} retryLabel={t.common.retry} />
            ) : opps?.opportunities?.length ? (
              <ul className="space-y-2">
                {opps.opportunities.slice(0, 4).map((o: any, i: number) => (
                  <li key={o.symbol} className="flex gap-2 items-start text-sm border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0 flex-wrap">
                    <span className="font-bold text-slate-400">#{i + 1}</span>
                    <Link to={`/stocks/${o.symbol}`} className="font-bold text-blue-700 dark:text-blue-400 hover:underline">
                      {o.symbol}
                    </Link>
                    <AIScoreBadge score={o.score} />
                    <SignalBadge signal={o.signal} />
                    <span className="text-slate-500 basis-full sm:basis-auto">{o.reasons?.[0] || ""}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon="🤖" title={t.gen.dataUnavailable} />
            )}
          </Card>

          {/* Events: tradeable feed unavailable — real calendar items live on /calendar */}
          <Card
            title={t.daily.events}
            action={<Link to="/calendar" className="text-sm text-blue-700 dark:text-blue-400 hover:underline">{t.daily.viewAll} →</Link>}
          >
            <EmptyState icon="📅" title={t.daily.eventsNA} description={t.daily.eventsContract} />
          </Card>
        </>
      )}

      {alertFor && <AlertModal symbol={alertFor} onClose={() => setAlertFor(null)} />}
    </div>
  );
}
