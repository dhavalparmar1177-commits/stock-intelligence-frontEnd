import { useState } from "react";
import { useLang } from "../i18n/LanguageContext";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { AlertKind, AlertOp, NEEDS_BACKEND, useAlerts } from "../hooks/useAlerts";

const KINDS: AlertKind[] = [
  "price", "changePct", "rsi", "score", "signal", "volume",
  "high52", "low52", "news", "earnings",
];

const NO_VALUE: AlertKind[] = ["high52", "low52"];

/**
 * Alert creation dialog. Only evaluable kinds can be submitted —
 * news/earnings stay disabled with the backend contract note.
 */
export function AlertModal({ symbol, onClose }: { symbol: string; onClose: () => void }) {
  const { t } = useLang();
  const { create } = useAlerts();
  const [kind, setKind] = useState<AlertKind>("price");
  const [op, setOp] = useState<AlertOp>("above");
  const [value, setValue] = useState("");
  const [signal, setSignal] = useState("BUY");
  const [err, setErr] = useState("");

  const kindLabel = (k: AlertKind): string => {
    switch (k) {
      case "price": return t.alerts.kPrice;
      case "changePct": return t.alerts.kChange;
      case "rsi": return t.alerts.kRSI;
      case "score": return t.alerts.kScore;
      case "signal": return t.alerts.kSignal;
      case "volume": return t.alerts.kVolume;
      case "high52": return t.alerts.kHigh52;
      case "low52": return t.alerts.kLow52;
      case "news": return t.alerts.kNews;
      case "earnings": return t.alerts.kEarnings;
    }
  };

  const submit = () => {
    setErr("");
    if (NEEDS_BACKEND.includes(kind)) return;
    if (kind === "signal") {
      if (!create({ symbol, kind, op: "equals", value: signal })) setErr("—");
      else onClose();
      return;
    }
    if (NO_VALUE.includes(kind)) {
      if (!create({ symbol, kind, op: "above", value: null })) setErr("—");
      else onClose();
      return;
    }
    const n = Number(value);
    if (!Number.isFinite(n)) {
      setErr(t.alerts.value);
      return;
    }
    if (!create({ symbol, kind, op, value: n })) setErr("—");
    else onClose();
  };

  return (
    <Modal open title={`${t.alerts.newTitle} · ${symbol}`} onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label htmlFor="al-kind" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
            {t.alerts.kind}
          </label>
          <select
            id="al-kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as AlertKind)}
            className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900"
          >
            {KINDS.map((k) => (
              <option key={k} value={k} disabled={NEEDS_BACKEND.includes(k)}>
                {kindLabel(k)}{NEEDS_BACKEND.includes(k) ? ` — ${t.alerts.needsBackend}` : ""}
              </option>
            ))}
          </select>
        </div>
        {NEEDS_BACKEND.includes(kind) ? (
          <p className="text-xs text-slate-500">{t.alerts.backendNote}</p>
        ) : kind === "signal" ? (
          <div>
            <label htmlFor="al-signal" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              {t.alerts.value}
            </label>
            <select
              id="al-signal"
              value={signal}
              onChange={(e) => setSignal(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900"
            >
              {["BUY", "HOLD", "SELL"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        ) : NO_VALUE.includes(kind) ? (
          <p className="text-xs text-slate-500">
            {kind === "high52" ? t.alerts.kHigh52 : t.alerts.kLow52} — {t.alerts.op}: {t.alerts.above} / {t.alerts.below}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="al-op" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                {t.alerts.op}
              </label>
              <select
                id="al-op"
                value={op}
                onChange={(e) => setOp(e.target.value as AlertOp)}
                className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900"
              >
                <option value="above">{t.alerts.above}</option>
                <option value="below">{t.alerts.below}</option>
              </select>
            </div>
            <Input label={t.alerts.value} type="number" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
        )}
        {err && (
          <p role="alert" className="text-xs text-red-600">
            {t.alerts.value}: {err === "—" ? "—" : err}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            {t.watch.cancel}
          </Button>
          <Button variant="primary" size="sm" onClick={submit} disabled={NEEDS_BACKEND.includes(kind)}>
            {t.alerts.create}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default AlertModal;
