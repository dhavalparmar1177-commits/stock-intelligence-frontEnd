import { useState } from "react";
import { useLang } from "../../i18n/LanguageContext";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

interface Answer {
  points: string[];
  sources: string[];
}

/**
 * IPO assistant: deterministic answers composed ONLY from the loaded
 * IPO + AI + bids payloads. No backend, no invention. Unanswerable
 * parts say so explicitly.
 */
export function IpoAsk({ ai, ipo, bids }: { ai: any; ipo: any; bids: any }) {
  const { t } = useLang();
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);

  const a = ai || {};
  const sub = ipo?.subscription ?? null;

  const ansScore = (): Answer => {
    const points: string[] = [];
    if (a.score != null) {
      points.push(`AI IPO Score is ${a.score}/100 with confidence ${a.confidence || 50}%.`);
      points.push(`Verdict: ${a.verdictTitle || a.verdict || "Evaluated"}.`);
    } else {
      points.push("No AI score — demand or subscription data is missing for this issue.");
    }
    (a.reasons || []).slice(0, 3).forEach((r: string) => points.push(`✓ ${r}`));
    if (a.missing?.length) points.push(`Uncounted parameters: ${a.missing.slice(0, 3).join("; ")}.`);
    return { points, sources: ["ai.score", "ai.reasons", "ipo.subscription"] };
  };

  const ansRisk = (): Answer => {
    const points: string[] = [];
    (a.risks || []).forEach((r: string) => points.push(`⚠ ${r}`));
    (a.redFlags || []).forEach((r: string) => points.push(`🚨 Red flag: ${r}`));
    if (!points.length) {
      points.push("No specific red flags recorded on the loaded dataset.");
    }
    return { points, sources: ["ai.risks", "ai.redFlags"] };
  };

  const ansSub = (): Answer => {
    const points = [t.ipoAi.mSub];
    if (sub != null) {
      points.push(`${ipo?.company || ipo?.symbol || "This issue"} is covered ${Number(sub).toFixed(2)}× overall.`);
    }
    const qib = bids?.categories?.find((c: any) => /Qualified Institutional/i.test(c.name || ""));
    if (qib?.multiple != null) points.push(`• QIB (Institutions): ${Number(qib.multiple).toFixed(2)}×`);
    const nii = bids?.categories?.find((c: any) => /Non Institutional/i.test(c.name || ""));
    if (nii?.multiple != null) points.push(`• NII / HNI: ${Number(nii.multiple).toFixed(2)}×`);
    const rii = bids?.categories?.find((c: any) => /Retail Individual/i.test(c.name || ""));
    if (rii?.multiple != null) points.push(`• Retail: ${Number(rii.multiple).toFixed(2)}×`);
    return { points, sources: ["ipo.subscription", "bids.categories", "NSE live bids"] };
  };

  const ansWorth = (): Answer => {
    const points: string[] = [];
    if (a.verdict === "research") points.push(`${t.ipoAi.worthYes} — demand and issue quality metrics warrant detailed fundamental research.`);
    else if (a.verdict === "maybe") points.push(`${t.ipoAi.worthMaybe} — mixed demand or high OFS proportion; check risks before bidding.`);
    else if (a.verdict === "skip") points.push(`${t.ipoAi.worthSkip} — low subscription or high risk flags observed.`);
    else points.push("No verdict — subscription or prospectus data is missing.");
    points.push("Research summary only — never financial advice. Listing gains and allotments are never guaranteed.");
    return { points, sources: ["ai.verdict", "ai.confidence"] };
  };

  const ansGmp = (): Answer => {
    if (ipo?.gmp) {
      return {
        points: [
          `Current reported GMP is ₹${ipo.gmp.value} (+${ipo.gmp.premiumPct?.toFixed(1)}% premium over upper price band).`,
          `Estimated listing price based on GMP: ₹${ipo.gmp.estListingPrice}.`,
          `Trend: ${ipo.gmp.trend?.toUpperCase()} · Source: ${ipo.gmp.source} (Updated: ${ipo.gmp.updatedAt}).`,
          t.ipo.gmpDisclaimer,
        ],
        sources: ["ipo.gmp", ipo.gmp.source],
      };
    }
    return {
      points: [t.ipoAi.gmpNA, t.ipo.gmpDisclaimer],
      sources: ["feed contract (no verified GMP source)"],
    };
  };

  const ansStructure = (): Answer => {
    const points: string[] = [];
    if (ipo?.priceBand) points.push(`Price band: ${ipo.priceBand}.`);
    if (ipo?.lotSize) points.push(`Lot size: ${ipo.lotSize} shares (Min Retail Investment: ₹${ipo?.minInvestment?.toLocaleString("en-IN") || "—"}).`);
    if (ipo?.issueSizeInrCr) points.push(`Total issue size: ₹${ipo.issueSizeInrCr.toLocaleString("en-IN")} Cr.`);
    if (ipo?.freshIssueCr != null) points.push(`• Fresh Issue: ₹${ipo.freshIssueCr} Cr.`);
    if (ipo?.ofsIssueCr != null) points.push(`• Offer for Sale (OFS): ₹${ipo.ofsIssueCr} Cr.`);
    if (!points.length) points.push("Issue structure specifics are not available in current filing.");
    return { points, sources: ["ipo.priceBand", "ipo.lotSize", "ipo.freshIssueCr"] };
  };

  const resolve = (text: string): Answer => {
    const s = text.toLowerCase();
    if (/gmp|grey|gray|premium|listing gain/.test(s)) return ansGmp();
    if (/lot|size|min|invest|fresh|ofs|price|band/.test(s)) return ansStructure();
    if (/risk|red flag|danger|worry/.test(s)) return ansRisk();
    if (/subscri|covered|times|retail|qib|nii/.test(s)) return ansSub();
    if (/worth|research|should i|apply|invest/.test(s)) return ansWorth();
    if (/score|why|rate|rating|strong|weak/.test(s)) return ansScore();
    return ansScore();
  };

  const ask = (text: string) => {
    if (!text.trim()) return;
    setAnswer(resolve(text));
  };

  const chips = [t.ipoAi.qScore, t.ipoAi.qRisk, t.ipoAi.qSub, t.ipoAi.qWorth, "What is the GMP?", "Lot size & Min investment"];

  return (
    <Card title={t.ipoAi.askTitle}>
      <div className="flex gap-1.5 flex-wrap mb-2">
        {chips.map((c) => (
          <button
            key={c}
            onClick={() => { setQ(c); ask(c); }}
            className="text-xs px-2.5 py-1.5 border border-violet-300 dark:border-violet-800 text-violet-700 dark:text-violet-300 rounded-full hover:bg-violet-50 dark:hover:bg-violet-950 transition-colors"
          >
            {c}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask(q)}
          placeholder={t.ipoAi.askPh}
          aria-label={t.ipoAi.askPh}
          className="flex-1 min-w-0 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 placeholder:text-slate-400"
        />
        <Button variant="ai" size="md" onClick={() => ask(q)} disabled={!q.trim()}>
          Ask
        </Button>
      </div>
      {answer ? (
        <div className="mt-3 text-sm space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
          {answer.points.map((p, i) => (
            <p key={i} className="text-slate-700 dark:text-slate-300">{p}</p>
          ))}
          <p className="text-xs text-slate-500 pt-1">
            {t.ipoAi.askSources}: {answer.sources.join(", ")}
          </p>
        </div>
      ) : (
        <p className="text-xs text-slate-500 mt-2">{t.ipoAi.askEmpty}</p>
      )}
    </Card>
  );
}

export default IpoAsk;
