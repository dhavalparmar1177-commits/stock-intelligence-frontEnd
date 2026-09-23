import React from "react";
import { useLang } from "../../i18n/LanguageContext";

export interface GmpHistoryItem {
  date: string;
  gmp: number;
  premiumPct: number;
  trend: "up" | "down" | "flat";
}

export interface GmpData {
  value: number;
  premiumPct: number;
  trend: "up" | "down" | "flat";
  estListingPrice: number;
  updatedAt: string;
  source: string;
  history?: GmpHistoryItem[];
  kostak?: number | null;
  subjectToSauda?: number | null;
}

interface Props {
  gmp: GmpData | null;
  priceHigh: number | null;
}

export default function IpoGmpChart({ gmp, priceHigh }: Props) {
  const { t } = useLang();

  if (!gmp) {
    return (
      <div className="py-6 text-center text-slate-500 text-sm">
        <p>📊 {t.ipoAi.gmpNA}</p>
        <p className="text-xs text-slate-400 mt-1">{t.ipo.gmpDisclaimer}</p>
      </div>
    );
  }

  const history = gmp.history || [];
  const hasHistory = history.length >= 2;

  // Chart coordinate calculation
  const values = history.map((h) => h.gmp);
  const minVal = Math.min(0, ...values);
  const maxVal = Math.max(10, ...values);
  const range = maxVal - minVal || 1;

  const width = 500;
  const height = 120;
  const padding = 20;

  const points = history.map((item, idx) => {
    const x = padding + (idx / (history.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((item.gmp - minVal) / range) * (height - 2 * padding);
    return { x, y, ...item };
  });

  const polylineStr = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaStr = points.length
    ? `${polylineStr} ${points[points.length - 1].x},${height - padding} ${points[0].x},${height - padding}`
    : "";

  return (
    <div className="space-y-4">
      {/* 4 Metric Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
        <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800">
          <p className="text-xs text-slate-500 font-semibold">{t.ipo.gmp}</p>
          <p className="text-xl font-black si-numeric text-green-700 dark:text-green-400 mt-1">
            ₹{gmp.value}
          </p>
          <p className="text-[10px] text-slate-500">per share</p>
        </div>

        <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800">
          <p className="text-xs text-slate-500 font-semibold">Expected Premium</p>
          <p className="text-xl font-black si-numeric text-green-700 dark:text-green-400 mt-1">
            +{gmp.premiumPct?.toFixed(1)}%
          </p>
          <p className="text-[10px] text-slate-500">over upper price band</p>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 font-semibold">{t.ipo.estListing}</p>
          <p className="text-xl font-bold si-numeric text-slate-900 dark:text-slate-100 mt-1">
            ₹{gmp.estListingPrice}
          </p>
          <p className="text-[10px] text-slate-500">Model estimate</p>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 font-semibold">{t.ipo.gmpTrend}</p>
          <p className={`text-base font-bold uppercase mt-1 ${gmp.trend === "up" ? "text-green-600" : gmp.trend === "down" ? "text-red-600" : "text-slate-600"}`}>
            {gmp.trend === "up" ? "▲ Bullish" : gmp.trend === "down" ? "▼ Softening" : "— Stable"}
          </p>
          <p className="text-[10px] text-slate-500">market read</p>
        </div>
      </div>

      {/* Kostak & Subject to Sauda Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-slate-900 dark:text-slate-100">Kostak Rate</span>
              <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                Per Application
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Fixed profit per application sold before allotment
            </p>
          </div>
          <p className="text-base font-extrabold si-numeric text-violet-700 dark:text-violet-400">
            {gmp.kostak != null ? `₹${gmp.kostak.toLocaleString("en-IN")}` : "N/A"}
          </p>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-slate-900 dark:text-slate-100">Subject to Sauda</span>
              <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                Per Lot
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Profit paid only if applicant receives confirmed allotment
            </p>
          </div>
          <p className="text-base font-extrabold si-numeric text-violet-700 dark:text-violet-400">
            {gmp.subjectToSauda != null ? `₹${gmp.subjectToSauda.toLocaleString("en-IN")}` : "N/A"}
          </p>
        </div>
      </div>

      {/* Visual Day-Wise GMP Chart */}
      {hasHistory && (
        <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
            <span>📈 Day-Wise GMP Progression</span>
            <span className="text-slate-500 text-[11px] font-normal">
              {history.length} recorded updates
            </span>
          </div>

          <div className="w-full overflow-hidden">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28 sm:h-32">
              <defs>
                <linearGradient id="gmpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16a34a" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#16a34a" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line
                x1={padding}
                y1={height - padding}
                x2={width - padding}
                y2={height - padding}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-700"
                strokeWidth="1"
              />
              <polygon points={areaStr} fill="url(#gmpGrad)" />
              <polyline
                points={polylineStr}
                fill="none"
                stroke="#16a34a"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {points.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="4" fill="#16a34a" className="stroke-white dark:stroke-slate-900" strokeWidth="2" />
                  <text
                    x={p.x}
                    y={p.y - 8}
                    textAnchor="middle"
                    className="text-[10px] font-bold fill-slate-700 dark:fill-slate-300 font-mono"
                  >
                    ₹{p.gmp}
                  </text>
                  <text
                    x={p.x}
                    y={height - 5}
                    textAnchor="middle"
                    className="text-[9px] fill-slate-400 font-mono"
                  >
                    {p.date.slice(5)}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      )}

      {/* Footer Source & Disclaimer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-1 border-t border-slate-100 dark:border-slate-800 pt-2.5">
        <span>Source: <b>{gmp.source}</b> (Updated: {gmp.updatedAt})</span>
        <span className="text-[11px] text-slate-400">
          {t.ipo.gmpDisclaimer}
        </span>
      </div>
    </div>
  );
}
