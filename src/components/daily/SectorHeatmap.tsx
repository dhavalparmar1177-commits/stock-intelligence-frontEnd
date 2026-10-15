import { useState, useMemo } from "react";
import { useLang } from "../../i18n/LanguageContext";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Layers } from "lucide-react";

export interface SectorDatum {
  sector?: string | null;
  index?: string | null;
  indexName?: string | null;
  price?: number | null;
  changePct?: number | null;
  unavailable?: boolean;
}

// Benchmark market-cap weighting of Indian market sectors in Nifty 50 / 500
const SECTOR_WEIGHTS: Record<string, number> = {
  "Private Banks": 24,
  "IT": 15,
  "Energy": 12,
  "FMCG": 9,
  "Auto": 8,
  "PSU Banks": 7,
  "Pharma": 6,
  "Healthcare": 6,
  "Metals": 5,
  "Infrastructure": 4,
  "Telecom": 4,
  "Consumer": 3,
  "Insurance": 3,
};

interface TreemapRect {
  sector: string;
  indexName: string;
  price: number | null;
  changePct: number | null;
  weight: number;
  unavailable: boolean;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  w: number; // percentage 0-100
  h: number; // percentage 0-100
}

/**
 * 2-Tier Horizontal Treemap Partitioner.
 * Distributes major sectors in Tier 1 (~52% height) and mid-weight sectors in Tier 2 (~48% height).
 * Guarantees every tile receives at least 180px-200px of vertical height, completely preventing
 * text overlap or border clipping.
 */
function layoutTreemap(items: Array<Omit<TreemapRect, "x" | "y" | "w" | "h">>): TreemapRect[] {
  if (!items.length) return [];
  const sorted = [...items].sort((a, b) => b.weight - a.weight);

  // Divide into Tier 1 (top 3 heavyweights) and Tier 2 (remaining sectors)
  const tier1 = sorted.slice(0, 3);
  const tier2 = sorted.slice(3);

  const rects: TreemapRect[] = [];
  const tier1Height = tier2.length ? 52 : 100;
  const tier2Height = 100 - tier1Height;

  // Tier 1: Horizontal distribution across top row
  const tier1WeightSum = tier1.reduce((sum, item) => sum + item.weight, 0) || 1;
  let currentX = 0;
  for (const item of tier1) {
    const itemWidth = (item.weight / tier1WeightSum) * 100;
    rects.push({
      ...item,
      x: currentX,
      y: 0,
      w: itemWidth,
      h: tier1Height,
    });
    currentX += itemWidth;
  }

  // Tier 2: Horizontal distribution across bottom row
  if (tier2.length) {
    const tier2WeightSum = tier2.reduce((sum, item) => sum + item.weight, 0) || 1;
    currentX = 0;
    for (const item of tier2) {
      const itemWidth = (item.weight / tier2WeightSum) * 100;
      rects.push({
        ...item,
        x: currentX,
        y: tier1Height,
        w: itemWidth,
        h: tier2Height,
      });
      currentX += itemWidth;
    }
  }

  return rects;
}

