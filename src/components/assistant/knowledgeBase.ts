export interface KnowledgeItem {
  id: string;
  keywords: string[];
  category: "market" | "concept" | "investing" | "risk" | "ipo" | "app";
  question: string;
  answer: string;
  keyPoints: string[];
  learnMoreUrl?: string;
  learnMoreLabel?: string;
}

export const KNOWLEDGE_BASE: KnowledgeItem[] = [
  {
    id: "pe-ratio",
    keywords: ["pe ratio", "price to earnings", "p/e", "valuation pe", "what is pe"],
    category: "concept",
    question: "What is P/E Ratio (Price-to-Earnings)?",
    answer: "P/E ratio measures how much investors are willing to pay for every ₹1 of profit a company earns. Higher P/E often indicates high growth expectations, while lower P/E may mean value or trouble.",
    keyPoints: [
      "Formula: Market Price ÷ Earnings Per Share (EPS)",
      "High P/E (>35): Investors expect rapid future growth",
      "Low P/E (<15): May be undervalued or in a slow-growth industry",
      "Always compare P/E with sector peers, not across different industries"
    ],
    learnMoreUrl: "/learn/valuation",
    learnMoreLabel: "Learn Valuation in Academy"
  },
  {
    id: "sip-basics",
    keywords: ["sip", "systematic investment plan", "mutual fund sip", "monthly investment"],
    category: "investing",
    question: "What is SIP and how does it work?",
    answer: "A Systematic Investment Plan (SIP) allows you to invest a fixed amount of money regularly (e.g., monthly) into mutual funds or stocks, averaging your buy cost over time.",
    keyPoints: [
      "Rupee Cost Averaging: You buy more units when prices are low and fewer when prices are high",
      "Disciplined Saving: Builds long-term wealth without timing the market",
      "Power of Compounding: Small amounts (e.g. ₹1,000/mo) grow significantly over 10-15 years"
    ],
    learnMoreUrl: "/goal-planner",
    learnMoreLabel: "Open Goal & SIP Calculator"
  },
  {
    id: "nifty-sensex",
    keywords: ["nifty", "sensex", "nifty 50", "bse sensex", "index", "market index"],
    category: "market",
    question: "What are NIFTY 50 and SENSEX?",
    answer: "NIFTY 50 (NSE) and SENSEX (BSE) are benchmark indices tracking the top 50 and top 30 largest companies in India respectively.",
    keyPoints: [
      "NIFTY 50: Top 50 companies across 13 major sectors listed on NSE",
      "SENSEX: Top 30 well-established companies listed on BSE",
      "If NIFTY goes up, it means top companies overall had a positive day"
    ],
    learnMoreUrl: "/learn/nifty-sensex",
    learnMoreLabel: "Read NIFTY & SENSEX Lesson"
  },
  {
    id: "ipo-guide",
    keywords: ["ipo", "initial public offering", "gmp", "how to apply ipo", "allotment"],
    category: "ipo",
    question: "How do IPOs work and should beginners apply?",
    answer: "An IPO is when a private company sells shares to the public for the first time to raise capital. While exciting, IPOs can be volatile.",
    keyPoints: [
      "Price Band: Company sets a min and max price range for bidding",
      "Grey Market Premium (GMP): Unofficial demand indicator before listing",
      "Rule for Beginners: Don't rely solely on GMP; check subscription figures & fundamentals",
      "Allotment is done by lottery if oversubscribed in retail category"
    ],
    learnMoreUrl: "/ipos",
    learnMoreLabel: "Explore IPO Hub"
  },
  {
    id: "diversification",
    keywords: ["diversification", "risk management", "how many stocks", "portfolio allocation"],
    category: "risk",
    question: "How should I diversify my stock portfolio?",
    answer: "Diversification means spreading your money across different sectors (IT, Banking, Pharma, FMCG) to reduce risk if one sector performs poorly.",
    keyPoints: [
      "Ideal Portfolio Size: 10 to 15 stocks across 4-5 different sectors",
      "Single Stock Limit: Never put more than 10-15% of total capital in one company",
      "Mix Capitalisations: Combine stable large-caps (60%) with growth mid-caps (30%)"
    ],
    learnMoreUrl: "/learn/diversification",
    learnMoreLabel: "Read Diversification Lesson"
  },
  {
    id: "paper-trading",
    keywords: ["paper trade", "practice trading", "virtual money", "demo account", "simulator"],
    category: "app",
    question: "How does Paper Trading work in StockIntel?",
    answer: "Paper Trading gives you ₹10,00,000 in virtual cash so you can buy and sell real NSE/BSE stocks without risking real money.",
    keyPoints: [
      "Real Stock Prices: Trades use live market prices from NSE/BSE",
      "Risk Free: Test your strategy for 2-3 months before investing real cash",
      "P&L Tracking: See your overall virtual profit/loss and trade history"
    ],
    learnMoreUrl: "/paper-trade",
    learnMoreLabel: "Open Paper Trading Simulator"
  },
  {
    id: "rsi-indicator",
    keywords: ["rsi", "relative strength index", "overbought", "oversold"],
    category: "concept",
    question: "What is RSI (Relative Strength Index)?",
    answer: "RSI is a momentum indicator scaled from 0 to 100. It helps identify whether a stock is overbought (too expensive short-term) or oversold (bargain territory).",
    keyPoints: [
      "Above 70: Overbought — stock might be due for a cooldown/correction",
      "Below 30: Oversold — stock might be near a bottom/rebound",
      "Between 40-60: Neutral trend zone"
    ],
    learnMoreUrl: "/learn/rsi",
    learnMoreLabel: "Learn Technical Analysis"
  },
  {
    id: "first-step",
    keywords: ["where to start", "beginner guide", "first time", "how to start", "new user"],
    category: "investing",
    question: "I am a complete beginner. What should I do first?",
    answer: "Welcome! Follow this simple 4-step path to start your investment journey safely:",
    keyPoints: [
      "1. Build Knowledge: Spend 1 week in the StockIntel Academy (`/learn`)",
      "2. Know Your Risk: Take the Risk Quiz in Goal Planner (`/goal-planner`)",
      "3. Practice Free: Use Paper Trading (`/paper-trade`) with virtual ₹10 Lakhs for 1 month",
      "4. Start Small: When ready, invest ₹500–₹1,000 monthly in index funds or blue-chip stocks"
    ],
    learnMoreUrl: "/goal-planner",
    learnMoreLabel: "Take Risk Profile Quiz"
  }
];

export function findKnowledge(query: string): KnowledgeItem | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;

  let bestMatch: KnowledgeItem | null = null;
  let maxScore = 0;

  for (const item of KNOWLEDGE_BASE) {
    let score = 0;
    for (const kw of item.keywords) {
      if (q.includes(kw)) {
        score += kw.length;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestMatch = item;
    }
  }

  return bestMatch;
}
