import { useLang } from "../../i18n/LanguageContext";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";

export interface SectorDatum {
  sector?: string | null;
  index?: string | null;
  price?: number | null;
  changePct?: number | null;
  unavailable?: boolean;
}

/**
 * Sector heatmap: one tile per sector from REAL indiaMarket.sectors[].
 * Equal-weight tiles (no cap weights published by the feed), colored
 * AND labeled by changePct — never color-only. Missing → neutral tile.
 */
export function SectorHeatmap({ sectors }: { sectors: SectorDatum[] }) {
  const { t } = useLang();
  const rows = (sectors || []).filter((s) => s && (s.sector || s.index));
  if (!rows.length) {
    return (
      <Card title={t.daily.heatmap}>
        <EmptyState icon="🗺️" title={t.gen.dataUnavailable} />
      </Card>
    );
  }
  const tone = (v: number | null | undefined): string => {
    if (v == null) return "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700";
    if (v >= 1) return "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200 border-green-300 dark:border-green-800";
    if (v > 0) return "bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-300 border-green-200 dark:border-green-900";
    if (v > -1) return "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-900";
    return "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200 border-red-300 dark:border-red-800";
  };
  return (
    <Card title={t.daily.heatmap}>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2" role="list" aria-label={t.daily.heatmap}>
        {rows.map((s, i) => (
          <div
            key={`${s.sector || s.index}-${i}`}
            role="listitem"
            className={`border rounded-xl p-3 min-w-0 ${tone(s.unavailable ? null : s.changePct)}`}
          >
            <p className="font-bold text-sm truncate">{s.sector || s.index}</p>
            <p className="text-xs opacity-80 truncate">{s.index && s.sector ? s.index : " "}</p>
            <p className="font-bold text-lg si-numeric mt-1">
              {s.unavailable || s.changePct == null
                ? t.gen.na
                : `${s.changePct >= 0 ? "+" : ""}${s.changePct}%`}
            </p>
            <p className="text-xs opacity-80 si-numeric truncate">
              {s.price != null ? Number(s.price).toLocaleString("en-IN") : ""}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default SectorHeatmap;
