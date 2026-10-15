import { useEffect, useRef, useState, useMemo } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  AreaSeries,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  Time,
} from "lightweight-charts";
import { marketApi } from "../api/market";
import { useLang } from "../i18n/LanguageContext";
import { Card } from "./ui/Card";
import { EmptyState } from "./ui/EmptyState";
import { ErrorState } from "./ui/ErrorState";
import { Skeleton } from "./ui/Skeleton";
import { SegmentedControl } from "./ui/SegmentedControl";
import { describeTrend } from "./stock/series";
import { smaSeries } from "./stock/series";
import { formatPriceINR, formatPrice2dp, formatPct } from "../design/tokens";
import { AreaChart as AreaIcon, BarChart2, Activity, TrendingUp, TrendingDown } from "lucide-react";

import { getIndianMarketStatus } from "./ui/MarketStatus";

interface IndexDef {
  id: string;
  label: string;
  yahoo: string;
}

const INDICES: IndexDef[] = [
  { id: "NIFTY50", label: "NIFTY 50", yahoo: "^NSEI" },
  { id: "SENSEX", label: "SENSEX", yahoo: "^BSESN" },
  { id: "BANKNIFTY", label: "BANK NIFTY", yahoo: "^NSEBANK" },
  { id: "INDIAVIX", label: "INDIA VIX", yahoo: "^INDIAVIX" },
];

interface Preset {
  id: string;
  interval: string;
  range: string;
}

const PRESETS: Preset[] = [
  { id: "1D", interval: "5m", range: "1d" },
  { id: "1W", interval: "15m", range: "5d" },
  { id: "1M", interval: "1d", range: "1mo" },
  { id: "3M", interval: "1d", range: "3mo" },
  { id: "6M", interval: "1d", range: "6mo" },
  { id: "1Y", interval: "1wk", range: "1y" },
  { id: "5Y", interval: "1wk", range: "5y" },
];

interface TooltipData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number | null;
  changePct?: number;
}

/**
 * Institutional Market Overview Chart powered by TradingView Lightweight Charts.
 * - Hero treatment above the fold with minimal chrome
 * - Compact trend chip in header (e.g. "Downtrend in view · Below 50-DMA")
 * - Side-by-side period change pill ("Today +1.76%" or "Last session +1.76%" vs "6M -6.64%")
 * - Floating glass tooltip pill on hover with OHLCV
 * - 50 / 200 DMA tiny pill toggles
 */
