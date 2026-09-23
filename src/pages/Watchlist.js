import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { marketApi } from "../api/market";
export default function Watchlist() {
    const [lists, setLists] = useState([]);
    const [name, setName] = useState("My Watchlist");
    const [add, setAdd] = useState({});
    const [live, setLive] = useState({});
    const [liveErr, setLiveErr] = useState("");
    const load = () => api.get("/watchlists").then((r) => setLists(r.data)).catch(() => { });
    useEffect(() => { load(); }, []);
    const create = async () => { await api.post("/watchlists", { name }); setName(""); load(); };
    const addSym = async (id) => { if (!add[id])
        return; await api.post(`/watchlists/${id}/stocks`, { symbol: add[id].toUpperCase() }); load(); };
    const refreshLive = async () => {
        const syms = Array.from(new Set(lists.flatMap((w) => (w.stocks || []).map((s) => s.stock.symbol))));
        if (!syms.length)
            return;
        try {
            const r = await marketApi.quotes(syms);
            const map = {};
            r.quotes.forEach((q) => { map[q.appSymbol] = q; });
            setLive(map);
            setLiveErr("");
        }
        catch {
            setLiveErr("Live prices unavailable right now");
        }
    };
    useEffect(() => { if (lists.length)
        refreshLive(); }, [lists.length]);
    if (!localStorage.getItem("accessToken"))
        return _jsxs("p", { className: "text-sm", children: ["Please ", _jsx(Link, { to: "/login", className: "text-blue-600", children: "login" }), " to use watchlists."] });
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("h1", { className: "text-xl font-bold", children: "Watchlists" }), _jsx("button", { onClick: refreshLive, className: "text-sm px-3 py-1 border border-green-500 text-green-700 rounded", children: "\u21BB Live prices" }), liveErr && _jsx("span", { className: "text-xs text-red-600", children: liveErr })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { value: name, onChange: (e) => setName(e.target.value), className: "border rounded px-3 py-1.5 text-sm bg-white dark:bg-slate-900" }), _jsx("button", { onClick: create, className: "bg-blue-600 text-white rounded px-3 text-sm", children: "Create" })] }), lists.length === 0 && _jsx("p", { className: "text-sm text-slate-500", children: "No watchlists yet \u2014 create one above." }), lists.map((w) => (_jsxs("div", { className: "bg-white dark:bg-slate-900 border rounded-xl p-4", children: [_jsx("h3", { className: "font-semibold", children: w.name }), _jsxs("div", { className: "flex gap-2 my-2", children: [_jsx("input", { placeholder: "SYMBOL e.g. TCS", value: add[w.id] || "", onChange: (e) => setAdd({ ...add, [w.id]: e.target.value }), className: "border rounded px-2 py-1 text-sm" }), _jsx("button", { onClick: () => addSym(w.id), className: "text-sm border rounded px-2", children: "Add" })] }), w.stocks?.length ? w.stocks.map((s) => {
                        const L = live[s.stock.symbol];
                        return _jsxs("div", { className: "flex justify-between text-sm py-1 border-b gap-2", children: [_jsx(Link, { to: `/stocks/${s.stock.symbol}`, className: "text-blue-600", children: s.stock.symbol }), _jsx("span", { children: L ? _jsxs("span", { className: L.changePct >= 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold", children: ["LIVE ", L.price?.toLocaleString(), " (", L.changePct >= 0 ? "+" : "", L.changePct?.toFixed(2), "%)"] }) : _jsxs("span", { className: "text-slate-500", children: ["demo ", s.stock.quotes?.[0]?.price?.toFixed(2)] }) })] }, s.id);
                    }) : _jsx("p", { className: "text-sm text-slate-500", children: "Empty." })] }, w.id)))] }));
}
