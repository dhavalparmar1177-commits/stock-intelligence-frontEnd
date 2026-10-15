import { HTMLAttributes } from "react";
import { TrendingUp, TrendingDown, Sparkles, ShieldAlert, ShieldCheck } from "lucide-react";
import { useLang } from "../../i18n/LanguageContext";

type Tone = "neutral" | "positive" | "negative" | "warning" | "ai" | "live" | "info";

const TONES: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300 border-slate-200 dark:border-white/10",
  positive: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/50",
  negative: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/80 dark:border-rose-800/50",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/50",
  ai: "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 border-violet-200/80 dark:border-violet-800/50 shadow-sm",
  live: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/50",
  info: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/50",
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

/** BUY (emerald with up arrow) / SELL (rose with down arrow) / anything else (amber). */
export function SignalBadge({ signal, className = "" }: { signal?: string | null; className?: string }) {
  const { t } = useLang();
  if (!signal) {
    return <Badge tone="neutral" className={className}>{t.gen.dataUnavailable}</Badge>;
  }
  const isBuy = BUY.has(signal);
  const isSell = SELL.has(signal);
  const tone: Tone = isBuy ? "positive" : isSell ? "negative" : "warning";

  return (
    <Badge tone={tone} className={`gap-1 font-semibold ${className}`}>
      {isBuy ? (
        <TrendingUp className="w-3 h-3" />
      ) : isSell ? (
        <TrendingDown className="w-3 h-3" />
      ) : (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      )}
      <span>{signal}</span>
    </Badge>
  );
}

const LOW = new Set(["Low", "LOW", "कम", "ઓછું"]);
const HIGH = new Set(["High", "HIGH", "अधिक", "વધુ"]);

/** Risk level badge: Low green / High red / Medium-or-other amber. */
export function RiskBadge({ level, className = "" }: { level?: string | null; className?: string }) {
  const { t } = useLang();
  if (!level) {
    return <Badge tone="neutral" className={className}>{t.gen.dataUnavailable}</Badge>;
  }
  const isLow = LOW.has(level);
  const isHigh = HIGH.has(level);
  const tone: Tone = isLow ? "positive" : isHigh ? "negative" : "warning";

  return (
    <Badge tone={tone} className={`gap-1 ${className}`}>
      {isLow ? (
        <ShieldCheck className="w-3 h-3" />
      ) : isHigh ? (
        <ShieldAlert className="w-3 h-3" />
      ) : null}
      <span>{level}</span>
    </Badge>
  );
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
    <Badge tone="ai" className={`si-numeric font-semibold gap-1 ${className}`}>
      <Sparkles className="w-3 h-3 opacity-80" />
      <span className="text-[10px] uppercase tracking-wider font-bold opacity-80">AI</span>
      <span>{n.toFixed(0)}/100</span>
    </Badge>
  );
}

export default Badge;
