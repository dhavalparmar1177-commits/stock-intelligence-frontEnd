import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../i18n/LanguageContext";
import { StatChip } from "./ui/StatChip";

/**
 * Modern FinTech Quote Row with tabular numerals, price flash,
 * minimum 12px secondary text, 14px body text, and an inline visual percentage bar.
 */
export function QuoteRow({ x, showBar = true }: { x: any; showBar?: boolean }) {
  const { t } = useLang();
  const sym = x.appSymbol || x.symbol;
  const prevPriceRef = useRef<number | null>(null);
  const [flash, setFlash] = useState<"flash-gain" | "flash-loss" | null>(null);

  useEffect(() => {
    if (x.price != null && prevPriceRef.current != null && prevPriceRef.current !== x.price) {
      setFlash(x.price > prevPriceRef.current ? "flash-gain" : "flash-loss");
      const timer = setTimeout(() => setFlash(null), 900);
      return () => clearTimeout(timer);
    }
    if (x.price != null) {
      prevPriceRef.current = x.price;
    }
  }, [x.price]);

  const changePct = Number(x.changePct ?? 0);
  const isUp = changePct >= 0;
  // Visual percentage bar scaled to ±10% max move
  const barWidth = Math.min(Math.max(Math.abs(changePct) * 10, 8), 100);

  return (
    <Link
      to={`/stocks/${sym}`}
      className={`flex items-center justify-between gap-3 py-3 px-3.5 rounded-[14px] hover:bg-slate-100/80 dark:hover:bg-white/[0.04] transition-all duration-150 group ${
        flash || ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm sm:text-[15px] text-slate-900 dark:text-[#F4F6FB] group-hover:text-violet-600 dark:group-hover:text-[#7C5CFF] transition-colors truncate font-display">
            {sym || t.gen.dataUnavailable}
          </span>
          {x.exchange && (
            <span className="text-xs font-semibold text-slate-500 dark:text-[#A3AEC7] bg-slate-100 dark:bg-white/[0.06] px-1.5 py-0.5 rounded">
              {x.exchange}
            </span>
          )}
        </div>
        {x.name && (
          <p className="text-xs text-slate-500 dark:text-[#A3AEC7] truncate mt-0.5">
            {x.name}
          </p>
        )}
      </div>

      <div className="flex flex-col items-end shrink-0 text-right">
        <div className="flex items-center gap-2.5">
          <span className="font-bold text-sm sm:text-[15px] si-numeric text-slate-900 dark:text-[#F4F6FB]">
            {x.price != null
              ? `₹${Number(x.price).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : t.gen.dataUnavailable}
          </span>
          <StatChip value={x.changePct} format="pct" size="sm" />
        </div>
        {showBar && x.changePct != null && (
          <div className="w-20 h-1 bg-slate-200/70 dark:bg-white/[0.08] rounded-full overflow-hidden mt-1.5" title={`Move magnitude: ${Math.abs(changePct).toFixed(2)}%`}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isUp ? "bg-[#2BD67B]" : "bg-[#FF5C6C]"
              }`}
              style={{ width: `${barWidth}%` }}
            />
          </div>
        )}
      </div>
    </Link>
  );
}

export default QuoteRow;
