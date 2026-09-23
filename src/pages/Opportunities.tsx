import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { useLang } from "../i18n/LanguageContext";
import { Card } from "../components/ui/Card";
import { Badge, AIScoreBadge, SignalBadge, RiskBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { SkeletonCard, SkeletonText } from "../components/ui/Skeleton";
import { PageHeader } from "../components/layout/primitives";

export default function Opportunities() {
  const { t, lang } = useLang();
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [nlq, setNlq] = useState("");
  const [screen, setScreen] = useState<any>(null);
  const [screenErr, setScreenErr] = useState("");
  const [screening, setScreening] = useState(false);

  const runScreen = async (q: string) => {
    const query = (q || nlq).trim();
    if (!query) return;
    setScreening(true);
    setScreenErr("");
    setScreen(null);
    try {
      const r = await api.get("/market/india/screen", { params: { q: query, lang } });
      setScreen(r.data);
    } catch (e: any) {
      setScreenErr(e.response?.data?.error || t.screen.loadFail);
    } finally {
      setScreening(false);
    }
  };

  useEffect(() => {
    load();
  }, [lang]);

  const load = () => {
    setLoading(true);
    setErr("");
    api.get("/market/india/opportunities?limit=8", { params: { lang } })
      .then((r) => { setData(r.data); setLoading(false); })
      .catch((e: any) => { setErr(e.response?.data?.error || t.screen.loadFail); setLoading(false); });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={t.opp.title}
        description={
          data
            ? `${t.opp.rankedOf.replace("{ranked}", String(data.ranked)).replace("{scanned}", String(data.scanned))} · ${new Date(data.asOf).toLocaleString()}`
            : t.opp.liveTag
        }
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/evaluation"
              className="text-xs sm:text-sm px-3 py-1.5 font-medium border border-violet-500/30 text-violet-700 dark:text-violet-300 rounded-lg hover:bg-violet-500/10 transition-colors"
            >
              {t.opp.evalLink} →
            </Link>
            <button
              onClick={load}
              className="text-xs sm:text-sm px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              ↻ {t.common.refreshNow}
            </button>
          </div>
        }
      />

      {/* Natural Language Discovery Card */}
      <Card title={t.opp.title} accent="ai">
        <div className="flex gap-2">
          <input
            value={nlq}
            onChange={(e) => setNlq(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runScreen(nlq)}
            placeholder={t.opp.nlPh}
            aria-label={t.opp.nlPh}
            className="border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 text-sm flex-1 bg-white dark:bg-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <Button
            variant="ai"
            size="md"
            onClick={() => runScreen(nlq)}
            disabled={screening || !nlq.trim()}
            loading={screening}
          >
            {t.opp.nlBtn}
          </Button>
        </div>

        <div className="flex gap-1.5 flex-wrap mt-2">
          {t.opp.nlExamples.map((x: string) => (
            <button
              key={x}
              onClick={() => { setNlq(x); runScreen(x); }}
              className="text-xs px-2.5 py-1 rounded-full border border-violet-300 dark:border-violet-800/80 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-colors"
            >
              {x}
            </button>
          ))}
        </div>

        {screening && <p className="text-xs text-slate-500 mt-2">{t.opp.nlSearching}</p>}
        {screenErr && (
          <p role="alert" className="text-xs text-rose-600 dark:text-rose-400 mt-2">
            {screenErr}
          </p>
        )}

        {screen && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            {screen.results?.length ? (
              <div className="space-y-2">
                {screen.results.map((o: any, i: number) => (
                  <div
                    key={o.symbol}
                    className="flex gap-3 flex-wrap items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-[120px]">
                      <span className="font-bold text-slate-400 w-5">#{i + 1}</span>
                      <Link to={`/stocks/${o.symbol}`} className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
                        {o.symbol}
                      </Link>
                      <span className="si-numeric font-semibold">
                        {o.price != null ? `₹${Number(o.price).toLocaleString("en-IN")}` : t.gen.notAvailable}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <AIScoreBadge score={o.score} />
                      <span className="text-slate-500">{o.trend}</span>
                    </div>

                    <p className="text-slate-600 dark:text-slate-400 flex-1 min-w-[180px] truncate">{o.mainReason}</p>
                    <RiskBadge level={o.riskLevel} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">{t.opp.nlEmpty}</p>
            )}
          </div>
        )}
      </Card>

      {/* Loading state */}
      {loading && (
        <div className="space-y-3" role="status" aria-label={t.opp.loading}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonText lines={2} />
        </div>
      )}

      {err && !loading && <ErrorState title={err} onRetry={load} retryLabel={t.common.retry} />}

      {/* Top Ranked Opportunities Cards */}
      {!loading && data?.opportunities && (
        <div className="space-y-3">
          {data.opportunities.map((o: any, i: number) => (
            <div
              key={o.symbol}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center gap-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black si-numeric text-slate-300 dark:text-slate-700 w-8 text-center">
                  #{i + 1}
                </span>
                <div className="min-w-[140px]">
                  <Link
                    to={`/stocks/${o.symbol}`}
                    className="text-base font-extrabold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {o.symbol}
                  </Link>
                  <p className="text-xs text-slate-500 truncate max-w-[160px]">{o.name || t.gen.dataUnavailable}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Price</p>
                  <p className="font-bold si-numeric text-slate-900 dark:text-slate-100">
                    {o.price != null ? `₹${Number(o.price).toLocaleString("en-IN")}` : t.gen.notAvailable}
                  </p>
                  {o.changePct != null && (
                    <span className={`text-[10px] font-semibold ${o.changePct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                      {o.changePct >= 0 ? "+" : ""}{Number(o.changePct).toFixed(2)}%
                    </span>
                  )}
                </div>

                <div className="pl-3 border-l border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] uppercase font-bold text-slate-400">AI Score</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <AIScoreBadge score={o.score} />
                    <SignalBadge signal={o.signal} />
                  </div>
                </div>
              </div>

              <div className="flex-1 text-xs">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <span>RSI: <b className="text-slate-700 dark:text-slate-300 font-semibold">{o.rsi14 ?? "—"}</b></span>
                  <span>·</span>
                  <span>3M Mom: <b className="text-slate-700 dark:text-slate-300 font-semibold">{o.momentum3mPct != null ? `${o.momentum3mPct}%` : "—"}</b></span>
                  <span>·</span>
                  <span>Vol Ratio: <b className="text-slate-700 dark:text-slate-300 font-semibold">{o.volumeRatio != null ? `${o.volumeRatio}×` : "—"}</b></span>
                </div>
                <ul className="space-y-0.5">
                  {o.reasons?.slice(0, 2).map((x: string, j: number) => (
                    <li key={j} className="text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold shrink-0">✓</span>
                      <span className="truncate">{x}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <RiskBadge level={o.riskLevel} />
                <Link
                  to={`/stocks/${o.symbol}`}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                >
                  {t.opp.fullReport} →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {data && (!data.opportunities || !data.opportunities.length) && !loading && (
        <Card>
          <EmptyState icon="🎯" title={t.opp.empty} />
        </Card>
      )}

      <p className="text-xs text-slate-400 dark:text-slate-500 text-center">{t.opp.note}</p>
    </div>
  );
}
