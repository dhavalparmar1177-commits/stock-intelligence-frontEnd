import { Link } from "react-router-dom";
import { useLang } from "../../i18n/LanguageContext";
import { Card } from "../ui/Card";
import { CmpRow, num, relNifty, fmtINR } from "./cmpUtils";

/**
 * Grounded AI comparison composer. Every sentence is built from the
 * ranked compare payload (scores, reasons, risks, indicators,
 * forecast bands). Explains WHY — never bare "X is better".
 * No network calls, no invented content.
 */
export function AiVerdict({ rows }: { rows: CmpRow[] }) {
  const { t } = useLang();
  if (rows.length < 2) return null;
  const leader = rows[0];
  const rest = rows.slice(1);

  const advantages = rest.map((r) => {
    const edges: string[] = [];
    if (r.topReasons?.[0]) edges.push(r.topReasons[0]);
    const rv = relNifty(r);
    const lv = relNifty(leader);
    if (rv != null && lv != null && rv > lv) {
      edges.push(`${t.compare.vStrongerNifty} (${rv} pts vs ${lv} pts for ${leader.symbol}).`);
    }
    if (num(r.volatilityAnnPct) != null && num(leader.volatilityAnnPct) != null && Number(r.volatilityAnnPct) < Number(leader.volatilityAnnPct)) {
      edges.push(`${t.compare.vCalmer} (volatility ${r.volatilityAnnPct}% vs ${leader.volatilityAnnPct}%).`);
    }
    if (num(r.forecast?.upsidePct) != null && num(leader.forecast?.upsidePct) != null && Number(r.forecast?.upsidePct) > Number(leader.forecast?.upsidePct)) {
      edges.push(`${t.compare.vLargerUpside} (+${r.forecast?.upsidePct}% vs +${leader.forecast?.upsidePct}%).`);
    }
    return { r, edges };
  });

  const scores = rows.map((r) => num(r.score)).filter((v): v is number => v != null);
  const gap = scores.length >= 2 ? Math.max(...scores) - Math.min(...scores) : null;

  const missing: string[] = [];
  const missingFields = new Set<string>();
  for (const r of rows) {
    if (r.score == null) missingFields.add("AI score");
    if (!r.signal) missingFields.add("signal");
    if (r.rsi14 == null) missingFields.add("RSI");
    if (r.forecast?.low == null) missingFields.add("forecast range");
    if (!r.sentiment) missingFields.add("sentiment");
  }
  if (missingFields.size) missing.push(`${t.compare.vMissingFor} ${[...missingFields].join(", ")}.`);
  missing.push(t.compare.vNoPE);
  const confidence = Math.max(25, 75 - missingFields.size * 10 - (gap != null && gap < 5 ? 5 : 0));

  const monitors: string[] = [];
  for (const r of rows) {
    if (num(r.rsi14) != null && (Number(r.rsi14) > 70 || Number(r.rsi14) < 30)) {
      monitors.push(`${r.symbol}: RSI ${r.rsi14} — ${t.compare.vExtremeRSI}`);
    }
    if (num(r.volumeRatio) != null && Number(r.volumeRatio) >= 2) {
      monitors.push(`${r.symbol}: ${t.compare.vHighVolume.replace("×", `${r.volumeRatio}×`)}`);
    }
    if (num(r.volatilityAnnPct) != null && Number(r.volatilityAnnPct) >= 40) {
      monitors.push(`${r.symbol}: ${t.compare.vHighVol.replace("volatility", `volatility ${r.volatilityAnnPct}%`)}`);
    }
  }
  if (!monitors.length) monitors.push(t.compare.vNoExtremes);

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <p className="font-semibold text-sm mb-1">{title}</p>
      <div className="text-sm space-y-1 text-slate-700 dark:text-slate-200">{children}</div>
    </div>
  );

  return (
    <Card title={t.compare.aiVerdict} accent="ai">
      <div className="space-y-4">
        <Section title={t.compare.vOverall}>
          <p>
            {leader.symbol} {t.compare.vRanksFirst} ({leader.score ?? "—"}/100
            {gap != null ? `, ${gap.toFixed(0)} ${t.compare.vPointsClear}` : ""}).{" "}
            {leader.signal && <>{t.compare.vSignalReads} {leader.signal} with a {leader.trend} {t.compare.vTrend}.</>} Rankings reflect the
            composite of technical, momentum, volume, sentiment, sector and market factors — not price alone.
          </p>
        </Section>

        <Section title={t.compare.vWhy}>
          {leader.topReasons?.length ? (
            <ul className="list-disc ml-4">
              {leader.topReasons.map((x, i) => <li key={i}>{x}</li>)}
            </ul>
          ) : (
            <p>{t.gen.dataUnavailable}</p>
          )}
        </Section>

        {advantages.map(({ r, edges }) => (
          <Section key={r.symbol} title={t.compare.vEdge.replace("{s}", r.symbol)}>
            {edges.length ? (
              <ul className="list-disc ml-4">
                {edges.map((x, i) => <li key={i}>{x}</li>)}
              </ul>
            ) : (
              <p>{t.gen.dataUnavailable}</p>
            )}
          </Section>
        ))}

        <Section title={t.compare.vRisks}>
          <ul className="list-disc ml-4">
            {rows.flatMap((r) => (r.topRisks || []).map((x, i) => <li key={`${r.symbol}${i}`}><b>{r.symbol}:</b> {x}</li>))}
            {!rows.some((r) => r.topRisks?.length) && <li>{t.gen.dataUnavailable}</li>}
          </ul>
        </Section>

        <div className="grid sm:grid-cols-2 gap-3">
          <Section title={t.compare.vBull}>
            <ul className="list-disc ml-4">
              {rows.flatMap((r) => (r.topReasons || []).map((x, i) => <li key={`${r.symbol}${i}`}><b>{r.symbol}:</b> {x}</li>))}
            </ul>
          </Section>
          <Section title={t.compare.vBear}>
            <ul className="list-disc ml-4">
              {rows.flatMap((r) => (r.topRisks || []).map((x, i) => <li key={`${r.symbol}${i}`}><b>{r.symbol}:</b> {x}</li>))}
            </ul>
          </Section>
        </div>

        <Section title={t.compare.vChange}>
          <p>
            {gap != null && gap < 10
              ? `${t.compare.vScoresClose} ${gap.toFixed(0)} ${t.compare.vSingleWeek}`
              : `${gap != null ? gap.toFixed(0) + "-point" : ""} ${t.compare.vGapMaterial}`}{" "}
            {missing[0]}
          </p>
        </Section>

        <Section title={t.compare.vMonitor}>
          <ul className="list-disc ml-4">
            {monitors.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </Section>

        <Section title={t.compare.vScenarios}>
          <div className="grid sm:grid-cols-3 gap-2">
            {rows.map((r) => (
              <div key={r.symbol} className="border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                <p className="font-bold mb-1">
                  <Link to={`/stocks/${r.symbol}`} className="text-blue-700 dark:text-blue-400 hover:underline">
                    {r.symbol}
                  </Link>
                </p>
                {r.forecast?.low != null && r.forecast?.high != null && r.forecast?.central != null ? (
                  <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                    <li><b className="text-green-700 dark:text-green-400">Bull {fmtINR(r.forecast.high)}:</b> {r.topReasons?.[0] || "—"}</li>
                    <li><b className="text-blue-700 dark:text-blue-400">Base {fmtINR(r.forecast.central)}:</b> {r.trend || "—"}</li>
                    <li><b className="text-red-700 dark:text-red-400">Bear {fmtINR(r.forecast.low)}:</b> {r.topRisks?.[0] || "—"}</li>
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500">{t.compare.scenInsufficient}</p>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-1">{t.compare.vScenarioNote}</p>
        </Section>

        <Section title={t.compare.vConfidence}>
          <p>
            {confidence}% — reduced for missing fields across the set.
          </p>
          <ul className="list-disc ml-4 text-slate-500">
            {missing.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </Section>
      </div>
    </Card>
  );
}

export default AiVerdict;