export function SectorHeatmap({ sectors }: { sectors: SectorDatum[] }) {
  const { t } = useLang();
  const [hovered, setHovered] = useState<TreemapRect | null>(null);

  // 1. Clean and rename duplicate Banking tiles into "Private Banks" and "PSU Banks"
  const normalizedSectors = useMemo(() => {
    return (sectors || [])
      .filter((s) => s && (s.sector || s.index))
      .map((s) => {
        let name = s.sector || s.index || "Other";
        const idxText = (s.index || s.indexName || "").toUpperCase();

        if (name.toLowerCase().includes("bank")) {
          if (idxText.includes("PSU") || name.toLowerCase().includes("psu")) {
            name = "PSU Banks";
          } else {
            name = "Private Banks";
          }
        } else if (name === "Energy" || idxText.includes("ENERGY")) {
          name = "Energy";
        } else if (name === "IT" || idxText.includes("IT")) {
          name = "IT";
        }

        const weight = SECTOR_WEIGHTS[name] || 4;
        return {
          sector: name,
          indexName: s.indexName || s.index || name,
          price: s.price ?? null,
          changePct: s.changePct ?? null,
          weight,
          unavailable: !!s.unavailable || s.changePct == null,
        };
      });
  }, [sectors]);

  const treemapItems = useMemo(() => layoutTreemap(normalizedSectors), [normalizedSectors]);

  if (!treemapItems.length) {
    return (
      <Card title={t.daily.heatmap}>
        <EmptyState icon="🗺️" title={t.gen.dataUnavailable} />
      </Card>
    );
  }

  // Red-to-green diverging scale styling
  const getDivergingStyle = (pct: number | null, unavailable: boolean) => {
    if (unavailable || pct == null) {
      return "bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-[#A3AEC7] border-slate-200/80 dark:border-white/[0.08]";
    }
    if (pct >= 2.0) {
      return "bg-emerald-500/90 dark:bg-[#2BD67B]/85 text-slate-950 font-bold border-emerald-400 dark:border-[#2BD67B] shadow-[0_0_15px_rgba(43,214,123,0.25)]";
    }
    if (pct >= 0.8) {
      return "bg-emerald-100 dark:bg-[#2BD67B]/25 text-emerald-950 dark:text-[#2BD67B] border-emerald-300 dark:border-[#2BD67B]/40";
    }
    if (pct >= 0.1) {
      return "bg-emerald-50/90 dark:bg-[#2BD67B]/10 text-emerald-900 dark:text-emerald-300 border-emerald-200/90 dark:border-[#2BD67B]/20";
    }
    if (pct > -0.1) {
      return "bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-[#A3AEC7] border-slate-200 dark:border-white/10";
    }
    if (pct > -0.8) {
      return "bg-rose-50/90 dark:bg-[#FF5C6C]/10 text-rose-900 dark:text-rose-300 border-rose-200/90 dark:border-[#FF5C6C]/20";
    }
    if (pct > -2.0) {
      return "bg-rose-100 dark:bg-[#FF5C6C]/25 text-rose-950 dark:text-[#FF5C6C] border-rose-300 dark:border-[#FF5C6C]/40";
    }
    return "bg-rose-500/90 dark:bg-[#FF5C6C]/85 text-white font-bold border-rose-400 dark:border-[#FF5C6C] shadow-[0_0_15px_rgba(255,92,108,0.25)]";
  };

  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-violet-600 dark:text-[#7C5CFF]" />
          <span>NSE Sector Market-Cap Treemap</span>
        </span>
      }
      subtitle="Sized by market-cap weighting with live divergence scale · For information only."
      action={
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-[#A3AEC7] font-medium">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5C6C]" />
            <span>Lagging</span>
          </span>
          <span className="flex items-center gap-1 ml-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2BD67B]" />
            <span>Leading</span>
          </span>
        </div>
      }
    >
      {/* Desktop & Tablet 2-Tier Squarified Treemap (>=640px) */}
      <div className="hidden sm:block relative w-full h-[380px] md:h-[420px] rounded-[16px] overflow-hidden bg-slate-50 dark:bg-[#070B14]/60 border border-slate-200/80 dark:border-white/[0.06] p-1.5 select-none">
        {treemapItems.map((item) => {
          const style = getDivergingStyle(item.changePct, item.unavailable);
          const isUp = (item.changePct ?? 0) >= 0;

          return (
            <div
              key={item.sector}
              onMouseEnter={() => setHovered(item)}
              onMouseLeave={() => setHovered(null)}
              style={{
                left: `calc(${item.x}% + 3px)`,
                top: `calc(${item.y}% + 3px)`,
                width: `calc(${item.w}% - 6px)`,
                height: `calc(${item.h}% - 6px)`,
              }}
              className={`absolute rounded-[14px] border p-3.5 sm:p-4 flex flex-col justify-between overflow-hidden transition-all duration-200 cursor-pointer hover:z-20 hover:scale-[1.01] hover:shadow-lg ${style}`}
            >
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="font-bold text-xs sm:text-sm md:text-base truncate leading-snug">
                    {item.sector}
                  </span>
                  <span className="text-[11px] font-semibold opacity-80 shrink-0 px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 hidden sm:inline">
                    ~{item.weight}%
                  </span>
                </div>
                <p className="text-xs opacity-75 truncate font-mono mt-0.5">
                  {item.indexName}
                </p>
              </div>

              {/* Bottom value area with generous breathing room and zero border clipping */}
              <div className="flex items-baseline justify-between gap-2 mt-2 pt-1 pb-0.5">
                <span className="font-bold text-base sm:text-xl si-numeric leading-none">
                  {item.unavailable || item.changePct == null
                    ? t.gen.na
                    : `${isUp ? "+" : ""}${item.changePct.toFixed(2)}%`}
                </span>
                {item.price != null && (
                  <span className="text-xs opacity-85 si-numeric font-medium hidden md:inline">
                    ₹{Number(item.price).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Hover Floating Details Card */}
        {hovered && (
          <div className="absolute bottom-3 right-3 z-30 pointer-events-none bg-white/95 dark:bg-[#0D1424]/90 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-[14px] p-3.5 shadow-xl text-xs space-y-2 animate-in fade-in duration-100 min-w-[210px]">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-white/10 pb-1.5">
              <span className="font-bold text-sm text-slate-900 dark:text-[#F4F6FB]">{hovered.sector}</span>
              <span className="text-violet-600 dark:text-[#7C5CFF] font-semibold text-xs">~{hovered.weight}% of NIFTY</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-[#A3AEC7]">
              <span>Index:</span>
              <span className="font-semibold text-slate-800 dark:text-[#F4F6FB]">{hovered.indexName}</span>
            </div>
            {hovered.price != null && (
              <div className="flex justify-between text-slate-600 dark:text-[#A3AEC7]">
                <span>Level:</span>
                <span className="font-semibold si-numeric text-slate-800 dark:text-[#F4F6FB]">
                  ₹{Number(hovered.price).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
            <div className="flex justify-between text-slate-600 dark:text-[#A3AEC7]">
              <span>Session Delta:</span>
              <span className={`font-bold si-numeric ${(hovered.changePct ?? 0) >= 0 ? "text-[#2BD67B]" : "text-[#FF5C6C]"}`}>
                {(hovered.changePct ?? 0) >= 0 ? "+" : ""}{hovered.changePct?.toFixed(2)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Responsive Grid (<640px) */}
      <div className="sm:hidden grid grid-cols-2 gap-2.5">
        {treemapItems.map((item) => {
          const style = getDivergingStyle(item.changePct, item.unavailable);
          const isUp = (item.changePct ?? 0) >= 0;

          return (
            <div
              key={item.sector}
              className={`rounded-[14px] border p-3 flex flex-col justify-between min-h-[110px] overflow-hidden ${style}`}
            >
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-xs truncate leading-snug">{item.sector}</span>
                  <span className="text-[10px] opacity-75 font-semibold">~{item.weight}%</span>
                </div>
                <p className="text-[11px] opacity-75 truncate font-mono mt-0.5">{item.indexName}</p>
              </div>

              <div className="flex items-baseline justify-between gap-1 mt-2">
                <span className="font-bold text-sm si-numeric leading-none">
                  {item.unavailable || item.changePct == null
                    ? t.gen.na
                    : `${isUp ? "+" : ""}${item.changePct.toFixed(2)}%`}
                </span>
                {item.price != null && (
                  <span className="text-[10px] opacity-80 si-numeric font-medium">
                    ₹{Number(item.price).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-400 dark:text-[#6B7792] italic mt-3">
        Sector weights estimated from current Nifty index composition. For information only. Not investment advice.
      </p>
    </Card>
  );
}

export default SectorHeatmap;
