import { Link } from "react-router-dom";
import { useLang } from "../../i18n/LanguageContext";
import { Alert } from "../ui/Alert";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { MetricCard } from "../ui/MetricCard";
import { EmptyState } from "../ui/EmptyState";
import { Tooltip } from "../ui/Tooltip";
import { fmtINR } from "./utils";

/**
 * Fundamentals tab. The free feed publishes no statements or ratios
 * (backend: fundamentals always null), so this tab says so up front
 * and shows only live-derivable facts. Everything else: unavailable.
 */
export function FundamentalsTab({ analysis }: { analysis: any }) {
  const { t } = useLang();
  if (!analysis) return <EmptyState icon="📊" title={t.stock.insufficient} />;
  const ind = analysis.indicators || {};
  const px = analysis.currentPrice;
  const vsSMA = (sma: unknown) =>
    px != null && sma != null && Number(sma) !== 0
      ? `${(((px - Number(sma)) / Number(sma)) * 100).toFixed(1)}%`
      : undefined;
  return (
    <div className="space-y-3">
      <Alert tone="info" title={t.stock.tabFund}>
        <p>{t.stock.fundMissing}</p>
        {analysis.fundamentalHealth?.note && (
          <p className="text-xs text-slate-500 mt-1">{analysis.fundamentalHealth.note}</p>
        )}
      </Alert>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <MetricCard label={t.stock.f52wHigh} value={ind.week52High != null ? fmtINR(ind.week52High) : undefined} tip={t.stock.fTip52} />
        <MetricCard label={t.stock.f52wLow} value={ind.week52Low != null ? fmtINR(ind.week52Low) : undefined} tip={t.stock.fTip52} />
        <MetricCard
          label={t.stock.fVolatility}
          value={ind.volatilityAnnPct != null ? `${ind.volatilityAnnPct}%` : undefined}
          tip={t.forecast.tipVol}
        />
        <MetricCard
          label={t.stock.fVolumeVsAvg}
          value={analysis.volumeAnalysis?.ratio != null ? `${analysis.volumeAnalysis.ratio}×` : undefined}
          tip={t.stock.fTipVolRatio}
        />
        <MetricCard label={t.stock.fPriceVsSma50} value={vsSMA(ind.sma50)} tip={t.stock.fTipSMA} />
        <MetricCard label={t.stock.fPriceVsSma200} value={vsSMA(ind.sma200)} tip={t.stock.fTipSMA} />
        <MetricCard label={t.stock.fPE} value={undefined} tip={t.stock.fundMissing} />
        <MetricCard label={t.stock.fDebtEquity} value={undefined} tip={t.stock.fundMissing} />
        <MetricCard label={t.stock.fRevenue} value={undefined} tip={t.stock.fundMissing} />
        <MetricCard label={t.stock.fProfit} value={undefined} tip={t.stock.fundMissing} />
        <MetricCard label={t.stock.fEps} value={undefined} tip={t.stock.fundMissing} />
        <MetricCard label={t.stock.fDivYield} value={undefined} tip={t.stock.fundMissing} />
      </div>
      <Card title={t.stock.valuation}>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t.stock.fundMissing}
        </p>
      </Card>
    </div>
  );
}

/**
 * Technicals tab — indicators, volume read, real support/resistance.
 */
