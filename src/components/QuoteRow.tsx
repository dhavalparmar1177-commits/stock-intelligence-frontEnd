import { Link } from "react-router-dom";
import { useLang } from "../i18n/LanguageContext";

/**
 * Institutional live quote row with tabular numerals and clean change badges.
 */
export function QuoteRow({ x }: { x: any }) {
  const { t } = useLang();
  const sym = x.appSymbol || x.symbol;
  const up = (x.changePct ?? 0) >= 0;

  return (
    <Link
      to={`/stocks/${sym}`}
      className="flex items-center justify-between gap-3 py-2.5 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
            {sym || t.gen.dataUnavailable}
          </span>
          {x.exchange && (
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
              {x.exchange}
            </span>
          )}
        </div>
        {x.name && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {x.name}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="font-bold text-xs sm:text-sm si-numeric text-slate-900 dark:text-slate-100">
          {x.price != null
            ? `₹${Number(x.price).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : t.gen.dataUnavailable}
        </span>
        {x.changePct != null && (
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full si-numeric ${
              up
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60"
                : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60"
            }`}
          >
            {up ? "+" : ""}
            {Number(x.changePct).toFixed(2)}%
          </span>
        )}
      </div>
    </Link>
  );
}

export default QuoteRow;

