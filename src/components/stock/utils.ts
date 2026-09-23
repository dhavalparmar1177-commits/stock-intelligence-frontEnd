/**
 * Indian-symbol gate (the live analysis endpoint only serves NSE/BSE
 * symbols). Covers the full app NSE universe — keep in sync with the
 * peer map in PeerCompare.tsx. Unknown bare tickers are still sent
 * to the backend, which is the final arbiter (see StockDetail's
 * foreign-symbol classification).
 */
const NSE_UNIVERSE = [
  "RELIANCE", "TCS", "HDFCBANK", "INFY", "TATAMOTORS", "SBIN", "ITC",
  "ICICIBANK", "AXISBANK", "KOTAKBANK", "TITAN", "LT", "BHARTIARTL",
  "HDFCLIFE", "SBILIFE",
];

export function isIndianSymbol(s: string): boolean {
  const u = (s || "").toUpperCase();
  return /(\.NS|\.BO)$/.test(u) || NSE_UNIVERSE.includes(u);
}

/** Backend rejection message for non-NSE/BSE symbols. */
export function isForeignError(msg: unknown): boolean {
  return /only NSE and BSE/i.test(String(msg || ""));
}

export function fmtINR(v: unknown): string {
  if (v === null || v === undefined) return "Data unavailable";
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString("en-IN") : "Data unavailable";
}

export function fmtPct(v: unknown): string {
  if (v === null || v === undefined) return "Data unavailable";
  const n = Number(v);
  if (!Number.isFinite(n)) return "Data unavailable";
  return `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
}
