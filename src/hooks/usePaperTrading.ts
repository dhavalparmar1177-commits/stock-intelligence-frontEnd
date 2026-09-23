import { useCallback, useEffect, useState } from "react";

export interface TradeOrder {
  id: string;
  symbol: string;
  action: "BUY" | "SELL";
  qty: number;
  price: number;
  total: number;
  at: string;
}

export interface Holding {
  symbol: string;
  qty: number;
  avgBuyPrice: number;
  boughtAt: string;
}

export interface PaperPortfolio {
  balance: number;
  holdings: Holding[];
  history: TradeOrder[];
  startedAt: string;
}

const INITIAL_BALANCE = 1000000; // ₹10,00,000 virtual cash
const STORAGE_KEY = "si-paper-trading";

function readState(): PaperPortfolio {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.balance === "number" && Array.isArray(parsed.holdings)) {
        return parsed;
      }
    }
  } catch {
    /* fallback to default */
  }
  return {
    balance: INITIAL_BALANCE,
    holdings: [],
    history: [],
    startedAt: new Date().toISOString(),
  };
}

export function usePaperTrading() {
  const [portfolio, setPortfolio] = useState<PaperPortfolio>(readState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
    } catch {
      /* ignore storage errors */
    }
  }, [portfolio]);

  const buy = useCallback((symbol: string, qty: number, price: number): { success: boolean; message: string } => {
    const sym = symbol.trim().toUpperCase();
    if (!sym) return { success: false, message: "Invalid symbol" };
    if (qty <= 0) return { success: false, message: "Quantity must be greater than 0" };
    if (price <= 0) return { success: false, message: "Invalid price" };

    const total = qty * price;

    if (portfolio.balance < total) {
      return { success: false, message: "Insufficient virtual balance" };
    }

    setPortfolio((prev) => {
      const existingHolding = prev.holdings.find((h) => h.symbol === sym);
      let updatedHoldings: Holding[];

      if (existingHolding) {
        const totalQty = existingHolding.qty + qty;
        const totalCost = existingHolding.qty * existingHolding.avgBuyPrice + total;
        const avgBuyPrice = totalCost / totalQty;

        updatedHoldings = prev.holdings.map((h) =>
          h.symbol === sym ? { ...h, qty: totalQty, avgBuyPrice } : h
        );
      } else {
        updatedHoldings = [
          ...prev.holdings,
          { symbol: sym, qty, avgBuyPrice: price, boughtAt: new Date().toISOString() },
        ];
      }

      const trade: TradeOrder = {
        id: `tr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        symbol: sym,
        action: "BUY",
        qty,
        price,
        total,
        at: new Date().toISOString(),
      };

      return {
        ...prev,
        balance: prev.balance - total,
        holdings: updatedHoldings,
        history: [trade, ...prev.history],
      };
    });

    return { success: true, message: `Bought ${qty} shares of ${sym}` };
  }, [portfolio.balance]);

  const sell = useCallback((symbol: string, qty: number, price: number): { success: boolean; message: string } => {
    const sym = symbol.trim().toUpperCase();
    if (!sym) return { success: false, message: "Invalid symbol" };
    if (qty <= 0) return { success: false, message: "Quantity must be greater than 0" };
    if (price <= 0) return { success: false, message: "Invalid price" };

    const existingHolding = portfolio.holdings.find((h) => h.symbol === sym);
    if (!existingHolding || existingHolding.qty < qty) {
      return { success: false, message: "Insufficient shares in holdings" };
    }

    const total = qty * price;

    setPortfolio((prev) => {
      const remainingQty = existingHolding.qty - qty;
      const updatedHoldings = remainingQty > 0
        ? prev.holdings.map((h) => (h.symbol === sym ? { ...h, qty: remainingQty } : h))
        : prev.holdings.filter((h) => h.symbol !== sym);

      const trade: TradeOrder = {
        id: `tr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        symbol: sym,
        action: "SELL",
        qty,
        price,
        total,
        at: new Date().toISOString(),
      };

      return {
        ...prev,
        balance: prev.balance + total,
        holdings: updatedHoldings,
        history: [trade, ...prev.history],
      };
    });

    return { success: true, message: `Sold ${qty} shares of ${sym}` };
  }, [portfolio.holdings]);

  const reset = useCallback(() => {
    const fresh: PaperPortfolio = {
      balance: INITIAL_BALANCE,
      holdings: [],
      history: [],
      startedAt: new Date().toISOString(),
    };
    setPortfolio(fresh);
  }, []);

  const getHolding = useCallback(
    (symbol: string): Holding | undefined => {
      return portfolio.holdings.find((h) => h.symbol === symbol.trim().toUpperCase());
    },
    [portfolio.holdings]
  );

  return { portfolio, buy, sell, reset, getHolding, INITIAL_BALANCE };
}

export default usePaperTrading;
