import { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { marketApi } from "../../api/market";
import { useLang } from "../../i18n/LanguageContext";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { SkeletonTable } from "../ui/Skeleton";

interface StockRow {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  momentum3mPct: number | null;
  aboveSMA50: boolean | null;
  score: number;
  signal: string;
}

interface SectorData {
  sector: string;
  index: string;
  indexTicker: string;
  stocks: StockRow[];
  total: number;
  price?: number;
  changePct?: number;
  aboveSMA50?: boolean | null;
  momentum3mPct?: number | null;
  unavailable?: boolean;
}

type SortKey = "symbol" | "price" | "changePct" | "momentum3mPct" | "score";
type SortDir = "asc" | "desc";

export default function SectorStocks() {
  const { t, lang } = useLang();
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await marketApi.sectorConstituents(lang);
      setSectors(data.sectors || []);
    } catch {
      setError(t.live.sectorFail || "Failed to load sector data.");
    } finally {
      setLoading(false);
    }
  }, [lang, t]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (sector: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(sector)) next.delete(sector);
      else next.add(sector);
      return next;
    });
  };

  const toggleAll = () => {
    if (expanded.size === sectors.length) {
      setExpanded(new Set());
    } else {
      setExpanded(new Set(sectors.map((s) => s.sector)));
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "symbol" ? "asc" : "desc");
    }
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " ▲" : " ▼";
  };

  const filteredSectors = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return sectors;
    return sectors.map((sec) => ({
      ...sec,
      stocks: sec.stocks.filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q)
      ),
    }));
  }, [sectors, search]);

  const sortedStocks = useCallback(
    (stocks: StockRow[]) => {
      const sorted = [...stocks];
      sorted.sort((a, b) => {
        let av: number | string, bv: number | string;
        switch (sortKey) {
          case "symbol":
            av = a.symbol;
            bv = b.symbol;
            return sortDir === "asc"
              ? (av as string).localeCompare(bv as string)
              : (bv as string).localeCompare(av as string);
          case "price":
            av = a.price ?? 0;
            bv = b.price ?? 0;
            break;
          case "changePct":
            av = a.changePct ?? 0;
            bv = b.changePct ?? 0;
            break;
          case "momentum3mPct":
            av = a.momentum3mPct ?? -999;
            bv = b.momentum3mPct ?? -999;
            break;
          case "score":
          default:
            av = a.score ?? 0;
            bv = b.score ?? 0;
            break;
        }
        return sortDir === "asc"
          ? (av as number) - (bv as number)
          : (bv as number) - (av as number);
      });
      return sorted;
    },
    [sortKey, sortDir]
  );

  const fmtPct = (v: number | null | undefined) => {
    if (v === null || v === undefined) return "—";
    const n = Number(v);
    if (!Number.isFinite(n)) return "—";
    return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
  };

  const fmtPrice = (v: number | null | undefined) => {
    if (v === null || v === undefined) return "—";
    return v.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  };

  if (loading && !sectors.length) {
    return (
      <Card title={t.live.regime}>
        <SkeletonTable rows={6} />
      </Card>
    );
  }

  if (error && !sectors.length) {
    return (
      <Card title={t.live.regime}>
        <div className="p-4 text-center text-sm text-rose-600 dark:text-rose-400">
          {error}
          <button onClick={load} className="ml-2 underline font-semibold">
            {t.common.retry}
          </button>
        </div>
      </Card>
    );
  }

  const totalStocks = sectors.reduce((a, s) => a + s.stocks.length, 0);

  return (
    <Card
      title={t.live.regime}
      subtitle={`${totalStocks} stocks across ${sectors.length} sectors`}
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAll}
            className="text-xs px-2.5 py-1.5 border border-slate-200/90 dark:border-slate-800/80 rounded-lg bg-white dark:bg-[#0e1626] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 font-medium transition-all"
          >
            {expanded.size === sectors.length ? t.live.collapseAll : t.live.expandAll}
          </button>
        </div>
      }
    >
      {/* Search */}
      <div className="mb-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.live.searchStocks}
          className="w-full border border-slate-200/90 dark:border-slate-800/80 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-[#0e1626] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
      </div>

      {/* Sectors */}
      <div className="space-y-2">
        {filteredSectors.map((sec) => {
          const isExpanded = expanded.has(sec.sector);
          const stocksToShow = isExpanded ? sortedStocks(sec.stocks) : [];
          const advCount = sec.stocks.filter((s) => s.changePct > 0).length;
          const decCount = sec.stocks.filter((s) => s.changePct < 0).length;

          return (
            <div
              key={sec.sector}
              className="border border-slate-200/80 dark:border-slate-800/80 rounded-xl overflow-hidden transition-all"
            >
              {/* Sector Header */}
              <button
                onClick={() => toggle(sec.sector)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50/70 dark:bg-slate-900/30 hover:bg-slate-100/70 dark:hover:bg-slate-800/40 transition-colors text-left"
              >
                <span
                  className={`text-slate-400 transition-transform text-xs ${isExpanded ? "rotate-90" : ""}`}
                >
                  ▶
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                      {sec.sector}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {sec.index}
                    </span>
                    <Badge tone="neutral" className="text-[10px]">
                      {sec.stocks.length} {t.live.stocksCount?.replace("{n}", "") || "stocks"}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs si-numeric">
                  {/* Sector index 3M */}
                  {sec.momentum3mPct !== null && sec.momentum3mPct !== undefined && (
                    <span
                      className={
                        sec.momentum3mPct >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }
                    >
                      {fmtPct(sec.momentum3mPct)}
                    </span>
                  )}
                  {/* Sector index trend */}
                  {sec.aboveSMA50 !== null && sec.aboveSMA50 !== undefined && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        sec.aboveSMA50
                          ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
                          : "text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60"
                      }`}
                    >
                      {sec.aboveSMA50 ? "▲" : "▼"}
                    </span>
                  )}
                  {/* Advance/Decline mini indicator */}
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {advCount}
                  </span>
                  <span className="text-rose-600 dark:text-rose-400">
                    {decCount}
                  </span>
                </div>
              </button>

              {/* Expanded Stock Table */}
              {isExpanded && (
                <div className="overflow-x-auto">
                  {stocksToShow.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                      {t.gen.dataUnavailable}
                    </div>
                  ) : (
                    <table className="w-full text-xs sm:text-[13px] border-collapse min-w-[640px]">
                      <thead>
                        <tr className="text-left text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200/90 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/20">
                          <th
                            className="py-2 px-4 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                            onClick={() => handleSort("symbol")}
                          >
                            {t.live.thSymbol}{sortIcon("symbol")}
                          </th>
                          <th className="py-2 px-3 hidden sm:table-cell">
                            {t.live.thCompany}
                          </th>
                          <th
                            className="py-2 px-3 text-right cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                            onClick={() => handleSort("price")}
                          >
                            {t.live.thPrice}{sortIcon("price")}
                          </th>
                          <th
                            className="py-2 px-3 text-right cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                            onClick={() => handleSort("changePct")}
                          >
                            {t.live.thChange}{sortIcon("changePct")}
                          </th>
                          <th
                            className="py-2 px-3 text-right cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                            onClick={() => handleSort("momentum3mPct")}
                          >
                            {t.live.thReturn3m}{sortIcon("momentum3mPct")}
                          </th>
                          <th className="py-2 px-3 text-center">
                            {t.live.thSmaTrend}
                          </th>
                          <th
                            className="py-2 px-3 text-right cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                            onClick={() => handleSort("score")}
                          >
                            {t.live.thScore}{sortIcon("score")}
                          </th>
                          <th className="py-2 px-3 text-center">
                            {t.live.thSignal}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                        {stocksToShow.map((s) => (
                          <tr
                            key={s.symbol}
                            className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors"
                          >
                            <td className="py-2 px-4">
                              <Link
                                to={`/stocks/${s.symbol}`}
                                className="font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              >
                                {s.symbol}
                              </Link>
                            </td>
                            <td className="py-2 px-3 text-slate-500 dark:text-slate-400 truncate max-w-[160px] hidden sm:table-cell">
                              {s.name}
                            </td>
                            <td className="py-2 px-3 text-right font-medium si-numeric">
                              ₹{fmtPrice(s.price)}
                            </td>
                            <td className="py-2 px-3 text-right font-medium si-numeric">
                              <span
                                className={
                                  s.changePct >= 0
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-rose-600 dark:text-rose-400"
                                }
                              >
                                {fmtPct(s.changePct)}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-medium si-numeric">
                              <span
                                className={
                                  (s.momentum3mPct ?? 0) >= 0
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-rose-600 dark:text-rose-400"
                                }
                              >
                                {fmtPct(s.momentum3mPct)}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center">
                              {s.aboveSMA50 === null || s.aboveSMA50 === undefined ? (
                                "—"
                              ) : s.aboveSMA50 ? (
                                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-full">
                                  ▲
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 px-2 py-0.5 rounded-full">
                                  ▼
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right font-medium si-numeric">
                              {s.score}/100
                            </td>
                            <td className="py-2 px-3 text-center">
                              <SignalBadge signal={s.signal} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function SignalBadge({ signal }: { signal: string }) {
  const s = (signal || "").toUpperCase();
  if (s === "BUY")
    return (
      <Badge tone="positive" className="text-[10px]">
        {signal}
      </Badge>
    );
  if (s === "SELL")
    return (
      <Badge tone="negative" className="text-[10px]">
        {signal}
      </Badge>
    );
  return (
    <Badge tone="warning" className="text-[10px]">
      {signal}
    </Badge>
  );
}
