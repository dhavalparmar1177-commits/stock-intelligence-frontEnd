import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { useLang } from "../i18n/LanguageContext";

const KIND_OPTIONS = [
  "PRICE_ABOVE",
  "PRICE_BELOW",
  "RSI_ABOVE",
  "RSI_BELOW",
  "WEEK52_HIGH",
  "WEEK52_LOW",
] as const;

export default function Alerts() {
  const { t } = useLang();
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState({ symbol: "TCS", type: "PRICE_ABOVE", value: "" });
  const load = () => api.get("/alerts").then((r) => setRows(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);
  const create = async () => {
    await api.post("/alerts", {
      symbol: form.symbol.toUpperCase(),
      type: form.type,
      value: form.value ? Number(form.value) : undefined,
    });
    load();
  };
  const del = async (id: number) => {
    await api.delete(`/alerts/${id}`);
    load();
  };

  if (!localStorage.getItem("accessToken"))
    return (
      <p className="text-sm">
        {t.alerts.pleaseLogin}{" "}
        <Link to="/login" className="text-blue-600">{t.alerts.loginLink}</Link>{" "}
        {t.alerts.loginSuffix}
      </p>
    );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t.alerts.title}</h1>
      <div className="flex gap-2 flex-wrap">
        <input
          value={form.symbol}
          onChange={(e) => setForm({ ...form, symbol: e.target.value })}
          className="border rounded px-2 py-1.5 text-sm w-28"
        />
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="border rounded px-2 py-1.5 text-sm"
        >
          {KIND_OPTIONS.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
        <input
          value={form.value}
          onChange={(e) => setForm({ ...form, value: e.target.value })}
          placeholder={t.alerts.value}
          className="border rounded px-2 py-1.5 text-sm w-32"
        />
        <button
          onClick={create}
          className="bg-blue-600 text-white rounded px-3 text-sm"
        >
          {t.alerts.create}
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">{t.alerts.noAlerts}</p>
      ) : (
        rows.map((a) => (
          <div
            key={a.id}
            className="bg-white dark:bg-slate-900 border rounded-xl p-3 flex justify-between text-sm"
          >
            <span>
              {a.stock.symbol} · {a.type}{" "}
              {a.value ?? ""}{" "}
              {a.triggered ? (
                <span className="text-amber-600 font-bold">{t.alerts.triggered}</span>
              ) : (
                <span className="text-slate-500">{t.alerts.active}</span>
              )}
            </span>
            <button onClick={() => del(a.id)} className="text-red-600">
              {t.alerts.delete}
            </button>
          </div>
        ))
      )}
    </div>
  );
}
