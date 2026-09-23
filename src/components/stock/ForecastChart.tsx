import {
  ComposedChart, Line, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from "recharts";
import { useLang } from "../../i18n/LanguageContext";

/**
 * History + 30-day projection chart (moved unchanged from
 * IndiaForecast — history line, shaded ~80% band, dashed central
 * path, current-price reference).
 */
export function ForecastChart({
  bars,
  projection,
  currentPrice,
}: {
  bars: any[];
  projection: any[];
  currentPrice?: number | null;
}) {
  const { t } = useLang();
  const data = [
    ...(bars || []).slice(-120).map((b: any) => ({
      d: String(b.date || "").slice(0, 10),
      hist: b.close,
      central: null,
      high: null,
      low: null,
    })),
    ...(projection || [])
      .filter((_: any, i: number) => i % 2 === 0)
      .map((p: any) => ({ d: p.date, hist: null, central: p.central, high: p.high, low: p.low })),
  ];
  if (!data.length) return <p className="text-sm text-slate-500">{t.gen.dataUnavailable}</p>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="d" tick={{ fontSize: 10 }} minTickGap={50} />
        <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10 }} width={64} />
        <Tooltip />
        <Area type="monotone" dataKey="high" fill="#fed7aa" stroke="none" />
        <Area type="monotone" dataKey="low" fill="#ffffff" stroke="none" />
        <Line type="monotone" dataKey="hist" stroke="#2563eb" dot={false} strokeWidth={2} name="History" />
        <Line type="monotone" dataKey="central" stroke="#16a34a" dot={false} strokeWidth={2} strokeDasharray="6 3" name="Projected" />
        {currentPrice != null && (
          <ReferenceLine y={currentPrice} stroke="#888" strokeDasharray="3 3" label={{ value: "now", fontSize: 10 }} />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export default ForecastChart;
