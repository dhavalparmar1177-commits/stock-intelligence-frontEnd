import React from "react";
import { useLang } from "../../i18n/LanguageContext";

interface Props {
  registrarName?: string | null;
  allotmentUrl?: string | null;
  companyName?: string | null;
  symbol?: string | null;
  allotmentDate?: string | null;
}

const REGISTRAR_PORTALS = [
  { name: "Link Intime India", url: "https://linkintime.co.in/initial_offer/public-issues.html" },
  { name: "KFin Technologies", url: "https://kosmic.kfintech.com/ipostatus/" },
  { name: "Bigshare Services", url: "https://ipo.bigshareonline.com/ipo_status.html" },
  { name: "Purva Sharegistry", url: "https://www.purvashare.com/investor-service/ipo-query" },
  { name: "Maashitla Instruments", url: "https://maashitla.com/allotment-status/public-issues" },
  { name: "Skyline Financial", url: "https://www.skylinerta.com/ipo.php" },
  { name: "BSE Allotment Check", url: "https://www.bseindia.com/investors/appli_check.aspx" },
  { name: "NSE IPO Bidding Portal", url: "https://www.nseindia.com/products/content/equities/ipos/ipo_login.htm" },
];

export default function IpoAllotmentChecker({
  registrarName,
  allotmentUrl,
  companyName,
  symbol,
  allotmentDate,
}: Props) {
  const { t } = useLang();

  const targetUrl =
    allotmentUrl ||
    REGISTRAR_PORTALS.find((r) =>
      registrarName && r.name.toLowerCase().includes(registrarName.toLowerCase())
    )?.url ||
    "https://www.bseindia.com/investors/appli_check.aspx";

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/80 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-900/60 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>📋</span> {t.ipo.checkAllotment}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {companyName || symbol} {allotmentDate ? `· Allotment Scheduled: ${allotmentDate}` : ""}
            </p>
            {registrarName && (
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mt-0.5">
                Official Registrar: {registrarName}
              </p>
            )}
          </div>
          <a
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors text-center shrink-0"
          >
            <span>Open Allotment Portal</span>
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400">
        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
          <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1">
            <span>🔑</span> Required for Checking:
          </p>
          <ul className="list-disc ml-4 space-y-1">
            <li><b>PAN Number</b> (Permanent Account Number)</li>
            <li><b>Application Number</b> (from your broker app / ASBA slip)</li>
            <li><b>DP / Client ID</b> (16-digit CDSL/NSDL ID)</li>
          </ul>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
          <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1">
            <span>💡</span> Allotment Timeline Note:
          </p>
          <p>
            Allotment status is finalized by the Registrar typically on <b>T+1 day</b> after issue close. Bank ASBA lien will be released for non-allottees and shares credited to Demat on <b>T+2 day</b>.
          </p>
        </div>
      </div>

      <details className="text-xs text-slate-500 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
        <summary className="cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
          Direct Links to Other Major Registrars & Exchanges
        </summary>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          {REGISTRAR_PORTALS.map((r, i) => (
            <a
              key={i}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline truncate"
            >
              {r.name} ↗
            </a>
          ))}
        </div>
      </details>
    </div>
  );
}
