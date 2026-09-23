import { useEffect, useState } from "react";
import { marketApi } from "../../api/market";
import { useLang } from "../../i18n/LanguageContext";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { SkeletonTable } from "../ui/Skeleton";

// Moved unchanged from IndiaForecast (peer universe is static
// sector knowledge, values always come from indiaCompare).
const SECTOR_PEERS: Record<string, string[]> = {
  RELIANCE: ["TCS", "INFY", "HDFCBANK", "ICICIBANK"],
  TCS: ["INFY", "HDFCBANK", "RELIANCE"],
  INFY: ["TCS", "HDFCBANK", "RELIANCE"],
  HDFCBANK: ["ICICIBANK", "AXISBANK", "KOTAKBANK", "SBIN"],
  ICICIBANK: ["HDFCBANK", "AXISBANK", "SBIN"],
  AXISBANK: ["HDFCBANK", "ICICIBANK", "KOTAKBANK"],
  KOTAKBANK: ["HDFCBANK", "ICICIBANK", "AXISBANK"],
  SBIN: ["HDFCBANK", "ICICIBANK", "AXISBANK"],
  TATAMOTORS: ["RELIANCE", "LT", "TITAN"],
  ITC: ["TITAN", "RELIANCE", "INFY"],
  TITAN: ["ITC", "RELIANCE", "TATAMOTORS"],
  LT: ["RELIANCE", "TATAMOTORS", "ULTRACEMCO"],
  BHARTIARTL: ["RELIANCE", "TCS", "INFY"],
  HDFCLIFE: ["SBILIFE", "HDFCBANK", "ICICIBANK"],
  SBILIFE: ["HDFCLIFE", "SBIN", "HDFCBANK"],
};

export function PeerCompare({ symbol }: { symbol: string }) {
  const { t, lang } = useLang();
  const [rows, setRows] = useState<any[] | null>(null);

  useEffect(() => {
    let alive = true;
    setRows(null);
    const u = symbol.toUpperCase();
    const peers = (SECTOR_PEERS[u] || ["RELIANCE", "TCS", "HDFCBANK", "INFY"].filter((s) => s !== u)).slice(0, 4);
    const list = [u, ...peers.filter((p) => p !== u)].slice(0, 5);
    if (list.length < 2) {
      setRows([]);
      return;
    }
    marketApi
      .indiaCompare(list.join(","), lang)
      .then((r) => alive && setRows(r.ranked || []))
      .catch(() => alive && setRows([]));
    return () => {
      alive = false;
    };
  }, [symbol]);

  return (
    <Card title={t.forecast.peersTitle}>
      {rows === null ? (
        <SkeletonTable rows={4} />
      ) : rows.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[480px]">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="font-medium">{t.stock.peerSymbol}</th>
                <th className="font-medium">{t.compare.mScore}</th>
                <th className="font-medium">{t.compare.mSignal}</th>
                <th className="font-medium">{t.compare.mRange}</th>
                <th className="font-medium">{t.compare.mRisk}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s: any) => (
                <tr
                  key={s.symbol}
                  className={`border-t border-slate-100 dark:border-slate-800 ${s.symbol === symbol.toUpperCase() ? "bg-orange-50 dark:bg-orange-950/30 font-bold" : ""}`}
                >
                  <td className="py-1.5">{s.symbol}</td>
                  <td className="si-numeric">{s.score}/100</td>
                  <td>{s.signal}</td>
                  <td className="si-numeric">
                    {s.forecast?.low != null && s.forecast?.high != null
                      ? `${Number(s.forecast.low).toLocaleString("en-IN")}–${Number(s.forecast.high).toLocaleString("en-IN")}`
                      : t.gen.dataUnavailable}
                  </td>
                  <td>{s.riskLevel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon="🏢" title={t.gen.dataUnavailable} />
      )}
    </Card>
  );
}

export default PeerCompare;
