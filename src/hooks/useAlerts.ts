import { useCallback, useEffect, useState } from "react";

export type AlertKind =
  | "price"
  | "changePct"
  | "rsi"
  | "score"
  | "signal"
  | "volume"
  | "high52"
  | "low52"
  | "news"
  | "earnings";

export type AlertOp = "above" | "below" | "equals";

export interface Alert {
  id: string;
  symbol: string;
  kind: AlertKind;
  op: AlertOp;
  /** Threshold. Unused for high52/low52 (evaluated against live 52w band). */
  value: number | string | null;
  active: boolean;
  createdAt: string;
}

export interface TriggerRecord {
  at: string;
  snapshot: string;
}

const ALERTS_KEY = "si-alerts";
const TRIGGERED_KEY = "si-alerts-triggered";

/**
 * BACKEND CONTRACT (not yet available — no alert/push/event infra
 * exists server-side as of Phase 5):
 * - News alerts need a per-symbol event feed, e.g.
 *   GET /api/v1/market/india/events/:symbol (SSE or poll) returning
 *   [{ type: "news"|"earnings", at, title, url }].
 * - Until such an endpoint exists, news/earnings kinds are NOT
 *   creatable in the UI and are never evaluated. Everything else is
 *   evaluated client-side against real quote/compare data below.
 * - A future server evaluator could reuse evaluateAlert() semantics.
 */
export const NEEDS_BACKEND: AlertKind[] = ["news", "earnings"];

export interface AlertData {
  price?: number | null;
  changePct?: number | null;
  rsi14?: number | null;
  score?: number | null;
  signal?: string | null;
  volume?: number | null;
  week52High?: number | null;
  week52Low?: number | null;
}

export type AlertStatus = "triggered" | "ok" | "nodata" | "disabled" | "needs-backend";

/**
 * Pure condition check. Missing datum → "nodata" (never triggers,
 * never silently clears on bad data — callers keep prior state).
 */
export function evaluateAlert(a: Alert, d: AlertData): AlertStatus {
  if (!a.active) return "disabled";
  if (NEEDS_BACKEND.includes(a.kind)) return "needs-backend";
  const n = (v: unknown): number | null => {
    if (v === null || v === undefined) return null;
    const x = Number(v);
    return Number.isFinite(x) ? x : null;
  };
  const above = (v: number | null, t: number | null) => (v == null || t == null ? "nodata" as const : v >= t ? "triggered" as const : "ok" as const);
  const below = (v: number | null, t: number | null) => (v == null || t == null ? "nodata" as const : v <= t ? "triggered" as const : "ok" as const);
  const t = typeof a.value === "number" ? a.value : Number(a.value);
  const thr = Number.isFinite(t) ? t : null;
  switch (a.kind) {
    case "price":
      return a.op === "above" ? above(n(d.price), thr) : below(n(d.price), thr);
    case "changePct":
      return a.op === "above" ? above(n(d.changePct), thr) : below(n(d.changePct), thr);
    case "rsi":
      return a.op === "above" ? above(n(d.rsi14), thr) : below(n(d.rsi14), thr);
    case "score":
      return a.op === "above" ? above(n(d.score), thr) : below(n(d.score), thr);
    case "volume":
      return a.op === "above" ? above(n(d.volume), thr) : below(n(d.volume), thr);
    case "signal": {
      if (!d.signal || typeof a.value !== "string") return "nodata";
      return d.signal.toUpperCase() === a.value.toUpperCase() ? "triggered" : "ok";
    }
    case "high52": {
      const p = n(d.price);
      const h = n(d.week52High);
      return p == null || h == null || h <= 0 ? "nodata" : p >= h ? "triggered" : "ok";
    }
    case "low52": {
      const p = n(d.price);
      const l = n(d.week52Low);
      return p == null || l == null || l <= 0 ? "nodata" : p <= l ? "triggered" : "ok";
    }
    default:
      return "nodata";
  }
}

export function describeAlert(a: Alert): string {
  const sym = a.symbol;
  const v = typeof a.value === "number" ? a.value.toLocaleString("en-IN") : a.value;
  switch (a.kind) {
    case "price": return `${sym} price ${a.op === "above" ? "≥" : "≤"} ${v}`;
    case "changePct": return `${sym} day change ${a.op === "above" ? "≥" : "≤"} ${v}%`;
    case "rsi": return `${sym} RSI ${a.op === "above" ? "≥" : "≤"} ${v}`;
    case "score": return `${sym} AI score ${a.op === "above" ? "≥" : "≤"} ${v}`;
    case "volume": return `${sym} volume ${a.op === "above" ? "≥" : "≤"} ${v}`;
    case "signal": return `${sym} signal is ${v}`;
    case "high52": return `${sym} hits 52-week high`;
    case "low52": return `${sym} hits 52-week low`;
    case "news": return `${sym} news (needs backend)`;
    case "earnings": return `${sym} earnings (needs backend)`;
  }
}

function uid(): string {
  return `al-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Alert store: localStorage CRUD + triggered-transition log.
 * Evaluation runs wherever fresh market data exists (Watchlist
 * page); this hook only stores, never fetches.
 */
export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>(() => read<Alert[]>(ALERTS_KEY, []));
  const [triggered, setTriggered] = useState<Record<string, TriggerRecord>>(() =>
    read<Record<string, TriggerRecord>>(TRIGGERED_KEY, {})
  );

  useEffect(() => {
    try {
      localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts.slice(0, 100)));
    } catch {
      /* ignore */
    }
  }, [alerts]);

  useEffect(() => {
    try {
      localStorage.setItem(TRIGGERED_KEY, JSON.stringify(triggered));
    } catch {
      /* ignore */
    }
  }, [triggered]);

  const create = useCallback((draft: Omit<Alert, "id" | "createdAt" | "active">): Alert | null => {
    if (NEEDS_BACKEND.includes(draft.kind)) return null;
    const a: Alert = {
      ...draft,
      symbol: draft.symbol.trim().toUpperCase(),
      id: uid(),
      active: true,
      createdAt: new Date().toISOString(),
    };
    if (!a.symbol) return null;
    setAlerts((prev) => (prev.length >= 100 ? prev : [...prev, a]));
    return a;
  }, []);

  const remove = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    setTriggered((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const toggle = useCallback((id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a)));
  }, []);

  /**
   * Merge one evaluation pass: record ok→triggered transitions with
   * a data snapshot, re-arm ids back to ok. "nodata" keeps prior state.
   */
  const ingest = useCallback((results: { alert: Alert; status: AlertStatus; snapshot: string }[]) => {
    setTriggered((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const { alert, status, snapshot } of results) {
        if (status === "triggered" && !(alert.id in next)) {
          next[alert.id] = { at: new Date().toISOString(), snapshot };
          changed = true;
        } else if (status === "ok" && alert.id in next) {
          delete next[alert.id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, []);

  const clearTriggered = useCallback((id: string) => {
    setTriggered((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  return { alerts, triggered, create, remove, toggle, ingest, clearTriggered };
}

export default useAlerts;
