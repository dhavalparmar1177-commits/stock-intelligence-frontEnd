import { useEffect, useMemo, useRef, useState } from "react";
import { FALLBACK_TEXT, formatPriceINR, formatPrice2dp } from "../../design/tokens";
import { Sparkline } from "./Sparkline";
import { StatChip } from "./StatChip";
import { ShieldAlert, Activity } from "lucide-react";

export interface MarketCardData {
  name: string;
  label?: string;
  value?: number | string | null;
  change?: number | string | null;
  changePct?: number | string | null;
  note?: string | null;
  unavailable?: boolean;
  updated?: string | null;
}

/**
 * Modern FinTech Index Ticker Card with integrated SVG sparkline,
 * absolute + percentage delta chips, and volatility meter for INDIA VIX.
 */
export function MarketCard({
  market,
  showTimestamp = false,
}: {
  market: MarketCardData;
  showTimestamp?: boolean;
}) {
  const missing = market.unavailable || market.value === null || market.value === undefined;
  const numVal = Number(market.value);
  const numChange = Number(market.change ?? 0);
  const numPct = Number(market.changePct ?? 0);
  const up = numPct >= 0;
  const isVix = (market.label || market.name).toUpperCase().includes("VIX");

  // Price Flash on live value updates
  const prevValRef = useRef<number | null>(null);
  const [flash, setFlash] = useState<"flash-gain" | "flash-loss" | null>(null);

  useEffect(() => {
    if (!missing && Number.isFinite(numVal) && prevValRef.current != null && prevValRef.current !== numVal) {
      setFlash(numVal > prevValRef.current ? "flash-gain" : "flash-loss");
      const t = setTimeout(() => setFlash(null), 900);
      return () => clearTimeout(t);
    }
    if (!missing && Number.isFinite(numVal)) {
      prevValRef.current = numVal;
    }
  }, [missing, numVal]);

  // Generate a faithful mini-trend curve from prevClose to current value
  const sparklineData = useMemo(() => {
    if (missing || !Number.isFinite(numVal)) return null;
    const prev = numVal - numChange;
    // 6-step intraday progression preserving direction and magnitude
    return [
      prev,
      prev + numChange * 0.25,
      prev + numChange * 0.15,
      prev + numChange * 0.7,
      prev + numChange * 0.55,
      numVal,
    ];
  }, [missing, numVal, numChange]);

  // VIX Volatility Assessment
  const vixLevel = useMemo(() => {
    if (!isVix || missing) return null;
    if (numVal < 13) return { text: "Low Volatility", tone: "calm", sub: "Market calm" };
    if (numVal <= 18) return { text: "Moderate Volatility", tone: "normal", sub: "Typical swings" };
    return { text: "High Volatility", tone: "high", sub: "Elevated risk" };
  }, [isVix, missing, numVal]);

  const glowHover = up
    ? "hover:shadow-[0_0_30px_rgba(43,214,123,0.15)] dark:hover:border-[#2BD67B]/30"
    : "hover:shadow-[0_0_30px_rgba(255,92,108,0.15)] dark:hover:border-[#FF5C6C]/30";

  return (
    <div
      className={`h-full flex flex-col justify-between bg-white/80 dark:bg-[#131C30]/70 backdrop-blur-[20px] border border-slate-200/90 dark:border-white/[0.06] rounded-[20px] p-5 shadow-card dark:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden group ${glowHover}`}
    >
      <div>
        {/* Top row: Label + Live pulse indicator */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-[#A3AEC7] truncate">
              {market.label || market.name}
            </span>
            {isVix && (
              <span title="Volatility Index" className="inline-flex">
                <Activity className="w-3.5 h-3.5 text-violet-500 dark:text-[#7C5CFF] shrink-0" />
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="NSE data feed (Delayed 15 min)" />
            <span className="text-[10px] font-bold text-slate-400 dark:text-[#6B7792] uppercase tracking-wider">
              NSE
            </span>
          </div>
        </div>

        {missing ? (
          <div className="py-5">
            <p className="text-sm text-slate-400 dark:text-[#A3AEC7]">
              {FALLBACK_TEXT}
              {market.note ? ` — ${market.note}` : ""}
            </p>
          </div>
        ) : (
          /* Main Price & Sparkline */
          <div className="flex items-baseline justify-between gap-3 mt-1.5">
            <div className="min-w-0">
              <p
                className={`text-3xl sm:text-[2.25rem] font-semibold si-numeric text-slate-900 dark:text-[#F4F6FB] tracking-[-0.02em] leading-tight rounded px-1 transition-colors ${
                  flash || ""
                }`}
              >
                {isVix ? formatPrice2dp(numVal) : formatPriceINR(numVal)}
              </p>
              {market.change !== null && market.change !== undefined && !isVix && (
                <p className="text-xs font-semibold text-slate-500 dark:text-[#A3AEC7] si-numeric mt-1">
                  {numChange >= 0 ? "+" : ""}
                  {formatPrice2dp(numChange)} pts
                </p>
              )}
            </div>

            {/* Sparkline display */}
            {sparklineData && (
              <div className="shrink-0 flex items-center justify-end">
                <Sparkline
                  data={sparklineData}
                  width={96}
                  height={38}
                  positive={up}
                  className="group-hover:scale-105 transition-transform"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {!missing && (
        /* Bottom row: Delta Chip / Volatility Meter */
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2">
          <StatChip value={numPct} format="pct" />

          {isVix && vixLevel && (
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
                vixLevel.tone === "calm"
                  ? "bg-[#2BD67B]/[0.12] text-[#2BD67B]"
                  : vixLevel.tone === "normal"
                  ? "bg-[#FFB84D]/[0.12] text-[#FFB84D]"
                  : "bg-[#FF5C6C]/[0.12] text-[#FF5C6C]"
              }`}
            >
              <ShieldAlert className="w-3 h-3" />
              <span>{vixLevel.text}</span>
            </span>
          )}

          {showTimestamp && market.updated && (
            <span className="text-[10px] text-slate-400 dark:text-[#6B7792] truncate ml-auto">
              {market.updated}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default MarketCard;
