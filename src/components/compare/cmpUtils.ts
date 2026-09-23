/**
 * Shared helpers for the Compare page. All ranking uses real
 * compare-row fields only; anything without data yields
 * "Cannot determine" — never a guess.
 */

export interface CmpRow {
  symbol: string;
  name?: string | null;
  price?: number | null;
  changePct?: number | null;
  score?: number | null;
  signal?: string | null;
  trend?: string | null;
  confidence?: number | null;
  riskLevel?: string | null;
  forecast?: {
    low?: number | null;
    central?: number | null;
    high?: number | null;
    upsidePct?: number | null;
    downsidePct?: number | null;
    expectedPct?: number | null;
  } | null;
  rsi14?: number | null;
  macdHist?: number | null;
  volatilityAnnPct?: number | null;
  volumeRatio?: number | null;
  sentiment?: { label?: string | null; score?: number | null } | null;
  relativePerformance?: {
    vsNifty3mPct?: number | null;
    vsNifty3mPts?: number | null;
    vsSector3mPct?: number | null;
    sectorName?: string | null;
    verdict?: string | null;
  } | null;
  topReasons?: string[];
  topRisks?: string[];
  asOf?: string | null;
}

export function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** NIFTY-relative 3m strength (backend names it Pts in compare rows). */
export function relNifty(r: CmpRow): number | null {
  return num(r.relativePerformance?.vsNifty3mPct) ?? num(r.relativePerformance?.vsNifty3mPts);
}

/** Risk rank across all three backend languages (lang.ts risk()). */
const RISK_RANK: Record<string, number> = {
  Low: 0,
  Medium: 1,
  High: 2,
  "कम": 0,
  "मध्यम": 1,
  "उच्च": 2,
  "ઓછું": 0,
  "મધ્યમ": 1,
  "ઉચ્ચ": 2,
};

export function riskRank(level: unknown): number | null {
  if (typeof level !== "string") return null;
  const r = RISK_RANK[level.trim()];
  return r === undefined ? null : r;
}

export function fmtINR(v: unknown): string {
  const n = num(v);
  return n == null ? "Data unavailable" : n.toLocaleString("en-IN");
}
