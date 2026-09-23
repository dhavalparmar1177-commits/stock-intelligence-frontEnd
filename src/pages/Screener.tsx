import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { marketApi } from "../api/market";
import { useLang } from "../i18n/LanguageContext";
import { useWatchlist } from "../hooks/useWatchlist";
import { Alert } from "../components/ui/Alert";
import { Badge, AIScoreBadge, RiskBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Input } from "../components/ui/Input";
import { SkeletonTable } from "../components/ui/Skeleton";
import { Table, Column } from "../components/ui/Table";
import { PageHeader } from "../components/layout/primitives";
import { useScreenerUniverse, enrichAiResults, ScreenRow } from "../components/screener/useScreenerUniverse";
import CompareTray from "../components/screener/CompareTray";

interface Filters {
  search: string;
  minPrice: string;
  maxPrice: string;
  minVolume: string;
  unusualOnly: boolean;
  minRSI: string;
  maxRSI: string;
  minScore: string;
  risks: string[];
  minGrowth: string;
}

const EMPTY_FILTERS: Filters = {
  search: "", minPrice: "", maxPrice: "", minVolume: "", unusualOnly: false,
  minRSI: "", maxRSI: "", minScore: "", risks: [], minGrowth: "",
};

type SortKey = "symbol" | "price" | "growth" | "score" | "rsi" | "volume";

interface SavedScreen {
  name: string;
  filters: Filters;
  sortKey: SortKey;
  sortDir: 1 | -1;
}

const SCREENS_KEY = "si-screens";

function readScreens(): SavedScreen[] {
  try {
    const raw = localStorage.getItem(SCREENS_KEY);
    const parsed: unknown = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? (parsed as SavedScreen[]).filter((s) => s && typeof s.name === "string") : [];
  } catch {
    return [];
  }
}

