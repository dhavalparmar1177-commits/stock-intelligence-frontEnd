import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { marketApi } from "../api/market";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
export default function Portfolio() {
    const [lists, setLists] = useState([]);
    const [summary, setSummary] = useState(null);
    const [form, setForm] = useState({ portfolioId: "", symbol: "", quantity: "", purchasePrice: "" });
    const [livePnl, setLivePnl] = useState(null);
    const refreshLivePnl = async (alloc) => {
        const syms = Array.from(new Set((alloc || []).map((a) => a.symbol)));
        if (!syms.length) {
            setLivePnl(null);
            return;
        }
        try {
            const r = await marketApi.quotes(syms);
            const map = {};
            r.quotes.forEach((q) => { map[q.appSymbol] = q; });
            let invested = 0, current = 0;
            const rows = alloc.map((a) => {
                const L = map[a.symbol];
                const px = L?.price ?? a.currentPrice;
                const cur = a.quantity * px;
                const inv = a.quantity * a.purchasePrice;
                invested += inv;
                current += cur;
                return { ...a, livePrice: L?.price ?? null, liveChangePct: L?.changePct ?? null, liveValue: cur, livePnl: cur - inv };
            });
            setLivePnl({ invested, current, pnl: current - invested, pnlPct: invested ? ((current - invested) / invested) * 100 : 0, rows });
        }
        catch {
            setLivePnl(null);
        }
    };
    useEffect(() => { if (summary?.allocation)
        refreshLivePnl(summary.allocation); }, [summary]);
    const load = async () => {
        try {
            const r = await api.get("/portfolios");
            setLists(r.data);
            if (!form.portfolioId && r.data[0])
                setForm((f) => ({ ...f, portfolioId: r.data[0].id }));
            const s = await api.get("/portfolios/summary");
            setSummary(s.data);
        }
        catch { }
    };
    useEffect(() => { load(); }, []);
    const create = async () => { const r = await api.post("/portfolios", { name: "My Portfolio" }); setForm({ ...form, portfolioId: r.data.id }); load(); };
    const addH = async () => { await api.post(`/portfolios/${form.portfolioId}/holdings`, { symbol: form.symbol.toUpperCase(), quantity: Number(form.quantity), purchasePrice: Number(form.purchasePrice) }); load(); };
    if (!localStorage.getItem("accessToken"))
        return _jsxs("p", { className: "text-sm", children: ["Please ", _jsx(Link, { to: "/login", className: "text-blue-600", children: "login" }), " to use portfolio."] });
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("h1", { className: "text-xl font-bold", children: "Portfolio" }), summary && _jsxs("div", { className: "grid grid-cols-3 gap-2", children: [_jsxs("div", { className: "border rounded-xl p-3 bg-white dark:bg-slate-900", children: [_jsx("p", { className: "text-xs text-slate-500", children: "Invested" }), _jsx("p", { className: "font-bold", children: summary.invested.toFixed(2) })] }), _jsxs("div", { className: "border rounded-xl p-3 bg-white dark:bg-slate-900", children: [_jsx("p", { className: "text-xs text-slate-500", children: "Current" }), _jsx("p", { className: "font-bold", children: summary.current.toFixed(2) })] }), _jsxs("div", { className: "border rounded-xl p-3 bg-white dark:bg-slate-900", children: [_jsx("p", { className: "text-xs text-slate-500", children: "P/L" }), _jsxs("p", { className: `font-bold ${summary.pnl >= 0 ? "text-green-600" : "text-red-600"}`, children: [summary.pnl.toFixed(2), " (", summary.pnlPct.toFixed(1), "%)"] })] })] }), livePnl && _jsxs("div", { className: "border border-green-300 dark:border-green-800 rounded-xl p-3 bg-white dark:bg-slate-900", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("p", { className: "text-xs text-slate-500", children: "LIVE P&L (real prices)" }), _jsx("button", { onClick: () => summary?.allocation && refreshLivePnl(summary.allocation), className: "text-xs border border-green-500 text-green-700 rounded px-2 py-0.5", children: "\u21BB" })] }), _jsxs("p", { className: `font-bold text-lg ${livePnl.pnl >= 0 ? "text-green-600" : "text-red-600"}`, children: [livePnl.pnl.toFixed(2), " (", livePnl.pnlPct.toFixed(1), "%)"] }), _jsxs("p", { className: "text-xs text-slate-500", children: ["Current ", livePnl.current.toFixed(2), " \u00B7 Invested ", livePnl.invested.toFixed(2)] })] }), _jsxs("div", { className: "flex gap-2 flex-wrap", children: [_jsx("button", { onClick: create, className: "text-sm border rounded px-3 py-1.5", children: "New portfolio" }), _jsx("input", { placeholder: "SYMBOL", value: form.symbol, onChange: (e) => setForm({ ...form, symbol: e.target.value }), className: "border rounded px-2 py-1 text-sm w-28" }), _jsx("input", { placeholder: "Qty", value: form.quantity, onChange: (e) => setForm({ ...form, quantity: e.target.value }), className: "border rounded px-2 py-1 text-sm w-20" }), _jsx("input", { placeholder: "Buy price", value: form.purchasePrice, onChange: (e) => setForm({ ...form, purchasePrice: e.target.value }), className: "border rounded px-2 py-1 text-sm w-28" }), _jsx("button", { onClick: addH, disabled: !form.portfolioId, className: "text-sm bg-blue-600 text-white rounded px-3", children: "Add holding" })] }), summary?.allocation?.length > 0 && _jsxs("div", { className: "bg-white dark:bg-slate-900 border rounded-xl p-4", children: [_jsx("h3", { className: "font-semibold mb-2", children: "Allocation" }), _jsx(ResponsiveContainer, { width: "100%", height: 240, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: summary.allocation, dataKey: "value", nameKey: "symbol", label: true, children: summary.allocation.map((_, i) => _jsx(Cell, { fill: COLORS[i % COLORS.length] }, i)) }), _jsx(Tooltip, {})] }) })] }), (!summary?.allocation || summary.allocation.length === 0) && _jsx("p", { className: "text-sm text-slate-500", children: "No holdings yet." })] }));
}
