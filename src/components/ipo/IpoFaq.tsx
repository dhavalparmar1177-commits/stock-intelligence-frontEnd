import React, { useState } from "react";

export interface FaqItem {
  id: string;
  question: string;
  category: "gmp" | "process" | "allotment" | "risks";
  answer: string;
}

const DEFAULT_FAQS: FaqItem[] = [
  {
    id: "what-is-gmp",
    category: "gmp",
    question: "What is Grey Market Premium (GMP)?",
    answer: "Grey Market Premium (GMP) is the unofficial and unregulated cash premium at which an IPO's shares are traded in the off-market prior to official stock exchange listing. For example, if an IPO's upper price band is ₹100 and GMP is ₹40, the unofficial expected listing estimate is ₹140 (+40%). Please note: GMP is purely market sentiment and carries no regulatory backing or guarantee of actual listing gains.",
  },
  {
    id: "what-is-kostak",
    category: "gmp",
    question: "What is Kostak rate?",
    answer: "Kostak is the fixed profit amount in the off-market paid to an IPO applicant for selling their application before allotment, irrespective of whether the application gets allotted or rejected. This is an unofficial, informal agreement and carries counterparty risk.",
  },
  {
    id: "what-is-sauda",
    category: "gmp",
    question: "What is Subject to Sauda?",
    answer: "Subject to Sauda (or Sauda rate) is an informal deal where the buyer pays a predetermined profit amount to the seller ONLY IF the seller gets a confirmed allotment in the IPO. If no shares are allotted to the applicant, the deal becomes null and void.",
  },
  {
    id: "how-is-allotment-decided",
    category: "allotment",
    question: "How is retail IPO allotment decided under SEBI rules?",
    answer: "When the Retail Individual Investor (RII) category is oversubscribed, SEBI mandates a computer-generated randomized lottery system so that the maximum number of unique applicants receive at least 1 minimum lot. Bidding for multiple lots in retail does NOT improve allotment odds in an oversubscribed IPO.",
  },
  {
    id: "what-is-t3-timeline",
    category: "process",
    question: "What is the T+3 listing timeline?",
    answer: "SEBI mandates all Indian IPOs to list on stock exchanges within T+3 working days from the issue closing date (T = Close date, T+1 = Basis of allotment finalized by Registrar, T+2 = Unblocking of funds & Demat credit, T+3 = Trading commences on NSE/BSE).",
  },
  {
    id: "fresh-vs-ofs",
    category: "process",
    question: "What is the difference between Fresh Issue and Offer for Sale (OFS)?",
    answer: "Fresh Issue proceeds flow straight to the company's bank accounts to fund capital expenditures, working capital, or debt reduction. Offer for Sale (OFS) proceeds go to exiting promoters or private equity investors who are selling their existing shares; zero capital enters the company.",
  },
  {
    id: "sme-vs-mainboard",
    category: "risks",
    question: "What are the key risks of SME IPOs compared to Mainboard?",
    answer: "SME platform IPOs require higher minimum application amounts (typically ₹1,00,000–₹1,50,000), must be traded in full lot increments even after listing, and typically feature wider bid-ask spreads and lower secondary market liquidity.",
  },
];

interface Props {
  faqs?: FaqItem[];
}

export default function IpoFaq({ faqs = DEFAULT_FAQS }: Props) {
  const [openId, setOpenId] = useState<string | null>("what-is-gmp");
  const [filter, setFilter] = useState<string>("all");

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const filtered = faqs.filter((f) => {
    if (filter === "all") return true;
    return f.category === filter;
  });

  return (
    <div className="space-y-3">
      {/* Category Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {[
          { key: "all", label: "All Questions" },
          { key: "gmp", label: "GMP, Kostak & Sauda" },
          { key: "allotment", label: "Allotment & Lottery" },
          { key: "process", label: "Process & T+3" },
          { key: "risks", label: "SME vs Mainboard" },
        ].map((btn) => (
          <button
            key={btn.key}
            onClick={() => setFilter(btn.key)}
            className={`text-xs px-2.5 py-1 rounded-lg border whitespace-nowrap font-medium transition-colors ${
              filter === btn.key
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold border-transparent"
                : "border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Accordion List */}
      <div className="space-y-2">
        {filtered.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div
              key={faq.id}
              className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 transition-colors"
            >
              <button
                onClick={() => toggle(faq.id)}
                className="w-full p-3.5 text-left flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                aria-expanded={isOpen}
              >
                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                  {faq.question}
                </span>
                <span className="text-slate-400 text-xs shrink-0 font-bold">
                  {isOpen ? "▲" : "▼"}
                </span>
              </button>
              {isOpen && (
                <div className="p-3.5 pt-0 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