export function MarketChart({ className = "" }: { className?: string }) {
  const { t } = useLang();
  const [index, setIndex] = useState<IndexDef>(INDICES[0]);
  const [preset, setPreset] = useState<Preset>(PRESETS[4]); // 6M default
  const [chartType, setChartType] = useState<"area" | "candle">("area");
  const [showSMA50, setShowSMA50] = useState(false);
  const [showSMA200, setShowSMA200] = useState(false);

  const [bars, setBars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [seq, setSeq] = useState(0);
  const [indexQuote, setIndexQuote] = useState<{ changePct: number; price: number } | null>(null);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const [hoveredData, setHoveredData] = useState<TooltipData | null>(null);

  // Fetch live index quote for authoritative session change
  useEffect(() => {
    let alive = true;
    marketApi
      .quotes([index.yahoo])
      .then((r) => {
        if (!alive) return;
        const hit = r.quotes?.[0];
        if (hit && hit.changePct !== null && hit.changePct !== undefined) {
          setIndexQuote({ changePct: Number(hit.changePct), price: Number(hit.price) });
        }
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, [index.yahoo, seq]);

  // Fetch history data
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");

    marketApi
      .history(index.yahoo, preset.interval, preset.range)
      .then((r) => {
        if (!alive) return;
        setBars(Array.isArray(r.bars) ? r.bars : []);
      })
      .catch(() => {
        if (alive) setError(t.gen.unableToLoad);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [index, preset, seq]);

  // Clean and prepare bar series
  const cleanBars = useMemo(() => {
    if (!bars.length) return [];
    const isIntraday = preset.range === "1d" || preset.range === "5d";

    const mapped = bars
      .filter((b: any) => b && b.close != null && b.date)
      .map((b: any) => {
        const d = new Date(b.date);
        const timeVal: Time = isIntraday
          ? (Math.floor(d.getTime() / 1000) as any)
          : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
              d.getDate()
            ).padStart(2, "0")}`;

        return {
          time: timeVal,
          open: Number(b.open ?? b.close),
          high: Number(b.high ?? b.close),
          low: Number(b.low ?? b.close),
          close: Number(b.close),
          volume: b.volume ? Number(b.volume) : null,
          rawDate: d,
        };
      });

    // Sort and remove duplicates by time
    mapped.sort((a, b) => (a.rawDate.getTime() > b.rawDate.getTime() ? 1 : -1));

    const unique: typeof mapped = [];
    for (let i = 0; i < mapped.length; i++) {
      if (i === 0 || mapped[i].time !== mapped[i - 1].time) {
        unique.push(mapped[i]);
      }
    }
    return unique;
  }, [bars, preset.range]);

  const closes = useMemo(() => cleanBars.map((b) => b.close), [cleanBars]);

  // Period change calculation
  const periodPct = useMemo(() => {
    if (cleanBars.length < 2) return 0;
    const first = cleanBars[0].close;
    const last = cleanBars[cleanBars.length - 1].close;
    return first > 0 ? ((last - first) / first) * 100 : 0;
  }, [cleanBars]);

  // Authoritative session change calculation: uses live index quote matching index cards
  const marketStatus = useMemo(() => getIndianMarketStatus(), []);
  const isMarketOpen = marketStatus.state === "open";
  const sessionLabel = isMarketOpen ? "Today" : "Last session";

  const sessionPct = useMemo(() => {
    if (indexQuote && Number.isFinite(indexQuote.changePct)) {
      return indexQuote.changePct;
    }
    if (cleanBars.length < 2) return 0;
    if (preset.range === "1d") {
      const first = cleanBars[0].open;
      const last = cleanBars[cleanBars.length - 1].close;
      return first > 0 ? ((last - first) / first) * 100 : 0;
    }
    const last = cleanBars[cleanBars.length - 1];
    const prev = cleanBars[cleanBars.length - 2];
    return prev.close > 0 ? ((last.close - prev.close) / prev.close) * 100 : 0;
  }, [indexQuote, cleanBars, preset.range]);

  // Context line explaining contrast between Session and Period moves
  const contrastExplanation = useMemo(() => {
    const sUp = sessionPct >= 0;
    const pUp = periodPct >= 0;
    const pId = preset.id;
    if (sUp && !pUp) {
      return `Short-term session bounce counter to the wider ${pId} pullback.`;
    }
    if (!sUp && pUp) {
      return `Intraday retracement within a resilient ${pId} upward trend.`;
    }
    if (sUp && pUp) {
      return `Constructive bullish alignment across both session and ${pId} horizons.`;
    }
    return `Persistent downward pressure observed across session and ${pId} horizons.`;
  }, [sessionPct, periodPct, preset.id]);

  // Compact Trend Insight chip
  const trendInsight = useMemo(() => {
    if (closes.length < 2) return null;
    const tokens = describeTrend(closes, {
      intraday: preset.range === "1d" || preset.range === "5d",
    });
    if (!tokens.length) return null;

    const tokenMap: Record<string, string> = {
      "up-strong": "Strong Uptrend",
      "down": "Downtrend in view",
      "flat": "Consolidating",
      "above-sma50": "Above 50-DMA",
      "below-sma50": "Below 50-DMA",
      "rsi-hot": "RSI Overbought",
      "rsi-cold": "RSI Oversold",
      "mom-weak": "Momentum Softening",
    };

    return tokens.map((tk) => tokenMap[tk] || tk).slice(0, 2).join(" · ");
  }, [closes, preset.range]);

  // Render Lightweight Chart instance
  useEffect(() => {
    if (!chartContainerRef.current || !cleanBars.length || loading) return;

    const isDark = document.documentElement.classList.contains("dark");
    const firstClose = cleanBars[0]?.close;
    const lastClose = cleanBars[cleanBars.length - 1]?.close;
    const isUp = lastClose >= firstClose;

    const accentColor = isUp ? "#2BD67B" : "#FF5C6C";
    const bg = isDark ? "#0D1424" : "#ffffff";
    const textColor = isDark ? "#A3AEC7" : "#64748b";
    const gridColor = isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.04)";

    // Clean up previous instance
    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 440,
      layout: {
        background: { type: ColorType.Solid, color: bg },
        textColor,
        fontFamily: "Geist, Inter, -apple-system, sans-serif",
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
          width: 1,
          style: 3,
        },
        horzLine: {
          color: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
          width: 1,
          style: 3,
        },
      },
      rightPriceScale: {
        borderColor: gridColor,
        scaleMargins: {
          top: 0.1,
          bottom: 0.22,
        },
      },
      timeScale: {
        borderColor: gridColor,
        timeVisible: preset.range === "1d" || preset.range === "5d",
        secondsVisible: false,
      },
    });

    chartInstanceRef.current = chart;

    // 1. Add Volume Series
    const hasVolume = cleanBars.some((b) => b.volume && b.volume > 0);
    if (hasVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: isDark ? "rgba(124, 92, 255, 0.25)" : "rgba(99, 102, 241, 0.2)",
        priceFormat: { type: "volume" },
        priceScaleId: "",
      });

      volumeSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.82,
          bottom: 0,
        },
      });

      const volumeData = cleanBars
        .filter((b) => b.volume != null)
        .map((b) => ({
          time: b.time,
          value: b.volume!,
          color:
            b.close >= b.open
              ? isDark
                ? "rgba(43, 214, 123, 0.25)"
                : "rgba(43, 214, 123, 0.3)"
              : isDark
              ? "rgba(255, 92, 108, 0.25)"
              : "rgba(255, 92, 108, 0.3)",
        }));

      volumeSeries.setData(volumeData);
    }

    // 2. Main Series (Area or Candlestick)
    let mainSeries: ISeriesApi<"Area" | "Candlestick">;

    if (chartType === "candle") {
      mainSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#2BD67B",
        downColor: "#FF5C6C",
        borderUpColor: "#2BD67B",
        borderDownColor: "#FF5C6C",
        wickUpColor: "#2BD67B",
        wickDownColor: "#FF5C6C",
      });
      mainSeries.setData(cleanBars);
    } else {
      mainSeries = chart.addSeries(AreaSeries, {
        topColor: isUp ? "rgba(43, 214, 123, 0.28)" : "rgba(255, 92, 108, 0.28)",
        bottomColor: isUp ? "rgba(43, 214, 123, 0.0)" : "rgba(255, 92, 108, 0.0)",
        lineColor: accentColor,
        lineWidth: 2,
      });
      mainSeries.setData(
        cleanBars.map((b) => ({
          time: b.time,
          value: b.close,
        }))
      );
    }

    // 3. Technical Overlays (50-DMA, 200-DMA)
    if (showSMA50 && cleanBars.length >= 50) {
      const sma50Values = smaSeries(
        cleanBars.map((b) => b.close),
        50
      );
      const sma50Series = chart.addSeries(LineSeries, {
        color: "#FFB84D",
        lineWidth: 1,
        title: "50-DMA",
      });
      const smaData = cleanBars
        .map((b, idx) => ({
          time: b.time,
          value: sma50Values[idx],
        }))
        .filter((p): p is { time: Time; value: number } => p.value !== null);
      sma50Series.setData(smaData);
    }

    if (showSMA200 && cleanBars.length >= 200) {
      const sma200Values = smaSeries(
        cleanBars.map((b) => b.close),
        200
      );
      const sma200Series = chart.addSeries(LineSeries, {
        color: "#7C5CFF",
        lineWidth: 1,
        title: "200-DMA",
      });
      const smaData = cleanBars
        .map((b, idx) => ({
          time: b.time,
          value: sma200Values[idx],
        }))
        .filter((p): p is { time: Time; value: number } => p.value !== null);
      sma200Series.setData(smaData);
    }

    // 4. Crosshair tracking
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData) {
        setHoveredData(null);
        return;
      }

      const point = cleanBars.find((b) => b.time === param.time);
      if (point) {
        const delta = ((point.close - firstClose) / firstClose) * 100;
        setHoveredData({
          time: point.rawDate.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: preset.range === "1d" || preset.range === "5d" ? "2-digit" : undefined,
            minute: preset.range === "1d" || preset.range === "5d" ? "2-digit" : undefined,
          }),
          open: point.open,
          high: point.high,
          low: point.low,
          close: point.close,
          volume: point.volume,
          changePct: delta,
        });
      }
    });

    chart.timeScale().fitContent();

    // Resize handler
    const handleResize = () => {
      if (chartContainerRef.current && chartInstanceRef.current) {
        chartInstanceRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }
    };
  }, [
    cleanBars,
    chartType,
    showSMA50,
    showSMA200,
    loading,
    preset.range,
  ]);

  const lastBar = cleanBars[cleanBars.length - 1];
  const displayedBar = hoveredData || (lastBar ? {
    time: "Latest Session",
    open: lastBar.open,
    high: lastBar.high,
    low: lastBar.low,
    close: lastBar.close,
    volume: lastBar.volume,
    changePct: periodPct,
  } : null);

  return (
    <Card className={`space-y-3.5 ${className}`}>
      {/* Top Header Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/[0.06] pb-3">
        {/* Left: Index Selector Tabs + Trend Insight Chip */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex gap-1 overflow-x-auto pb-0.5" role="tablist">
            {INDICES.map((ix) => (
              <button
                key={ix.id}
                onClick={() => setIndex(ix)}
                aria-selected={index.id === ix.id}
                className={`text-xs font-semibold px-3 py-1.5 rounded-[10px] border transition-all whitespace-nowrap ${
                  index.id === ix.id
                    ? "bg-gradient-to-r from-[#7C5CFF] to-[#4F8CFF] text-white border-transparent shadow-[0_2px_12px_rgba(124,92,255,0.3)]"
                    : "border-slate-200/90 dark:border-white/[0.08] text-slate-600 dark:text-[#A3AEC7] bg-slate-50 dark:bg-[#131C30]/50 hover:bg-slate-100 dark:hover:bg-[#1A2540]"
                }`}
              >
                {ix.label}
              </button>
            ))}
          </div>

          {/* Compact Trend Chip */}
          {trendInsight && (
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-violet-500/10 dark:bg-[#7C5CFF]/10 border border-violet-500/20 dark:border-[#7C5CFF]/20 text-violet-700 dark:text-[#7C5CFF]">
              <Activity className="w-3 h-3 text-[#7C5CFF]" />
              <span>{trendInsight}</span>
            </span>
          )}
        </div>

        {/* Right side controls: Period Comparison + 50/200 DMA + View Toggle + Range Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Side-by-side Period Change Pill */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold si-numeric bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] rounded-full px-3 py-1">
            <span className={sessionPct >= 0 ? "text-[#2BD67B]" : "text-[#FF5C6C]"}>
              {sessionLabel} {sessionPct >= 0 ? "+" : ""}{sessionPct.toFixed(2)}%
            </span>
            <span className="text-slate-300 dark:text-white/20 select-none">vs</span>
            <span className={periodPct >= 0 ? "text-[#2BD67B]" : "text-[#FF5C6C]"}>
              {preset.id} {periodPct >= 0 ? "+" : ""}{periodPct.toFixed(2)}%
            </span>
          </div>

          {/* 50 / 200 DMA tiny pill toggles */}
          <div className="flex items-center gap-1 border-r border-slate-200/80 dark:border-white/10 pr-2">
            <button
              type="button"
              onClick={() => setShowSMA50((v) => !v)}
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-all ${
                showSMA50
                  ? "bg-[#FFB84D]/15 text-[#FFB84D] border-[#FFB84D]/40 shadow-sm"
                  : "border-slate-200/80 dark:border-white/10 text-slate-400 dark:text-[#6B7792] hover:text-slate-600 dark:hover:text-[#A3AEC7]"
              }`}
              title="Toggle 50-day moving average overlay"
            >
              50-DMA
            </button>
            <button
              type="button"
              onClick={() => setShowSMA200((v) => !v)}
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-all ${
                showSMA200
                  ? "bg-[#7C5CFF]/15 text-[#7C5CFF] border-[#7C5CFF]/40 shadow-sm"
                  : "border-slate-200/80 dark:border-white/10 text-slate-400 dark:text-[#6B7792] hover:text-slate-600 dark:hover:text-[#A3AEC7]"
              }`}
              title="Toggle 200-day moving average overlay"
            >
              200-DMA
            </button>
          </div>

          {/* Chart Type Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-[#131C30]/80 p-0.5 rounded-lg border border-slate-200/80 dark:border-white/10">
            <button
              onClick={() => setChartType("area")}
              className={`p-1 rounded-md transition ${
                chartType === "area"
                  ? "bg-white dark:bg-[#0D1424] text-indigo-600 dark:text-[#7C5CFF] shadow-sm"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-[#A3AEC7]"
              }`}
              title="Area Line Chart"
            >
              <AreaIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType("candle")}
              className={`p-1 rounded-md transition ${
                chartType === "candle"
                  ? "bg-white dark:bg-[#0D1424] text-indigo-600 dark:text-[#7C5CFF] shadow-sm"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-[#A3AEC7]"
              }`}
              title="Candlestick Chart"
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Range Selector */}
          <SegmentedControl
            size="sm"
            options={PRESETS.map((p) => ({ id: p.id, label: p.id }))}
            value={preset.id}
            onChange={(val) => {
              const next = PRESETS.find((p) => p.id === val);
              if (next) setPreset(next);
            }}
          />
        </div>
      </div>

      {/* Contrast Explanation Sub-strip */}
      <div className="flex items-center justify-between text-xs px-1 text-slate-500 dark:text-[#A3AEC7] flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800 dark:text-[#F4F6FB]">{index.label}:</span>
          <span>{contrastExplanation}</span>
        </div>
        <div className="text-[11px] opacity-75 hidden sm:inline">
          Delayed 15m · TradingView Lightweight Charts™
        </div>
      </div>

      {/* Main Chart Area with Floating OHLC Glass Pill */}
      {loading ? (
        <Skeleton className="h-[440px] w-full !rounded-[16px]" label={t.gen.loadingChart} />
      ) : error ? (
        <ErrorState title={error} onRetry={() => setSeq((s) => s + 1)} />
      ) : cleanBars.length ? (
        <div className="relative">
          {/* Floating Crosshair OHLC Tooltip Pill */}
          {displayedBar && (
            <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none bg-white/95 dark:bg-[#070B14]/85 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-[12px] px-3.5 py-2 shadow-lg flex items-center gap-3 text-xs si-numeric transition-all">
              <div className="font-semibold text-slate-900 dark:text-[#F4F6FB] border-r border-slate-200 dark:border-white/10 pr-2.5">
                {displayedBar.time}
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-[#A3AEC7] flex-wrap">
                <span>O: <strong className="text-slate-900 dark:text-[#F4F6FB]">₹{formatPrice2dp(displayedBar.open)}</strong></span>
                <span>H: <strong className="text-slate-900 dark:text-[#F4F6FB]">₹{formatPrice2dp(displayedBar.high)}</strong></span>
                <span>L: <strong className="text-slate-900 dark:text-[#F4F6FB]">₹{formatPrice2dp(displayedBar.low)}</strong></span>
                <span>C: <strong className="text-slate-900 dark:text-[#F4F6FB]">₹{formatPrice2dp(displayedBar.close)}</strong></span>
                {displayedBar.volume != null && (
                  <span className="hidden md:inline">Vol: <strong className="text-slate-900 dark:text-[#F4F6FB]">{Number(displayedBar.volume).toLocaleString("en-IN")}</strong></span>
                )}
              </div>
              {displayedBar.changePct !== undefined && (
                <span className={`font-bold ml-1 ${displayedBar.changePct >= 0 ? "text-[#2BD67B]" : "text-[#FF5C6C]"}`}>
                  ({formatPct(displayedBar.changePct)})
                </span>
              )}
            </div>
          )}

          <div ref={chartContainerRef} className="w-full h-[440px] rounded-[16px] overflow-hidden" />
        </div>
      ) : (
        <EmptyState icon="📉" title={t.gen.dataUnavailable} />
      )}
    </Card>
  );
}

export default MarketChart;
