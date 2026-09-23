import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { marketApi } from "../api/market";
import { useLang } from "../i18n/LanguageContext";
import { Alert } from "../components/ui/Alert";
import { Badge, AIScoreBadge, SignalBadge, RiskBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { SkeletonCard } from "../components/ui/Skeleton";
import { Table } from "../components/ui/Table";
import { PageHeader } from "../components/layout/primitives";
import { CmpRow, relNifty, fmtINR } from "../components/compare/cmpUtils";
import Winners from "../components/compare/Winners";
import AiVerdict from "../components/compare/AiVerdict";
import { normSym } from "../components/screener/useScreenerUniverse";

function MetricTable({ caption, rows, stocks, t }: {
  caption: string;
  rows: { label: React.ReactNode; get: (s: CmpRow) => React.ReactNode }[];
  stocks: CmpRow[];
  t: any;
}) {
  return (
    <Table
      caption={caption}
      minWidth={Math.max(420, 140 + stocks.length * 150)}
      columns={[
        { key: "m", header: "", cell: (r: any) => <span className="text-slate-500">{r.label}</span> },
        ...stocks.map((s) => ({
          key: s.symbol,
          header: (
            <Link to={`/stocks/${s.symbol}`} className="text-blue-700 dark:text-blue-400 hover:underline font-semibold">
              {s.symbol}
            </Link>
          ),
          align: "center" as const,
          cell: (r: any) => r.get(s),
        })),
      ]}
      rows={rows.map((r, i) => ({ ...r, id: i }))}
    />
  );
}

function naCell(t: any) {
  return <span className="text-slate-400">{t.gen.dataUnavailable}</span>;
}

/**
 * Professional stock comparison (Phase 6): one indiaCompare call per
 * symbol set, overview cards → scores → fundamentals → technicals →
 * winners → AI verdict. Fundamentals are N/A (free feed publishes
 * none) — stated, never estimated.
 */
export default function Compare() {
  const { t, lang } = useLang();
  const [symbols, setSymbols] = useState<string[]>(["TCS", "INFY"]);
  const [rows, setRows] = useState<CmpRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fetchedKey = useRef("");

  const [addInput, setAddInput] = useState("");
  const [hint, setHint] = useState("");
  const [adding, setAdding] = useState(false);
  const [replacing, setReplacing] = useState<number | null>(null);
  const [replaceInput, setReplaceInput] = useState("");

  const fetchSet = async (syms: string[], force = false) => {
    const key = [...syms].map((s) => s.toUpperCase()).sort().join(",");
    if (!force && key === fetchedKey.current) return; // dedupe identical sets
    if (syms.length < 2 || syms.length > 5) return;
    setLoading(true);
    setError("");
    try {
      const r = await marketApi.indiaCompare(syms.join(","), lang);
      fetchedKey.current = key;
      setRows(r.ranked || []);
    } catch (e: any) {
      setError(e.response?.data?.error || t.compare.needTwo);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSet(["TCS", "INFY"]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resolveSymbol = async (v: string): Promise<string | null> => {
    const q = v.trim().toUpperCase();
    if (!q) return null;
    try {
      const r = await marketApi.search(q);
      const hit = (r.results || []).find((h: any) => normSym(h.appSymbol || h.symbol) === normSym(q));
      return hit ? String(hit.appSymbol || hit.symbol).toUpperCase() : null;
    } catch {
      return null;
    }
  };

  const doAdd = async () => {
    if (adding) return;
    if (symbols.length >= 5) {
      setHint(t.compare.maxFive);
      return;
    }
    setAdding(true);
    setHint("");
    const sym = await resolveSymbol(addInput);
    setAdding(false);
    if (!sym) {
      setHint(t.compare.noMatch);
      return;
    }
    if (symbols.includes(sym)) {
      setAddInput("");
      return;
    }
    const next = [...symbols, sym];
    setSymbols(next);
    setAddInput("");
    fetchSet(next);
  };

  const doRemove = (sym: string) => {
    const next = symbols.filter((s) => s !== sym);
    setSymbols(next);
    if (next.length >= 2) fetchSet(next);
    else {
      setRows([]);
      fetchedKey.current = "";
    }
  };

  const doReplace = async (idx: number) => {
    if (adding) return;
    setAdding(true);
    const sym = await resolveSymbol(replaceInput);
    setAdding(false);
    if (!sym) {
      setHint(t.compare.noMatch);
      return;
    }
    const next = symbols.map((s, i) => (i === idx ? sym : s));
    if (new Set(next).size !== next.length) {
      setHint(t.compare.maxFive);
      return;
    }
    setSymbols(next);
    setReplacing(null);
    setReplaceInput("");
    setHint("");
    fetchSet(next);
  };

  const scoreRows = [
    { label: t.compare.mScore, get: (s: CmpRow) => <AIScoreBadge score={s.score} /> },
    { label: t.compare.mSignal, get: (s: CmpRow) => <SignalBadge signal={s.signal} /> },
    { label: t.compare.mTrend, get: (s: CmpRow) => (s.trend ? <Badge tone="neutral">{s.trend}</Badge> : <Badge tone="neutral">{t.gen.dataUnavailable}</Badge>) },
    { label: t.compare.vConfidence, get: (s: CmpRow) => (s.confidence != null ? <span className="si-numeric">{s.confidence}%</span> : <span className="text-slate-400">{t.gen.dataUnavailable}</span>) },
    { label: t.compare.mRisk, get: (s: CmpRow) => <RiskBadge level={s.riskLevel || undefined} /> },
  ];

  const fundRows = [
    { label: t.compare.mCap, get: () => naCell(t) },
    { label: t.compare.mPE, get: () => naCell(t) },
    { label: t.compare.mEPS, get: () => naCell(t) },
    { label: t.compare.mROE, get: () => naCell(t) },
    { label: t.compare.mROCE, get: () => naCell(t) },
    { label: t.compare.mRevenueGrowth, get: () => naCell(t) },
    { label: t.compare.mProfitGrowth, get: () => naCell(t) },
    { label: t.compare.mProfitMargin, get: () => naCell(t) },
    { label: t.compare.mDebtEquity, get: () => naCell(t) },
    { label: t.compare.mDivYield, get: () => naCell(t) },
  ];

  const techRows = [
    {
      label: t.compare.mRSI,
      get: (s: CmpRow) => (s.rsi14 != null ? <span className="si-numeric">{s.rsi14}</span> : <span className="text-slate-400">{t.gen.dataUnavailable}</span>),
    },
    {
      label: `${t.compare.mRel} (${t.compare.momNote})`,
      get: (s: CmpRow) => {
        const v = relNifty(s);
        return v != null ? (
          <span className={`si-numeric font-semibold ${v >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
            {v >= 0 ? "+" : ""}{v} pts
          </span>
        ) : <span className="text-slate-400">{t.gen.dataUnavailable}</span>;
      },
    },
    {
      label: t.compare.mTrend,
      get: (s: CmpRow) => (s.trend ? <span>{s.trend}</span> : <span className="text-slate-400">{t.gen.dataUnavailable}</span>),
    },
    {
      label: t.compare.mVolume,
      get: (s: CmpRow) => (s.volumeRatio != null ? <span className="si-numeric">{s.volumeRatio}× avg</span> : <span className="text-slate-400">{t.gen.dataUnavailable}</span>),
    },
    { label: t.compare.mMovingAvg, get: () => naCell(t) },
    {
      label: t.compare.mVol,
      get: (s: CmpRow) => (s.volatilityAnnPct != null ? <span className="si-numeric">{s.volatilityAnnPct}%</span> : <span className="text-slate-400">{t.gen.dataUnavailable}</span>),
    },
    {
      label: t.compare.mMACD,
      get: (s: CmpRow) => (s.macdHist != null ? <span className="si-numeric">{s.macdHist}</span> : <span className="text-slate-400">{t.gen.dataUnavailable}</span>),
    },
    {
      label: t.compare.mSenti,
      get: (s: CmpRow) => (s.sentiment ? <span>{s.sentiment.label} ({s.sentiment.score})</span> : <span className="text-slate-400">{t.gen.dataUnavailable}</span>),
    },
    {
      label: t.compare.mRange,
      get: (s: CmpRow) =>
        s.forecast?.low != null && s.forecast?.high != null ? (
          <span className="si-numeric">{fmtINR(s.forecast.low)}–{fmtINR(s.forecast.high)}</span>
        ) : <span className="text-slate-400">{t.gen.dataUnavailable}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title={t.compare.title}
        description={t.compare.selHint}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => fetchSet(symbols, true)}
            disabled={symbols.length < 2 || loading}
            loading={loading}
          >
            {t.compare.compareBtn}
          </Button>
        }
      />

      {/* Selection */}
      <Card title={`${t.compare.title} (${symbols.length}/5)`}>
        <div className="flex gap-1.5 flex-wrap items-center">
          {symbols.map((s, i) =>
            replacing === i ? (
              <span key={s} className="inline-flex items-center gap-1 text-sm">
                <input
                  value={replaceInput}
                  onChange={(e) => setReplaceInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") doReplace(i);
                    if (e.key === "Escape") setReplacing(null);
                  }}
                  placeholder={s}
                  aria-label={`${t.compare.replace} ${s}`}
                  autoFocus
                  className="w-32 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1 text-sm bg-white dark:bg-slate-900"
                />
                <button onClick={() => doReplace(i)} aria-label={t.compare.apply} className="text-green-700 px-1">✓</button>
                <button onClick={() => setReplacing(null)} aria-label={t.compare.cancel} className="text-slate-400 px-1">✕</button>
              </span>
            ) : (
              <span key={s} className="inline-flex items-center gap-1 text-sm px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold">
                {s}
                <button
                  onClick={() => {
                    setReplacing(i);
                    setReplaceInput("");
                    setHint("");
                  }}
                  aria-label={`${t.compare.replace} ${s}`}
                  title={`${t.compare.replace} ${s}`}
                  className="text-slate-400 hover:text-blue-600 px-0.5"
                >
                  ✎
                </button>
                <button onClick={() => doRemove(s)} aria-label={`Remove ${s}`} className="text-slate-400 hover:text-red-600 px-0.5">
                  ✕
                </button>
              </span>
            )
          )}
          <button
            onClick={() => {
              setSymbols([]);
              setRows([]);
              fetchedKey.current = "";
            }}
            disabled={!symbols.length}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40"
          >
            {t.compare.clear}
          </button>
        </div>
        <div className="flex gap-2 mt-2">
          <input
            value={addInput}
            onChange={(e) => setAddInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doAdd()}
            placeholder={t.compare.addPh}
            aria-label={t.compare.addPh}
            className="flex-1 min-w-0 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-slate-900 placeholder:text-slate-400"
          />
          <Button variant="secondary" size="sm" onClick={doAdd} disabled={adding || !addInput.trim() || symbols.length >= 5} loading={adding}>
            {t.compare.add}
          </Button>
        </div>
        {hint && <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">{hint}</p>}
        {symbols.length > 0 && symbols.length < 2 && <p className="text-xs text-slate-500 mt-1">{t.compare.needTwo}</p>}
      </Card>

      {loading && !rows.length ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {symbols.map((s) => (
            <SkeletonCard key={s} />
          ))}
        </div>
      ) : error && !rows.length ? (
        <ErrorState title={error} onRetry={() => fetchSet(symbols, true)} retryLabel={t.common.retry} />
      ) : rows.length >= 2 ? (
        <>
          {/* Overview */}
          <section aria-label={t.compare.overview}>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {rows.map((s, i) => {
                const up = (s.changePct ?? 0) >= 0;
                return (
                  <Card key={s.symbol} accent={i === 0 ? "ai" : "none"}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {i === 0 && (
                          <span className="text-[11px] font-bold text-violet-700 dark:text-violet-300">★ #1</span>
                        )}
                        <Link to={`/stocks/${s.symbol}`} className="block font-bold text-lg hover:underline truncate">
                          {s.symbol}
                        </Link>
                        <p className="text-xs text-slate-500 truncate">{s.name || t.gen.dataUnavailable}</p>
                      </div>
                      <AIScoreBadge score={s.score} />
                    </div>
                    <div className="flex items-baseline gap-2 mt-2 flex-wrap">
                      <p className="font-bold text-xl si-numeric">
                        {s.price != null ? Number(s.price).toLocaleString("en-IN") : t.gen.dataUnavailable}
                      </p>
                      {s.changePct != null && (
                        <p className={`text-sm font-semibold si-numeric ${up ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                          {up ? "+" : ""}{Number(s.changePct).toFixed(2)}%
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      <SignalBadge signal={s.signal} />
                      <RiskBadge level={s.riskLevel || undefined} />
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          <Card title={t.compare.scores}>
            <MetricTable caption={t.compare.capAiScores} rows={scoreRows} stocks={rows} t={t} />
          </Card>

          <Card title={t.compare.fundamentals}>
            <MetricTable caption={t.compare.capFundComp} rows={fundRows} stocks={rows} t={t} />
            <p className="text-xs text-slate-500 mt-2">{t.compare.fundNote}</p>
          </Card>

          <Card title={t.compare.technicals}>
            <MetricTable caption={t.compare.capTechComp} rows={techRows} stocks={rows} t={t} />
          </Card>

          <Winners rows={rows} />

          <AiVerdict rows={rows} />

          <Alert tone="info">
            <p className="text-xs">
              {rows[0]?.asOf ? `${t.compare.dataAsOf} ${new Date(rows[0].asOf).toLocaleString()}. ` : ""}
              {t.compare.aiDisclaimer}
            </p>
          </Alert>
        </>
      ) : (
        <Card>
          <EmptyState icon="⚖️" title={t.compare.needTwo} />
        </Card>
      )}
    </div>
  );
}
