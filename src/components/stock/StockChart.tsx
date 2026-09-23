import { useEffect, useMemo, useState } from "react";
import {
  LineChart, Line, AreaChart, Area, ComposedChart, Bar, BarChart,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Cell,
} from "recharts";
import { marketApi } from "../../api/market";
import { useLang } from "../../i18n/LanguageContext";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { ErrorState } from "../ui/ErrorState";
import { Skeleton } from "../ui/Skeleton";
import { smaSeries, emaSeries, rsiSeries, macdSeries, bollingerSeries, MIN_BARS } from "./series";
import ChartInsight from "./ChartInsight";

type ChartType = "line" | "area" | "candles";

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

interface Candle {
  d: string;
  o: number;
  h: number;
  l: number;
  c: number;
  hl: [number, number];
  up: boolean;
}

/** Wick + body drawn from payload ratios — no invented geometry. */
function CandleShape(props: any) {
  const { x, y, width, height, payload } = props;
  // Like the tooltip, the shape receives the row datum; candle is nested.
  const p = payload?.candle as Candle | undefined;
  if (!p || p.o == null || p.h == null || p.l == null || p.c == null) return <g />;
  if (!(p.h > p.l) || !(width > 0)) return <g />;
  const cx = x + width / 2;
  const top = Math.max(p.o, p.c);
  const bodyTop = y + (height * (p.h - top)) / (p.h - p.l);
  const bodyH = Math.max(1, (height * Math.abs(p.o - p.c)) / (p.h - p.l));
  const color = p.up ? "#15803d" : "#b91c1c";
  return (
    <g>
      <line x1={cx} y1={y} x2={cx} y2={y + height} stroke={color} strokeWidth={1.5} />
      <rect x={x + 1} y={bodyTop} width={Math.max(1, width - 2)} height={bodyH} fill={color} />
    </g>
  );
}

function CandleTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  // Recharts passes the whole row datum; the candle is nested at .candle.
  const p = payload[0]?.payload?.candle as Candle | undefined;
  if (!p || p.o == null || p.h == null || p.l == null || p.c == null) return null;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs si-numeric">
      <p className="font-semibold mb-0.5">{p.d}</p>
      <p>O {Number(p.o).toLocaleString("en-IN")} · H {Number(p.h).toLocaleString("en-IN")}</p>
      <p>L {Number(p.l).toLocaleString("en-IN")} · C {Number(p.c).toLocaleString("en-IN")}</p>
    </div>
  );
}

/**
 * Professional stock chart: 7 periods, line/area/candlestick, SMA /
 * EMA / Bollinger overlays, volume + RSI + MACD subplots. Every
 * indicator is gated on real bar count — short histories disable the
 * toggle with an "Insufficient data" reason instead of estimating.
 */
