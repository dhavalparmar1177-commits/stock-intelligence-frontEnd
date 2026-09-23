import api from "./client";

export const marketApi = {
  status: () => api.get("/market/status").then((r) => r.data),
  indices: () => api.get("/market/indices").then((r) => r.data),
  movers: () => api.get("/market/movers").then((r) => r.data),
  quotes: (symbols: string[]) => api.get("/market/quotes", { params: { symbols: symbols.join(",") } }).then((r) => r.data),
  history: (symbol: string, interval = "1d", range = "6mo") =>
    api.get(`/market/history/${symbol}`, { params: { interval, range } }).then((r) => r.data),
  search: (q: string) => api.get("/market/search", { params: { q } }).then((r) => r.data),
  indiaCompare: (symbols: string, lang = "en") => api.get("/market/india/compare", { params: { symbols, lang } }).then((r) => r.data),
  indiaMarket: (lang = "en") => api.get("/market/india/market", { params: { lang } }).then((r) => r.data),
  sectorConstituents: (lang = "en") => api.get("/market/india/sectors", { params: { lang } }).then((r) => r.data),
  opportunities: (limit = 10, lang = "en") => api.get("/market/india/opportunities", { params: { limit, lang } }).then((r) => r.data),
  indiaScreen: (q: string, lang = "en") => api.get("/market/india/screen", { params: { q, lang } }).then((r) => r.data),
  evaluation: (symbols: string) => api.get("/market/india/evaluation", { params: { symbols } }).then((r) => r.data),
  calendar: () => api.get("/market/india/calendar").then((r) => r.data),
  ipos: () => api.get("/market/ipo/current").then((r) => r.data),
  ipoDetail: (symbol: string) => api.get(`/market/ipo/detail/${symbol}`).then((r) => r.data),
  ipoCalendar: () => api.get("/market/ipo/calendar").then((r) => r.data),
  ipoFaq: () => api.get("/market/ipo/faq").then((r) => r.data),
  ipoCompare: (symbols: string[]) => api.get("/market/ipo/compare", { params: { symbols: symbols.join(",") } }).then((r) => r.data),
  ipoBids: (symbol: string, series = "EQ") => api.get(`/market/ipo/bids/${symbol}`, { params: { series } }).then((r) => r.data),
  ipoAiAll: () => api.get("/market/ipo/ai").then((r) => r.data),
  ipoAiOne: (symbol: string) => api.get(`/market/ipo/ai/${symbol}`).then((r) => r.data),
};
