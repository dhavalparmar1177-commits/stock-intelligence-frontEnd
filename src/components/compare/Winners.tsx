import { useLang } from "../../i18n/LanguageContext";
import { Card } from "../ui/Card";
import { CmpRow, num, relNifty, riskRank } from "./cmpUtils";

export interface Winner {
  key: string;
  label: string;
  symbol: string | null;
  detail: string;
}

/**
 * Category winners with contextual (non-simplistic) rules:
 * - Overall: highest AI score (composite of 7 weighted categories).
 * - Momentum: NIFTY-relative 3m strength — explicitly NOT RSI alone.
 * - Lowest risk: riskLevel first, annualized volatility as tiebreak.
 * - Valuation / growth / profitability: always "Cannot determine"
 *   because the free feed publishes no P/E, earnings or margins.
 */
export function calcWinners(rows: CmpRow[]): Winner[] {
  const scored = rows.filter((r) => num(r.score) != null);
  const overall =
    scored.length >= 2
      ? scored.reduce((a, b) => (Number(b.score) > Number(a.score) ? b : a))
      : null;

  const withRel = rows
    .map((r) => ({ r, v: relNifty(r) }))
    .filter((x): x is { r: CmpRow; v: number } => x.v != null);
  const momentum = withRel.length >= 2 ? withRel.reduce((a, b) => (b.v > a.v ? b : a)).r : null;

  const withRisk = rows
    .map((r) => ({ r, rank: riskRank(r.riskLevel), vol: num(r.volatilityAnnPct) }))
    .filter((x): x is { r: CmpRow; rank: number; vol: number | null } => x.rank != null);
  let lowestRisk: CmpRow | null = null;
  if (withRisk.length >= 2) {
    const sorted = [...withRisk].sort(
      (a, b) => a.rank - b.rank || (a.vol ?? Infinity) - (b.vol ?? Infinity)
    );
    lowestRisk = sorted[0].r;
  }

  const NA = "_NA_";
  return [
    {
      key: "overall",
      label: "wOverall",
      symbol: overall?.symbol || null,
      detail: overall ? `AI ${overall.score}/100` : NA,
    },
    {
      key: "valuation",
      label: "wValuation",
      symbol: null,
      detail: NA,
    },
    {
      key: "growth",
      label: "wGrowth",
      symbol: null,
      detail: NA,
    },
    {
      key: "profit",
      label: "wProfit",
      symbol: null,
      detail: NA,
    },
    {
      key: "momentum",
      label: "wMomentum",
      symbol: momentum?.symbol || null,
      detail: momentum ? `${relNifty(momentum)} pts vs NIFTY` : NA,
    },
    {
      key: "risk",
      label: "wRisk",
      symbol: lowestRisk?.symbol || null,
      detail: lowestRisk ? `${lowestRisk.riskLevel}` : NA,
    },
  ];
}

export function Winners({ rows }: { rows: CmpRow[] }) {
  const { t } = useLang();
  const winners = calcWinners(rows);
  const label = (key: string): string => {
    switch (key) {
      case "wOverall": return t.compare.wOverall;
      case "wValuation": return t.compare.wValuation;
      case "wGrowth": return t.compare.wGrowth;
      case "wProfit": return t.compare.wProfit;
      case "wMomentum": return t.compare.wMomentum;
      default: return t.compare.wRisk;
    }
  };
  return (
    <Card title={t.compare.winners}>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {winners.map((w) => (
          <div
            key={w.key}
            className={`border rounded-xl p-3 ${w.symbol ? "border-violet-300 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20" : "border-slate-200 dark:border-slate-800"}`}
          >
            <p className="text-xs text-slate-500">{label(w.label)}</p>
            {w.symbol ? (
              <>
                <p className="font-bold">{w.symbol}</p>
                <p className="text-xs text-slate-500 si-numeric">{w.detail}</p>
              </>
            ) : (
              <>
                <p className="font-bold text-slate-400">{t.compare.cannotDetermine}</p>
                <p className="text-xs text-slate-500">{w.detail === "_NA_" ? t.compare.fundNote : w.detail}</p>
              </>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-2">{t.compare.momNote}</p>
    </Card>
  );
}

export default Winners;
