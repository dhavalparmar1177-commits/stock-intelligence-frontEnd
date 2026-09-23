import { useState } from "react";
import { useLang } from "../../i18n/LanguageContext";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

interface Answer {
  points: string[];
  sources: string[];
}

function num(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString("en-IN") : null;
}

/**
 * "Ask AI about this stock" — deterministic answers composed ONLY
 * from the already-loaded analysis payload. No network calls, no
 * backend changes, no invented content. Every answer cites sources;
 * unanswerable parts say "Insufficient data".
 */
export function AskAi({ analysis }: { analysis: any }) {
  const { t } = useLang();
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);

  const a = analysis || {};

  const answerRating = (): Answer => {
    const points: string[] = [];
    if (a.signal && a.score != null) points.push(`${t.stock.askRated} ${a.signal} ${t.stock.askScore} ${a.score}/100.`);
    const cats = (a.categories || []).filter((c: any) => c?.score != null).sort((x: any, y: any) => y.score - x.score);
    if (cats.length) points.push(`${t.stock.askAreas} ${cats.slice(0, 3).map((c: any) => `${c.key} (${c.score}/100)`).join(", ")}.`);
    if (a.reasoning?.final) points.push(a.reasoning.final);
    if (!points.length) points.push(t.stock.askInsufficient);
    return { points, sources: ["signal", "score", "categories", "reasoning.final"] };
  };

  const answerRisks = (): Answer => {
    const points: string[] = [];
    if (a.riskLevel) points.push(`${t.stock.askRiskLevel} ${a.riskLevel}.`);
    (a.keyRisks || []).forEach((r: string) => points.push(`• ${r}`));
    (a.anomalies || []).forEach((x: any) => x?.message && points.push(`• ${t.stock.askAnomaly} ${x.message}`));
    if (!points.length) points.push(t.stock.askInsufficient);
    return { points, sources: ["riskLevel", "keyRisks", "anomalies"] };
  };

  const answerExpensive = (): Answer => {
    const points: string[] = [
      t.stock.askNoPE,
    ];
    const ind = a.indicators || {};
    if (a.currentPrice != null && ind.sma50 != null) {
      const d = ((a.currentPrice - ind.sma50) / ind.sma50) * 100;
      points.push(`${t.stock.askPriceSits} ${d >= 0 ? "+" : ""}${d.toFixed(1)}% ${t.stock.askVs50d}`);
    }
    if (ind.bollinger?.pctB != null) points.push(`${t.stock.askBollinger} ${ind.bollinger.pctB} ${t.stock.askBollingerHint}`);
    if (ind.week52High != null && ind.week52Low != null && a.currentPrice != null) {
      const pos = ((a.currentPrice - ind.week52Low) / (ind.week52High - ind.week52Low)) * 100;
      points.push(`${t.stock.askPrice52w} ${pos.toFixed(0)}% ${t.stock.askPrice52wHint}`);
    }
    return { points, sources: ["fundamentals (null)", "indicators.sma50", "indicators.bollinger", "indicators.week52High/Low"] };
  };

  const answerBullish = (): Answer => {
    const points: string[] = [];
    (a.reasons || []).slice(0, 4).forEach((r: string) => points.push(`• ${r}`));
    if (a.forecast?.upsidePct != null) points.push(`${t.stock.askUpside} +${a.forecast.upsidePct}%.`);
    if (a.support?.length) points.push(`${t.stock.askSupport} ${a.support.map((v: number) => num(v)).join(" · ")}.`);
    if (a.trend) points.push(`${t.stock.askTrend} ${a.trend}.`);
    if (!points.length) points.push(t.stock.askInsufficient);
    return { points, sources: ["reasons", "forecast.upsidePct", "support", "trend"] };
  };

  const answerCompare = (): Answer => {
    const points: string[] = [];
    const rp = a.relativePerformance;
    if (rp?.vsNifty3mPct != null) points.push(`${t.stock.askVsNifty} ${rp.vsNifty3mPct >= 0 ? "+" : ""}${rp.vsNifty3mPct} pts.`);
    if (rp?.vsSector3mPct != null) points.push(`${t.stock.askVsSector} ${rp.sectorName || ""} ${rp.vsSector3mPct >= 0 ? "+" : ""}${rp.vsSector3mPct} pts.`);
    if (rp?.verdict) points.push(rp.verdict);
    points.push(t.stock.askPeersHint);
    return { points, sources: ["relativePerformance", "peers (indiaCompare)"] };
  };

  const answerFallback = (): Answer => {
    const points: string[] = [];
    if (a.signal) points.push(`${t.stock.askViewIs} ${a.signal} (${a.score ?? "—"}/100, confidence ${a.confidence ?? "—"}%).`);
    if (a.dataGaps?.length) points.push(`${t.stock.askLimitedBy} ${a.dataGaps.join("; ")}.`);
    points.push(t.stock.askTrySuggested);
    return { points, sources: ["signal", "score", "confidence", "dataGaps"] };
  };

  const resolve = (text: string): Answer => {
    const s = text.toLowerCase();
    if (/why|rat/.test(s)) return answerRating();
    if (/risk|danger|downside|worry|concern/.test(s)) return answerRisks();
    if (/expensive|cheap|valu|overvalu|undervalu|p\/e|\bpe\b|worth|fair/.test(s)) return answerExpensive();
    if (/bull|upside|buy|rally|rise|moon/.test(s)) return answerBullish();
    if (/compar|competitor|peer|rival|\bvs\b|better than|versus/.test(s)) return answerCompare();
    return answerFallback();
  };

  const ask = (text: string) => {
    if (!text.trim()) return;
    setAnswer(resolve(text));
  };

  const chips = [t.stock.q1, t.stock.q2, t.stock.q3, t.stock.q4, t.stock.q5];

  return (
    <Card title={t.stock.askTitle}>
      <div className="flex gap-1.5 flex-wrap mb-2">
        {chips.map((c) => (
          <button
            key={c}
            onClick={() => { setQ(c); ask(c); }}
            className="text-xs px-2.5 py-1.5 border border-violet-300 dark:border-violet-800 text-violet-700 dark:text-violet-300 rounded-full hover:bg-violet-50 dark:hover:bg-violet-950"
          >
            {c}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask(q)}
          placeholder={t.stock.askPh}
          aria-label={t.stock.askPh}
          className="flex-1 min-w-0 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 placeholder:text-slate-400"
        />
        <Button variant="ai" size="md" onClick={() => ask(q)} disabled={!q.trim()}>
          {t.stock.askButton}
        </Button>
      </div>
      {answer ? (
        <div className="mt-3 text-sm space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
          {answer.points.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <p className="text-xs text-slate-500">
            {t.stock.askSources}: {answer.sources.join(", ")}
          </p>
        </div>
      ) : (
        <p className="text-xs text-slate-500 mt-2">{t.stock.askEmpty} {t.stock.askHint}</p>
      )}
    </Card>
  );
}

export default AskAi;
