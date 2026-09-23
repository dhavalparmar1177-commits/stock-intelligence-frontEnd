import React from "react";
import { Link } from "react-router-dom";
import { useLang } from "../../i18n/LanguageContext";

interface Props {
  ipos: any[];
  onClose: () => void;
  onRemove: (symbol: string) => void;
}

export default function IpoCompareModal({ ipos, onClose, onRemove }: Props) {
  const { t } = useLang();

  if (!ipos || ipos.length === 0) return null;

  const getVerdictBadge = (verdict: string | null | undefined) => {
    if (verdict === "research") return <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">Worth Researching</span>;
    if (verdict === "maybe") return <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Maybe</span>;
    if (verdict === "skip") return <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">Skip</span>;
    return <span className="text-slate-400 text-xs">N/A</span>;
  };

  const rows = [
    {
      id: "segment",
      label: t.ipo.segment,
      get: (ipo: any) => (
        <span className={`text-xs px-2 py-0.5 rounded font-semibold ${ipo.segment === "SME" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"}`}>
          {ipo.segment || ipo.series || "Mainboard"}
        </span>
      ),
    },
    {
      id: "status",
      label: t.ipo.status,
      get: (ipo: any) => <span className="capitalize font-semibold text-slate-800 dark:text-slate-200">{ipo.status}</span>,
    },
    {
      id: "score",
      label: t.ipoAi.scoreLabel,
      get: (ipo: any) => (
        <span className="font-bold text-base si-numeric text-violet-700 dark:text-violet-400">
          {ipo.ai?.score != null ? `${ipo.ai.score}/100` : "—"}
        </span>
      ),
    },
    {
      id: "verdict",
      label: "AI Verdict",
      get: (ipo: any) => getVerdictBadge(ipo.ai?.verdict),
    },
    {
      id: "priceBand",
      label: t.ipo.priceBand,
      get: (ipo: any) => <span className="si-numeric font-medium">{ipo.priceBand || "—"}</span>,
    },
    {
      id: "lotSize",
      label: t.ipo.lotSize,
      get: (ipo: any) => <span className="si-numeric">{ipo.lotSize ? `${ipo.lotSize} shares` : "—"}</span>,
    },
    {
      id: "minInvest",
      label: t.ipo.minInvest,
      get: (ipo: any) => <span className="si-numeric font-semibold text-slate-900 dark:text-slate-100">{ipo.minInvestment ? `₹${ipo.minInvestment.toLocaleString("en-IN")}` : "—"}</span>,
    },
    {
      id: "issueSize",
      label: "Issue Size (₹ Cr)",
      get: (ipo: any) => <span className="si-numeric">{ipo.issueSizeInrCr ? `₹${ipo.issueSizeInrCr.toLocaleString("en-IN")} Cr` : "—"}</span>,
    },
    {
      id: "freshOfs",
      label: t.ipo.freshOfs,
      get: (ipo: any) => {
        if (!ipo.freshIssueCr && !ipo.ofsIssueCr) return <span className="text-slate-400">N/A</span>;
        return (
          <div className="text-xs space-y-0.5">
            {ipo.freshIssueCr != null && <p className="text-green-700 dark:text-green-400">Fresh: ₹{ipo.freshIssueCr} Cr</p>}
            {ipo.ofsIssueCr != null && <p className="text-amber-700 dark:text-amber-400">OFS: ₹{ipo.ofsIssueCr} Cr</p>}
          </div>
        );
      },
    },
    {
      id: "subTotal",
      label: "Total Subscription",
      get: (ipo: any) => (
        <span className={`font-bold text-sm si-numeric ${ipo.subscription && ipo.subscription >= 3 ? "text-green-700 dark:text-green-400" : "text-slate-700 dark:text-slate-300"}`}>
          {ipo.subscription != null ? `${Number(ipo.subscription).toFixed(2)}×` : "—"}
        </span>
      ),
    },
    {
      id: "gmp",
      label: "GMP & Est Listing",
      get: (ipo: any) => {
        if (!ipo.gmp) return <span className="text-slate-400">N/A</span>;
        return (
          <div className="text-xs">
            <span className="font-bold text-green-700 dark:text-green-400 si-numeric">
              +{ipo.gmp.premiumPct?.toFixed(1)}% (₹{ipo.gmp.value})
            </span>
            <p className="text-slate-500 text-[10px]">Est: ₹{ipo.gmp.estListingPrice}</p>
          </div>
        );
      },
    },
    {
      id: "dates",
      label: "Open → Close",
      get: (ipo: any) => <span className="text-xs si-numeric text-slate-600 dark:text-slate-400">{ipo.openDate || "—"} → {ipo.closeDate || "—"}</span>,
    },
    {
      id: "listingDate",
      label: t.ipo.listing,
      get: (ipo: any) => <span className="text-xs si-numeric">{ipo.listingDate || "—"}</span>,
    },
    {
      id: "registrar",
      label: t.ipo.registrar,
      get: (ipo: any) => <span className="text-xs">{ipo.registrar?.name || "—"}</span>,
    },
    {
      id: "redFlags",
      label: t.ipoAi.redFlags,
      get: (ipo: any) => (
        ipo.ai?.redFlags?.length ? (
          <span className="text-xs text-red-700 dark:text-red-400 font-semibold">{ipo.ai.redFlags.length} flagged</span>
        ) : (
          <span className="text-xs text-green-700 dark:text-green-400">0 flags</span>
        )
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>⚖️</span> {t.ipo.compareIpos}
            </h3>
            <p className="text-xs text-slate-500">
              Side-by-side comparison across demand, valuation, financials and structure
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Comparison Table */}
        <div className="p-4 overflow-x-auto flex-1">
          <table className="w-full text-left text-sm border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                <th className="py-3 px-3 w-40 text-xs font-semibold text-slate-500 uppercase">Parameter</th>
                {ipos.map((ipo) => (
                  <th key={ipo.symbol} className="py-3 px-3 text-center min-w-[180px]">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1">
                        <Link
                          to={`/ipos/${ipo.symbol}`}
                          className="font-bold text-base text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {ipo.symbol}
                        </Link>
                        <button
                          onClick={() => onRemove(ipo.symbol)}
                          title="Remove from comparison"
                          className="text-slate-400 hover:text-red-500 text-xs ml-1"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate max-w-[160px]">{ipo.company}</p>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {row.label}
                  </td>
                  {ipos.map((ipo) => (
                    <td key={ipo.symbol} className="py-2.5 px-3 text-center">
                      {row.get(ipo)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs text-slate-500">
          <span>Real data only · Missing fields report N/A</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-medium text-xs hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
