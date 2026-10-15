import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  TrendingUp,
  History,
  Compass,
  ArrowRight,
  Sparkles,
  Layers,
  Calendar,
  X,
  Building2,
} from "lucide-react";
import { marketApi } from "../api/market";
import { useLang } from "../i18n/LanguageContext";

interface SearchHit {
  symbol: string;
  appSymbol?: string;
  name?: string;
  exchange?: string;
}

const TRENDING_TICKERS = [
  { symbol: "RELIANCE", name: "Reliance Industries Ltd" },
  { symbol: "TCS", name: "Tata Consultancy Services" },
  { symbol: "HDFCBANK", name: "HDFC Bank Ltd" },
  { symbol: "INFY", name: "Infosys Ltd" },
  { symbol: "TATAMOTORS", name: "Tata Motors Ltd" },
  { symbol: "SBIN", name: "State Bank of India" },
];

const QUICK_ACTIONS = [
  { label: "AI Opportunities", to: "/opportunities", icon: Sparkles, hint: "View AI scored stocks" },
  { label: "Live Market Hub", to: "/live", icon: TrendingUp, hint: "Indices & breadth" },
  { label: "IPO Center", to: "/ipos", icon: Layers, hint: "GMP & Subscriptions" },
  { label: "Stock Screener", to: "/screener", icon: Compass, hint: "Filter universe" },
  { label: "Paper Trading", to: "/paper-trade", icon: Building2, hint: "Virtual simulator" },
  { label: "Market Calendar", to: "/calendar", icon: Calendar, hint: "Results & corporate actions" },
];

const RECENT_KEY = "si-recent-searches";

function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(sym: string) {
  try {
    const prev = getRecentSearches().filter((s) => s !== sym);
    localStorage.setItem(RECENT_KEY, JSON.stringify([sym, ...prev].slice(0, 5)));
  } catch {
    /* ignore */
  }
}

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { t } = useLang();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>(getRecentSearches);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setRecent(getRecentSearches());
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const r = await marketApi.search(q);
        setResults(Array.isArray(r.results) ? r.results.slice(0, 8) : []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  // Global keydown escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSelectSymbol = (sym: string) => {
    saveRecentSearch(sym);
    onClose();
    navigate(`/stocks/${sym}`);
  };

  const handleSelectAction = (to: string) => {
    onClose();
    navigate(to);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command search dialog"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/60 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white/95 dark:bg-[#0D1424]/90 backdrop-blur-[24px] border border-slate-200 dark:border-white/[0.08] rounded-[20px] shadow-[0_24px_80px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] overflow-hidden flex flex-col max-h-[80vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200/80 dark:border-white/[0.06]">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company, ticker (e.g. RELIANCE, TCS) or command..."
            className="flex-1 bg-transparent text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Clear query"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
              ESC
            </kbd>
          )}
        </div>

        {/* Results Container */}
        <div className="overflow-y-auto p-2 space-y-4">
          {loading && (
            <div className="p-4 text-center text-xs text-slate-400 animate-pulse">
              Searching live Indian markets...
            </div>
          )}

          {/* Search Hits */}
          {results.length > 0 && (
            <div>
              <p className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Matching Stocks (NSE / BSE)
              </p>
              <div className="space-y-0.5">
                {results.map((hit) => {
                  const sym = hit.appSymbol || hit.symbol;
                  return (
                    <button
                      key={sym}
                      onClick={() => handleSelectSymbol(sym)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-[#1a233d] transition group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100 font-display">
                          {sym}
                        </span>
                        <span className="text-xs text-slate-500 truncate max-w-[260px]">
                          {hit.name || t.gen.dataUnavailable}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {hit.exchange || "NSE"}
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!query && (
            <>
              {/* Recent Searches */}
              {recent.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-3 py-1">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5" /> Recent Searches
                    </p>
                    <button
                      onClick={() => {
                        localStorage.removeItem(RECENT_KEY);
                        setRecent([]);
                      }}
                      className="text-[11px] text-slate-400 hover:text-rose-500"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-3 py-1.5">
                    {recent.map((sym) => (
                      <button
                        key={sym}
                        onClick={() => handleSelectSymbol(sym)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-[#17203a] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 transition"
                      >
                        {sym}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Tickers */}
              <div>
                <p className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Trending in Market
                </p>
                <div className="grid grid-cols-2 gap-1 px-1">
                  {TRENDING_TICKERS.map((item) => (
                    <button
                      key={item.symbol}
                      onClick={() => handleSelectSymbol(item.symbol)}
                      className="flex items-center justify-between px-2.5 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-[#1a233d] transition group text-xs"
                    >
                      <span className="font-bold text-slate-900 dark:text-slate-100">{item.symbol}</span>
                      <span className="text-[11px] text-slate-400 truncate max-w-[130px]">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <p className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Quick Navigation
                </p>
                <div className="grid grid-cols-2 gap-1 px-1">
                  {QUICK_ACTIONS.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.to}
                        onClick={() => handleSelectAction(action.to)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-[#1a233d] transition group"
                      >
                        <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{action.label}</p>
                          <p className="text-[10px] text-slate-400">{action.hint}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {query && !loading && results.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching Indian stocks found for &quot;{query}&quot;
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-[#0e1626]/50 flex items-center justify-between text-[11px] text-slate-400">
          <span>Search verified NSE / BSE securities</span>
          <div className="flex items-center gap-2">
            <span>Navigation:</span>
            <kbd className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              ↑↓
            </kbd>
            <kbd className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              ↵
            </kbd>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
