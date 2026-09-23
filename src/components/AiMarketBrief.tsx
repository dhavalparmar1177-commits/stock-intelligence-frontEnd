import { useLang } from "../i18n/LanguageContext";
import { Card } from "./ui/Card";
import { EmptyState } from "./ui/EmptyState";
import { ErrorState } from "./ui/ErrorState";
import { SkeletonText } from "./ui/Skeleton";
import { Badge } from "./ui/Badge";

function num(v: unknown, unavailable: string): string {
  if (v === null || v === undefined) return unavailable;
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString("en-IN") : unavailable;
}

/**
 * Institutional AI market brief grounded entirely in measured live data.
 */
export function AiMarketBrief({
  data,
  loading,
  error,
  onRetry,
}: {
  data: any;
  loading: boolean;
  error: string;
  onRetry: () => void;
}) {
  const { t } = useLang();

  const sentences: string[] = [];
  if (data) {
    const n = data.nifty;
    if (n?.price != null) {
      let s = `${t.live.niftyAt} ${num(n.price, t.gen.dataUnavailable)} (${n.changePct != null ? `${n.changePct >= 0 ? "+" : ""}${n.changePct}%` : t.live.changeUnavail})`;
      if (n.rsi14 != null) s += `, RSI ${n.rsi14}`;
      if (n.aboveSMA50 === true) s += ` — ${t.live.above50d}`;
      else if (n.aboveSMA50 === false) s += ` — ${t.live.below50d}`;
      sentences.push(s + ".");
    }
    const sx = data.sensex;
    if (sx?.price != null) {
      sentences.push(
        `${t.live.sensexAt} ${num(sx.price, t.gen.dataUnavailable)} (${sx.changePct != null ? `${sx.changePct >= 0 ? "+" : ""}${sx.changePct}%` : t.live.changeUnavail}).`
      );
    }
    if (data.regime) sentences.push(`${t.daily.marketRegime} ${data.regime}.`);
    const b = data.breadth;
    if (b?.tracked != null) {
      sentences.push(
        `${t.live.breadthLabel} ${b.advancers ?? "—"} ${t.live.advancers} vs ${b.decliners ?? "—"} ${t.live.decliners} of ${b.tracked} ${t.live.tracked}.`
      );
    }
    const sectors = (data.sectors || []).filter((s: any) => s?.momentum3mPct != null);
    if (sectors.length) {
      const sorted = [...sectors].sort((a: any, b: any) => b.momentum3mPct - a.momentum3mPct);
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];
      sentences.push(`${t.daily.ledBy} ${best.sector} (${best.momentum3mPct}%).`);
      if (sorted.length > 1) sentences.push(`${t.daily.draggedBy} ${worst.sector} (${worst.momentum3mPct}%).`);
    }
    if (n?.volatilityAnnPct != null) {
      sentences.push(`NIFTY annualized volatility is ${n.volatilityAnnPct}%.`);
    }
  }

  return (
    <Card
      title={t.dash.briefTitle}
      accent="ai"
      action={<Badge tone="ai" dot>AI Intelligence</Badge>}
    >
      {loading ? (
        <SkeletonText lines={4} />
      ) : error ? (
        <ErrorState title={error} onRetry={onRetry} retryLabel={t.common.retry} />
      ) : sentences.length ? (
        <div className="space-y-3">
          <ul className="space-y-2 text-xs sm:text-sm">
            {sentences.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 bg-slate-50/60 dark:bg-[#131d31]/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                <span aria-hidden="true" className="text-violet-600 dark:text-violet-400 font-bold shrink-0 mt-0.5">
                  ✦
                </span>
                <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{s}</span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-1">
            {t.dash.briefDerived}
          </p>
        </div>
      ) : (
        <EmptyState icon="🤖" title={t.gen.dataUnavailable} />
      )}
    </Card>
  );
}

export default AiMarketBrief;