export function StockChart({ symbol }: { symbol: string }) {
  const { t } = useLang();
  const [preset, setPreset] = useState<Preset>(PRESETS[5]);
  const [type, setType] = useState<ChartType>("line");
  const [show, setShow] = useState({ sma20: false, sma50: false, ema20: false, bb: false, vol: true, rsi: false, macd: false });
  const [bars, setBars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [seq, setSeq] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    marketApi
      .history(symbol, preset.interval, preset.range)
      .then((r) => alive && setBars(Array.isArray(r.bars) ? r.bars : []))
      .catch(() => alive && setError("Unable to load market data."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [symbol, preset, seq]);

  const model = useMemo(() => {
    const valid = bars.filter((b: any) => b?.close != null && b?.date);
    const closes = valid.map((b: any) => Number(b.close));
    const n = closes.length;
    const sma20 = n >= MIN_BARS.sma20 ? smaSeries(closes, 20) : [];
    const sma50 = n >= MIN_BARS.sma50 ? smaSeries(closes, 50) : [];
    const ema20 = n >= MIN_BARS.ema20 ? emaSeries(closes, 20) : [];
    const bb = n >= MIN_BARS.bb ? bollingerSeries(closes, 20, 2) : [];
    const rsi = n >= MIN_BARS.rsi ? rsiSeries(closes, 14) : [];
    const macd = n >= MIN_BARS.macd ? macdSeries(closes) : [];
    const rows = valid.map((b: any, i: number) => {
      const o = Number(b.open ?? b.close);
      const h = Number(b.high ?? b.close);
      const l = Number(b.low ?? b.close);
      const c = Number(b.close);
      return {
        d: new Date(b.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", ...(preset.range === "1y" || preset.range === "5y" ? { year: "2-digit" as const } : {}) }),
        c,
        candle: { d: new Date(b.date).toLocaleDateString("en-IN"), o, h, l, c, hl: [l, h] as [number, number], up: c >= o },
        vol: typeof b.volume === "number" && b.volume > 0 ? b.volume : null,
        sma20: sma20[i] ?? null,
        sma50: sma50[i] ?? null,
        ema20: ema20[i] ?? null,
        bbU: bb[i]?.upper ?? null,
        bbL: bb[i]?.lower ?? null,
        rsi: rsi[i] ?? null,
        macdD: macd[i]?.dif ?? null,
        macdS: macd[i]?.sig ?? null,
        macdH: macd[i]?.hist ?? null,
      };
    });
    const hasVol = rows.some((r) => r.vol != null);
    const up = n >= 2 ? closes[n - 1] >= closes[0] : true;
    return { rows, n, hasVol, up };
  }, [bars, preset]);

  const toggle = (k: keyof typeof show) => setShow((s) => ({ ...s, [k]: !s[k] }));
  const gate = (need: number): { ok: boolean; why: string } =>
    model.n >= need ? { ok: true, why: "" } : { ok: false, why: `${t.stock.insufficient} (${t.chart.needBars} ${need})` };

  const indBtn = (k: keyof typeof show, label: string, need: number, extraOk = true) => {
    const g = gate(need);
    const ok = g.ok && extraOk;
    return (
      <button
        key={k}
        onClick={() => ok && toggle(k)}
        disabled={!ok}
        aria-pressed={show[k]}
        title={ok ? label : g.why || `${t.stock.insufficient}`}
        className={`text-xs px-2 py-1 rounded-md border disabled:opacity-40 disabled:cursor-not-allowed ${
          show[k] && ok
            ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold"
            : "border-slate-300 dark:border-slate-700"
        }`}
      >
        {label}
      </button>
    );
  };

  const priceColor = model.up ? "#15803d" : "#b91c1c";

  return (
    <Card
      title={`${t.dash.chart} — ${symbol}`}
      action={
        <div className="flex gap-1 flex-wrap" role="group" aria-label="Chart range">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPreset(p)}
              aria-pressed={preset.id === p.id}
              className={`text-xs px-2 py-1 rounded-md border ${
                preset.id === p.id
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold"
                  : "border-slate-300 dark:border-slate-700"
              }`}
            >
              {p.id}
            </button>
          ))}
        </div>
      }
    >
      <div className="flex gap-1.5 flex-wrap mb-1" role="group" aria-label={t.chart.chartType}>
        {(["line", "area", "candles"] as ChartType[]).map((ct) => (
          <button
            key={ct}
            onClick={() => setType(ct)}
            aria-pressed={type === ct}
            className={`text-xs px-2.5 py-1 rounded-full border ${
              type === ct
                ? "bg-blue-700 text-white border-blue-700 font-semibold"
                : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300"
            }`}
          >
            {ct === "line" ? t.chart.line : ct === "area" ? t.chart.area : t.chart.candles}
          </button>
        ))}
      </div>
      <div className="flex gap-1.5 flex-wrap mb-3" role="group" aria-label={t.chart.indicators}>
        {indBtn("sma20", "SMA 20", MIN_BARS.sma20)}
        {indBtn("sma50", "SMA 50", MIN_BARS.sma50)}
        {indBtn("ema20", "EMA 20", MIN_BARS.ema20)}
        {indBtn("bb", t.chart.indBB, MIN_BARS.bb)}
        {indBtn("vol", t.chart.indVol, 1, model.hasVol)}
        {indBtn("rsi", t.chart.indRSI, MIN_BARS.rsi)}
        {indBtn("macd", t.chart.indMACD, MIN_BARS.macd)}
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full !rounded-xl" label="Loading chart" />
      ) : error ? (
        <ErrorState title={error} onRetry={() => setSeq((s) => s + 1)} />
      ) : !model.rows.length ? (
        <EmptyState icon="📉" title={t.stock.insufficient} />
      ) : (
        <>
          <ChartInsight
            closes={model.rows.map((r) => r.c)}
            intraday={preset.range === "1d" || preset.range === "5d"}
          />
          {type === "candles" ? (
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={model.rows} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="d" tick={{ fontSize: 10 }} minTickGap={50} />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10 }} width={64} />
                <Tooltip content={<CandleTooltip />} />
                <Bar dataKey="candle.hl" shape={<CandleShape />} maxBarSize={14} isAnimationActive={false}>
                  {model.rows.map((r, i) => (
                    <Cell key={i} />
                  ))}
                </Bar>
                {show.sma20 && <Line type="monotone" dataKey="sma20" stroke="#7c3aed" dot={false} strokeWidth={1.5} connectNulls />}
                {show.sma50 && <Line type="monotone" dataKey="sma50" stroke="#b45309" dot={false} strokeWidth={1.5} connectNulls />}
                {show.ema20 && <Line type="monotone" dataKey="ema20" stroke="#0ea5e9" dot={false} strokeWidth={1.5} connectNulls />}
                {show.bb && <Line type="monotone" dataKey="bbU" stroke="#94a3b8" dot={false} strokeWidth={1} strokeDasharray="4 3" connectNulls />}
                {show.bb && <Line type="monotone" dataKey="bbL" stroke="#94a3b8" dot={false} strokeWidth={1} strokeDasharray="4 3" connectNulls />}
              </ComposedChart>
            </ResponsiveContainer>
          ) : type === "area" ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={model.rows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="d" tick={{ fontSize: 10 }} minTickGap={50} />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10 }} width={64} />
                <Tooltip formatter={(v: any) => [Number(v).toLocaleString("en-IN"), symbol]} />
                <Area type="monotone" dataKey="c" stroke={priceColor} fill={priceColor} fillOpacity={0.15} strokeWidth={2} name={symbol} />
                {show.sma20 && <Line type="monotone" dataKey="sma20" stroke="#7c3aed" dot={false} strokeWidth={1.5} connectNulls />}
                {show.sma50 && <Line type="monotone" dataKey="sma50" stroke="#b45309" dot={false} strokeWidth={1.5} connectNulls />}
                {show.ema20 && <Line type="monotone" dataKey="ema20" stroke="#0ea5e9" dot={false} strokeWidth={1.5} connectNulls />}
                {show.bb && <Line type="monotone" dataKey="bbU" stroke="#94a3b8" dot={false} strokeWidth={1} strokeDasharray="4 3" connectNulls />}
                {show.bb && <Line type="monotone" dataKey="bbL" stroke="#94a3b8" dot={false} strokeWidth={1} strokeDasharray="4 3" connectNulls />}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={model.rows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="d" tick={{ fontSize: 10 }} minTickGap={50} />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10 }} width={64} />
                <Tooltip formatter={(v: any) => [Number(v).toLocaleString("en-IN"), symbol]} />
                <Line type="monotone" dataKey="c" stroke={priceColor} dot={false} strokeWidth={2} name={symbol} connectNulls />
                {show.sma20 && <Line type="monotone" dataKey="sma20" stroke="#7c3aed" dot={false} strokeWidth={1.5} connectNulls />}
                {show.sma50 && <Line type="monotone" dataKey="sma50" stroke="#b45309" dot={false} strokeWidth={1.5} connectNulls />}
                {show.ema20 && <Line type="monotone" dataKey="ema20" stroke="#0ea5e9" dot={false} strokeWidth={1.5} connectNulls />}
                {show.bb && <Line type="monotone" dataKey="bbU" stroke="#94a3b8" dot={false} strokeWidth={1} strokeDasharray="4 3" connectNulls />}
                {show.bb && <Line type="monotone" dataKey="bbL" stroke="#94a3b8" dot={false} strokeWidth={1} strokeDasharray="4 3" connectNulls />}
              </LineChart>
            </ResponsiveContainer>
          )}

          {show.vol && model.hasVol && (
            <div className="mt-1">
              <p className="text-xs text-slate-500 mb-0.5">{t.chart.indVol}</p>
              <ResponsiveContainer width="100%" height={70}>
                <BarChart data={model.rows}>
                  <XAxis dataKey="d" tick={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9 }} width={52} />
                  <Tooltip formatter={(v: any) => [Number(v).toLocaleString("en-IN"), t.chart.indVol]} />
                  <Bar dataKey="vol" fill="#94a3b8" maxBarSize={14} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {show.rsi && (
            <div className="mt-1">
              <p className="text-xs text-slate-500 mb-0.5">{t.chart.indRSI} (14)</p>
              <ResponsiveContainer width="100%" height={90}>
                <LineChart data={model.rows}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="d" tick={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} width={30} />
                  <Tooltip />
                  <ReferenceLine y={70} stroke="#b91c1c" strokeDasharray="3 3" />
                  <ReferenceLine y={30} stroke="#15803d" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="rsi" stroke="#6d28d9" dot={false} strokeWidth={1.5} connectNulls name="RSI" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {show.macd && (
            <div className="mt-1">
              <p className="text-xs text-slate-500 mb-0.5">{t.chart.indMACD} (12, 26, 9)</p>
              <ResponsiveContainer width="100%" height={90}>
                <ComposedChart data={model.rows}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="d" tick={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9 }} width={52} />
                  <Tooltip />
                  <Bar dataKey="macdH" fill="#94a3b8" maxBarSize={14} isAnimationActive={false} name="Hist" />
                  <Line type="monotone" dataKey="macdD" stroke="#2563eb" dot={false} strokeWidth={1.5} connectNulls name="DIF" />
                  <Line type="monotone" dataKey="macdS" stroke="#b45309" dot={false} strokeWidth={1.5} connectNulls name="Signal" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

export default StockChart;
