import { useEffect, useState } from "react";
import { useLang } from "../i18n/LanguageContext";
import usePaperTrading, { Holding, TradeOrder } from "../hooks/usePaperTrading";
import { marketApi } from "../api/market";
import { PageHeader } from "../components/layout/primitives";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import MetricCard from "../components/ui/MetricCard";
import Table, { Column } from "../components/ui/Table";
import { formatPrice2dp, formatPriceINR, formatPct } from "../design/tokens";

export function PaperTrading() {
  const { t } = useLang();
  const { portfolio, buy, sell, reset, INITIAL_BALANCE } = usePaperTrading();

  const [liveQuotes, setLiveQuotes] = useState<Record<string, { price: number; changePct: number }>>({});
  const [loadingQuotes, setLoadingQuotes] = useState(false);

  // Search & Trade Form State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ symbol: string; name: string }[]>([]);
  const [selectedStock, setSelectedStock] = useState<{ symbol: string; price: number } | null>(null);
  const [tradeQty, setTradeQty] = useState(1);
  const [tradeMessage, setTradeMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch live prices for current holdings
  useEffect(() => {
    const symbols = portfolio.holdings.map((h) => h.symbol);
    if (symbols.length === 0) return;

    setLoadingQuotes(true);
    marketApi
      .quotes(symbols)
      .then((data) => {
        const map: Record<string, { price: number; changePct: number }> = {};
        if (Array.isArray(data)) {
          data.forEach((q) => {
            if (q && q.symbol && typeof q.price === "number") {
              map[q.symbol.toUpperCase()] = { price: q.price, changePct: q.changePct ?? 0 };
            }
          });
        }
        setLiveQuotes(map);
      })
      .catch(() => {
        /* fallback to avg price if live fetch fails */
      })
      .finally(() => setLoadingQuotes(false));
  }, [portfolio.holdings]);

  // Handle Stock Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      marketApi
        .search(searchQuery)
        .then((res) => {
          if (Array.isArray(res)) {
            setSearchResults(res.slice(0, 5));
          }
        })
        .catch(() => setSearchResults([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Select stock from search result
  const handleSelectStock = (sym: string) => {
    setSelectedStock(null);
    marketApi
      .quotes([sym])
      .then((res) => {
        if (Array.isArray(res) && res[0]?.price) {
          setSelectedStock({ symbol: sym.toUpperCase(), price: res[0].price });
        }
      })
      .catch(() => setTradeMessage({ type: "error", text: "Failed to fetch current stock price" }));
    setSearchResults([]);
    setSearchQuery(sym);
  };

  // Portfolio calculations
  let holdingsValue = 0;
  portfolio.holdings.forEach((h) => {
    const curPrice = liveQuotes[h.symbol]?.price ?? h.avgBuyPrice;
    holdingsValue += h.qty * curPrice;
  });

  const totalPortfolioValue = portfolio.balance + holdingsValue;
  const totalPL = totalPortfolioValue - INITIAL_BALANCE;
  const totalPLPct = (totalPL / INITIAL_BALANCE) * 100;

  const handleBuy = () => {
    if (!selectedStock) return;
    const res = buy(selectedStock.symbol, tradeQty, selectedStock.price);
    setTradeMessage({ type: res.success ? "success" : "error", text: res.message });
  };

  const handleSell = () => {
    if (!selectedStock) return;
    const res = sell(selectedStock.symbol, tradeQty, selectedStock.price);
    setTradeMessage({ type: res.success ? "success" : "error", text: res.message });
  };

  const holdingsColumns: Column<Holding & { id: string }>[] = [
    {
      key: "symbol",
      header: "Symbol",
      cell: (r) => <span className="font-bold text-slate-900 dark:text-slate-100">{r.symbol}</span>,
    },
    {
      key: "qty",
      header: "Qty",
      align: "right",
      numeric: true,
      cell: (r) => r.qty,
    },
    {
      key: "avgBuyPrice",
      header: "Avg Price",
      align: "right",
      numeric: true,
      cell: (r) => `₹${formatPrice2dp(r.avgBuyPrice)}`,
    },
    {
      key: "livePrice",
      header: "Live Price",
      align: "right",
      numeric: true,
      cell: (r) => `₹${formatPrice2dp(liveQuotes[r.symbol]?.price ?? r.avgBuyPrice)}`,
    },
    {
      key: "pl",
      header: "P&L",
      align: "right",
      numeric: true,
      cell: (r) => {
        const livePrice = liveQuotes[r.symbol]?.price ?? r.avgBuyPrice;
        const curVal = r.qty * livePrice;
        const costVal = r.qty * r.avgBuyPrice;
        const pl = curVal - costVal;
        const plPct = (pl / costVal) * 100;
        return (
          <span className={`font-semibold ${pl >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            {pl >= 0 ? "+" : ""}₹{formatPrice2dp(pl)} ({formatPct(plPct)})
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      cell: (r) => (
        <Button variant="secondary" size="sm" onClick={() => handleSelectStock(r.symbol)} className="text-[11px] py-1 px-2">
          Trade
        </Button>
      ),
    },
  ];

  const historyColumns: Column<TradeOrder>[] = [
    {
      key: "at",
      header: "Time",
      cell: (r) => <span className="text-xs text-slate-500">{new Date(r.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>,
    },
    {
      key: "action",
      header: "Action",
      cell: (r) => <Badge tone={r.action === "BUY" ? "positive" : "negative"}>{r.action}</Badge>,
    },
    {
      key: "symbol",
      header: "Symbol",
      cell: (r) => <span className="font-bold">{r.symbol}</span>,
    },
    {
      key: "qty",
      header: "Qty",
      align: "right",
      numeric: true,
      cell: (r) => r.qty,
    },
    {
      key: "price",
      header: "Price",
      align: "right",
      numeric: true,
      cell: (r) => `₹${formatPrice2dp(r.price)}`,
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      numeric: true,
      cell: (r) => `₹${formatPriceINR(r.total)}`,
    },
  ];

  const holdingsRows = portfolio.holdings.map((h) => ({ ...h, id: h.symbol }));

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={t.paper?.title || "Paper Trading Simulator"}
        description={t.paper?.subtitle || "Practice trading real NSE/BSE stocks with virtual ₹10,00,000 cash"}
      />

      {/* Simulator Disclaimer Banner */}
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-4 flex items-start gap-3 text-amber-900 dark:text-amber-200 text-xs sm:text-sm">
        <span className="text-lg">🛡️</span>
        <div>
          <span className="font-semibold block mb-0.5">{t.paper?.disclaimer || "Virtual Simulator Mode"}</span>
          Every order uses real live market prices, but trades are executed with virtual risk-free cash. Use this to practice your strategies before investing real capital.
        </div>
      </div>

      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label={t.paper?.balance || "Virtual Cash Balance"}
          value={`₹${formatPriceINR(portfolio.balance)}`}
          sub="Available Cash"
        />
        <MetricCard
          label={t.paper?.totalValue || "Portfolio Total Value"}
          value={`₹${formatPriceINR(totalPortfolioValue)}`}
          sub={`Holdings: ₹${formatPriceINR(holdingsValue)}`}
        />
        <MetricCard
          label={t.paper?.totalPl || "Total P&L"}
          value={`₹${formatPriceINR(totalPL)}`}
          tone={totalPL >= 0 ? "positive" : "negative"}
          sub={`Since start (${new Date(portfolio.startedAt).toLocaleDateString()})`}
        />
      </div>

      {/* Main Grid: Trade Panel + Holdings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trade Execution Panel */}
        <Card className="lg:col-span-1 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {t.paper?.tradePanel || "Execute Virtual Trade"}
          </h3>

          {/* Stock Search Input */}
          <div className="relative">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Search Stock (NSE/BSE)
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. RELIANCE, TCS, INFY..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#131d31] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Auto-suggest dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white dark:bg-[#131d31] border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden">
                {searchResults.map((item) => (
                  <button
                    key={item.symbol}
                    onClick={() => handleSelectStock(item.symbol)}
                    className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs flex justify-between items-center"
                  >
                    <span className="font-bold text-slate-900 dark:text-slate-100">{item.symbol}</span>
                    <span className="text-slate-500 truncate max-w-[180px]">{item.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Stock Details & Controls */}
          {selectedStock ? (
            <div className="p-3 bg-slate-50 dark:bg-[#131d31] border border-slate-200 dark:border-slate-800 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{selectedStock.symbol}</span>
                <Badge tone="neutral">₹{formatPrice2dp(selectedStock.price)}</Badge>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">{t.paper?.qty || "Quantity"}</label>
                <input
                  type="number"
                  min="1"
                  value={tradeQty}
                  onChange={(e) => setTradeQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-1.5 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-between text-xs text-slate-500 pt-1">
                <span>{t.paper?.total || "Total Cost"}:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  ₹{formatPriceINR(selectedStock.price * tradeQty)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button variant="live" onClick={handleBuy} className="w-full text-xs">
                  {t.paper?.buy || "Buy (Virtual)"}
                </Button>
                <Button variant="danger" onClick={handleSell} className="w-full text-xs">
                  {t.paper?.sell || "Sell (Virtual)"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
              Search a stock above to see live price & execute trades
            </div>
          )}

          {/* Trade Feedback Alert */}
          {tradeMessage && (
            <div
              className={`p-2.5 rounded-lg text-xs font-medium ${
                tradeMessage.type === "success"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
              }`}
            >
              {tradeMessage.text}
            </div>
          )}

          {/* Reset Button */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => {
                if (window.confirm(t.paper?.resetConfirm || "Reset virtual portfolio?")) reset();
              }}
              className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
            >
              🔄 {t.paper?.reset || "Reset Virtual Portfolio"}
            </button>
          </div>
        </Card>

        {/* Current Holdings Table */}
        <Card className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {t.paper?.holdings || "Current Holdings"}
            </h3>
            {loadingQuotes && <span className="text-xs text-slate-400">Updating prices...</span>}
          </div>

          <Table
            caption={t.paper?.holdings || "Current Holdings"}
            columns={holdingsColumns}
            rows={holdingsRows}
            empty={
              <div className="py-12 text-center text-slate-500 text-xs">
                {t.paper?.noHoldings || "No holdings yet. Search a stock on the left to make your first practice trade!"}
              </div>
            }
          />
        </Card>
      </div>

      {/* Trade History */}
      <Card className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          {t.paper?.history || "Trade History"}
        </h3>
        <Table
          caption={t.paper?.history || "Trade History"}
          columns={historyColumns}
          rows={portfolio.history}
          empty={
            <div className="py-6 text-center text-slate-500 text-xs">
              {t.paper?.noHistory || "No trade history recorded yet."}
            </div>
          }
        />
      </Card>
    </div>
  );
}

export default PaperTrading;
