import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { marketApi } from "../api/market";
import { useLang } from "../i18n/LanguageContext";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { MetricCard } from "../components/ui/MetricCard";
import { SkeletonText } from "../components/ui/Skeleton";
import { AIScoreBadge } from "../components/ui/Badge";
import SourceTag from "../components/stock/SourceTag";
import IpoTimeline from "../components/ipo/IpoTimeline";
import IpoSubscriptionTable from "../components/ipo/IpoSubscriptionTable";
import IpoGmpChart from "../components/ipo/IpoGmpChart";
import IpoAllotmentChecker from "../components/ipo/IpoAllotmentChecker";
import IpoAlertModal from "../components/ipo/IpoAlertModal";
import IpoFaq from "../components/ipo/IpoFaq";
import IpoAsk from "../components/ipo/IpoAsk";

function MetricRow({ label, value, note }: { label: string; value?: string | number | null; note?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 text-sm">
      <span className="text-slate-500">{label}</span>
      <div className="text-right">
        <span className={`si-numeric ${value != null && value !== "" ? "font-semibold text-slate-800 dark:text-slate-200" : "text-slate-400"}`}>
          {value != null && value !== "" ? String(value) : "Not available"}
        </span>
        {note && <p className="text-[10px] text-slate-400">{note}</p>}
      </div>
    </div>
  );
}

