import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { marketApi } from "../api/market";
import { useLang } from "../i18n/LanguageContext";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { SkeletonCard } from "../components/ui/Skeleton";
import { PageHeader } from "../components/layout/primitives";
import IpoCompareModal from "../components/ipo/IpoCompareModal";
import IpoAlertModal from "../components/ipo/IpoAlertModal";
import IpoFaq, { FaqItem } from "../components/ipo/IpoFaq";

type Tab = "open" | "upcoming" | "closed" | "listed" | "calendar" | "faq";
type SegmentFilter = "all" | "Mainboard" | "SME";
type SubFilter = "all" | "covered" | "high" | "mega";
type SortOption = "date" | "sub" | "size" | "score" | "gmp";

export default function Ipos() {
  const { t } = useLang();
  const [data, setData] = useState<any>(null);
  const [ai, setAi] = useState<any[]>([]);
  const [calEvents, setCalEvents] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [seq, setSeq] = useState(0);

  // Filters & State
  const [tab, setTab] = useState<Tab>("open");
  const [q, setQ] = useState("");
  const [segment, setSegment] = useState<SegmentFilter>("all");
  const [subFilter, setSubFilter] = useState<SubFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [selected, setSelected] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [alertTarget, setAlertTarget] = useState<any | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");

    Promise.all([
      marketApi.ipos().catch(() => null),
      marketApi.ipoAiAll().catch(() => null),
      marketApi.ipoCalendar().catch(() => null),
      marketApi.ipoFaq().catch(() => null),
    ])
      .then(([l, a, c, f]) => {
        if (!alive) return;
        setData(l);
        setAi(a?.ranked || []);
        setCalEvents(c?.events || []);
        if (f?.faqs) setFaqs(f.faqs);
        if (!l) setError(t.gen.unableToLoad);
      })
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [seq]);

  const retry = () => setSeq((s) => s + 1);

  const ipos: any[] = data?.ipos || [];
  const query = q.trim().toUpperCase();
  const aiBySym = useMemo(
    () => new Map((ai || []).map((a: any) => [String(a.symbol || "").toUpperCase(), a])),
    [ai]
  );

  const toggleSelect = (sym: string) =>
    setSelected((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : prev.length >= 4 ? prev : [...prev, sym]
    );

  const filtered = useMemo(() => {
    if (tab === "calendar" || tab === "faq") return [];
    const list = ipos.filter((i: any) => {
      // Tab status check
      if (i.status !== tab) return false;

      // Segment check
      if (segment !== "all" && i.segment !== segment) return false;

      // Subscription check
      if (subFilter === "covered" && (i.subscription == null || i.subscription < 1)) return false;
      if (subFilter === "high" && (i.subscription == null || i.subscription < 5)) return false;
      if (subFilter === "mega" && (i.subscription == null || i.subscription < 20)) return false;

      // Text search check
      if (query) {
        const text = `${i.symbol} ${i.company} ${i.registrar?.name || ""}`.toUpperCase();
        if (!text.includes(query)) return false;
      }
      return true;
    });

    // Sorting
    return list.sort((a, b) => {
      if (sortBy === "sub") {
        return (b.subscription || 0) - (a.subscription || 0);
      }
      if (sortBy === "size") {
        return (b.issueSizeInrCr || 0) - (a.issueSizeInrCr || 0);
      }
      if (sortBy === "score") {
        const scoreA = aiBySym.get(a.symbol)?.score || 0;
        const scoreB = aiBySym.get(b.symbol)?.score || 0;
        return scoreB - scoreA;
      }
      if (sortBy === "gmp") {
        return (b.gmp?.premiumPct || 0) - (a.gmp?.premiumPct || 0);
      }
      // Default: date
      return (b.openDate || "").localeCompare(a.openDate || "");
    });
  }, [ipos, tab, segment, subFilter, sortBy, query, aiBySym]);

  const counts = useMemo(() => {
    return {
      open: ipos.filter((x) => x.status === "open").length,
      upcoming: ipos.filter((x) => x.status === "upcoming").length,
      closed: ipos.filter((x) => x.status === "closed").length,
      listed: ipos.filter((x) => x.status === "listed").length,
    };
  }, [ipos]);

  const topSubscribed = useMemo(() => {
    const withSub = ipos.filter((x) => typeof x.subscription === "number" && x.subscription > 0);
    if (!withSub.length) return null;
    return withSub.reduce((max, x) => (x.subscription > max.subscription ? x : max), withSub[0]);
  }, [ipos]);

  const selectedIpoObjects = useMemo(() => {
    return selected
      .map((sym) => {
        const item = ipos.find((i) => i.symbol === sym);
        if (!item) return null;
        return { ...item, ai: aiBySym.get(sym) };
      })
      .filter(Boolean);
  }, [selected, ipos, aiBySym]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t.ipo.title}
        description={`${t.ipo.subtitle}${data?.asOf ? ` · ${new Date(data.asOf).toLocaleString("en-IN")}` : ""}`}
        actions={
          <div className="flex items-center gap-2">
            {selected.length >= 2 && (
              <button
                onClick={() => setCompareOpen(true)}
                className="text-sm px-3.5 py-1.5 font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <span>⚖️</span>
                <span>Compare ({selected.length})</span>
              </button>
            )}
            <button
              onClick={retry}
              className="text-sm px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              ↻ {t.common.refreshNow}
            </button>
          </div>
        }
      />

      {/* Quick Stats Banner */}
      {!loading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
            <p className="text-xs text-slate-500 font-medium">{t.ipo.statOpen}</p>
            <p className="text-2xl font-bold si-numeric text-blue-600 dark:text-blue-400 mt-1">
              {counts.open}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Bidding active on NSE</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
            <p className="text-xs text-slate-500 font-medium">{t.ipo.statUpcoming}</p>
            <p className="text-2xl font-bold si-numeric text-violet-600 dark:text-violet-400 mt-1">
              {counts.upcoming}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Scheduled to open soon</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
            <p className="text-xs text-slate-500 font-medium">Top Subscribed</p>
            <p className="text-2xl font-bold si-numeric text-green-600 dark:text-green-400 mt-1">
              {topSubscribed ? `${topSubscribed.subscription.toFixed(1)}×` : "—"}
            </p>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {topSubscribed ? topSubscribed.symbol : "No live bids yet"}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
            <p className="text-xs text-slate-500 font-medium">{t.ipo.listed}</p>
            <p className="text-2xl font-bold si-numeric text-slate-800 dark:text-slate-200 mt-1">
              {counts.listed}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">With live performance tracking</p>
          </div>
        </div>
      )}

      {/* Tabs & Filter Bar */}
      <div className="space-y-3">
        {/* Tab Buttons (Segmented Controller) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div
            className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto"
            role="group"
            aria-label="IPO views"
          >
            {(
              [
                { key: "open", label: t.ipo.open, count: counts.open },
                { key: "upcoming", label: t.ipo.upcoming, count: counts.upcoming },
                { key: "closed", label: t.ipo.closed, count: counts.closed },
                { key: "listed", label: t.ipo.listed, count: counts.listed },
                { key: "calendar", label: "📅 " + t.ipo.calendar, count: null },
                { key: "faq", label: "💡 " + t.ipo.faqTab, count: null },
              ] as const
            ).map((tabItem) => (
              <button
                key={tabItem.key}
                onClick={() => setTab(tabItem.key as Tab)}
                aria-pressed={tab === tabItem.key}
                className={`text-xs sm:text-sm px-3.5 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  tab === tabItem.key
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50"
                }`}
              >
                {tabItem.label} {tabItem.count != null && <span className="si-numeric">({tabItem.count})</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Multi-Filters, Sorting & Search Toolbar */}
        {tab !== "calendar" && tab !== "faq" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 flex flex-wrap lg:flex-nowrap gap-2 items-center justify-between shadow-sm">
            <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center flex-1 min-w-0">
              {/* Segment Toggle */}
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value as SegmentFilter)}
                aria-label="Filter by segment"
                className="text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Segments</option>
                <option value="Mainboard">Mainboard Only</option>
                <option value="SME">SME Only</option>
              </select>

              {/* Subscription Filter */}
              <select
                value={subFilter}
                onChange={(e) => setSubFilter(e.target.value as SubFilter)}
                aria-label="Filter by subscription"
                className="text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{t.ipo.subAll}</option>
                <option value="covered">{t.ipo.subCovered}</option>
                <option value="high">{t.ipo.subHigh}</option>
                <option value="mega">{t.ipo.subMega}</option>
              </select>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Sort IPOs"
                className="text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Sort: {t.ipo.sortDate}</option>
                <option value="sub">Sort: {t.ipo.sortSub}</option>
                <option value="size">Sort: {t.ipo.sortSize}</option>
                <option value="score">Sort: {t.ipo.sortScore}</option>
                <option value="gmp">Sort: {t.ipo.sortGmp}</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-64 shrink-0">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t.ipo.searchPh}
                aria-label={t.ipo.searchPh}
                className="w-full border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorState title={error} onRetry={retry} retryLabel={t.common.retry} />
      ) : tab === "faq" ? (
        /* FAQ & Knowledge Base */
        <Card title={`📚 ${t.ipo.faqTitle}`}>
          <IpoFaq faqs={faqs.length ? faqs : undefined} />
        </Card>
      ) : tab === "calendar" ? (
        /* Calendar View */
        <Card title="📅 Complete IPO Calendar & Milestone Timeline">
          {calEvents.length === 0 ? (
            <EmptyState icon="📅" title="No upcoming calendar milestones found." />
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Chronological timeline of Issue Opens, Closes, Allotments, and Listings derived from official filings.
              </p>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {calEvents.map((evt) => {
                  const isOpening = evt.eventType === "open";
                  const isClosing = evt.eventType === "close";
                  const isAllotment = evt.eventType === "allotment";
                  const isListing = evt.eventType === "listing";

                  return (
                    <div
                      key={evt.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                            isListing
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                              : isAllotment
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                              : isClosing
                              ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                              : "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                          }`}
                        >
                          {isListing ? "🚀" : isAllotment ? "📋" : isClosing ? "⏰" : "🔔"}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/ipos/${evt.symbol}`}
                              className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-blue-600 hover:underline"
                            >
                              {evt.title}
                            </Link>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                evt.segment === "SME"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                  : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                              }`}
                            >
                              {evt.segment}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{evt.detail}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span className="text-xs font-semibold si-numeric text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                          {evt.date}
                        </span>
                        <button
                          onClick={() => setAlertTarget(evt)}
                          title="Set Alert for this milestone"
                          className="text-xs px-2 py-1 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                        >
                          🔔 Alert
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      ) : filtered.length > 0 ? (
        /* Grid of IPO Cards */
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map((ipo: any) => {
            const a = aiBySym.get(String(ipo.symbol || "").toUpperCase());
            const strength =
              a?.score == null
                ? null
                : a.score >= 65
                ? t.ipoAi.strStrong
                : a.score >= 40
                ? t.ipoAi.strModerate
                : t.ipoAi.strWeak;

            const highlights = [
              ...(a?.reasons || []).slice(0, 2).map((x: string) => ({ x, good: true })),
              ...(a?.risks || []).slice(0, 1).map((x: string) => ({ x, good: false })),
            ].slice(0, 3);

            return (
              <div
                key={ipo.symbol}
                className="block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Checkbox + Symbol/Company + Segment Badge + Alert Button */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={selected.includes(ipo.symbol)}
                        disabled={!selected.includes(ipo.symbol) && selected.length >= 4}
                        onChange={() => toggleSelect(ipo.symbol)}
                        aria-label={`Select ${ipo.symbol} for comparison`}
                        className="mt-1 text-blue-600 rounded"
                      />
                      <div className="min-w-0">
                        <Link
                          to={`/ipos/${ipo.symbol}`}
                          className="font-bold text-base text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1"
                        >
                          {ipo.company || ipo.symbol}
                        </Link>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{ipo.symbol}</span>
                          <span>·</span>
                          <span>{ipo.exchange || "NSE"}</span>
                          {ipo.lotSize && (
                            <>
                              <span>·</span>
                              <span>Lot: {ipo.lotSize}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full ${
                          ipo.segment === "SME"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        }`}
                      >
                        {ipo.segment || ipo.series || "Mainboard"}
                      </span>
                      <button
                        onClick={() => setAlertTarget(ipo)}
                        title="Set Milestone Alert"
                        className="text-xs p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
                        aria-label={`Set alert for ${ipo.symbol}`}
                      >
                        🔔
                      </button>
                    </div>
                  </div>

                  {/* 3 Metrics Boxes */}
                  <div className="grid grid-cols-3 gap-2 mt-3.5 text-center">
                    {/* AI Score */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl px-2 py-2 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                        {t.ipoAi.scoreLabel}
                      </p>
                      <p className="font-extrabold text-base si-numeric text-violet-700 dark:text-violet-300 mt-0.5">
                        {a?.score != null ? `${a.score}/100` : "—"}
                      </p>
                      {strength && (
                        <p
                          className={`text-[10px] font-bold ${
                            a.score >= 65
                              ? "text-green-700 dark:text-green-400"
                              : a.score >= 40
                              ? "text-amber-700 dark:text-amber-400"
                              : "text-red-700 dark:text-red-400"
                          }`}
                        >
                          {strength}
                        </p>
                      )}
                    </div>

                    {/* Subscription or Listing Performance */}
                    {tab === "listed" && ipo.listingPerformance ? (
                      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl px-2 py-2 border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                          Listing Gain
                        </p>
                        <p
                          className={`font-extrabold text-base si-numeric mt-0.5 ${
                            (ipo.listingPerformance.listingGainPct || 0) >= 0
                              ? "text-green-700 dark:text-green-400"
                              : "text-red-700 dark:text-red-400"
                          }`}
                        >
                          {ipo.listingPerformance.listingGainPct != null
                            ? `${ipo.listingPerformance.listingGainPct > 0 ? "+" : ""}${ipo.listingPerformance.listingGainPct}%`
                            : "—"}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Issue: ₹{ipo.listingPerformance.issuePrice}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl px-2 py-2 border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                          {t.ipoAi.subLabel}
                        </p>
                        <p
                          className={`font-extrabold text-base si-numeric mt-0.5 ${
                            ipo.subscription && ipo.subscription >= 3
                              ? "text-green-700 dark:text-green-400"
                              : ipo.subscription && ipo.subscription >= 1
                              ? "text-blue-700 dark:text-blue-400"
                              : "text-slate-800 dark:text-slate-200"
                          }`}
                        >
                          {ipo.subscription != null ? `${Number(ipo.subscription).toFixed(2)}×` : "—"}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {ipo.status === "open" ? "Live Demand" : "Final Coverage"}
                        </p>
                      </div>
                    )}

                    {/* GMP */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl px-2 py-2 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                        {t.ipo.gmp}
                      </p>
                      {ipo.gmp ? (
                        <>
                          <p className="font-extrabold text-base si-numeric text-green-700 dark:text-green-400 mt-0.5">
                            +{ipo.gmp.premiumPct?.toFixed(0)}%
                          </p>
                          <p className="text-[10px] text-slate-500">₹{ipo.gmp.value} / sh</p>
                        </>
                      ) : (
                        <>
                          <p className="font-bold text-base text-slate-400 mt-0.5">N/A</p>
                          <p className="text-[10px] text-slate-400">No verified feed</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Pricing & Investment Row */}
                  <div className="mt-3 py-2 px-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{t.ipo.priceBand}:</span>
                      <span className="font-semibold si-numeric text-slate-900 dark:text-slate-100">
                        {ipo.priceBand || "—"}
                      </span>
                    </div>
                    {ipo.minInvestment && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">{t.ipo.minInvest}:</span>
                        <span className="font-medium si-numeric text-slate-800 dark:text-slate-200">
                          ₹{ipo.minInvestment.toLocaleString("en-IN")} ({ipo.lotSize} shares)
                        </span>
                      </div>
                    )}
                    {ipo.issueSizeInrCr && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Issue Size:</span>
                        <span className="font-medium si-numeric text-slate-800 dark:text-slate-200">
                          ₹{ipo.issueSizeInrCr.toLocaleString("en-IN")} Cr
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Date Timeline */}
                  <div className="flex items-center justify-between mt-2.5 text-xs text-slate-600 dark:text-slate-400 px-1">
                    <span className="text-[11px]">
                      {t.ipo.openDate}: <b>{ipo.openDate || "—"}</b>
                    </span>
                    <span className="text-[11px]">
                      {t.ipo.closeDate}: <b>{ipo.closeDate || "—"}</b>
                    </span>
                    {ipo.listingDate && (
                      <span className="text-[11px]">
                        Listing: <b>{ipo.listingDate}</b>
                      </span>
                    )}
                  </div>

                  {/* Highlights / Strengths / Risks */}
                  {highlights.length > 0 && (
                    <ul className="mt-2.5 space-y-1 text-xs">
                      {highlights.map((h, i) => (
                        <li
                          key={i}
                          className={`flex items-start gap-1.5 ${
                            h.good
                              ? "text-green-700 dark:text-green-400"
                              : "text-red-700 dark:text-red-400"
                          }`}
                        >
                          <span className="shrink-0">{h.good ? "✓" : "⚠"}</span>
                          <span className="line-clamp-1">{h.x}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Bottom Action Footer */}
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    {a?.verdictTitle && (
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          a.verdict === "research"
                            ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                            : a.verdict === "skip"
                            ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {a.verdictTitle}
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/ipos/${ipo.symbol}`}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>{t.ipo.viewDetail}</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <EmptyState icon="📋" title={t.ipo.noIpos} description="Try clearing filters or changing search keywords." />
        </Card>
      )}

      {/* Side-by-Side Compare Modal */}
      {compareOpen && selectedIpoObjects.length >= 2 && (
        <IpoCompareModal
          ipos={selectedIpoObjects}
          onClose={() => setCompareOpen(false)}
          onRemove={(sym) => setSelected((prev) => prev.filter((s) => s !== sym))}
        />
      )}

      {/* Alert Setup Modal */}
      {alertTarget && (
        <IpoAlertModal
          symbol={alertTarget.symbol}
          company={alertTarget.company || alertTarget.symbol}
          openDate={alertTarget.openDate}
          closeDate={alertTarget.closeDate}
          allotmentDate={alertTarget.allotmentDate}
          listingDate={alertTarget.listingDate}
          onClose={() => setAlertTarget(null)}
        />
      )}
    </div>
  );
}