export function TechnicalsTab({ analysis }: { analysis: any }) {
  const { t } = useLang();
  if (!analysis) return <EmptyState icon="📈" title={t.stock.insufficient} />;
  const ind = analysis.indicators || {};
  const macd = ind.macd ? `${ind.macd.dif}/${ind.macd.signal} (hist ${ind.macd.hist})` : undefined;
  const bb = ind.bollinger ? `${fmtINR(ind.bollinger.lower)}–${fmtINR(ind.bollinger.upper)} (%B ${ind.bollinger.pctB})` : undefined;
  return (
    <div className="space-y-3">
      <Card title={t.stock.techPic}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <MetricCard label={t.stock.tRsi} value={ind.rsi14 ?? undefined} tip={t.forecast.tipRSI} />
          <MetricCard label={t.stock.tMacd} value={macd} tip={t.forecast.tipMACD} />
          <MetricCard label={t.stock.tSma} value={ind.sma20 != null ? `${ind.sma20}/${ind.sma50 ?? "—"}/${ind.sma200 ?? "—"}` : undefined} />
          <MetricCard label={t.stock.tEma} value={ind.ema20 ?? undefined} />
          <MetricCard label={t.stock.tBollinger} value={bb} />
          <MetricCard label={t.stock.tAtr} value={ind.atr14 ?? undefined} />
          <MetricCard label={t.stock.tMomentum} value={ind.momentum3mPct != null ? `${ind.momentum3mPct}%` : undefined} />
          <MetricCard label={t.stock.tTrend} value={analysis.trend ?? undefined} />
        </div>
      </Card>
      {analysis.volumeAnalysis && (
        <Card title={t.stock.tVolume}>
          <p className="text-sm">
            🔊 {analysis.volumeAnalysis.verdict}{" "}
            <span className="text-slate-500">
              ({t.stock.tToday} {fmtINR(analysis.volumeAnalysis.today)} {t.stock.tVsAvg} {fmtINR(analysis.volumeAnalysis.avg20)})
            </span>
          </p>
        </Card>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        <Card title={t.forecast.support}>
          <p className="font-semibold text-green-700 dark:text-green-400">
            <Tooltip tip={t.forecast.tipSup}>
              {analysis.support?.length
                ? analysis.support.map((v: number) => fmtINR(v)).join(" · ")
                : t.stock.insufficient}
            </Tooltip>
          </p>
        </Card>
        <Card title={t.forecast.resistance}>
          <p className="font-semibold text-red-700 dark:text-red-400">
            <Tooltip tip={t.forecast.tipRes}>
              {analysis.resistance?.length
                ? analysis.resistance.map((v: number) => fmtINR(v)).join(" · ")
                : t.stock.insufficient}
            </Tooltip>
          </p>
        </Card>
      </div>
    </div>
  );
}

/**
 * News tab — real Yahoo headlines + extractive news intel.
 */
export function NewsTab({ analysis, symbol }: { analysis: any; symbol?: string }) {
  const { t } = useLang();
  if (!analysis) return <EmptyState icon="📰" title={t.stock.insufficient} />;
  const ni = analysis.newsIntel;
  const items = analysis.news || [];
  const score = analysis.sentiment?.score;
  const tone = score == null ? "neutral" : score >= 60 ? "positive" : score <= 40 ? "negative" : "warning";
  return (
    <div className="space-y-3">
      {ni && ni.count > 0 && (
        <Card title={`${t.forecast.newsTitle} (${ni.count})`}>
          <div className="text-sm space-y-1">
            <p>{ni.summary}</p>
            <p className="text-slate-500">
              <b>{t.forecast.impactTitle}:</b> {ni.impact}
            </p>
          </div>
        </Card>
      )}
      {analysis.sentiment && (
        <Card title={t.stock.tSentiment}>
          <p className="text-sm flex items-center gap-2 flex-wrap">
            <Badge tone={tone as "positive" | "negative" | "warning" | "neutral"}>
              {analysis.sentiment.label}
            </Badge>
            <span className="text-slate-500">
              ({analysis.sentiment.positive}/{analysis.sentiment.negative} · {analysis.sentiment.counted})
            </span>
          </p>
        </Card>
      )}
      <Card title={t.stock.tabNews}>
        {items.length ? (
          <ul className="text-sm space-y-2">
            {items.map((n: any, i: number) => (
              <li key={i} className="border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0">
                {n.url ? (
                  <a href={n.url} target="_blank" rel="noreferrer" className="text-blue-700 dark:text-blue-400 hover:underline font-medium">
                    {n.title}
                  </a>
                ) : (
                  <p className="font-medium">{n.title}</p>
                )}
                <p className="text-xs text-slate-500">
                  {n.publisher || t.gen.dataUnavailable}
                  {n.publishedAt ? ` · ${new Date(n.publishedAt).toLocaleDateString()}` : ""}
                  {symbol ? (
                    <> · Related: <Link to={`/stocks/${symbol}`} className="text-blue-700 dark:text-blue-400 hover:underline">{symbol}</Link></>
                  ) : null}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon="📰" title={t.stock.insufficient} />
        )}
      </Card>
    </div>
  );
}
