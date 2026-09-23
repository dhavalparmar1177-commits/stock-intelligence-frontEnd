import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { marketApi } from "../../api/market";
import { useLang } from "../../i18n/LanguageContext";
import { Table } from "../ui/Table";
import { SkeletonTable } from "../ui/Skeleton";
import { ErrorState } from "../ui/ErrorState";

/**
 * Shared selected-stocks comparison tray. One indiaCompare call
 * (backend enforces 2–5 symbols) per symbol set — no per-row calls.
 * Remount (key=symbols) to compare a new selection.
 */
export function CompareTray({ symbols }: { symbols: string[] }) {
  const { t, lang } = useLang();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [seq, setSeq] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    marketApi
      .indiaCompare(symbols.join(","), lang)
      .then((r) => alive && setRows(r.ranked || []))
      .catch((e: any) => alive && setError(e.response?.data?.error || "Comparison unavailable"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [seq]);

  const metrics: { label: string; get: (s: any) => string }[] = [
    { label: t.screen.cPrice, get: (s) => (s.price != null ? Number(s.price).toLocaleString("en-IN") : t.gen.na) },
    { label: t.screen.cScore, get: (s) => (s.score != null ? `${s.score}/100` : t.gen.na) },
    { label: t.compare.mSignal, get: (s) => s.signal || t.gen.na },
    { label: t.compare.mTrend, get: (s) => s.trend || t.gen.na },
    { label: t.compare.mRSI, get: (s) => s.rsi14 ?? t.gen.na },
    { label: t.compare.mVol, get: (s) => (s.volatilityAnnPct != null ? `${s.volatilityAnnPct}%` : t.gen.na) },
    { label: t.screen.cRisk, get: (s) => s.riskLevel || t.gen.na },
    {
      label: t.compare.mRange,
      get: (s) =>
        s.forecast?.low != null && s.forecast?.high != null
          ? `${Number(s.forecast.low).toLocaleString("en-IN")}–${Number(s.forecast.high).toLocaleString("en-IN")}`
          : t.gen.na,
    },
  ];

  if (loading) return <SkeletonTable rows={5} />;
  if (error) return <ErrorState title={error} onRetry={() => setSeq((s) => s + 1)} retryLabel={t.common.retry} />;
  if (!rows.length) return <p className="text-sm text-slate-500">{t.gen.dataUnavailable}</p>;

  return (
    <Table
      caption="Selected comparison"
      minWidth={520}
      columns={[
        { key: "m", header: "", cell: (r: any) => <span className="text-slate-500">{r.label}</span> },
        ...rows.map((s: any) => ({
          key: s.symbol,
          header: (
            <Link to={`/stocks/${s.symbol}`} className="text-blue-700 dark:text-blue-400 hover:underline font-semibold">
              {s.symbol}
            </Link>
          ),
          align: "center" as const,
          numeric: true,
          cell: (r: any) => r.get(s),
        })),
      ]}
      rows={metrics.map((r, i) => ({ ...r, id: i }))}
    />
  );
}

export default CompareTray;
