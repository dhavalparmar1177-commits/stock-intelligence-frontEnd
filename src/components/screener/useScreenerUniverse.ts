import { useCallback, useEffect, useState } from "react";
import { marketApi } from "../../api/market";

export interface ScreenRow {
  symbol: string;
  name?: string | null;
  price?: number | null;
  changePct?: number | null;
  volume?: number | null;
  volumeRatio?: number | null;
  rsi14?: number | null;
  momentum3mPct?: number | null;
  score?: number | null;
  signal?: string | null;
  trend?: string | null;
  riskLevel?: string | null;
  mainReason?: string | null;
}

/** Normalize app/yahoo symbol variants to one merge key. */
export function normSym(s: unknown): string {
  return String(s || "").toUpperCase().replace(/\.(NS|BO)$/, "");
}

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Screener universe: 4 parallel batched requests (movers, top-10
 * opportunities, top screen, quotes top-up), merged client-side by
 * symbol. Filtering/sorting happen locally afterwards — no
 * per-row requests, ever.
 */
export function useScreenerUniverse(lang: string) {
  const [rows, setRows] = useState<ScreenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [seq, setSeq] = useState(0);
  const [asOf, setAsOf] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const [moves, opps, screen] = await Promise.all([
          marketApi.movers(),
          marketApi.opportunities(10, lang).catch(() => null),
          marketApi.indiaScreen("list stocks", lang).catch(() => null),
        ]);
        if (!alive) return;
        const map = new Map<string, ScreenRow>();
        const upsert = (sym: string, patch: Partial<ScreenRow>) => {
          const k = normSym(sym);
          if (!k) return;
          map.set(k, { symbol: k, ...map.get(k), ...patch });
        };

        // Live quotes: price, change, absolute volume (movers rows).
        for (const bucket of [moves?.gainers, moves?.losers, moves?.mostActive]) {
          for (const x of bucket || []) {
            upsert(x.appSymbol || x.symbol, {
              name: x.name ?? null,
              price: num(x.price),
              changePct: num(x.changePct),
              volume: num(x.volume),
            });
          }
        }
        // AI scores, RSI, momentum, volume ratio (opportunities).
        for (const o of opps?.opportunities || []) {
          upsert(o.symbol, {
            name: o.name ?? map.get(normSym(o.symbol))?.name ?? null,
            price: num(o.price) ?? map.get(normSym(o.symbol))?.price ?? null,
            changePct: num(o.changePct) ?? map.get(normSym(o.symbol))?.changePct ?? null,
            score: num(o.score),
            signal: o.signal ?? null,
            rsi14: num(o.rsi14),
            momentum3mPct: num(o.momentum3mPct),
            volumeRatio: num(o.volumeRatio),
            mainReason: o.reasons?.[0] ?? o.mainReason ?? null,
          });
        }
        // Risk + trend + interpretation (screen rows).
        for (const s of screen?.results || []) {
          const k = normSym(s.symbol);
          const prev = map.get(k);
          upsert(s.symbol, {
            name: s.name ?? prev?.name ?? null,
            price: num(s.price) ?? prev?.price ?? null,
            changePct: num(s.changePct) ?? prev?.changePct ?? null,
            score: num(s.score) ?? prev?.score ?? null,
            trend: s.trend ?? prev?.trend ?? null,
            riskLevel: s.riskLevel ?? prev?.riskLevel ?? null,
            mainReason: s.mainReason ?? prev?.mainReason ?? null,
          });
        }

        // One batched top-up for any symbol missing price/volume.
        const missing = [...map.values()].filter((r) => r.price == null || r.volume == null).map((r) => r.symbol);
        if (missing.length) {
          try {
            const q = await marketApi.quotes(missing);
            if (!alive) return;
            for (const x of q.quotes || []) {
              const k = normSym(x.appSymbol || x.symbol);
              const prev = map.get(k);
              if (!prev) continue;
              map.set(k, {
                ...prev,
                name: prev.name ?? x.name ?? null,
                price: prev.price ?? num(x.price),
                changePct: prev.changePct ?? num(x.changePct),
                volume: prev.volume ?? num(x.volume),
              });
            }
          } catch {
            /* top-up is best-effort; merged rows still render */
          }
        }
        if (!alive) return;
        setRows([...map.values()].sort((a, b) => (b.score ?? -1) - (a.score ?? -1)));
        setAsOf(moves?.asOf || opps?.asOf || screen?.asOf || "");
      } catch {
        if (alive) setError("Unable to load market data.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [seq]);

  const refresh = useCallback(() => setSeq((s) => s + 1), []);
  return { rows, loading, error, asOf, refresh };
}

/**
 * Enrich AI-screen result symbols into full ScreenRows on Apply:
 * batched compare calls (≤5 symbols each) + one quotes top-up.
 * Called on explicit user action only.
 */
export async function enrichAiResults(items: any[]): Promise<ScreenRow[]> {
  const syms = [...new Set((items || []).map((s: any) => normSym(s.symbol)).filter(Boolean))];
  if (!syms.length) return [];
  const byScreen = new Map(syms.map((k) => [k, items.find((s: any) => normSym(s.symbol) === k)]));
  const rows = new Map<string, ScreenRow>(syms.map((k) => [k, { symbol: k }]));

  // Compare in chunks of 5 (backend enforces 2–5 per call).
  const chunks: string[][] = [];
  for (let i = 0; i < syms.length; i += 5) chunks.push(syms.slice(i, i + 5));
  await Promise.all(
    chunks.map(async (c) => {
      if (c.length < 2) return;
      try {
        const r = await marketApi.indiaCompare(c.join(","));
        for (const s of r.ranked || []) {
          const k = normSym(s.symbol);
          const prev = rows.get(k);
          if (!prev) continue;
          const n = (v: unknown) => (v === null || v === undefined || !Number.isFinite(Number(v)) ? null : Number(v));
          rows.set(k, {
            ...prev,
            name: s.name ?? null,
            price: n(s.price),
            changePct: n(s.changePct),
            score: n(s.score),
            signal: s.signal ?? null,
            trend: s.trend ?? null,
            riskLevel: s.riskLevel ?? null,
            rsi14: n(s.rsi14),
            volumeRatio: n(s.volumeRatio),
          });
        }
      } catch {
        /* per-chunk failure keeps screen-row data below */
      }
    })
  );

  // Screen rows always contribute score/trend/risk/reason.
  for (const [k, s] of byScreen) {
    const prev = rows.get(k)!;
    rows.set(k, {
      ...prev,
      name: prev.name ?? s.name ?? null,
      price: prev.price ?? num(s.price),
      changePct: prev.changePct ?? num(s.changePct),
      score: prev.score ?? num(s.score),
      trend: prev.trend ?? s.trend ?? null,
      riskLevel: prev.riskLevel ?? s.riskLevel ?? null,
      mainReason: s.mainReason ?? s.reasons?.[0] ?? null,
    });
  }

  // Quotes top-up for price/volume gaps.
  const missing = [...rows.values()].filter((r) => r.price == null || r.volume == null).map((r) => r.symbol);
  if (missing.length) {
    try {
      const q = await marketApi.quotes(missing);
      for (const x of q.quotes || []) {
        const k = normSym(x.appSymbol || x.symbol);
        const prev = rows.get(k);
        if (!prev) continue;
        rows.set(k, {
          ...prev,
          name: prev.name ?? x.name ?? null,
          price: prev.price ?? num(x.price),
          changePct: prev.changePct ?? num(x.changePct),
          volume: num(x.volume),
        });
      }
    } catch {
      /* best-effort */
    }
  }
  return [...rows.values()];
}

export default useScreenerUniverse;
