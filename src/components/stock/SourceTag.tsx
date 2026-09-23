import { useLang } from "../../i18n/LanguageContext";

export type SourceKind = "real" | "calc" | "ai";

const STYLES: Record<SourceKind, string> = {
  real: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  calc: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  ai: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
};

/**
 * Provenance tag: marks whether a section shows real market data,
 * calculated indicators, or AI analysis. Small, neutral, text-first.
 */
export function SourceTag({ kind }: { kind: SourceKind }) {
  const { t } = useLang();
  const label = kind === "real" ? t.chart.srcReal : kind === "calc" ? t.chart.srcCalc : t.chart.srcAI;
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${STYLES[kind]}`}>
      {label}
    </span>
  );
}

export default SourceTag;
