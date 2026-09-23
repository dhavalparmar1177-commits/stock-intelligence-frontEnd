import { useCallback, useEffect, useRef, useState } from "react";

export interface Watchlist {
  id: string;
  name: string;
  symbols: string[];
  createdAt: string;
}

const LISTS_KEY = "si-watchlist-lists";
const LEGACY_KEY = "si-watchlist";
const MAX_LISTS = 10;
export const MAX_SYMBOLS = 10;

function uid(): string {
  return `wl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function clean(symbols: unknown): string[] {
  if (!Array.isArray(symbols)) return [];
  return [...new Set(
    symbols.filter((s): s is string => typeof s === "string").map((s) => s.trim().toUpperCase()).filter(Boolean)
  )].slice(0, MAX_SYMBOLS);
}

function readLists(): Watchlist[] {
  try {
    const raw = localStorage.getItem(LISTS_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const lists = parsed
          .filter((l) => l && typeof (l as Watchlist).id === "string" && typeof (l as Watchlist).name === "string")
          .map((l) => ({ ...(l as Watchlist), symbols: clean((l as Watchlist).symbols) }));
        if (lists.length) return lists.slice(0, MAX_LISTS);
      }
    }
    // One-time migration from the Phase 2 single-list store.
    const legacy: unknown = JSON.parse(localStorage.getItem(LEGACY_KEY) || "[]");
    const syms = clean(legacy);
    try {
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      /* ignore */
    }
    return [{ id: uid(), name: "My Stocks", symbols: syms, createdAt: new Date().toISOString() }];
  } catch {
    return [{ id: uid(), name: "My Stocks", symbols: [], createdAt: new Date().toISOString() }];
  }
}

/**
 * Multi-list watchlist store (Phase 5). No backend tables exist, so
 * lists persist in localStorage. Symbols are real NSE/BSE tickers
 * only — callers add validated symbols; lists are never seeded
 * with fake stocks.
 */
export function useWatchlists() {
  const [lists, setLists] = useState<Watchlist[]>(readLists);
  const [activeId, setActiveId] = useState<string | null>(null);
  const listsRef = useRef(lists);
  listsRef.current = lists;

  useEffect(() => {
    try {
      localStorage.setItem(LISTS_KEY, JSON.stringify(lists));
    } catch {
      /* private mode — lists just won't persist */
    }
  }, [lists]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LISTS_KEY) setLists(readLists());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const active = lists.find((l) => l.id === activeId) || lists[0] || null;

  const create = useCallback((name: string): string | null => {
    const n = name.trim().slice(0, 40);
    if (!n) return null;
    const prev = listsRef.current;
    const existing = prev.find((l) => l.name.toLowerCase() === n.toLowerCase());
    if (existing) return existing.id;
    if (prev.length >= MAX_LISTS) return null;
    const id = uid();
    setLists([...prev, { id, name: n, symbols: [], createdAt: new Date().toISOString() }]);
    return id;
  }, []);

  const rename = useCallback((id: string, name: string) => {
    const n = name.trim().slice(0, 40);
    if (!n) return;
    setLists((prev) => prev.map((l) => (l.id === id ? { ...l, name: n } : l)));
  }, []);

  const removeList = useCallback((id: string) => {
    setLists((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((l) => l.id !== id);
    });
  }, []);

  const addSymbol = useCallback((listId: string, symbol: string): "ok" | "exists" | "full" | "missing" => {
    const u = symbol.trim().toUpperCase();
    if (!u) return "missing";
    const list = listsRef.current.find((l) => l.id === listId);
    if (!list) return "missing";
    if (list.symbols.includes(u)) return "exists";
    if (list.symbols.length >= MAX_SYMBOLS) return "full";
    setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, symbols: [...l.symbols, u] } : l)));
    return "ok";
  }, []);

  const removeSymbol = useCallback((listId: string, symbol: string) => {
    const u = symbol.trim().toUpperCase();
    setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, symbols: l.symbols.filter((s) => s !== u) } : l)));
  }, []);

  const moveSymbol = useCallback((listId: string, symbol: string, dir: -1 | 1) => {
    const u = symbol.trim().toUpperCase();
    setLists((prev) =>
      prev.map((l) => {
        if (l.id !== listId) return l;
        const i = l.symbols.indexOf(u);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= l.symbols.length) return l;
        const next = [...l.symbols];
        [next[i], next[j]] = [next[j], next[i]];
        return { ...l, symbols: next };
      })
    );
  }, []);

  return { lists, active, activeId: active?.id || null, setActiveId, create, rename, removeList, addSymbol, removeSymbol, moveSymbol };
}

/**
 * Back-compat single-list API used by the header actions, dashboard
 * section and screener stars. Operates on the active (first) list.
 */
export function useWatchlist() {
  const { active, addSymbol, removeSymbol } = useWatchlists();
  const symbols = active?.symbols || [];
  const add = useCallback((s: string) => void addSymbol(active?.id || "", s), [active?.id, addSymbol]);
  const remove = useCallback((s: string) => removeSymbol(active?.id || "", s), [active?.id, removeSymbol]);
  const has = useCallback((s: string) => symbols.includes(s.trim().toUpperCase()), [symbols]);
  return { symbols, add, remove, has, full: symbols.length >= MAX_SYMBOLS };
}

export default useWatchlists;
