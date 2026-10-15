import { useMemo } from "react";
import { Activity, ShieldAlert, Sparkles, TrendingUp, TrendingDown } from "lucide-react";
import { formatPrice2dp, formatPct } from "../../design/tokens";

interface VixGaugeProps {
  value?: number | string | null;
  change?: number | string | null;
  changePct?: number | string | null;
  loading?: boolean;
  className?: string;
}

/**
 * Institutional Semicircle Volatility Gauge for INDIA VIX.
 * Calibrated for Indian market thresholds:
 * - Calm: < 13 (Low risk, steady trends)
 * - Moderate: 13 – 18 (Normal historical baseline)
 * - High: > 18 (Elevated turbulence & hedging activity)
 */
export function VixGauge({
  value,
  change,
  changePct,
  loading = false,
  className = "",
}: VixGaugeProps) {
  const numVal = value != null ? Number(value) : null;
  const numChange = change != null ? Number(change) : null;
  const numPct = changePct != null ? Number(changePct) : null;

  const valid = numVal != null && Number.isFinite(numVal);

  const assessment = useMemo(() => {
    if (!valid || numVal === null) {
      return {
        level: "Unavailable",
        tone: "neutral",
        desc: "Awaiting live feed from NSE",
        color: "#6B7792",
      };
    }
    if (numVal < 13) {
      return {
        level: "Calm",
        tone: "calm",
        desc: "Low volatility · Steady market environment",
        color: "#2BD67B",
      };
    }
    if (numVal <= 18) {
      return {
        level: "Moderate",
        tone: "moderate",
        desc: "Typical volatility · Normal intraday swings",
        color: "#FFB84D",
      };
    }
    return {
      level: "High",
      tone: "high",
      desc: "Elevated risk · Increased option premiums & turbulence",
      color: "#FF5C6C",
    };
  }, [valid, numVal]);

  // SVG Geometry for Semicircle Arc
  // Center: (110, 105), Radius: 82, StrokeWidth: 10
  const cx = 110;
  const cy = 105;
  const r = 82;

  // Clamped angle calculation (Range: 8 to 28)
  const angleDeg = useMemo(() => {
    if (!valid || numVal === null) return 90; // center
    const clamped = Math.max(8, Math.min(28, numVal));
    const fraction = (clamped - 8) / (28 - 8);
    // 0 frac -> 180 deg (left), 1 frac -> 0 deg (right)
    return 180 - fraction * 180;
  }, [valid, numVal]);

  const needleRad = (angleDeg * Math.PI) / 180;
  // Needle tip
  const needleLen = r - 12;
  const tipX = cx + needleLen * Math.cos(needleRad);
  const tipY = cy - needleLen * Math.sin(needleRad);

  // Indicator pip on arc outer perimeter
  const pipX = cx + r * Math.cos(needleRad);
  const pipY = cy - r * Math.sin(needleRad);

  return (
    <div
      className={`relative flex flex-col justify-between h-full bg-white/80 dark:bg-[#131C30]/70 backdrop-blur-[20px] rounded-[20px] p-5 border border-slate-200/90 dark:border-white/[0.06] shadow-card dark:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-200 hover:-translate-y-0.5 ${className}`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-500/10 dark:bg-violet-400/10 border border-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#A3AEC7]">
              Market Volatility
            </h3>
            <span className="text-[11px] font-bold text-slate-900 dark:text-[#F4F6FB]">
              INDIA VIX
            </span>
          </div>
        </div>

        {/* Level Badge */}
        <span
          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 si-numeric transition-colors ${
            assessment.tone === "calm"
              ? "bg-[#2BD67B]/[0.12] text-[#2BD67B] border-[#2BD67B]/30"
              : assessment.tone === "moderate"
              ? "bg-[#FFB84D]/[0.12] text-[#FFB84D] border-[#FFB84D]/30"
              : assessment.tone === "high"
              ? "bg-[#FF5C6C]/[0.12] text-[#FF5C6C] border-[#FF5C6C]/30"
              : "bg-white/[0.06] text-[#A3AEC7] border-white/[0.08]"
          }`}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: assessment.color }}
          />
          {assessment.level.toUpperCase()}
        </span>
      </div>

      {/* Semicircle SVG Gauge Visual */}
      <div className="relative flex flex-col items-center justify-center my-1">
        <svg
          viewBox="0 0 220 130"
          className="w-full max-w-[210px] overflow-visible"
          aria-hidden="true"
        >
          <defs>
            {/* Soft glow filter */}
            <filter id="vix-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Track */}
          <path
            d="M 28 105 A 82 82 0 0 1 192 105"
            fill="none"
            stroke="currentColor"
            className="text-slate-200 dark:text-white/[0.06]"
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Calm Arc Segment (<13: 8 to 13 -> 180 to 135 deg) */}
          <path
            d="M 28 105 A 82 82 0 0 1 52 47"
            fill="none"
            stroke="#2BD67B"
            strokeWidth="10"
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* Moderate Arc Segment (13-18 -> 135 to 90 deg) */}
          <path
            d="M 52 47 A 82 82 0 0 1 110 23"
            fill="none"
            stroke="#FFB84D"
            strokeWidth="10"
            opacity="0.85"
          />

          {/* High Arc Segment (>18: 18 to 28 -> 90 to 0 deg) */}
          <path
            d="M 110 23 A 82 82 0 0 1 192 105"
            fill="none"
            stroke="#FF5C6C"
            strokeWidth="10"
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* Pivot Center Hub */}
          <circle
            cx={cx}
            cy={cy}
            r="16"
            className="fill-slate-100 dark:fill-[#0D1424] stroke-slate-300 dark:stroke-white/10"
            strokeWidth="2"
          />
          <circle
            cx={cx}
            cy={cy}
            r="5"
            fill={assessment.color}
          />

          {/* Dynamic Needle */}
          <line
            x1={cx}
            y1={cy}
            x2={tipX}
            y2={tipY}
            stroke={assessment.color}
            strokeWidth="2.5"
            strokeLinecap="round"
            filter="url(#vix-glow)"
            className="transition-all duration-700 ease-out"
          />

          {/* Indicator pip on outer arc */}
          <circle
            cx={pipX}
            cy={pipY}
            r="6"
            fill={assessment.color}
            className="stroke-white dark:stroke-[#0D1424] transition-all duration-700 ease-out"
            strokeWidth="2"
          />
        </svg>

        {/* Center Numeric Value Overlay */}
        <div className="text-center mt-[-18px]">
          {loading ? (
            <div className="h-8 w-20 bg-slate-200 dark:bg-white/10 rounded-md animate-pulse mx-auto" />
          ) : (
            <div>
              <span className="text-3xl font-extrabold si-numeric tracking-tight text-slate-900 dark:text-[#F4F6FB] leading-none">
                {valid ? formatPrice2dp(numVal!) : "—"}
              </span>
              {numChange != null && (
                <div className="flex items-center justify-center gap-1 text-xs si-numeric font-semibold mt-1">
                  <span
                    className={
                      numChange >= 0
                        ? "text-[#FF5C6C] flex items-center gap-0.5"
                        : "text-[#2BD67B] flex items-center gap-0.5"
                    }
                  >
                    {numChange >= 0 ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5" />
                    )}
                    {numChange >= 0 ? "+" : ""}
                    {formatPrice2dp(numChange)}
                    {numPct != null && ` (${formatPct(numPct)})`}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Context Description and Scale Legend */}
      <div className="mt-2 pt-2.5 border-t border-slate-100 dark:border-white/[0.06]">
        <p className="text-[11px] text-slate-500 dark:text-[#A3AEC7] text-center truncate">
          {assessment.desc}
        </p>

        {/* Three Zone Pills */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-[#6B7792] mt-2 px-1">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2BD67B]" />
            &lt; 13 Calm
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFB84D]" />
            13–18 Normal
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C6C]" />
            &gt; 18 High
          </span>
        </div>
      </div>
    </div>
  );
}

export default VixGauge;
