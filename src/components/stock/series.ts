/**
 * Chart indicator series computed from REAL bars only.
 * Math mirrors backend/src/utils/indicators.ts exactly (SMA seed for
 * EMA, simple-average RSI over the trailing window). Every function
 * returns null for points without enough history — never estimates.
 */

export function smaSeries(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (values.length < period || period <= 0) return out;
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

export function emaSeries(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (values.length < period || period <= 0) return out;
  const k = 2 / (period + 1);
  let e = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  out[period - 1] = e;
  for (let i = period; i < values.length; i++) {
    e = values[i] * k + e * (1 - k);
    out[i] = e;
  }
  return out;
}

function rsiAt(closes: number[], end: number, period: number): number | null {
  if (end < period || end >= closes.length) return null;
  let gains = 0;
  let losses = 0;
  for (let i = end - period + 1; i <= end; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gains += d;
    else losses -= d;
  }
  if (losses === 0) return 100;
  return 100 - 100 / (1 + gains / losses);
}

export function rsiSeries(closes: number[], period = 14): (number | null)[] {
  return closes.map((_, i) => rsiAt(closes, i, period));
}

export interface MacdPoint {
  dif: number | null;
  sig: number | null;
  hist: number | null;
}

export function macdSeries(closes: number[], fast = 12, slow = 26, signal = 9): MacdPoint[] {
  const out: MacdPoint[] = closes.map(() => ({ dif: null, sig: null, hist: null }));
  if (closes.length < slow + signal) return out;
  const ef = emaSeries(closes, fast);
  const es = emaSeries(closes, slow);
  const difs: (number | null)[] = closes.map((_, i) =>
    ef[i] !== null && es[i] !== null ? (ef[i] as number) - (es[i] as number) : null
  );
  for (let i = 0; i < closes.length; i++) {
    if (difs[i] === null) continue;
    const valid = difs.slice(0, i + 1).filter((d): d is number => d !== null);
    if (valid.length < signal) continue;
    // Same seeding as backend macd(): EMA over the valid DIF window.
    const k = 2 / (signal + 1);
    let e = valid.slice(0, signal).reduce((a, b) => a + b, 0) / signal;
    for (let j = signal; j < valid.length; j++) e = valid[j] * k + e * (1 - k);
    out[i] = { dif: difs[i], sig: e, hist: (difs[i] as number) - e };
  }
  return out;
}

export interface BbPoint {
  upper: number | null;
  mid: number | null;
  lower: number | null;
}

export function bollingerSeries(closes: number[], period = 20, mult = 2): BbPoint[] {
  const out: BbPoint[] = closes.map(() => ({ upper: null, mid: null, lower: null }));
  if (closes.length < period || period <= 0) return out;
  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const mid = slice.reduce((a, b) => a + b, 0) / period;
    const sd = Math.sqrt(slice.reduce((a, c) => a + (c - mid) * (c - mid), 0) / period);
    out[i] = { upper: mid + mult * sd, mid, lower: mid - mult * sd };
  }
  return out;
}

/** Minimum bars required before each overlay earns its toggle. */
export const MIN_BARS = {
  sma20: 20,
  sma50: 50,
  ema20: 20,
  bb: 20,
  rsi: 15,
  macd: 35,
} as const;

export type InsightToken =
  | "up-strong"
  | "down"
  | "flat"
  | "above-sma50"
  | "below-sma50"
  | "rsi-hot"
  | "rsi-cold"
  | "mom-weak";

/**
 * Plain-English read of the VISIBLE window only. Conservative
 * thresholds, every token backed by a computed number — never a
 * guess about why the market moved.
 */
export function describeTrend(
  closes: number[],
  opts: { sma50ok?: boolean; intraday?: boolean } = {}
): InsightToken[] {
  const out: InsightToken[] = [];
  const n = closes.length;
  if (n < 2) return out;
  const first = closes[0];
  const last = closes[n - 1];
  if (!(first > 0)) return out;
  const pct = ((last - first) / first) * 100;
  if (pct >= 5) out.push("up-strong");
  else if (pct <= -5) out.push("down");
  else out.push("flat");

  // Position vs 50-session average (daily+ resolutions only).
  if (!opts.intraday && n >= 50) {
    const sma = smaSeries(closes, 50)[n - 1];
    if (sma != null && sma > 0) out.push(last >= sma ? "above-sma50" : "below-sma50");
  } else if (opts.sma50ok === false) {
    // Explicitly unknown — no token.
  }

  // RSI state + short momentum read.
  if (n >= 15) {
    const rsi = rsiSeries(closes, 14);
    const cur = rsi[n - 1];
    if (cur != null) {
      if (cur >= 70) out.push("rsi-hot");
      else if (cur <= 30) out.push("rsi-cold");
      const prev = rsi[Math.max(0, n - 6)];
      if (prev != null && prev - cur > 10 && cur < 60) out.push("mom-weak");
    }
  }
  return out;
}
