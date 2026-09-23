import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { marketApi } from "../api/market";
import { useLang } from "../i18n/LanguageContext";
import { Card } from "./ui/Card";
import { EmptyState } from "./ui/EmptyState";
import { ErrorState } from "./ui/ErrorState";
import { Skeleton } from "./ui/Skeleton";
import ChartInsight from "./stock/ChartInsight";

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

/**
 * Institutional market overview chart with area gradient and interval selectors.
 */
export function MarketChart() {
  const { t } = useLang();
  const [index, setIndex] = useState<IndexDef>(INDICES[0]);
  const [preset, setPreset] = useState<Preset>(PRESETS[4]);
  const [bars, setBars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [seq, setSeq] = useState(0);

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

  const data = bars
    .filter((b: any) => b?.close != null && b?.date)
    .map((b: any) => ({
      d: new Date(b.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      close: Number(b.close),
    }));
  const first = data[0]?.close;
  const last = data[data.length - 1]?.close;
  const up = first != null && last != null ? last >= first : true;
  const strokeColor = up ? "#10b981" : "#f43f5e";
  const fillColor = up ? "rgba(16, 185, 129, 0.12)" : "rgba(244, 63, 94, 0.12)";

  return (
    <Card
      title={t.dash.chart}
      action={
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/60" role="group" aria-label="Chart range">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPreset(p)}
              aria-pressed={preset.id === p.id}
              className={`text-[11px] font-semibold px-2 py-1 rounded-md transition-all ${
                preset.id === p.id
                  ? "bg-white dark:bg-[#0e1626] text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {p.id}
            </button>
          ))}
        </div>
      }
    >
      <div className="flex gap-1.5 flex-wrap mb-4" role="group" aria-label="Index">
        {INDICES.map((ix) => (
          <button
            key={ix.id}
            onClick={() => setIndex(ix)}
            aria-pressed={index.id === ix.id}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
              index.id === ix.id
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {ix.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full !rounded-xl" label={t.gen.loadingChart} />
      ) : error ? (
        <ErrorState title={error} onRetry={() => setSeq((s) => s + 1)} />
      ) : data.length ? (
        <div className="space-y-3">
          <ChartInsight
            closes={data.map((d) => d.close)}
            intraday={preset.range === "1d" || preset.range === "5d"}
          />
          <ResponsiveContainer width="100%" height={270}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="marketAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="d" tick={{ fontSize: 10, fill: "#94a3b8" }} minTickGap={40} axisLine={false} tickLine={false} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "#94a3b8" }} width={64} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(14, 22, 38, 0.95)",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "0.75rem",
                  color: "#f8fafc",
                  fontSize: "12px",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                }}
                formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, index.label]}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={strokeColor}
                fill="url(#marketAreaGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState icon="📉" title={t.gen.dataUnavailable} />
      )}
    </Card>
  );
}

export default MarketChart;

