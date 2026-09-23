import React, { useState } from "react";
import { useLang } from "../../i18n/LanguageContext";

interface Props {
  symbol: string;
  company: string;
  openDate?: string | null;
  closeDate?: string | null;
  allotmentDate?: string | null;
  listingDate?: string | null;
  onClose: () => void;
}

export default function IpoAlertModal({
  symbol,
  company,
  openDate,
  closeDate,
  allotmentDate,
  listingDate,
  onClose,
}: Props) {
  const { t } = useLang();
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["close", "allotment"]);
  const [saved, setSaved] = useState(false);

  const toggleType = (key: string) => {
    setSelectedTypes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSave = () => {
    try {
      const existing = JSON.parse(localStorage.getItem("si_ipo_alerts") || "[]");
      const newAlerts = selectedTypes.map((type) => ({
        id: `${symbol}-${type}-${Date.now()}`,
        symbol,
        company,
        type,
        date:
          type === "open"
            ? openDate
            : type === "close"
            ? closeDate
            : type === "allotment"
            ? allotmentDate
            : listingDate,
        createdAt: new Date().toISOString(),
        active: true,
      }));
      localStorage.setItem("si_ipo_alerts", JSON.stringify([...existing, ...newAlerts]));
      setSaved(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch {
      setSaved(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  const alertOptions = [
    {
      key: "open",
      title: "🔔 Issue Opening Alert",
      desc: "Notify on the morning the issue opens for subscription",
      date: openDate,
    },
    {
      key: "close",
      title: "⏰ Issue Closing Reminder",
      desc: "Reminder before 3:00 PM on the final day of bidding",
      date: closeDate,
    },
    {
      key: "allotment",
      title: "📋 Basis of Allotment Out",
      desc: "Direct prompt with registrar link when allotment is finalized",
      date: allotmentDate,
    },
    {
      key: "listing",
      title: "🚀 Listing Day Alert",
      desc: "Notify at 9:15 AM on exchange listing day",
      date: listingDate,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>🔔</span> {t.ipo.setAlert}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {company} ({symbol})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm"
          >
            ✕
          </button>
        </div>

        {saved ? (
          <div className="p-4 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-xl text-center space-y-1">
            <p className="text-green-700 dark:text-green-400 font-bold text-sm">
              ✓ {t.ipo.alertSuccess}!
            </p>
            <p className="text-xs text-slate-500">
              You will receive reminders for the selected milestones.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {alertOptions.map((opt) => (
                <label
                  key={opt.key}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedTypes.includes(opt.key)
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 dark:border-blue-700"
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(opt.key)}
                    onChange={() => toggleType(opt.key)}
                    className="mt-1 text-blue-600 rounded"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                        {opt.title}
                      </p>
                      {opt.date && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          {opt.date}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-3 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={selectedTypes.length === 0}
                className="flex-1 px-3 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-sm"
              >
                Save Alerts ({selectedTypes.length})
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
