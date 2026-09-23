import React from "react";
import { useLang } from "../../i18n/LanguageContext";

export interface BidCategory {
  name: string;
  offered: number | null;
  bid: number | null;
  multiple: number | null;
}

interface Props {
  categories: BidCategory[];
  totalMultiple: number | null;
  updateTime: string | null;
}

function getCategoryTone(multiple: number | null) {
  if (multiple == null) return "text-slate-400";
  if (multiple >= 10) return "text-purple-700 dark:text-purple-400 font-bold";
  if (multiple >= 3) return "text-green-700 dark:text-green-400 font-bold";
  if (multiple >= 1) return "text-blue-700 dark:text-blue-400 font-semibold";
  return "text-amber-700 dark:text-amber-400 font-medium";
}

export default function IpoSubscriptionTable({ categories, totalMultiple, updateTime }: Props) {
  const { t } = useLang();

  if (!categories || categories.length === 0) {
    return (
      <div className="py-8 text-center text-slate-500 text-sm">
        <p>📊 {t.ipo.catBidsHint}</p>
      </div>
    );
  }

  const maxMultiple = Math.max(1, ...(categories.map((c) => c.multiple || 0)));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
        <span>{t.ipo.bidsTitle}</span>
        {updateTime && (
          <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-600 dark:text-slate-400">
            🕒 {updateTime}
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
              <th className="py-2.5 px-3 font-semibold">Category</th>
              <th className="py-2.5 px-3 font-semibold text-right">{t.ipo.offered}</th>
              <th className="py-2.5 px-3 font-semibold text-right">{t.ipo.bid}</th>
              <th className="py-2.5 px-3 font-semibold text-right">Subscription</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {categories.map((cat, idx) => {
              const multiple = cat.multiple;
              const barWidth = multiple != null ? Math.min(100, (multiple / maxMultiple) * 100) : 0;

              return (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                    {cat.name}
                  </td>
                  <td className="py-2.5 px-3 text-right si-numeric text-slate-600 dark:text-slate-400">
                    {cat.offered != null ? Number(cat.offered).toLocaleString("en-IN") : "—"}
                  </td>
                  <td className="py-2.5 px-3 text-right si-numeric text-slate-600 dark:text-slate-400">
                    {cat.bid != null ? Number(cat.bid).toLocaleString("en-IN") : "—"}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="hidden sm:block w-20 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            multiple != null && multiple >= 3
                              ? "bg-green-600"
                              : multiple != null && multiple >= 1
                              ? "bg-blue-600"
                              : "bg-amber-500"
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <span className={`si-numeric ${getCategoryTone(multiple)}`}>
                        {multiple != null ? `${multiple.toFixed(2)}×` : "—"}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* Total Row */}
            {totalMultiple != null && (
              <tr className="bg-slate-50 dark:bg-slate-800/80 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                <td className="py-3 px-3 text-slate-900 dark:text-slate-100">
                  Total Subscription
                </td>
                <td colSpan={2} className="py-3 px-3 text-right text-xs text-slate-500 font-normal">
                  Overall Demand Coverage
                </td>
                <td className="py-3 px-3 text-right">
                  <span className={`text-base si-numeric ${getCategoryTone(totalMultiple)}`}>
                    {totalMultiple.toFixed(2)}×
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
