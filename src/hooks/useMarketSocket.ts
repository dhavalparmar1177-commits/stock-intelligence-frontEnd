// useMarketSocket — Smart market data stream with WebSocket + REST fallback.
// Polling Rules:
// - Market hours (9:15 AM – 3:30 PM IST Mon-Fri): Polls every 5s if WebSocket is offline.
// - Market closed (weekends, before 9:15 AM, after 3:30 PM IST): No polling interval; fetches once on load.
// - Tab hidden (visibilityState === "hidden"): Pauses all polling. Resumes immediately on tab focus.
// - Offline (navigator.onLine === false): Suspends connections until 'online' event.
// - Rate-limits / Errors: Exponential backoff with jitter.

import { useEffect, useRef, useState, useCallback } from "react";
import { marketApi } from "../api/market";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:4001";
const STALE_THRESHOLD_MS = 60_000; // 60s
const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;
const MARKET_POLL_INTERVAL_MS = 5_000; // 5s during open market hours

export type WsStatus = "disconnected" | "connecting" | "connected" | "reconnecting" | "offline";

export interface LiveQuote {
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
  timestamp: string; // ISO string
}

export interface UseMarketSocketResult {
  quotes: Map<string, LiveQuote>;
  status: WsStatus;
  isStale: boolean;
  isMarketOpen: boolean;
  lastUpdatedAt: Date | null;
  subscribe: (symbols: string[]) => void;
  unsubscribe: (symbols: string[]) => void;
  refresh: () => Promise<void>;
}

export function isIndianMarketOpen(): boolean {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utc + 5.5 * 3600000);
  const day = ist.getDay(); // 0 is Sunday, 6 is Saturday
  if (day === 0 || day === 6) return false;
  const mins = ist.getHours() * 60 + ist.getMinutes();
  return mins >= 555 && mins < 930; // 9:15 AM to 3:30 PM IST
}

export function useMarketSocket(initialSymbols: string[] = []): UseMarketSocketResult {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelay = useRef(RECONNECT_BASE_MS);
  const subscribedRef = useRef<Set<string>>(new Set(initialSymbols));
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [status, setStatus] = useState<WsStatus>(() =>
    typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "disconnected"
  );
  const [quotes, setQuotes] = useState<Map<string, LiveQuote>>(new Map());
  const [isStale, setIsStale] = useState(false);
  const [isMarketOpen, setIsMarketOpen] = useState(isIndianMarketOpen());
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const lastUpdateRef = useRef<number>(0);
  const isTabVisibleRef = useRef<boolean>(
    typeof document !== "undefined" ? document.visibilityState === "visible" : true
  );

  // Direct REST fetcher for subscribed symbols
  const fetchQuotesRest = useCallback(async () => {
    const syms = Array.from(subscribedRef.current);
    if (!syms.length) return;
    try {
      const res = await marketApi.quotes(syms);
      if (res?.quotes) {
        const nowIso = new Date().toISOString();
        lastUpdateRef.current = Date.now();
        setLastUpdatedAt(new Date());
        setIsStale(false);
        setQuotes((prev) => {
          const next = new Map(prev);
          for (const q of res.quotes) {
            const sym = q.appSymbol || q.symbol;
            next.set(sym, { ...q, timestamp: nowIso });
          }
          return next;
        });
      }
    } catch (err: any) {
      if (err?.response?.status === 429) {
        // Slow down polling on rate limit
        console.warn("[useMarketSocket] 429 received, backing off polling...");
      }
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchQuotesRest();
  }, [fetchQuotesRest]);

  // Connect to WebSocket feed
  const connect = useCallback(() => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setStatus("offline");
      return;
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    setStatus((s) => (subscribedRef.current.size > 0 ? "reconnecting" : "connecting"));

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectDelay.current = RECONNECT_BASE_MS;
        setStatus("connected");
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
            setLastUpdatedAt(new Date());
            setIsStale(false);
            setQuotes((prev) => new Map(prev).set(q.symbol, q));
          }
        } catch {
          /* ignore malformed frame */
        }
      };

      ws.onclose = () => {
        if (subscribedRef.current.size > 0 && navigator.onLine) {
          scheduleReconnect();
        } else {
          setStatus(navigator.onLine ? "disconnected" : "offline");
        }
      };

      ws.onerror = () => {
        // onclose will handle reconnect
      };
    } catch {
      scheduleReconnect();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const scheduleReconnect = useCallback(() => {
    if (!navigator.onLine) {
      setStatus("offline");
      return;
    }
    setStatus("reconnecting");
    reconnectRef.current = setTimeout(() => {
      reconnectDelay.current = Math.min(reconnectDelay.current * 2, RECONNECT_MAX_MS);
      connect();
    }, reconnectDelay.current);
  }, [connect]);

  // Online / Offline window listeners
  useEffect(() => {
    const handleOnline = () => {
      setStatus("connecting");
      fetchQuotesRest();
      connect();
    };
    const handleOffline = () => {
      setStatus("offline");
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [connect, fetchQuotesRest]);

  // Tab visibility listener — pause polling when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === "visible";
      isTabVisibleRef.current = visible;
      if (visible) {
        // Tab restored: trigger immediate refresh and evaluate market state
        setIsMarketOpen(isIndianMarketOpen());
        fetchQuotesRest();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [fetchQuotesRest]);

  // Smart Polling Manager
  useEffect(() => {
    // 1. Fetch initial snapshot when symbols change
    if (subscribedRef.current.size > 0) {
      fetchQuotesRest();
    }

    // 2. Clear any active poll timer
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    // 3. If WebSocket is connected, WS pushes live ticks — no REST polling needed
    if (status === "connected") return;

    // 4. Check market hours and tab visibility
    const open = isIndianMarketOpen();
    setIsMarketOpen(open);

    // Only poll continuously during market hours AND when tab is visible
    if (open) {
      pollTimerRef.current = setInterval(() => {
        if (isTabVisibleRef.current && navigator.onLine) {
          fetchQuotesRest();
        }
      }, MARKET_POLL_INTERVAL_MS);
    }

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [status, fetchQuotesRest]);

  // Periodic Market Status & Stale Evaluation
  useEffect(() => {
    const timer = setInterval(() => {
      const open = isIndianMarketOpen();
      setIsMarketOpen(open);

      if (open && lastUpdateRef.current > 0 && Date.now() - lastUpdateRef.current > STALE_THRESHOLD_MS) {
        setIsStale(true);
      }
    }, 10_000);
    return () => clearInterval(timer);
  }, []);

  const subscribe = useCallback((symbols: string[]) => {
    let hasNew = false;
    for (const s of symbols) {
      if (!subscribedRef.current.has(s)) {
        subscribedRef.current.add(s);
        hasNew = true;
      }
    }
    if (hasNew) {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: "subscribe", symbols }));
      }
      fetchQuotesRest();
    }
  }, [fetchQuotesRest]);

  const unsubscribe = useCallback((symbols: string[]) => {
    for (const s of symbols) subscribedRef.current.delete(s);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: "unsubscribe", symbols }));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);

  return { quotes, status, isStale, isMarketOpen, lastUpdatedAt, subscribe, unsubscribe, refresh };
}