function toNum(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function applyFilters(rows: ScreenRow[], f: Filters): ScreenRow[] {
  const q = f.search.trim().toUpperCase();
  const minP = toNum(f.minPrice);
  const maxP = toNum(f.maxPrice);
  const minV = toNum(f.minVolume);
  const minR = toNum(f.minRSI);
  const maxR = toNum(f.maxRSI);
  const minS = toNum(f.minScore);
  const minG = toNum(f.minGrowth);
  return rows.filter((r) => {
    if (q && !(r.symbol.includes(q) || (r.name || "").toUpperCase().includes(q))) return false;
    if (minP != null && (r.price == null || r.price < minP)) return false;
    if (maxP != null && (r.price == null || r.price > maxP)) return false;
    if (minV != null && (r.volume == null || r.volume < minV)) return false;
    if (f.unusualOnly && !(r.volumeRatio != null && r.volumeRatio >= 1.5)) return false;
    if (minR != null && (r.rsi14 == null || r.rsi14 < minR)) return false;
    if (maxR != null && (r.rsi14 == null || r.rsi14 > maxR)) return false;
    if (minS != null && (r.score == null || r.score < minS)) return false;
    if (f.risks.length && (r.riskLevel == null || !f.risks.includes(r.riskLevel))) return false;
    if (minG != null && (r.momentum3mPct == null || r.momentum3mPct < minG)) return false;
    return true;
  });
}

function sortRows(rows: ScreenRow[], key: SortKey, dir: 1 | -1): ScreenRow[] {
  const val = (r: ScreenRow): number | string | null => {
    switch (key) {
      case "symbol": return r.symbol;
      case "price": return r.price ?? null;
      case "growth": return r.momentum3mPct ?? null;
      case "score": return r.score ?? null;
      case "rsi": return r.rsi14 ?? null;
      case "volume": return r.volume ?? null;
    }
  };
  return [...rows].sort((a, b) => {
    const va = val(a);
    const vb = val(b);
    if (va == null && vb == null) return 0;
    if (va == null) return 1; // nulls last, both directions
    if (vb == null) return -1;
    if (typeof va === "string") return dir * va.localeCompare(String(vb));
    return dir * ((va as number) - (vb as number));
  });
}

/**
 * Professional screener (Phase 4): live universe, instant
 * client-side filters/sort, NL AI screening with pre-apply
 * interpretation, selection + inline compare, local saved screens.
 * Fundamental columns render N/A — the free feed doesn't publish them.
 */
export default function Screener() {
  const { t, lang } = useLang();
  const { rows, loading, error, asOf, refresh } = useScreenerUniverse(lang);
  const { add, remove, has } = useWatchlist();

  const [f, setF] = useState<Filters>(EMPTY_FILTERS);
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  const [selected, setSelected] = useState<string[]>([]);

  // AI screening state
  const [nlq, setNlq] = useState("");
  const [screening, setScreening] = useState(false);
  const [screenErr, setScreenErr] = useState("");
  const [interp, setInterp] = useState<any>(null);
  const [aiRows, setAiRows] = useState<ScreenRow[] | null>(null);
  const [enriching, setEnriching] = useState(false);

  // Inline compare state (data lives in CompareTray)
  const [showTray, setShowTray] = useState(false);

  // Saved screens (local only — backend has no persistence)
  const [screens, setScreens] = useState<SavedScreen[]>(readScreens);
  const [screenName, setScreenName] = useState("");

  const active: ScreenRow[] = aiRows ?? rows;
  const riskValues = useMemo(
    () => [...new Set(active.map((r) => r.riskLevel).filter((v): v is string => !!v))],
    [active]
  );
  const filtered = useMemo(() => sortRows(applyFilters(active, f), sortKey, sortDir), [active, f, sortKey, sortDir]);
  const maxScore = useMemo(() => Math.max(0, ...filtered.map((r) => r.score ?? 0)), [filtered]);

  const set = (patch: Partial<Filters>) => setF((p) => ({ ...p, ...patch }));
  const toggleRisk = (v: string) =>
    set({ risks: f.risks.includes(v) ? f.risks.filter((x) => x !== v) : [...f.risks, v] });
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(key);
      setSortDir(key === "symbol" ? 1 : -1);
    }
  };
  const resetAll = () => {
    setF(EMPTY_FILTERS);
    setSortKey("score");
    setSortDir(-1);
    setSelected([]);
    setShowTray(false);
    setAiRows(null);
    setInterp(null);
    setScreenErr("");
  };

  const toggleSelect = (sym: string) => {
    setShowTray(false);
    setSelected((p) => (p.includes(sym) ? p.filter((s) => s !== sym) : p.length >= 5 ? p : [...p, sym]));
  };

  const runAi = async () => {
    const query = nlq.trim();
    if (!query || screening) return;
    setScreening(true);
    setScreenErr("");
    setInterp(null);
    try {
      const r = await marketApi.indiaScreen(query, lang);
      setInterp(r); // interpretation shown BEFORE anything is applied
    } catch (e: any) {
      setScreenErr(e.response?.data?.error || t.screen.loadFail);
    } finally {
      setScreening(false);
    }
  };

  const applyAi = async () => {
    if (!interp?.results?.length || enriching) return;
    setEnriching(true);
    try {
      const enriched = await enrichAiResults(interp.results);
      setAiRows(enriched);
      setSelected([]);
      setShowTray(false);
    } finally {
      setEnriching(false);
    }
  };

  const saveScreen = () => {
    const name = screenName.trim();
    if (!name) return;
    const next = [...screens.filter((s) => s.name !== name), { name, filters: f, sortKey, sortDir }].slice(0, 20);
    setScreens(next);
    try {
      localStorage.setItem(SCREENS_KEY, JSON.stringify(next));
    } catch {
      /* private mode */
    }
    setScreenName("");
  };

  const loadScreen = (s: SavedScreen) => {
    setF(s.filters);
    setSortKey(s.sortKey);
    setSortDir(s.sortDir);
  };

  const deleteScreen = (name: string) => {
    const next = screens.filter((s) => s.name !== name);
    setScreens(next);
    try {
      localStorage.setItem(SCREENS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const th = (key: SortKey, label: string) => (
    <button
      onClick={() => toggleSort(key)}
      aria-label={`Sort by ${label} ${sortKey === key ? (sortDir === 1 ? "ascending" : "descending") : ""}`}
      className="font-medium hover:text-slate-800 dark:hover:text-slate-200"
    >
      {label} {sortKey === key ? (sortDir === 1 ? "▲" : "▼") : ""}
    </button>
  );

  const columns: Column<ScreenRow & { id?: unknown }>[] = [
    {
      key: "sel",
      header: <span className="sr-only">Select</span>,
      cell: (r) => (
        <input
          type="checkbox"
          checked={selected.includes(r.symbol)}
          disabled={!selected.includes(r.symbol) && selected.length >= 5}
          onChange={() => toggleSelect(r.symbol)}
          aria-label={`Select ${r.symbol} for comparison`}
        />
      ),
    },
    {
      key: "stock",
      header: th("symbol", t.screen.cStock),
      cell: (r) => (
        <span>
          <Link to={`/stocks/${r.symbol}`} className="text-blue-700 dark:text-blue-400 hover:underline font-semibold">
            {r.symbol}
          </Link>{" "}
          <button
            onClick={() => (has(r.symbol) ? remove(r.symbol) : add(r.symbol))}
            aria-pressed={has(r.symbol)}
            aria-label={has(r.symbol) ? `${t.stock.watchAdded} ${r.symbol}` : `${t.stock.watchAdd} ${r.symbol}`}
            title={has(r.symbol) ? t.stock.watchAdded : t.stock.watchAdd}
            className="text-xs"
          >
            {has(r.symbol) ? "★" : "☆"}
          </button>
          <br />
          <span className="text-xs text-slate-500">{r.name || t.gen.dataUnavailable}</span>
        </span>
      ),
    },
    {
      key: "price",
      header: th("price", t.screen.cPrice),
      numeric: true,
      cell: (r) => (
        <span className="si-numeric">
          {r.price != null ? Number(r.price).toLocaleString("en-IN") : t.gen.na}
          {r.changePct != null && (
            <span className={`block text-xs ${r.changePct >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
              {r.changePct >= 0 ? "+" : ""}{Number(r.changePct).toFixed(2)}%
            </span>
          )}
        </span>
      ),
    },
    { key: "mcap", header: t.screen.cMCap, numeric: true, cell: () => <span className="text-slate-400">{t.gen.na}</span> },
    { key: "pe", header: t.screen.cPE, numeric: true, cell: () => <span className="text-slate-400">{t.gen.na}</span> },
    { key: "roe", header: t.screen.cROE, numeric: true, cell: () => <span className="text-slate-400">{t.gen.na}</span> },
    { key: "roce", header: t.screen.cROCE, numeric: true, cell: () => <span className="text-slate-400">{t.gen.na}</span> },
    {
      key: "growth",
      header: th("growth", t.screen.cGrowth),
      numeric: true,
      cell: (r) => (
        <span className={`si-numeric ${r.momentum3mPct == null ? "text-slate-400" : r.momentum3mPct >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
          {r.momentum3mPct != null ? `${r.momentum3mPct >= 0 ? "+" : ""}${r.momentum3mPct}%` : t.gen.na}
        </span>
      ),
    },
    { key: "debt", header: t.screen.cDebt, numeric: true, cell: () => <span className="text-slate-400">{t.gen.na}</span> },
    {
      key: "score",
      header: th("score", t.screen.cScore),
      numeric: true,
      cell: (r) =>
        r.score != null ? (
          <span className={`si-numeric font-semibold ${r.score === maxScore && maxScore > 0 ? "text-violet-700 dark:text-violet-300" : ""}`}>
            {r.score}/100
          </span>
        ) : (
          <span className="text-slate-400">{t.gen.na}</span>
        ),
    },
    {
      key: "risk",
      header: t.screen.cRisk,
      cell: (r) => <RiskBadge level={r.riskLevel || undefined} />,
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title={t.screen.title}
        description={t.screen.liveBadge}
        actions={
          <button
            onClick={() => {
              resetAll();
              refresh();
            }}
            className="text-sm px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
          >
            ↻ {t.common.refreshNow}
          </button>
        }
      />
      {asOf && <p className="text-xs text-slate-500 -mt-2">{t.dash.lastUpdated} {new Date(asOf).toLocaleString()}</p>}

      {/* AI screening */}
      <Card title={t.screen.aiBtn} accent="ai">
        <div className="flex gap-2">
          <input
            value={nlq}
            onChange={(e) => setNlq(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runAi()}
            placeholder={t.screen.aiPh}
            aria-label={t.screen.aiPh}
            className="flex-1 min-w-0 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 placeholder:text-slate-400"
          />
          <Button variant="ai" size="md" onClick={runAi} disabled={screening || !nlq.trim()} loading={screening}>
            {t.screen.aiBtn}
          </Button>
        </div>
        {screening && <p className="text-sm text-slate-500 mt-2">{t.screen.aiSearching}</p>}
        {screenErr && (
          <p role="alert" className="text-sm text-red-600 mt-2">
            {screenErr}{" "}
            <button onClick={runAi} className="underline font-medium">
              {t.common.retry}
            </button>
          </p>
        )}
        {interp && (
          <div className="mt-2 border border-violet-200 dark:border-violet-800 rounded-xl p-3 bg-violet-50/50 dark:bg-violet-950/20">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
              {t.screen.aiInterpret}
            </p>
            <div className="flex gap-1.5 flex-wrap mt-1.5">
              <Badge tone="ai">preset: {interp.preset || "—"}</Badge>
              {interp.sector && <Badge tone="info">sector: {interp.sector}</Badge>}
              <Badge tone="neutral">
                {interp.matched ?? "?"} {t.screen.aiMatched} {t.screen.aiOf} {interp.scanned ?? "?"} {t.screen.aiScanned}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">“{interp.query}”</p>
            <div className="flex gap-2 mt-2">
              <Button variant="ai" size="sm" onClick={applyAi} disabled={enriching || !interp.results?.length} loading={enriching}>
                {t.screen.aiApply} ({interp.results?.length ?? 0})
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setInterp(null)}>
                {t.screen.aiDismiss}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Filters */}
      <Card title={t.screen.title}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Input label={t.screen.fSearch} value={f.search} onChange={(e) => set({ search: e.target.value })} placeholder="RELIANCE…" />
          <Input label={t.screen.fMinPrice} type="number" inputMode="decimal" value={f.minPrice} onChange={(e) => set({ minPrice: e.target.value })} />
          <Input label={t.screen.fMaxPrice} type="number" inputMode="decimal" value={f.maxPrice} onChange={(e) => set({ maxPrice: e.target.value })} />
          <Input label={t.screen.fMinVolume} type="number" inputMode="numeric" value={f.minVolume} onChange={(e) => set({ minVolume: e.target.value })} />
          <Input label={t.screen.fMinRSI} type="number" inputMode="decimal" value={f.minRSI} onChange={(e) => set({ minRSI: e.target.value })} />
          <Input label={t.screen.fMaxRSI} type="number" inputMode="decimal" value={f.maxRSI} onChange={(e) => set({ maxRSI: e.target.value })} />
          <Input label={t.screen.fMinScore} type="number" inputMode="numeric" value={f.minScore} onChange={(e) => set({ minScore: e.target.value })} />
          <Input label={t.screen.fMinGrowth} type="number" inputMode="decimal" value={f.minGrowth} onChange={(e) => set({ minGrowth: e.target.value })} />
        </div>
        <div className="flex gap-3 flex-wrap mt-2 items-center">
          <label className="flex items-center gap-1.5 text-sm">
            <input type="checkbox" checked={f.unusualOnly} onChange={(e) => set({ unusualOnly: e.target.checked })} />
            {t.screen.fUnusual}
          </label>
          {riskValues.length > 0 && (
            <span className="flex items-center gap-1.5 text-sm" role="group" aria-label={t.screen.fRisk}>
              {t.screen.fRisk}:
              {riskValues.map((v) => (
                <label key={v} className="flex items-center gap-1 text-sm font-normal">
                  <input type="checkbox" checked={f.risks.includes(v)} onChange={() => toggleRisk(v)} />
                  {v}
                </label>
              ))}
            </span>
          )}
          <button onClick={resetAll} className="ml-auto text-sm px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg">
            {t.screen.reset}
          </button>
        </div>
        <details className="mt-2 text-sm">
          <summary className="cursor-pointer text-slate-500">
            Fundamental filters · {t.screen.fNA}
          </summary>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 opacity-60">
            {[t.compare.mCap, t.compare.mPE, t.compare.mROE, t.compare.mROCE, t.compare.mRevenueGrowth, t.compare.mProfitGrowth, t.compare.mDebtEquity, t.compare.mDivYield, t.compare.mEPS, t.compare.mSector].map((k) => (
              <Input key={k} label={k} value="" disabled placeholder={t.screen.fNA} />
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-1">{t.screen.naFundNote}</p>
        </details>
        <p className="text-xs text-slate-400 mt-2">{t.screen.instantNote}</p>
      </Card>

      {/* Results */}
      <Card
        title={`${t.screen.cStock} · ${filtered.length}`}
        action={
          aiRows ? (
            <button
              onClick={() => {
                setAiRows(null);
                setInterp(null);
              }}
              className="text-xs px-2.5 py-1 rounded-md border border-violet-300 dark:border-violet-800 text-violet-700 dark:text-violet-300"
            >
              ✕ AI · {t.screen.reset}
            </button>
          ) : undefined
        }
      >
        {loading ? (
          <SkeletonTable rows={8} />
        ) : error && !rows.length ? (
          <ErrorState title={error} onRetry={refresh} retryLabel={t.common.retry} />
        ) : filtered.length ? (
          <Table
            caption={t.screen.screenerResults}
            minWidth={900}
            columns={columns}
            rows={filtered.map((r) => ({ ...r, id: r.symbol }))}
          />
        ) : (
          <EmptyState icon="🔍" title={t.screen.noMatch} />
        )}
        <p className="text-xs text-slate-400 mt-2">{t.screen.naFundNote}</p>
      </Card>

      {/* Selection + compare */}
      <Card title={`${t.screen.selTitle} (${selected.length}/5)`}>
        {selected.length === 0 ? (
          <p className="text-sm text-slate-500">{t.screen.selHint}</p>
        ) : (
          <div className="flex gap-1.5 flex-wrap items-center">
            {selected.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 font-semibold">
                {s}
                <button onClick={() => toggleSelect(s)} aria-label={`Remove ${s} from selection`} className="text-slate-400 hover:text-red-600">✕</button>
              </span>
            ))}
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowTray(true)}
              disabled={selected.length < 2}
              className="ml-auto"
            >
              {t.screen.selCompare} ({selected.length})
            </Button>
          </div>
        )}
        {showTray && selected.length >= 2 && (
          <div className="mt-3">
            <p className="font-semibold text-sm mb-1">{t.screen.cmpTitle}</p>
            <CompareTray key={selected.join(",")} symbols={selected} />
          </div>
        )}
      </Card>

      {/* Saved screens */}
      <Card title={t.screen.savedTitle}>
        <div className="flex gap-2">
          <input
            value={screenName}
            onChange={(e) => setScreenName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveScreen()}
            placeholder={t.screen.savePh}
            aria-label={t.screen.savePh}
            className="flex-1 min-w-0 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-slate-900 placeholder:text-slate-400"
          />
          <Button variant="secondary" size="sm" onClick={saveScreen} disabled={!screenName.trim()}>
            {t.screen.saveBtn}
          </Button>
        </div>
        {screens.length ? (
          <ul className="mt-2 space-y-1">
            {screens.map((s) => (
              <li key={s.name} className="flex items-center gap-2 text-sm border-b border-slate-100 dark:border-slate-800 pb-1 last:border-0">
                <span className="font-medium flex-1 truncate">{s.name}</span>
                <button onClick={() => loadScreen(s)} className="text-xs px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700">
                  {t.screen.savedUse}
                </button>
                <button onClick={() => deleteScreen(s.name)} aria-label={`${t.screen.savedDelete} ${s.name}`} className="text-xs px-2 py-1 text-slate-400 hover:text-red-600">
                  ✕
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500 mt-2">{t.screen.savedEmpty}</p>
        )}
        <Alert tone="info" className="mt-2">
          <p className="text-xs">{t.screen.backendNote}</p>
        </Alert>
      </Card>
    </div>
  );
}