export default function IpoDetail() {
  const { t } = useLang();
  const { symbol } = useParams<{ symbol: string }>();
  const sym = (symbol || "").toUpperCase();

  const [detailData, setDetailData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [seq, setSeq] = useState(0);
  const [alertOpen, setAlertOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");

    marketApi
      .ipoDetail(sym)
      .then((res) => {
        if (!alive) return;
        setDetailData(res);
        if (!res?.ipo) setError(t.gen.unableToLoad);
      })
      .catch(() => {
        if (alive) setError(t.gen.unableToLoad);
      })
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [sym, seq]);

  const retry = () => setSeq((s) => s + 1);

  const ipo = detailData?.ipo;
  const bids = detailData?.bids;
  const ai = detailData?.ai;

  const totalSub = bids?.total ?? ipo?.subscription;
  const freshCr = ipo?.freshIssueCr;
  const ofsCr = ipo?.ofsIssueCr;
  const totalIssueCr = ipo?.issueSizeInrCr || ((freshCr || 0) + (ofsCr || 0)) || null;

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/ipos" className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              ← IPOs
            </Link>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              {ipo?.company || sym}
            </h1>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded ${
                ipo?.segment === "SME"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
              }`}
            >
              {ipo?.segment || "Mainboard"}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300">
              {ipo?.exchange || "NSE"}
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded capitalize ${
                ipo?.status === "open"
                  ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                  : ipo?.status === "upcoming"
                  ? "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300"
                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {ipo?.status || "—"}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Symbol: <b className="text-slate-700 dark:text-slate-300">{sym}</b> · Face Value: ₹{ipo?.faceValue || 10} · Lot Size: {ipo?.lotSize || "—"} shares
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => setAlertOpen(true)}
            className="text-xs sm:text-sm px-3.5 py-1.5 font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
          >
            <span>🔔</span>
            <span>{t.ipo.setAlert}</span>
          </button>
          <button
            onClick={retry}
            className="text-xs sm:text-sm px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            ↻ {t.common.refreshNow}
          </button>
        </div>
      </div>

      {loading ? (
        <Card title={sym}>
          <SkeletonText lines={6} />
        </Card>
      ) : error || !ipo ? (
        <ErrorState title={error || t.gen.unableToLoad} onRetry={retry} retryLabel={t.common.retry} />
      ) : (
        <>
          {/* Milestone Timeline Card */}
          {ipo.timeline && ipo.timeline.length > 0 && (
            <Card title="📅 Issue Timeline & Milestones">
              <IpoTimeline steps={ipo.timeline} />
            </Card>
          )}

          {/* Quick Metrics & Issue Economics */}
          <Card
            title="💰 Issue Economics & Capital Structure"
            action={
              totalSub != null ? (
                <Badge tone={totalSub >= 5 ? "positive" : totalSub >= 1 ? "warning" : "negative"}>
                  Subscribed {totalSub.toFixed(2)}×
                </Badge>
              ) : undefined
            }
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <MetricCard label={t.ipo.priceBand} value={ipo.priceBand || "TBD"} />
              <MetricCard
                label={t.ipo.lotSize}
                value={ipo.lotSize ? `${ipo.lotSize} shares` : "Not available"}
              />
              <MetricCard
                label={t.ipo.minInvest}
                value={ipo.minInvestment ? `₹${ipo.minInvestment.toLocaleString("en-IN")}` : "Not available"}
              />
              <MetricCard
                label={t.ipo.maxInvest}
                value={ipo.retailMaxInvestment ? `₹${ipo.retailMaxInvestment.toLocaleString("en-IN")}` : "Not available"}
              />
            </div>

            {/* Fresh vs OFS Progress Bar */}
            {freshCr != null || ofsCr != null ? (
              <div className="mt-4 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>{t.ipo.freshOfs} Breakdown</span>
                  <span className="si-numeric text-slate-600 dark:text-slate-400">
                    Total: ₹{totalIssueCr ? `${totalIssueCr.toLocaleString("en-IN")} Cr` : "—"}
                  </span>
                </div>
                {totalIssueCr && totalIssueCr > 0 && (
                  <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                    {freshCr != null && freshCr > 0 && (
                      <div
                        className="bg-green-600 h-full"
                        style={{ width: `${(freshCr / totalIssueCr) * 100}%` }}
                        title={`Fresh Issue: ₹${freshCr} Cr`}
                      />
                    )}
                    {ofsCr != null && ofsCr > 0 && (
                      <div
                        className="bg-amber-500 h-full"
                        style={{ width: `${(ofsCr / totalIssueCr) * 100}%` }}
                        title={`OFS: ₹${ofsCr} Cr`}
                      />
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between text-xs pt-1 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-600 inline-block" />
                    <span>Fresh Issue (Company Growth): <b>₹{freshCr ?? "N/A"} Cr</b></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                    <span>Offer for Sale (Promoter/PE Exit): <b>₹{ofsCr ?? "N/A"} Cr</b></span>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 mt-3">
              <MetricRow label={t.ipo.exchange} value={ipo.exchange} />
              <MetricRow label={t.ipo.series} value={ipo.series || ipo.segment} />
              <MetricRow
                label="Issue Size (Shares)"
                value={ipo.issueSizeShares != null ? Number(ipo.issueSizeShares).toLocaleString("en-IN") : null}
              />
              <MetricRow
                label="Issue Size (₹ Cr)"
                value={totalIssueCr != null ? `₹${totalIssueCr.toLocaleString("en-IN")} Cr` : null}
              />
              <MetricRow
                label="sNII Min Investment (> ₹2 Lakh)"
                value={ipo.sNiiMinInvestment ? `₹${ipo.sNiiMinInvestment.toLocaleString("en-IN")}` : null}
              />
              <MetricRow
                label="bNII Min Investment (> ₹10 Lakh)"
                value={ipo.bNiiMinInvestment ? `₹${ipo.bNiiMinInvestment.toLocaleString("en-IN")}` : null}
              />
            </div>
          </Card>

          {/* Live Subscription by Category */}
          <Card
            title="📊 Live Subscription by Investor Category"
            action={<SourceTag kind="real" />}
          >
            <IpoSubscriptionTable
              categories={bids?.categories || []}
              totalMultiple={totalSub}
              updateTime={bids?.updateTime || ipo.bidsUpdatedAt}
            />
          </Card>

          {/* GMP Hub & Expected Listing Price */}
          <Card
            title="📈 Grey Market Premium (GMP), Kostak & Expected Listing"
            action={<SourceTag kind="real" />}
          >
            <IpoGmpChart gmp={ipo.gmp} priceHigh={ipo.priceHigh} />
          </Card>

          {/* Multi-Year Financial Performance (from RHP) */}
          <Card title="📑 Multi-Year Financial Performance (Official Filing)">
            {ipo.financials && ipo.financials.length > 0 ? (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse min-w-[500px]">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase">
                        <th className="py-2.5 px-3">Period</th>
                        <th className="py-2.5 px-3 text-right">Revenue (₹ Cr)</th>
                        <th className="py-2.5 px-3 text-right">EBITDA (₹ Cr)</th>
                        <th className="py-2.5 px-3 text-right">PAT / Profit (₹ Cr)</th>
                        <th className="py-2.5 px-3 text-right">Net Worth (₹ Cr)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {ipo.financials.map((fin: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                            {fin.year}
                          </td>
                          <td className="py-2.5 px-3 text-right si-numeric text-slate-700 dark:text-slate-300">
                            {fin.revenueCr != null ? `₹${fin.revenueCr.toLocaleString("en-IN")}` : "—"}
                          </td>
                          <td className="py-2.5 px-3 text-right si-numeric text-slate-700 dark:text-slate-300">
                            {fin.ebitdaCr != null ? `₹${fin.ebitdaCr.toLocaleString("en-IN")}` : "—"}
                          </td>
                          <td className={`py-2.5 px-3 text-right si-numeric font-semibold ${(fin.patCr || 0) >= 0 ? "text-green-700 dark:text-green-400" : "text-red-600"}`}>
                            {fin.patCr != null ? `₹${fin.patCr.toLocaleString("en-IN")}` : "—"}
                          </td>
                          <td className="py-2.5 px-3 text-right si-numeric text-slate-700 dark:text-slate-300">
                            {fin.netWorthCr != null ? `₹${fin.netWorthCr.toLocaleString("en-IN")}` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Key Valuation Metrics */}
                {ipo.valuation && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Key Valuation Multiples at Upper Price Band:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <MetricCard
                        label="P/E Ratio"
                        value={ipo.valuation.pe != null ? `${ipo.valuation.pe}×` : "Not available"}
                      />
                      <MetricCard
                        label="EPS (₹)"
                        value={ipo.valuation.eps != null ? `₹${ipo.valuation.eps}` : "Not available"}
                      />
                      <MetricCard
                        label="RoNW / ROE"
                        value={ipo.valuation.ronw != null ? `${ipo.valuation.ronw}%` : "Not available"}
                      />
                      <MetricCard
                        label="ROCE %"
                        value={ipo.valuation.roce != null ? `${ipo.valuation.roce}%` : "Not available"}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                icon="📄"
                title="Financials Not Available"
                description="Financial statements will be populated upon official prospectus filing updates."
              />
            )}
          </Card>

          {/* Strengths vs Risks Card (SWOT) */}
          {(ipo.strengths?.length > 0 || ipo.risks?.length > 0) && (
            <Card title="⚖️ Competitive Strengths & Key Business Risks">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-green-50/50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-900/40">
                  <p className="font-bold text-xs text-green-800 dark:text-green-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span>🌟</span> Competitive Strengths (from Prospectus)
                  </p>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    {ipo.strengths.map((str: string, i: number) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-green-600 font-bold shrink-0">✓</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/40">
                  <p className="font-bold text-xs text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span>⚠</span> Key Business & Operating Risks
                  </p>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    {ipo.risks.map((rsk: string, i: number) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-600 font-bold shrink-0">•</span>
                        <span>{rsk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          )}

          {/* Promoters & Shareholding Structure + Anchor Lock-in */}
          {ipo.promoters && (
            <Card title="👥 Promoters, Shareholding & Anchor Lock-In">
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-slate-500 font-semibold mb-1">{t.ipo.promoterNames}</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {ipo.promoters.names.join(", ")}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-500 font-semibold">{t.ipo.preHolding}</p>
                    <p className="text-lg font-bold si-numeric text-slate-800 dark:text-slate-200 mt-0.5">
                      {ipo.promoters.preHoldingPct != null ? `${ipo.promoters.preHoldingPct}%` : "—"}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-500 font-semibold">{t.ipo.postHolding}</p>
                    <p className="text-lg font-bold si-numeric text-slate-800 dark:text-slate-200 mt-0.5">
                      {ipo.promoters.postHoldingPct != null ? `${ipo.promoters.postHoldingPct}%` : "—"}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-500 font-semibold">30-Day Anchor Lock-in</p>
                    <p className="text-xs font-bold si-numeric text-slate-800 dark:text-slate-200 mt-1">
                      {ipo.promoters.anchorLockIn30d || "—"}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-500 font-semibold">90-Day Anchor Lock-in</p>
                    <p className="text-xs font-bold si-numeric text-slate-800 dark:text-slate-200 mt-1">
                      {ipo.promoters.anchorLockIn90d || "—"}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Listing Performance Tracker (for Listed IPOs) */}
          {ipo.listingPerformance && (
            <Card title="🚀 Listing Performance (Live Market Tracking)" action={<SourceTag kind="real" />}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <MetricCard label={t.ipo.issuePrice} value={`₹${ipo.listingPerformance.issuePrice}`} />
                <MetricCard
                  label={t.ipo.listingPrice}
                  value={ipo.listingPerformance.listingPrice ? `₹${ipo.listingPerformance.listingPrice}` : "Not available"}
                />
                <MetricCard
                  label={t.ipo.listingGain}
                  value={ipo.listingPerformance.listingGainPct != null ? `${ipo.listingPerformance.listingGainPct > 0 ? "+" : ""}${ipo.listingPerformance.listingGainPct}%` : "Not available"}
                />
                <MetricCard
                  label={t.ipo.cmp}
                  value={ipo.listingPerformance.currentPrice ? `₹${ipo.listingPerformance.currentPrice.toLocaleString("en-IN")}` : "Live quote pending"}
                />
              </div>

              {ipo.listingPerformance.currentGainPct != null && (
                <div className="mt-3 p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/40 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Total Return Since IPO Allotment:
                  </span>
                  <span className={`text-sm font-black si-numeric ${ipo.listingPerformance.currentGainPct >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {ipo.listingPerformance.currentGainPct >= 0 ? "+" : ""}
                    {ipo.listingPerformance.currentGainPct}%
                  </span>
                </div>
              )}
            </Card>
          )}

          {/* Registrar & Allotment Verification Hub */}
          <Card title="🏢 Registrar & Allotment Verification">
            <IpoAllotmentChecker
              registrarName={ipo.registrar?.name}
              allotmentUrl={ipo.registrar?.allotmentUrl}
              companyName={ipo.company}
              symbol={sym}
              allotmentDate={ipo.allotmentDate}
            />

            {/* Offer Documents Link */}
            {ipo.documents && (
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 flex-wrap text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-400">Prospectus Documents:</span>
                {ipo.documents.drhp && (
                  <a
                    href={ipo.documents.drhp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>📄 {t.ipo.drhp}</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                )}
                {ipo.documents.rhp && (
                  <a
                    href={ipo.documents.rhp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>📄 {t.ipo.rhp}</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                )}
                {ipo.documents.anchorList && (
                  <a
                    href={ipo.documents.anchorList}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>👥 Anchor Allocations</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                )}
                {ipo.documents.nseUrl && (
                  <a
                    href={ipo.documents.nseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>🌐 NSE Issue Page</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                )}
              </div>
            )}
          </Card>

          {/* AI Comprehensive Analysis */}
          <Card
            title={`${t.ipoAi.title} — ${sym}`}
            action={
              <span className="flex gap-1.5 items-center">
                <SourceTag kind="ai" />
                <AIScoreBadge score={ai?.score} />
              </span>
            }
          >
            {!ai ? (
              <EmptyState icon="🤖" title={t.gen.dataUnavailable} description={t.ipo.aiNeedsData} />
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {t.ipo.worthResearching}
                    </p>
                    <p
                      className={`text-2xl font-black mt-0.5 ${
                        ai.verdict === "research"
                          ? "text-green-700 dark:text-green-400"
                          : ai.verdict === "skip"
                          ? "text-red-700 dark:text-red-400"
                          : "text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      {ai.verdictTitle || (ai.verdict === "research" ? t.ipoAi.worthYes : ai.verdict === "skip" ? t.ipoAi.worthSkip : t.ipoAi.worthMaybe)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">{t.ipoAi.confidence}</p>
                    <p className="text-lg font-bold si-numeric text-slate-900 dark:text-slate-100">
                      {ai.confidence != null ? `${ai.confidence}%` : "—"}
                    </p>
                  </div>
                </div>

                {/* Categories progress bars */}
                {(ai.categories || []).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Score Factor Breakdown (Weighted over real inputs):
                    </p>
                    <div className="space-y-2">
                      {ai.categories.map((c: any) => (
                        <div key={c.key} className="flex items-center gap-2 text-xs">
                          <span className="w-40 shrink-0 font-medium text-slate-700 dark:text-slate-300 truncate">
                            {c.label || c.key} <span className="text-slate-400 font-normal">({c.weight}%)</span>
                          </span>
                          <div className="flex-1 h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            {c.score != null && (
                              <div
                                className="h-full bg-violet-600 rounded-full transition-all duration-500"
                                style={{ width: `${c.score}%` }}
                              />
                            )}
                          </div>
                          <span className="w-20 text-right font-semibold si-numeric text-slate-600 dark:text-slate-400">
                            {c.score != null ? `${c.score}/100` : "Excluded"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strengths & Risks Grid */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-3.5 bg-green-50/50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-900/40">
                    <p className="font-bold text-xs text-green-800 dark:text-green-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span>✓</span> {t.ipoAi.reasons}
                    </p>
                    {ai.reasons?.length ? (
                      <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                        {ai.reasons.map((x: string, i: number) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-green-600 font-bold shrink-0">•</span>
                            <span>{x}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-500">No positive factors loaded.</p>
                    )}
                  </div>

                  <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/40">
                    <p className="font-bold text-xs text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span>⚠</span> {t.ipoAi.risks}
                    </p>
                    {ai.risks?.length ? (
                      <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                        {ai.risks.map((x: string, i: number) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-amber-600 font-bold shrink-0">•</span>
                            <span>{x}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-500">No specific risk triggers identified.</p>
                    )}
                  </div>
                </div>

                {/* Red Flags Section */}
                {ai.redFlags?.length > 0 && (
                  <div className="p-3.5 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-300 dark:border-red-900">
                    <p className="font-bold text-xs text-red-800 dark:text-red-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span>🚨</span> {t.ipoAi.redFlags}
                    </p>
                    <ul className="space-y-1 text-xs text-red-900 dark:text-red-200">
                      {ai.redFlags.map((x: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="font-bold shrink-0">!</span>
                          <span>{x}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Missing Data Disclosure */}
                {ai.missing?.length > 0 && (
                  <div className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Unpublished / Excluded Inputs:{" "}
                    </span>
                    <span>{ai.missing.join(" · ")}</span>
                  </div>
                )}

                {ai.disclaimer && (
                  <p className="text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                    {ai.disclaimer}
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* Interactive AI Assistant */}
          <IpoAsk ai={ai} ipo={ipo} bids={bids} />

          {/* FAQ Knowledge Base Section */}
          <Card title="💡 IPO Investor FAQ & Knowledge Base">
            <IpoFaq />
          </Card>
        </>
      )}

      {/* Alert Modal */}
      {alertOpen && ipo && (
        <IpoAlertModal
          symbol={ipo.symbol}
          company={ipo.company || ipo.symbol}
          openDate={ipo.openDate}
          closeDate={ipo.closeDate}
          allotmentDate={ipo.allotmentDate}
          listingDate={ipo.listingDate}
          onClose={() => setAlertOpen(false)}
        />
      )}
    </div>
  );
}
