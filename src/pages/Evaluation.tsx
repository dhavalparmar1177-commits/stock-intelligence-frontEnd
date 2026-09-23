import { useEffect, useMemo, useState } from "react";
import { marketApi } from "../api/market";
import { useLang } from "../i18n/LanguageContext";
import { useWatchlists } from "../hooks/useWatchlist";
import { Alert } from "../components/ui/Alert";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { SkeletonText } from "../components/ui/Skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { Tabs } from "../components/ui/Tabs";
import { Table } from "../components/ui/Table";
import { PageHeader } from "../components/layout/primitives";
import SourceTag from "../components/stock/SourceTag";

const CORE = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "TATAMOTORS", "SBIN", "ITC"];

function Stat({ label, value, sub, t }: { label: string; value: string; sub?: string; t: any }) {
  const na = value === t.common.notVerified;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 min-w-0">
      <p className="text-xs text-slate-500 truncate">{label}</p>
      <p className={`font-bold text-lg si-numeric truncate ${na ? "text-slate-400 font-medium text-sm" : ""}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 truncate">{sub}</p>}
    </div>
  );
}

/**
 * AI Evaluation: stored predictions vs real outcomes, computed
 * server-side from ForecastRecord rows + live prices + one NIFTY
 * history. Empty buckets render NOT VERIFIED — never zeros, never
 * claims of accuracy the data cannot support.
 */
export default function Evaluation() {
  const { t } = useLang();

  function pct(v: unknown): string {
    if (v === null || v === undefined) return t.common.notVerified;
    const n = Number(v);
    return Number.isFinite(n) ? `${n}%` : t.common.notVerified;
  }

  const { lists } = useWatchlists();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [seq, setSeq] = useState(0);

  const symbols = useMemo(() => {
    const wl = lists.flatMap((l) => l.symbols.map((s) => s.trim().toUpperCase()));
    return [...new Set([...CORE, ...wl])].slice(0, 12);
  }, [lists]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    marketApi
      .evaluation(symbols.join(","))
      .then((r) => alive && setData(r))
      .catch((e: any) => alive && setError(e.response?.data?.error || t.gen.unableToLoad))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [seq]);

  const retry = () => setSeq((s) => s + 1);
  const o = data?.overall || {};
  const skipped = (data?.perSymbol || []).filter((p: any) => p.skipped);
  const wins = o.count != null && o.hits != null ? o.hits : null;
  const losses = o.count != null && o.hits != null ? o.count - o.hits : null;
  const bucketChart = ["d7", "d30", "d90"].map((b) => ({
    name: b === "d7" ? t.eval.d7 : b === "d30" ? t.eval.d30 : t.eval.d90,
    accuracy: data?.buckets?.[b]?.accuracyPct ?? null,
  }));
  const retChart = ["d7", "d30", "d90"].map((b) => ({
    name: b === "d7" ? t.eval.d7 : b === "d30" ? t.eval.d30 : t.eval.d90,
    predicted: data?.buckets?.[b]?.meanExpectedPct ?? null,
    actual: data?.buckets?.[b]?.meanActualPct ?? null,
  }));

  const accuracyTab = (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label={t.eval.evaluated} value={data ? `${o.count ?? 0} / ${data.stored ?? 0} ${t.eval.stored}` : t.common.notVerified} t={t} />
        <Stat label={t.eval.accuracy} value={pct(o.accuracyPct)} t={t} />
        <Stat label={t.eval.avgErr} value={pct(o.avgErrorPct)} t={t} />
        <Stat label={t.eval.winsLosses} value={wins != null && losses != null ? `${wins}W / ${losses}L` : t.common.notVerified} t={t} />
      </div>
      <Card title={t.eval.byAge}>
        <Table
          caption="Accuracy by age"
          minWidth={420}
          columns={[
            { key: "b", header: "", cell: (r: any) => <span className="text-slate-500">{r.label}</span> },
            { key: "n", header: t.eval.evaluated, align: "right", numeric: true, cell: (r: any) => r.n },
            { key: "a", header: t.eval.accuracy, align: "right", numeric: true, cell: (r: any) => r.a },
            { key: "e", header: t.eval.avgErr, align: "right", numeric: true, cell: (r: any) => r.e },
          ]}
          rows={[
            { id: "d7", label: t.eval.d7, n: data?.buckets?.d7?.count ?? 0, a: pct(data?.buckets?.d7?.accuracyPct), e: pct(data?.buckets?.d7?.avgErrorPct) },
            { id: "d30", label: t.eval.d30, n: data?.buckets?.d30?.count ?? 0, a: pct(data?.buckets?.d30?.accuracyPct), e: pct(data?.buckets?.d30?.avgErrorPct) },
            { id: "d90", label: t.eval.d90, n: data?.buckets?.d90?.count ?? 0, a: pct(data?.buckets?.d90?.accuracyPct), e: pct(data?.buckets?.d90?.avgErrorPct) },
          ]}
        />
      </Card>
      <Card title={t.eval.accuracy}>
        {bucketChart.every((b) => b.accuracy == null) ? (
          <EmptyState icon="📊" title={t.eval.notVerified} />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={bucketChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} width={36} />
              <Tooltip formatter={(v: any) => [`${v}%`, t.eval.accuracy]} />
              <Bar dataKey="accuracy" fill="#6d28d9" maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
      <Card title={t.eval.bySignal}>
        <Table
          caption="Accuracy by signal"
          minWidth={420}
          columns={[
            { key: "b", header: "", cell: (r: any) => <span className="text-slate-500">{r.label}</span> },
            { key: "n", header: t.eval.evaluated, align: "right", numeric: true, cell: (r: any) => r.n },
            { key: "a", header: t.eval.accuracy, align: "right", numeric: true, cell: (r: any) => r.a },
          ]}
          rows={["BUY", "SELL", "HOLD"].map((s) => ({
            id: s, label: s,
            n: data?.signals?.[s]?.count ?? 0,
            a: pct(data?.signals?.[s]?.accuracyPct),
          }))}
        />
      </Card>
      <Card title={t.eval.perSymbol}>
        <Table
          caption="Per-symbol accuracy"
          minWidth={420}
          columns={[
            { key: "s", header: t.eval.symbol, cell: (r: any) => <b>{r.symbol}</b> },
            { key: "n", header: t.eval.evaluated, align: "right", numeric: true, cell: (r: any) => r.n },
            { key: "a", header: t.eval.accuracy, align: "right", numeric: true, cell: (r: any) => r.a },
          ]}
          rows={(data?.perSymbol || []).map((p: any) => ({
            id: p.symbol, symbol: p.skipped ? `${p.symbol} (${t.eval.skipped})` : p.symbol,
            n: p.evaluated ?? 0, a: pct(p.accuracy),
          }))}
          empty={<EmptyState icon="📊" title={t.eval.noData} />}
        />
      </Card>
      <p className="text-xs text-slate-500">{t.eval.method}</p>
    </div>
  );

  const returnsTab = (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label={t.eval.meanExp} value={pct(o.meanExpectedPct)} t={t} />
        <Stat label={t.eval.meanAct} value={pct(o.meanActualPct)} t={t} />
        <Stat label={t.eval.avgErr} value={pct(o.avgErrorPct)} t={t} />
        <Stat label={t.eval.evaluated} value={data ? `${o.count ?? 0}` : t.common.notVerified} t={t} />
      </div>
      <Card title={t.eval.byAge}>
        <Table
          caption="Returns by age"
          minWidth={420}
          columns={[
            { key: "b", header: "", cell: (r: any) => <span className="text-slate-500">{r.label}</span> },
            { key: "e", header: t.eval.meanExp, align: "right", numeric: true, cell: (r: any) => r.e },
            { key: "a", header: t.eval.meanAct, align: "right", numeric: true, cell: (r: any) => r.a },
          ]}
          rows={[
            { id: "d7", label: t.eval.d7, e: pct(data?.buckets?.d7?.meanExpectedPct), a: pct(data?.buckets?.d7?.meanActualPct) },
            { id: "d30", label: t.eval.d30, e: pct(data?.buckets?.d30?.meanExpectedPct), a: pct(data?.buckets?.d30?.meanActualPct) },
            { id: "d90", label: t.eval.d90, e: pct(data?.buckets?.d90?.meanExpectedPct), a: pct(data?.buckets?.d90?.meanActualPct) },
          ]}
        />
      </Card>
      <Card title={`${t.eval.meanExp} / ${t.eval.meanAct}`}>
        {retChart.every((b) => b.predicted == null && b.actual == null) ? (
          <EmptyState icon="📊" title={t.eval.notVerified} />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={retChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} width={52} />
              <Tooltip formatter={(v: any, name: any) => [`${v}%`, name]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="predicted" name={t.eval.meanExp} fill="#2563eb" maxBarSize={32} />
              <Bar dataKey="actual" name={t.eval.meanAct} fill="#16a34a" maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );

  const benchmarkTab = (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <Stat label={t.eval.meanAct} value={pct(o.meanActualPct)} t={t} />
        <Stat label={t.eval.meanNifty} value={pct(o.meanNiftyPct)} t={t} />
        <Stat label={t.eval.beatNifty} value={pct(o.beatNiftyPct)} t={t} />
      </div>
      <Alert tone="info">
        <p className="text-xs">{data?.benchmarkNote || t.eval.notVerified}</p>
      </Alert>
    </div>
  );

  const confTab = (
    <div className="space-y-3">
      <Card title={t.eval.confCalib}>
        <Table
          caption="Confidence calibration"
          minWidth={420}
          columns={[
            { key: "b", header: "", cell: (r: any) => <span className="text-slate-500">{r.label}</span> },
            { key: "n", header: t.eval.evaluated, align: "right", numeric: true, cell: (r: any) => r.n },
            { key: "a", header: t.eval.accuracy, align: "right", numeric: true, cell: (r: any) => r.a },
          ]}
          rows={[
            { id: "h", label: `${t.chart.confHigh} (≥70)`, n: data?.confidence?.high?.count ?? 0, a: pct(data?.confidence?.high?.accuracyPct) },
            { id: "m", label: `${t.chart.confMed} (50–69)`, n: data?.confidence?.med?.count ?? 0, a: pct(data?.confidence?.med?.accuracyPct) },
            { id: "l", label: `${t.chart.confLow} (<50)`, n: data?.confidence?.low?.count ?? 0, a: pct(data?.confidence?.low?.accuracyPct) },
          ]}
        />
        {(data?.confidence?.unrecorded ?? 0) > 0 && (
          <p className="text-xs text-slate-500 mt-2">
            {data.confidence.unrecorded} {t.eval.unrecorded}
          </p>
        )}
      </Card>
    </div>
  );

  const historyTab = (
    <Card title={`${t.eval.tabHistory} (${(data?.history || []).length})`}>
      <Table
        caption="Prediction history"
        minWidth={640}
        columns={[
          { key: "s", header: t.screen.cStock, cell: (r: any) => <b>{r.symbol}</b> },
          { key: "d", header: t.eval.hAge, align: "right", numeric: true, cell: (r: any) => <span className="si-numeric">{r.ageDays}d · {String(r.asOf).slice(0, 10)}</span> },
          { key: "g", header: t.compare.mSignal, cell: (r: any) => r.signal },
          { key: "e", header: t.eval.meanExp, align: "right", numeric: true, cell: (r: any) => <span className="si-numeric">{r.expectedPct}%</span> },
          { key: "a", header: t.eval.meanAct, align: "right", numeric: true, cell: (r: any) => <span className="si-numeric">{r.actualPct}%</span> },
          { key: "h", header: t.eval.hHit, align: "center", cell: (r: any) => r.directionHit ? <span aria-label="win">✓</span> : <span aria-label="loss">✕</span> },
        ]}
        rows={(data?.history || []).map((r: any, i: number) => ({ ...r, id: `${r.symbol}-${r.asOf}-${i}` }))}
        empty={<EmptyState icon="📏" title={t.eval.noData} />}
      />
    </Card>
  );

  const risksTab = (
    <div className="space-y-3">
      <Card title={t.eval.leakage} action={<SourceTag kind="calc" />}>
        {(data?.leakage?.issues || []).length ? (
          <ul className="list-disc ml-4 text-sm space-y-1">
            {data.leakage.issues.map((x: any, i: number) => (
              <li key={i} className="text-red-700 dark:text-red-400">
                <b>{x.symbol}:</b> {x.detail}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon="🔍" title={t.eval.leakageClean} />
        )}
        {(data?.leakage?.uncheckedRecords ?? 0) > 0 && (
          <p className="text-xs text-slate-500 mt-2">
            {data.leakage.uncheckedRecords} {t.eval.leakageUnchecked}
          </p>
        )}
      </Card>
      {skipped.length > 0 && (
        <Alert tone="warning">
          <p className="text-xs">Skipped: {skipped.map((p: any) => `${p.symbol} (${p.skipped})`).join(", ")}</p>
        </Alert>
      )}
      <Alert tone="info">
        <p className="text-xs">{t.eval.method}</p>
      </Alert>
    </div>
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title={t.eval.title}
        description={`${t.eval.subtitle}${data?.asOf ? ` · ${new Date(data.asOf).toLocaleString()}` : ""}`}
        actions={
          <button
            onClick={retry}
            className="text-sm px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
          >
            ↻ {t.common.refreshNow}
          </button>
        }
      />
      {loading ? (
        <Card title={t.eval.title}>
          <SkeletonText lines={5} />
        </Card>
      ) : error ? (
        <ErrorState title={error} onRetry={retry} retryLabel={t.common.retry} />
      ) : data && data.evaluated > 0 ? (
        <Tabs
          label="Evaluation sections"
          defaultId="accuracy"
          tabs={[
            { id: "accuracy", label: t.eval.tabAccuracy, content: accuracyTab },
            { id: "returns", label: t.eval.tabReturns, content: returnsTab },
            { id: "benchmark", label: t.eval.tabBenchmark, content: benchmarkTab },
            { id: "confidence", label: t.eval.tabConfidence, content: confTab },
            { id: "risks", label: t.eval.tabRisks, content: risksTab },
            { id: "history", label: t.eval.tabHistory, content: historyTab },
          ]}
        />
      ) : (
        <Card>
          <EmptyState icon="📏" title={t.eval.noData} />
        </Card>
      )}
    </div>
  );
}
