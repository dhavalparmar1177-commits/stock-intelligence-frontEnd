import { Link } from "react-router-dom";
import { useLang } from "../../i18n/LanguageContext";
import { Alert } from "../ui/Alert";
import { Card } from "../ui/Card";
import { MetricCard } from "../ui/MetricCard";
import { EmptyState } from "../ui/EmptyState";
import { ErrorState } from "../ui/ErrorState";
import { SkeletonText } from "../ui/Skeleton";
import ForecastChart from "./ForecastChart";
import AskAi from "./AskAi";
import ChartInsight from "./ChartInsight";
import SourceTag from "./SourceTag";
import { fmtINR } from "./utils";

/**
 * Signature AI Analysis tab. Presents score/view/confidence/risk,
 * bullish AND bearish evidence side-by-side, pictures, real-data
 * scenarios, data-quality caveats, Q&A and track record.
 */
export function AiAnalysisTab({
  analysis,
  track,
  bars,
  loading,
  error,
  onRetry,
}: {
  analysis: any;
  track: any;
  bars: any[];
  loading: boolean;
  error: string;
  onRetry: () => void;
}) {
  const { t } = useLang();

  const CAT_LABEL: Record<string, string> = {
    technical: t.stock.tCatTechnical,
    momentum: t.stock.tCatMomentum,
    volume: t.stock.tCatVolume,
    sentiment: t.stock.tCatSentiment,
    sector: t.stock.tCatSector,
    market: t.stock.tCatMarket,
    fundamentals: t.stock.tCatFundamentals,
  };

  if (loading && !analysis) {
    return (
      <Card title={t.forecast.title}>
        <SkeletonText lines={5} />
        <p className="text-sm text-slate-500 mt-2">{t.forecast.crunching}</p>
      </Card>
    );
  }
  if (error && !analysis) return <ErrorState title={error} onRetry={onRetry} retryLabel={t.common.retry} />;
  if (!analysis) return <EmptyState icon="🤖" title={t.stock.noAnalysis} />;

  const a = analysis;
  const f = a.forecast || {};

  // Verdict + confidence band, derived from real fields only.
  const BUY = ["BUY", "खरीदें", "ખરીદો"];
  const SELL = ["SELL", "बेचें", "વેચો"];
  const trend = String(a.trend || "");
  const view: "bull" | "bear" | "neutral" =
    BUY.includes(a.signal) || /bull|तेजी|તેજી/i.test(trend)
      ? "bull"
      : SELL.includes(a.signal) || /bear|मंदी|મંદી/i.test(trend)
        ? "bear"
        : "neutral";
  const confBand =
    a.confidence == null ? null : a.confidence >= 70 ? "high" : a.confidence >= 50 ? "med" : "low";
  const viewLabel = view === "bull" ? t.stock.tBullish : view === "bear" ? t.stock.tBearish : t.stock.tNeutral;

  // Invalidation conditions observed in the loaded data right now.
  const ind = a.indicators || {};
  const invalid: string[] = [];
  if (ind.rsi14 != null && ind.rsi14 >= 70) invalid.push(`${t.stock.invRsiHot} (RSI ${ind.rsi14})`);
  if (ind.rsi14 != null && ind.rsi14 <= 30) invalid.push(`${t.stock.invRsiCold} (RSI ${ind.rsi14})`);
  if (a.volumeAnalysis?.ratio != null && a.volumeAnalysis.ratio >= 2) {
    invalid.push(`${t.stock.invVol} (${a.volumeAnalysis.ratio}×)`);
  }
  if (a.currentPrice != null && ind.sma50) {
    const d = ((a.currentPrice - ind.sma50) / ind.sma50) * 100;
    if (Math.abs(d) >= 10) invalid.push(`${t.stock.invSma} (${d >= 0 ? "+" : ""}${d.toFixed(1)}%)`);
  }

  const histCloses = (bars || [])
    .filter((b: any) => b?.close != null)
    .map((b: any) => Number(b.close));

  return (
    <div className="space-y-3">
      {/* Verdict hero: view + confidence band + score + risk */}
      <Card
        title={`${t.forecast.title} — ${a.signal || t.stock.insufficient}`}
        action={<SourceTag kind="ai" />}
        accent="ai"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          <div className="md:col-span-4 flex items-center gap-4">
            <div className="min-w-[100px]">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t.stock.tViewLabel}</p>
              <p className={`text-2xl font-black tracking-tight ${view === "bull" ? "text-emerald-600 dark:text-emerald-400" : view === "bear" ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400"}`}>
                {viewLabel}
              </p>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                <span>{t.forecast.confidence}:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {confBand === "high" ? t.chart.confHigh : confBand === "med" ? t.chart.confMed : confBand === "low" ? t.chart.confLow : "—"}
                </span>
                {a.confidence != null && <span className="si-numeric text-slate-400">({a.confidence}%)</span>}
              </div>
            </div>

            <div className="text-center pl-4 border-l border-slate-200 dark:border-slate-800">
              <p className="text-3xl font-black si-numeric tracking-tight text-violet-600 dark:text-violet-400">{a.score ?? "—"}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Score /100</p>
            </div>
          </div>

          <div className="md:col-span-8 grid sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <p className="font-bold text-emerald-700 dark:text-emerald-400 mb-0.5 flex items-center gap-1">
                <span>▲</span> {t.forecast.sumWhy}
              </p>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{a.reasons?.[0] || "—"}</p>
            </div>
            <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20">
              <p className="font-bold text-rose-700 dark:text-rose-400 mb-0.5 flex items-center gap-1">
                <span>▼</span> {t.forecast.sumWatch}
              </p>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{a.keyRisks?.[0] || "—"}</p>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          {t.forecast.dataAsOf} {a.asOf ? new Date(a.asOf).toLocaleString() : t.gen.dataUnavailable}
        </p>
      </Card>

      {/* Bullish Drivers vs Risks Side-by-Side */}
      <div className="grid md:grid-cols-2 gap-3">
        <Card title={t.stock.whyRating} action={<SourceTag kind="ai" />}>
          {(a.reasons?.length || a.strengths?.length) ? (
            <ul className="space-y-2 text-xs">
              {(a.reasons || a.strengths || []).slice(0, 5).map((x: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                  <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
                  <span className="leading-relaxed">{x}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500">{t.stock.insufficient}</p>
          )}
        </Card>

        <Card title={t.stock.risks} action={<SourceTag kind="ai" />}>
          {(a.keyRisks?.length || a.anomalies?.length) ? (
            <ul className="space-y-2 text-xs">
              {(a.keyRisks || []).slice(0, 4).map((x: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                  <span className="text-rose-500 font-bold shrink-0 mt-0.5">⚠</span>
                  <span className="leading-relaxed">{x}</span>
                </li>
              ))}
              {(a.anomalies || []).map((x: any, i: number) => (
                <li key={`a${i}`} className="flex items-start gap-2 text-amber-600 dark:text-amber-400">
                  <span className="font-bold shrink-0 mt-0.5">!</span>
                  <span className="leading-relaxed">{x.message}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500">{t.stock.insufficient}</p>
          )}
        </Card>
      </div>

      {/* WHAT COULD CHANGE THE VIEW */}
      <Card title={t.stock.invTitle} action={<SourceTag kind="calc" />}>
        {invalid.length || a.dataGaps?.length ? (
          <ul className="list-disc ml-4 text-sm space-y-1">
            {invalid.map((x, i) => <li key={i}>{x}</li>)}
            {(a.dataGaps || []).map((g: string, i: number) => <li key={`g${i}`} className="text-slate-500">{g}</li>)}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">{t.stock.invNone}</p>
        )}
      </Card>

      {/* Score breakdown (collapsed — detail on demand) */}
      {a.categories && (
        <details className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3">
          <summary className="cursor-pointer font-semibold text-[0.9375rem]">
            {t.stock.breakdown} <SourceTag kind="ai" />
          </summary>
          <div className="mt-3 space-y-1.5">
            {a.categories.map((c: any) => (
              <div key={c.key} className="flex items-center gap-2 text-xs">
                <span className="w-32 shrink-0 font-medium">
                  {CAT_LABEL[c.key] ?? c.key} <span className="text-slate-400 font-normal">×{c.weight}</span>
                </span>
                <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded overflow-hidden">
                  {c.score !== null && c.score !== undefined && (
                    <div className="h-full bg-violet-600" style={{ width: `${c.score}%` }} />
                  )}
                </div>
                <span className="w-28 text-right text-slate-500">
                  {c.score !== null && c.score !== undefined ? `${c.score}/100` : t.forecast.excludedShort}
                </span>
              </div>
            ))}
            <p className="text-xs text-slate-500">({t.forecast.scoreNote})</p>
          </div>
        </details>
      )}

      {/* Valuation + range */}
      <Card
        title={t.stock.valuation}
        action={<span className="flex gap-1"><SourceTag kind="real" /><SourceTag kind="calc" /></span>}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
          <MetricCard label={t.forecast.statCurrent} value={a.currentPrice != null ? fmtINR(a.currentPrice) : undefined} />
          <MetricCard
            label={t.forecast.statRange}
            value={f.low != null && f.high != null ? `${fmtINR(f.low)} – ${fmtINR(f.high)}` : undefined}
          />
          <MetricCard
            label={t.forecast.statUD}
            value={f.upsidePct != null && f.downsidePct != null ? `+${f.upsidePct}% / −${f.downsidePct}%` : undefined}
          />
          <MetricCard
            label={t.forecast.statExpected}
            value={f.expectedPct != null ? `${f.expectedPct >= 0 ? "+" : ""}${f.expectedPct}%` : undefined}
          />
        </div>
        <div className="mt-3">
          <p className="text-xs text-slate-500 mb-1">{t.forecast.chartNote}</p>
          <ChartInsight closes={histCloses} />
          <ForecastChart bars={bars} projection={f.projection || []} currentPrice={a.currentPrice} />
        </div>
      </Card>

      {/* Bull / Base / Bear — real modelled prices only */}
      {a.scenarios && (
        <Card title={t.forecast.scenTitle}>
          <div className="grid sm:grid-cols-3 gap-2 text-sm">
            {a.scenarios.map((s: any) => (
              <div
                key={s.key}
                className={`border rounded-xl p-3 ${s.key === "bull" ? "border-green-300 bg-green-50/50 dark:bg-green-950/20" : s.key === "bear" ? "border-red-300 bg-red-50/50 dark:bg-red-950/20" : "border-blue-300 bg-blue-50/50 dark:bg-blue-950/20"}`}
              >
                <p className="font-bold">{s.label}: {s.price != null ? fmtINR(s.price) : t.stock.insufficient}</p>
                <ul className="list-disc ml-4 text-xs mt-1 text-slate-600 dark:text-slate-300">
                  {s.conditions?.map((c: string, i: number) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Confidence reflects data quality */}
      <Card title={t.stock.gapsTitle} action={<SourceTag kind="ai" />}>
        <p className="text-sm">
          {t.forecast.confidence}: <b>{a.confidence != null ? `${a.confidence}%` : t.stock.insufficient}</b>
        </p>
        {a.dataGaps?.length ? (
          <ul className="list-disc ml-4 text-sm mt-1 text-slate-600 dark:text-slate-300">
            {a.dataGaps.map((g: string, i: number) => <li key={i}>{g}</li>)}
          </ul>
        ) : null}
        <p className="text-xs text-slate-500 mt-1">{t.stock.gapsNote}</p>
      </Card>

      {/* Ask AI */}
      <AskAi analysis={a} />

      {/* Track record */}
      {track?.metrics && track.metrics.totalForecasts > 0 && (
        <Card
          title={t.forecast.trackTitle}
          action={<Link to="/evaluation" className="text-sm text-violet-700 dark:text-violet-300 hover:underline">AI Evaluation →</Link>}
        >
          <p className="text-sm text-slate-500">
            {track.metrics.totalForecasts} {t.forecast.stored} · {track.metrics.evaluated} {t.forecast.evaluated} ·{" "}
            {t.forecast.dirAcc} <b>{track.metrics.directionAccuracyPct ?? "—"}%</b> · {t.forecast.avgErr}{" "}
            <b>{track.metrics.avgErrorPct ?? "—"}%</b>
          </p>
        </Card>
      )}

      <Alert tone="info" title={t.forecast.detailsSum}>
        <p className="text-xs">{a.methodology}</p>
        <p className="text-xs mt-1 font-medium">{a.disclaimer}</p>
      </Alert>
    </div>
  );
}

export default AiAnalysisTab;
