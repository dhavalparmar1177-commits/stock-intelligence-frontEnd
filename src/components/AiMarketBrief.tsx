import { Link } from "react-router-dom";
import { useLang } from "../i18n/LanguageContext";
import { Card } from "./ui/Card";
import { EmptyState } from "./ui/EmptyState";
import { ErrorState } from "./ui/ErrorState";
import { SkeletonText } from "./ui/Skeleton";
import { Badge } from "./ui/Badge";
import { ArrowRight, Sparkles } from "lucide-react";
import { formatPriceINR } from "../design/tokens";

interface BulletItem {
  id: string;
  lead: string;
  chips: string[];
  tail?: string;
}

/**
 * Institutional AI market brief grounded entirely in measured live data.
 * Displays max 4 short bullets with formatted metric chips, "Read more" CTA,
 * and standard regulatory disclosure.
 */
export function AiMarketBrief({
  data,
  loading,
  error,
  onRetry,
}: {
  data: any;
  loading: boolean;
  error: string;
  onRetry: () => void;
}) {
  const { t } = useLang();

  const bullets: BulletItem[] = [];

  if (data) {
    const n = data.nifty;
    if (n?.price != null) {
      const up = (n.changePct ?? 0) >= 0;
      bullets.push({
        id: "nifty",
        lead: "NIFTY 50 trading at",
        chips: [
          `₹${formatPriceINR(n.price)}`,
          `${up ? "+" : ""}${Number(n.changePct).toFixed(2)}%`,
          n.rsi14 != null ? `RSI ${n.rsi14}` : "",
        ].filter(Boolean),
        tail: n.aboveSMA50 === true ? "above 50-DMA" : n.aboveSMA50 === false ? "below 50-DMA" : undefined,
      });
    }

    const sx = data.sensex;
    if (sx?.price != null && bullets.length < 4) {
      const up = (sx.changePct ?? 0) >= 0;
      bullets.push({
        id: "sensex",
        lead: "SENSEX settlement at",
        chips: [
          `₹${Number(sx.price).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
          `${up ? "+" : ""}${Number(sx.changePct).toFixed(2)}%`,
        ],
      });
    }

    if (data.regime && bullets.length < 4) {
      const b = data.breadth;
      bullets.push({
        id: "regime",
        lead: "Market Structure indicates",
        chips: [
          `${data.regime} Regime`,
          b?.advancers != null ? `${b.advancers} Adv / ${b.decliners} Dec` : "",
        ].filter(Boolean),
        tail: "across tracked universe",
      });
    }

    const sectors = (data.sectors || []).filter((s: any) => s?.momentum3mPct != null);
    if (sectors.length && bullets.length < 4) {
      const sorted = [...sectors].sort((a: any, b: any) => b.momentum3mPct - a.momentum3mPct);
      const best = sorted[0];
      bullets.push({
        id: "sector",
        lead: "Leading sector momentum led by",
        chips: [
          best.sector || best.indexName,
          `+${Number(best.momentum3mPct).toFixed(1)}% (3M)`,
        ],
      });
    }
  }

  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-600 dark:text-[#7C5CFF]" />
          <span>{t.dash.briefTitle || "AI Market Overview"}</span>
        </span>
      }
      accent="ai"
      action={
        <Badge tone="ai" dot>
          Live Analysis
        </Badge>
      }
    >
      {loading ? (
        <SkeletonText lines={4} />
      ) : error ? (
        <ErrorState title={error} onRetry={onRetry} retryLabel={t.common.retry} />
      ) : bullets.length ? (
        <div className="space-y-4">
          <ul className="space-y-2.5">
            {bullets.slice(0, 4).map((b) => (
              <li
                key={b.id}
                className="flex items-start gap-2.5 bg-slate-50/80 dark:bg-[#0D1424]/60 p-3 rounded-[14px] border border-slate-200/80 dark:border-white/[0.05] transition-all"
              >
                <span aria-hidden="true" className="text-[#7C5CFF] font-bold shrink-0 mt-0.5">
                  ✦
                </span>
                <div className="text-xs sm:text-sm text-slate-800 dark:text-[#F4F6FB] leading-relaxed flex-1">
                  <span>{b.lead} </span>
                  <div className="inline-flex items-center gap-1.5 flex-wrap mx-1 my-0.5 align-middle">
                    {b.chips.map((c, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-2 py-0.5 rounded-full font-mono font-semibold text-xs bg-violet-500/10 dark:bg-[#7C5CFF]/15 text-violet-700 dark:text-[#7C5CFF] border border-violet-500/20"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                  {b.tail && <span> {b.tail}</span>}
                </div>
              </li>
            ))}
          </ul>

          {/* Read more action and disclaimer */}
          <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2 flex-wrap">
            <Link
              to="/daily"
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-violet-600 dark:text-[#7C5CFF] hover:underline group"
            >
              <span>Read complete Daily Intelligence brief</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-[#6B7792] italic pt-0.5">
            Algorithmic summary derived from verified market feed. For information only. Not investment advice.
          </p>
        </div>
      ) : (
        <EmptyState icon="🤖" title={t.gen.dataUnavailable} />
      )}
    </Card>
  );
}

export default AiMarketBrief;
