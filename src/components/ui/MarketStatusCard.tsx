import { useEffect, useState, useMemo } from "react";
import { Clock, ShieldCheck, TrendingUp, Compass, BarChart3, Radio } from "lucide-react";
import { getIndianMarketStatus, MarketStatusInfo } from "./MarketStatus";

interface MarketStatusCardProps {
  marketData?: any;
  loading?: boolean;
  className?: string;
}

/**
 * Institutional Market Session & Breadth Card for the Bento Grid.
 * Displays real-time NSE/BSE operational phase, current IST clock,
 * Next session countdown/timing, and live market breadth (advancers/decliners).
 */
export function MarketStatusCard({
  marketData,
  loading = false,
  className = "",
}: MarketStatusCardProps) {
  const [status, setStatus] = useState<MarketStatusInfo>(getIndianMarketStatus);
  const [nowIst, setNowIst] = useState("");

  useEffect(() => {
    const update = () => {
      setStatus(getIndianMarketStatus());
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const ist = new Date(utc + 5.5 * 3600000);
      setNowIst(ist.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const breadth = marketData?.breadth;
  const regime = marketData?.regime;

  const totalBreadth = (breadth?.advancers ?? 0) + (breadth?.decliners ?? 0);
  const advPct = totalBreadth > 0 ? ((breadth.advancers / totalBreadth) * 100).toFixed(0) : "50";

  const isMarketOpen = status.state === "open";
  const isPreOpen = status.state === "pre-open";

  const statusColor = isMarketOpen
    ? "#2BD67B"
    : isPreOpen
    ? "#FFB84D"
    : "#A3AEC7";

  return (
    <div
      className={`relative flex flex-col justify-between h-full bg-white/80 dark:bg-[#131C30]/70 backdrop-blur-[20px] rounded-[20px] p-5 border border-slate-200/90 dark:border-white/[0.06] shadow-card dark:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-200 hover:-translate-y-0.5 ${className}`}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 dark:bg-[#2BD67B]/10 border border-emerald-500/20 dark:border-[#2BD67B]/20 flex items-center justify-center text-emerald-600 dark:text-[#2BD67B]">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#A3AEC7]">
                Market Status
              </h3>
              <span className="text-[11px] font-bold text-slate-900 dark:text-[#F4F6FB]">
                NSE · BSE Market Hours
              </span>
            </div>
          </div>

          {/* Session Pill */}
          <span
            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 transition-colors ${
              isMarketOpen
                ? "bg-[#2BD67B]/[0.12] text-[#2BD67B] border-[#2BD67B]/30"
                : isPreOpen
                ? "bg-[#FFB84D]/[0.12] text-[#FFB84D] border-[#FFB84D]/30"
                : "bg-white/[0.06] text-[#A3AEC7] border-white/[0.08]"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isMarketOpen || isPreOpen ? "animate-ping" : ""}`}
              style={{ backgroundColor: statusColor }}
            />
            {status.label.toUpperCase()}
          </span>
        </div>

        {/* Current IST Time & Next Session Schedule */}
        <div className="bg-slate-50 dark:bg-[#0D1424]/70 border border-slate-200/80 dark:border-white/[0.05] rounded-[14px] p-3 my-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#A3AEC7]">
              <Clock className="w-3.5 h-3.5 text-indigo-500 dark:text-[#7C5CFF]" />
              <span>IST Clock</span>
            </div>
            <span className="font-bold text-sm si-numeric text-slate-900 dark:text-[#F4F6FB] tracking-tight">
              {nowIst || "--:--:--"}
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-[#A3AEC7] mt-1 font-medium">
            {status.sub}
          </p>
        </div>
      </div>

      {/* Market Breadth Section (Advancers vs Decliners) */}
      <div className="mt-2 pt-2.5 border-t border-slate-100 dark:border-white/[0.06]">
        {breadth?.advancers != null && breadth?.decliners != null ? (
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-500 dark:text-[#A3AEC7] font-medium flex items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Market Breadth</span>
              </span>
              <span className="font-semibold text-[11px] text-slate-700 dark:text-[#F4F6FB]">
                {breadth.advancers} Adv / {breadth.decliners} Dec
              </span>
            </div>

            {/* Split Bar */}
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/[0.08] overflow-hidden flex">
              <div
                style={{ width: `${advPct}%` }}
                className="bg-[#2BD67B] h-full transition-all duration-500"
                title={`${advPct}% Advancing`}
              />
              <div
                style={{ width: `${100 - Number(advPct)}%` }}
                className="bg-[#FF5C6C] h-full transition-all duration-500"
                title={`${100 - Number(advPct)}% Declining`}
              />
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-[#6B7792] mt-1 si-numeric">
              <span className="text-[#2BD67B] font-semibold">{advPct}% Advancing</span>
              <span className="text-[#FF5C6C] font-semibold">{100 - Number(advPct)}% Declining</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-slate-500 dark:text-[#A3AEC7]">Trading Regime</span>
            <span className="font-semibold text-slate-800 dark:text-[#F4F6FB]">
              {regime || "Standard Settlement"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default MarketStatusCard;
