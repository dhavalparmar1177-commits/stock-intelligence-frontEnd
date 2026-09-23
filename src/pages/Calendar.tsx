import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { marketApi } from "../api/market";
import { useLang } from "../i18n/LanguageContext";
import { Alert } from "../components/ui/Alert";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { SkeletonText } from "../components/ui/Skeleton";
import { PageHeader } from "../components/layout/primitives";
import SourceTag from "../components/stock/SourceTag";

type Range = "today" | "week" | "upcoming";
type TypeFilter = "all" | "results" | "dividends" | "ipos" | "bonus-split" | "corporate" | "economic" | "milestones" | "projections";

const DAY = 24 * 3600 * 1000;
const todayUTC = () => new Date().toISOString().slice(0, 10);

/**
 * Market calendar: dated events from the real calendar endpoint.
 * Earnings/dividends/IPOs/splits/economic have no free feed and
 * render "Data unavailable" with the backend contract — the filter
 * chips for them exist so the gap is explicit, not hidden.
 */
export default function Calendar() {
  const { t } = useLang();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [seq, setSeq] = useState(0);
  const [range, setRange] = useState<Range>("today");
  const [type, setType] = useState<TypeFilter>("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    marketApi
      .calendar()
      .then((r) => alive && setData(r))
      .catch(() => alive && setError(t.gen.unableToLoad))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [seq]);

  const retry = () => setSeq((s) => s + 1);
  const events: any[] = data?.events || [];
  const unavailable: string[] = data?.unavailable || [];
  const today = todayUTC();
  const weekEnd = new Date(Date.now() + 7 * DAY).toISOString().slice(0, 10);

  const kindOf = (e: any): string => {
    if (e.kind === "projection") return "projections";
    if (e.kind === "milestone-high" || e.kind === "milestone-low") return "milestones";
    return e.kind;
  };

  const filtered = useMemo(() => {
    const query = q.trim().toUpperCase();
    return events.filter((e: any) => {
      if (range === "today" && e.date !== today) return false;
      if (range === "week" && (e.date < today || e.date > weekEnd)) return false;
      if (range === "upcoming" && e.date < today) return false;
      if (type !== "all" && kindOf(e) !== type) return false;
      if (query && !(String(e.symbol || "").toUpperCase().includes(query) || String(e.title || "").toUpperCase().includes(query))) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, range, type, q]);

  const typeLabel = (k: TypeFilter): string => {
    switch (k) {
      case "all": return t.cal.allTypes;
      case "results": return t.cal.tResults;
      case "dividends": return t.cal.tDividends;
      case "ipos": return t.cal.tIPOs;
      case "bonus-split": return t.cal.tBonusSplit;
      case "corporate": return t.cal.tCorporate;
      case "economic": return t.cal.tEconomic;
      case "milestones": return t.cal.tMilestones;
      default: return t.cal.tProjections;
    }
  };

  const unfedSelected = type !== "all" && type !== "milestones" && type !== "projections";
  const typeChips: TypeFilter[] = ["all", "results", "dividends", "ipos", "bonus-split", "corporate", "economic", "milestones", "projections"];

  return (
    <div className="space-y-4">
      <PageHeader
        title={t.cal.title}
        description={`${t.cal.subtitle}${data?.asOf ? ` · ${new Date(data.asOf).toLocaleString()}` : ""}`}
        actions={
          <button
            onClick={retry}
            className="text-sm px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
          >
            ↻ {t.common.refreshNow}
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-800" role="group" aria-label="Range">
          {(["today", "week", "upcoming"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              aria-pressed={range === r}
              className={`flex-1 sm:flex-initial text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                range === r
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {r === "today" ? t.cal.today : r === "week" ? t.cal.week : t.cal.upcoming}
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.cal.searchPh}
          aria-label={t.cal.searchPh}
          className="flex-1 min-w-[160px] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-1.5 text-xs bg-white dark:bg-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-1.5 flex-wrap" role="group" aria-label="Event type">
        {typeChips.map((k) => (
          <button
            key={k}
            onClick={() => setType(k)}
            aria-pressed={type === k}
            className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
              type === k
                ? "bg-blue-600 text-white border-blue-600 font-bold shadow-sm"
                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
            }`}
          >
            {typeLabel(k)}
          </button>
        ))}
      </div>

      {loading ? (
        <Card title={t.cal.title}>
          <SkeletonText lines={5} />
        </Card>
      ) : error && !events.length ? (
        <ErrorState title={error} onRetry={retry} retryLabel={t.common.retry} />
      ) : unfedSelected ? (
        <Card title={typeLabel(type)}>
          <EmptyState
            icon="📅"
            title={t.cal.unavailable}
            description={data?.contract || ""}
          />
        </Card>
      ) : filtered.length ? (
        <div className="space-y-2">
          {filtered.map((e: any, i: number) => {
            const isToday = e.date === today;
            return (
              <div
                key={`${e.date}-${e.symbol || ""}-${e.kind}-${i}`}
                className={`bg-white dark:bg-slate-900 border rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm transition-all ${
                  isToday
                    ? "border-blue-500/40 bg-blue-50/20 dark:bg-blue-950/10"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-center min-w-[56px] shrink-0 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/60">
                    <p className="text-base font-bold si-numeric text-slate-900 dark:text-slate-100">{e.date.slice(8, 10)}</p>
                    <p className="text-[10px] text-slate-500">{e.date.slice(0, 7)}</p>
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <div className="flex gap-1.5 items-center flex-wrap">
                      <Link to={`/stocks/${e.symbol}`} className="font-extrabold text-blue-600 dark:text-blue-400 hover:underline">
                        {e.symbol}
                      </Link>
                      <Badge tone={e.kind === "milestone-low" ? "negative" : e.kind === "milestone-high" ? "positive" : "ai"}>
                        {e.kind === "projection" ? t.cal.tProjections : t.cal.tMilestones}
                      </Badge>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{e.title}</p>
                    {e.detail && <p className="text-[11px] text-slate-500 si-numeric">{e.detail}</p>}
                    <p className="text-[10px] text-slate-400 mt-1">
                      {t.cal.source}: {e.source === "forecast-store" ? t.cal.aiForecastStore : t.cal.liveQuotes} ·{" "}
                      {t.cal.observed}: {e.observedAt ? new Date(e.observedAt).toLocaleString() : "—"}
                    </p>
                  </div>
                </div>

                <div className="self-end sm:self-center shrink-0">
                  <Link
                    to={`/stocks/${e.symbol}`}
                    className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold transition-colors"
                  >
                    View →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <EmptyState icon="📅" title={t.cal.noEvents} />
        </Card>
      )}

      {data && unavailable.length > 0 && !unfedSelected && (
        <Alert tone="info">
          <p className="text-xs">
            {t.cal.unavailable}: {unavailable.join(", ")} — {data.contract}
          </p>
        </Alert>
      )}
    </div>
  );
}
