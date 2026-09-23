import { useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../i18n/LanguageContext";
import { findKnowledge, KNOWLEDGE_BASE } from "../components/assistant/knowledgeBase";
import { marketApi } from "../api/market";
import { PageHeader } from "../components/layout/primitives";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { formatPrice2dp, formatPct } from "../design/tokens";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  keyPoints?: string[];
  learnMoreUrl?: string;
  learnMoreLabel?: string;
  sources?: string[];
  stockQuote?: {
    symbol: string;
    price: number;
    changePct: number;
    recommendation?: string;
  };
  timestamp: string;
}

export function AiAssistant() {
  const { t } = useLang();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-msg",
      sender: "ai",
      text: "Hello! I am your AI Stock Market Assistant. Ask me anything about stock market concepts, learning paths, IPOs, or specific Indian stocks!",
      keyPoints: [
        "Ask concepts like: 'What is PE ratio?' or 'How does SIP work?'",
        "Ask about stocks: 'Tell me about RELIANCE' or 'TCS live price'",
        "Ask beginner steps: 'I am new, where should I start?'"
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [inputQuery, setInputQuery] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const handleSend = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: Message = {
      id: userMsgId,
      sender: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputQuery("");
    setIsThinking(true);

    try {
      // 1. Check if user is asking about a specific stock symbol (e.g. RELIANCE, TCS, INFY)
      const words = q.toUpperCase().split(/\s+/);
      let foundSymbol: string | null = null;

      for (const w of words) {
        if (/^[A-Z]{3,10}$/.test(w) && !["WHAT", "HOW", "WHY", "STOCK", "PRICE", "BEST", "BUY"].includes(w)) {
          foundSymbol = w;
          break;
        }
      }

      if (foundSymbol) {
        try {
          const quoteRes = await marketApi.quotes([foundSymbol]);
          if (Array.isArray(quoteRes) && quoteRes[0]?.price) {
            const stock = quoteRes[0];
            const aiMsg: Message = {
              id: `ai-${Date.now()}`,
              sender: "ai",
              text: `Here is the live market snapshot for **${stock.symbol}**:`,
              stockQuote: {
                symbol: stock.symbol,
                price: stock.price,
                changePct: stock.changePct ?? 0,
              },
              keyPoints: [
                `Live Price: ₹${formatPrice2dp(stock.price)} (${formatPct(stock.changePct ?? 0)})`,
                `52-Week Range: ₹${formatPrice2dp(stock.week52Low)} - ₹${formatPrice2dp(stock.week52High)}`,
                `Day Volume: ${stock.volume ? stock.volume.toLocaleString("en-IN") : "N/A"}`,
              ],
              learnMoreUrl: `/stocks/${stock.symbol}`,
              learnMoreLabel: `Open full AI Research Page for ${stock.symbol}`,
              sources: ["NSE / BSE Official Real-time Market Feed"],
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };

            setMessages((prev) => [...prev, aiMsg]);
            setIsThinking(false);
            return;
          }
        } catch {
          /* continue to knowledge base search if quote fetch fails */
        }
      }

      // 2. Search local knowledge base
      const match = findKnowledge(q);
      if (match) {
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: match.answer,
          keyPoints: match.keyPoints,
          learnMoreUrl: match.learnMoreUrl,
          learnMoreLabel: match.learnMoreLabel,
          sources: [t.assistant?.noSources || "StockIntel Educational Curriculum"],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        // Fallback response with guidance
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: "I couldn't find an exact match for that question, but here are some popular topics you can explore:",
          keyPoints: [
            "Search a stock ticker like 'RELIANCE', 'TCS', or 'SBIN'",
            "Ask about concepts like 'What is PE ratio?' or 'What is RSI?'",
            "Ask about IPOs: 'How do IPOs work?'",
            "Or start learning in the Academy (`/learn`)"
          ],
          learnMoreUrl: "/learn",
          learnMoreLabel: "Go to Stock Market Academy",
          sources: ["StockIntel Knowledge Base"],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <PageHeader
        title={t.assistant?.title || "AI Investment Assistant"}
        description={t.assistant?.subtitle || "Ask questions about stocks, market concepts, IPOs, or investment strategies"}
      />

      {/* Disclaimer */}
      <div className="bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/60 rounded-xl p-3 text-xs text-violet-900 dark:text-violet-200 flex items-center gap-2">
        <span>💡</span>
        <span>{t.assistant?.disclaimer || "AI Assistant provides educational information and real-time market data lookups. Not investment advice."}</span>
      </div>

      {/* Chat Messages Window */}
      <Card className="min-h-[420px] max-h-[550px] flex flex-col justify-between p-4 space-y-4">
        <div className="overflow-y-auto space-y-4 pr-1">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm shadow-sm space-y-2 ${
                  m.sender === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-slate-100 dark:bg-[#131d31] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none"
                }`}
              >
                <p className="whitespace-pre-line leading-relaxed">{m.text}</p>

                {/* Stock Quote Card embedded in response */}
                {m.stockQuote && (
                  <div className="p-3 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between mt-2">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{m.stockQuote.symbol}</span>
                      <span className="text-xs text-slate-500 block">NSE Live</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        ₹{formatPrice2dp(m.stockQuote.price)}
                      </span>
                      <span
                        className={`block text-xs font-semibold ${
                          m.stockQuote.changePct >= 0 ? "text-emerald-500" : "text-rose-500"
                        }`}
                      >
                        {formatPct(m.stockQuote.changePct)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Key Points / Bullet Points */}
                {m.keyPoints && m.keyPoints.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-700 dark:text-slate-300 pt-1">
                    {m.keyPoints.map((pt, idx) => (
                      <li key={idx}>{pt}</li>
                    ))}
                  </ul>
                )}

                {/* Action / Learn More Button */}
                {m.learnMoreUrl && (
                  <div className="pt-2">
                    <Link
                      to={m.learnMoreUrl}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {m.learnMoreLabel || "Learn More"} →
                    </Link>
                  </div>
                )}

                {/* Sources Footer */}
                {m.sources && (
                  <div className="text-[10px] text-slate-400 border-t border-slate-200/50 dark:border-slate-800/50 pt-1">
                    Source: {m.sources.join(", ")}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-400 px-1 mt-1">{m.timestamp}</span>
            </div>
          ))}

          {isThinking && (
            <div className="flex items-start">
              <div className="bg-slate-100 dark:bg-[#131d31] rounded-2xl px-4 py-2 text-xs text-slate-500 animate-pulse">
                {t.assistant?.thinking || "Analyzing market data & knowledge base..."}
              </div>
            </div>
          )}
        </div>

        {/* Suggested Quick Questions */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
          <span className="text-[11px] text-slate-400 block mb-2">{t.assistant?.suggested || "Suggested Questions"}:</span>
          <div className="flex flex-wrap gap-1.5">
            {KNOWLEDGE_BASE.slice(0, 5).map((kb) => (
              <button
                key={kb.id}
                onClick={() => handleSend(kb.question)}
                className="text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 transition"
              >
                {kb.question}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-2 pt-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={t.assistant?.inputPh || "Ask anything about stocks, PE ratio, SIP..."}
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button variant="primary" onClick={() => handleSend()} disabled={isThinking || !inputQuery.trim()}>
            Send
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default AiAssistant;
