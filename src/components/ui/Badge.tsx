import { HTMLAttributes } from "react";
import { useLang } from "../../i18n/LanguageContext";

type Tone = "neutral" | "positive" | "negative" | "warning" | "ai" | "live" | "info";

const TONES: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300 border-slate-200 dark:border-slate-700/60",
  positive: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60",
  negative: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800/60",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/60",
  ai: "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 border-violet-200 dark:border-violet-800/60 shadow-sm",
  live: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60",
  info: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800/60",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
}

/** Generic pill badge with subtle border. Tone carries meaning AND text. */
export function Badge({ tone = "neutral", dot = false, className = "", children, ...rest }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap transition-colors ${TONES[tone]} ${className}`}
      {...rest}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            tone === "positive" || tone === "live"
              ? "bg-emerald-500 animate-pulse"
              : tone === "negative"
              ? "bg-rose-500"
              : tone === "ai"
              ? "bg-violet-500"
              : tone === "warning"
              ? "bg-amber-500"
              : "bg-slate-400"
          }`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

const BUY = new Set(["BUY", "खरीदें", "ખરીદો"]);
const SELL = new Set(["SELL", "बेचें", "વેચો"]);

/** BUY (emerald) / SELL (rose) / anything else (amber). Label text always shown. */
export function SignalBadge({ signal, className = "" }: { signal?: string | null; className?: string }) {
  const { t } = useLang();
  if (signal === null || signal === undefined || signal === "") {
    return <Badge tone="neutral" className={className}>{t.gen.dataUnavailable}</Badge>;
  }
  const tone: Tone = BUY.has(signal) ? "positive" : SELL.has(signal) ? "negative" : "warning";
  return <Badge tone={tone} dot className={className}>{signal}</Badge>;
}

const LOW = new Set(["Low", "LOW", "कम", "ઓછું"]);
const HIGH = new Set(["High", "HIGH", "अधिक", "વધુ"]);

/** Risk level badge: Low green / High red / Medium-or-other amber. */
export function RiskBadge({ level, className = "" }: { level?: string | null; className?: string }) {
  const { t } = useLang();
  if (level === null || level === undefined || level === "") {
    return <Badge tone="neutral" className={className}>{t.gen.dataUnavailable}</Badge>;
  }
  const tone: Tone = LOW.has(level) ? "positive" : HIGH.has(level) ? "negative" : "warning";
  return <Badge tone={tone} className={className}>{level}</Badge>;
}

/** 0–100 AI score with violet (AI) tone and numeric highlight. */
export function AIScoreBadge({ score, className = "" }: { score?: number | string | null; className?: string }) {
  const { t } = useLang();
  if (score === null || score === undefined || score === "") {
    return <Badge tone="neutral" className={className}>{t.gen.dataUnavailable}</Badge>;
  }
  const n = Number(score);
  if (!Number.isFinite(n)) return <Badge tone="neutral" className={className}>{t.gen.dataUnavailable}</Badge>;
  return (
    <Badge tone="ai" className={`font-mono font-semibold ${className}`}>
      <span className="text-[10px] uppercase tracking-wider opacity-80">AI</span> {n.toFixed(0)}/100
    </Badge>
  );
}

export default Badge;

