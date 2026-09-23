import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { marketApi } from "../api/market";
import { useLang } from "../i18n/LanguageContext";

interface SearchHit {
  symbol: string;
  appSymbol?: string;
  name?: string;
  exchange?: string;
}

type Kind = "Symbol" | "Company" | "Index" | "Sector";

function kindOf(hit: SearchHit, query: string): Kind {
  const q = query.trim().toUpperCase();
  const sym = (hit.appSymbol || hit.symbol || "").toUpperCase();
  if (/^(NIFTY|SENSEX|BANK|INDIA VIX|NSE|BSE)/.test(sym) || /INDEX/.test((hit.exchange || "").toUpperCase())) {
    return "Index";
  }
  if (sym === q || sym.startsWith(q)) return "Symbol";
  return "Company";
}

const KIND_TONE: Record<Kind, string> = {
  Symbol: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40",
  Company: "bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/40",
  Index: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40",
  Sector: "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/40",
};

/**
 * Institutional Global Search with debouncing, keyboard navigation, and keyboard shortcut support.
 */
export function GlobalSearch({ autoFocus = false, placeholder }: { autoFocus?: boolean; placeholder?: string }) {
  const navigate = useNavigate();
  const { t } = useLang();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [active, setActive] = useState(-1);
  const seq = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxId = useRef(`si-search-${Math.random().toString(36).slice(2, 8)}`);
  const listId = `${boxId.current}-list`;

  // Global hotkey Ctrl+K / Cmd+K to focus search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        if (q.trim()) setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [q]);

  // Debounced single-flight search against the real market API.
  useEffect(() => {
    const query = q.trim();
    if (!query) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      setError("");
      return;
    }
    setLoading(true);
    setOpen(true);
    const mySeq = ++seq.current;
    const timer = setTimeout(async () => {
      try {
        const r = await marketApi.search(query);
        if (seq.current !== mySeq) return;
        setResults(Array.isArray(r.results) ? r.results.slice(0, 8) : []);
        setError("");
        setActive(-1);
      } catch {
        if (seq.current !== mySeq) return;
        setResults([]);
        setError(t.hdr.searchFail);
      } finally {
        if (seq.current === mySeq) setLoading(false);
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [q]);

  // Close on outside click.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const go = (hit: SearchHit) => {
    const sym = hit.appSymbol || hit.symbol;
    setOpen(false);
    setQ("");
    navigate(`/stocks/${sym}`);
  };

  return (
    <div ref={rootRef} className="relative w-full">
      <div role="combobox" aria-expanded={open} aria-haspopup="listbox" aria-owns={listId} className="relative">
        <span aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs sm:text-sm pointer-events-none">
          🔍
        </span>
        <input
          ref={inputRef}
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q.trim() && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              return;
            }
            if (!open || !results.length) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => (a + 1) % results.length);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => (a - 1 + results.length) % results.length);
            } else if (e.key === "Enter" && active >= 0 && results[active]) {
              e.preventDefault();
              go(results[active]);
            }
          }}
          placeholder={placeholder || t.hdr.searchPh}
          aria-label={t.hdr.searchAria}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          className="w-full border border-slate-200/90 dark:border-slate-800/80 rounded-xl pl-8 sm:pl-9 pr-14 py-1.5 sm:py-2 text-xs sm:text-sm bg-slate-50/80 dark:bg-[#0e1626] hover:bg-white dark:hover:bg-[#131d31] focus:bg-white dark:focus:bg-[#0e1626] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {q ? (
            <button
              type="button"
              aria-label={t.hdr.searchClear}
              onClick={() => setQ("")}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-1"
            >
              ✕
            </button>
          ) : (
            <kbd className="hidden sm:inline-block text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded px-1.5 py-0.5">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {open && (
        <div className="absolute z-40 w-full mt-1.5 bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl shadow-pop overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {loading && !results.length && !error && (
            <p role="status" className="px-4 py-3 text-xs sm:text-sm text-slate-500 flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              {t.hdr.searching}
            </p>
          )}
          {error && (
            <p role="alert" className="px-4 py-3 text-xs sm:text-sm text-rose-600 dark:text-rose-400">
              {error}
            </p>
          )}
          {!loading && !error && results.length === 0 && q.trim() && (
            <p role="status" className="px-4 py-3 text-xs sm:text-sm text-slate-500">
              {t.hdr.searchEmpty}
            </p>
          )}
          {results.length > 0 && (
            <ul role="listbox" id={listId} aria-label={t.hdr.searchResults} className="max-h-72 overflow-auto p-1.5 space-y-0.5">
              <li aria-hidden="true" className="px-3 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {t.hdr.searchGroup}
              </li>
              {results.map((s, i) => {
                const kind = kindOf(s, q);
                return (
                  <li
                    key={s.appSymbol || s.symbol}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === active}
                  >
                    <button
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(s)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-xs sm:text-sm text-left rounded-xl transition-colors ${
                        i === active
                          ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                      }`}
                    >
                      <span className="font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">
                        {s.appSymbol || s.symbol}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 truncate flex-1 text-xs">
                        {s.name || "Data unavailable"} {s.exchange ? `· ${s.exchange}` : ""}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${KIND_TONE[kind]}`}>
                        {kind === "Symbol" ? t.hdr.kindSymbol : kind === "Company" ? t.hdr.kindCompany : kind === "Index" ? t.hdr.kindIndex : t.hdr.kindSector}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;

