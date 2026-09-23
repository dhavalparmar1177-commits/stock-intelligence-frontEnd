// useMarketSocket — React hook for real-time market data via WebSocket.
// Connects to ws://localhost:4001, subscribes to symbols, and returns live quotes.
// Falls back to REST polling if WebSocket is unavailable.

import { useEffect, useRef, useState, useCallback } from "react";
import { marketApi } from "../api/market";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:4001";
const STALE_THRESHOLD_MS = 5_000;
const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;

export type WsStatus = "disconnected" | "connecting" | "connected" | "reconnecting";

interface LiveQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  open: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  volume: number | null;
  marketTime: string | null;
  timestamp: string; // when we received the update
}

interface UseMarketSocketResult {
  quotes: Map<string, LiveQuote>;
  status: WsStatus;
  isStale: boolean;
  subscribe: (symbols: string[]) => void;
  unsubscribe: (symbols: string[]) => void;
}

export function useMarketSocket(initialSymbols: string[] = []): UseMarketSocketResult {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelay = useRef(RECONNECT_BASE_MS);
  const subscribedRef = useRef<Set<string>>(new Set());
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [status, setStatus] = useState<WsStatus>("disconnected");
  const [quotes, setQuotes] = useState<Map<string, LiveQuote>>(new Map());
  const [isStale, setIsStale] = useState(false);

  // Track last update time for stale detection.
  const lastUpdateRef = useRef<number>(0);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    setStatus((s) => (subscribedRef.current.size > 0 ? "reconnecting" : "connecting"));

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectDelay.current = RECONNECT_BASE_MS;
        setStatus("connected");
        // Re-subscribe to all previously subscribed symbols.
        if (subscribedRef.current.size > 0) {
          ws.send(JSON.stringify({ action: "subscribe", symbols: [...subscribedRef.current] }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "quote" && msg.data) {
            const q: LiveQuote = { ...msg.data, timestamp: msg.timestamp };
            lastUpdateRef.current = Date.now();
            setIsStale(false);
            setQuotes((prev) => new Map(prev).set(q.symbol, q));
          }
        } catch { /* ignore malformed messages */ }
      };

      ws.onclose = () => {
        if (subscribedRef.current.size > 0) {
          scheduleReconnect();
        } else {
          setStatus("disconnected");
        }
      };

      ws.onerror = () => {
        // onclose will fire after onerror, handling reconnect there.
      };
    } catch {
      scheduleReconnect();
    }
  }, []);

  const scheduleReconnect = useCallback(() => {
    setStatus("reconnecting");
    reconnectRef.current = setTimeout(() => {
      reconnectDelay.current = Math.min(reconnectDelay.current * 2, RECONNECT_MAX_MS);
      connect();
    }, reconnectDelay.current);
  }, [connect]);

  const subscribe = useCallback((symbols: string[]) => {
    for (const s of symbols) subscribedRef.current.add(s);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: "subscribe", symbols }));
    } else {
      connect();
    }
  }, [connect]);

  const unsubscribe = useCallback((symbols: string[]) => {
    for (const s of symbols) subscribedRef.current.delete(s);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: "unsubscribe", symbols }));
    }
  }, []);

  // Stale detection — if no update in STALE_THRESHOLD_MS, mark as stale.
  useEffect(() => {
    const timer = setInterval(() => {
      if (lastUpdateRef.current > 0 && Date.now() - lastUpdateRef.current > STALE_THRESHOLD_MS) {
        setIsStale(true);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // REST fallback polling — if WebSocket is disconnected, poll via REST.
  useEffect(() => {
    if (status === "connected" || subscribedRef.current.size === 0) {
      if (pollTimerRef.current) { clearInterval(pollTimerRef.current); pollTimerRef.current = null; }
      return;
    }
    // Poll every 15s as fallback.
    pollTimerRef.current = setInterval(async () => {
      const syms = [...subscribedRef.current];
      if (!syms.length) return;
      try {
        const r = await marketApi.quotes(syms);
        if (r.quotes) {
          const now = new Date().toISOString();
          setQuotes((prev) => {
            const next = new Map(prev);
            for (const q of r.quotes) {
              next.set(q.appSymbol || q.symbol, { ...q, timestamp: now });
            }
            return next;
          });
        }
      } catch { /* REST fallback failed, will retry */ }
    }, 15_000);
    return () => { if (pollTimerRef.current) { clearInterval(pollTimerRef.current); pollTimerRef.current = null; } };
  }, [status]);

  // Subscribe to initial symbols on mount.
  useEffect(() => {
    if (initialSymbols.length) subscribe(initialSymbols);
    return () => {
      // Cleanup on unmount.
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { quotes, status, isStale, subscribe, unsubscribe };
}
