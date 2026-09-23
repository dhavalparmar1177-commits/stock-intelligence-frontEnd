import { useState } from "react";
import { useLang } from "../i18n/LanguageContext";
import useInvestorProfile, { RiskType } from "../hooks/useInvestorProfile";
import { PageHeader } from "../components/layout/primitives";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import MetricCard from "../components/ui/MetricCard";
import { formatPriceINR } from "../design/tokens";

const QUIZ_QUESTIONS = [
  {
    q: "1. What is your age group?",
    options: [
      { text: "18 – 25 years old", score: 3 },
      { text: "26 – 35 years old", score: 3 },
      { text: "36 – 50 years old", score: 2 },
      { text: "50+ years old", score: 1 },
    ],
  },
  {
    q: "2. What is your stock market experience?",
    options: [
      { text: "Complete beginner (0 years)", score: 1 },
      { text: "Less than 1 year", score: 2 },
      { text: "1 to 3 years", score: 3 },
      { text: "3+ years", score: 3 },
    ],
  },
  {
    q: "3. If your portfolio drops 20% in a market crash, you would...",
    options: [
      { text: "Panic and sell everything immediately", score: 1 },
      { text: "Wait patiently for recovery", score: 2 },
      { text: "Buy more stocks at lower prices", score: 3 },
    ],
  },
  {
    q: "4. What is your primary investment goal?",
    options: [
      { text: "Protect my money safely (Capital Preservation)", score: 1 },
      { text: "Steady growth with moderate risk", score: 2 },
      { text: "Maximum long-term wealth (High Growth)", score: 3 },
    ],
  },
  {
    q: "5. How long can you keep money invested without touching it?",
    options: [
      { text: "Less than 1 year", score: 1 },
      { text: "1 to 3 years", score: 2 },
      { text: "3 to 5 years", score: 2 },
      { text: "5+ years", score: 3 },
    ],
  },
  {
    q: "6. Do you have an Emergency Fund (6 months expenses in savings)?",
    options: [
      { text: "No emergency savings", score: 1 },
      { text: "Partial (1-3 months)", score: 2 },
      { text: "Yes, fully funded (6+ months)", score: 3 },
    ],
  },
  {
    q: "7. What percentage of your monthly income can you comfortably invest?",
    options: [
      { text: "Less than 10%", score: 1 },
      { text: "10% to 25%", score: 2 },
      { text: "25% to 50%", score: 3 },
      { text: "More than 50%", score: 3 },
    ],
  },
  {
    q: "8. Which phrase describes your attitude towards market volatility?",
    options: [
      { text: "Losses make me anxious and stressed", score: 1 },
      { text: "Fluctuations are normal, I look at the long term", score: 2 },
      { text: "Volatility brings great buy opportunities!", score: 3 },
    ],
  },
];

export function GoalPlanner() {
  const { t } = useLang();
  const { profile, saveQuizResult, addGoal, removeGoal, resetQuiz } = useInvestorProfile();

  const [activeTab, setActiveTab] = useState<"quiz" | "sip" | "goals">("quiz");

  // Quiz state
  const [answers, setAnswers] = useState<Record<number, number>>({});

  // SIP Calculator State
  const [monthlySip, setMonthlySip] = useState(5000);
  const [returnRate, setReturnRate] = useState(12); // 12% default for NIFTY
  const [periodYears, setPeriodYears] = useState(10);

  // New Goal Modal/Form State
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState(500000);
  const [goalYears, setGoalYears] = useState(5);

  // Handle Quiz Option Selection
  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
  };

  // Submit Quiz
  const handleSubmitQuiz = () => {
    let totalScore = 0;
    QUIZ_QUESTIONS.forEach((q, idx) => {
      const optIdx = answers[idx];
      if (typeof optIdx === "number") {
        totalScore += q.options[optIdx].score;
      }
    });

    let resultRisk: RiskType = "moderate";
    if (totalScore <= 12) resultRisk = "conservative";
    else if (totalScore >= 20) resultRisk = "aggressive";

    saveQuizResult(answers, resultRisk);
  };

  // SIP Calculation Math
  const i = returnRate / 100 / 12; // Monthly rate
  const n = periodYears * 12; // Months
  const investedAmount = monthlySip * n;
  const futureValue = monthlySip * (((Math.pow(1 + i, n) - 1) / i) * (1 + i));
  const wealthGain = futureValue - investedAmount;

  // Add Goal Submit
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName.trim() || goalTarget <= 0 || goalYears <= 0) return;

    // Calculate required monthly SIP for this goal
    const goalMonthlyRate = (profile.riskType === "aggressive" ? 14 : profile.riskType === "conservative" ? 9 : 12) / 100 / 12;
    const goalMonths = goalYears * 12;
    const reqSip = goalTarget / (((Math.pow(1 + goalMonthlyRate, goalMonths) - 1) / goalMonthlyRate) * (1 + goalMonthlyRate));

    addGoal({
      name: goalName.trim(),
      targetAmount: goalTarget,
      timelineYears: goalYears,
      monthlySIP: Math.round(reqSip),
      expectedReturnPct: Math.round(goalMonthlyRate * 12 * 100),
    });

    setGoalName("");
    setGoalTarget(500000);
    setGoalYears(5);
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={t.planner?.title || "Goal & SIP Investment Planner"}
        description={t.planner?.subtitle || "Discover your risk appetite, calculate SIP returns, and plan your life goals"}
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("quiz")}
          className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition ${
            activeTab === "quiz"
              ? "bg-blue-600 text-white font-bold"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          {t.planner?.quizTab || "1. Risk Profile Quiz"}
        </button>
        <button
          onClick={() => setActiveTab("sip")}
          className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition ${
            activeTab === "sip"
              ? "bg-blue-600 text-white font-bold"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          {t.planner?.sipTab || "2. SIP Calculator"}
        </button>
        <button
          onClick={() => setActiveTab("goals")}
          className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition ${
            activeTab === "goals"
              ? "bg-blue-600 text-white font-bold"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          {t.planner?.goalsTab || "3. My Life Goals"} ({profile.goals.length})
        </button>
      </div>

      {/* TAB 1: RISK PROFILE QUIZ */}
      {activeTab === "quiz" && (
        <div className="space-y-6 max-w-3xl">
          {profile.riskType ? (
            /* Quiz Result Card */
            <Card className="space-y-4 border-l-4 border-l-blue-600 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <Badge tone="info" className="mb-2 uppercase tracking-wide">
                    {profile.riskType} Investor
                  </Badge>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    Your Investment Risk Profile
                  </h3>
                </div>
                <Button variant="secondary" size="sm" onClick={resetQuiz}>
                  {t.planner?.retakeQuiz || "Retake Quiz"}
                </Button>
              </div>

              <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
                {profile.riskType === "conservative" && (
                  <p>
                    🛡️ <strong>Conservative Investor:</strong> You prioritize protecting capital over high returns. Recommended asset split: <strong>60% Debt/FDs/Index funds</strong>, <strong>30% Blue-Chip Large Caps</strong>, <strong>10% Gold</strong>.
                  </p>
                )}
                {profile.riskType === "moderate" && (
                  <p>
                    ⚖️ <strong>Moderate Investor:</strong> You seek steady wealth accumulation with manageable risk. Recommended asset split: <strong>50% NIFTY 50 & Large Caps</strong>, <strong>35% Mid-Cap Growth Stocks</strong>, <strong>15% Debt/FDs</strong>.
                  </p>
                )}
                {profile.riskType === "aggressive" && (
                  <p>
                    🚀 <strong>Aggressive Growth Investor:</strong> You have a long timeframe and are comfortable with short-term market swings for maximum upside. Recommended split: <strong>40% Mid & Small Caps</strong>, <strong>40% Large Cap Leaders</strong>, <strong>20% IPOs & High Growth</strong>.
                  </p>
                )}
              </div>
            </Card>
          ) : (
            /* Questions Form */
            <Card className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {t.planner?.quizTitle || "Investor Risk Assessment"}
                </h3>
                <p className="text-xs text-slate-500">
                  {t.planner?.quizSub || "Answer 8 simple questions to find your personalized investment strategy"}
                </p>
              </div>

              <div className="space-y-6">
                {QUIZ_QUESTIONS.map((q, qIdx) => (
                  <div key={qIdx} className="space-y-2 border-b border-slate-100 dark:border-slate-800/60 pb-4">
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">{q.q}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, optIdx) => (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectOption(qIdx, optIdx)}
                          className={`text-left text-xs p-3 rounded-lg border transition ${
                            answers[qIdx] === optIdx
                              ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-semibold"
                              : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {opt.text}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <Button
                variant="primary"
                onClick={handleSubmitQuiz}
                disabled={Object.keys(answers).length < QUIZ_QUESTIONS.length}
                className="w-full sm:w-auto"
              >
                Calculate My Risk Profile
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* TAB 2: SIP CALCULATOR */}
      {activeTab === "sip" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {t.planner?.sipTitle || "SIP Calculator Controls"}
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.planner?.monthlySip || "Monthly SIP Amount"}: ₹{formatPriceINR(monthlySip)}
              </label>
              <input
                type="range"
                min="500"
                max="100000"
                step="500"
                value={monthlySip}
                onChange={(e) => setMonthlySip(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.planner?.expectedReturn || "Expected Annual Return"}: {returnRate}%
              </label>
              <input
                type="range"
                min="5"
                max="25"
                step="0.5"
                value={returnRate}
                onChange={(e) => setReturnRate(Number(e.target.value))}
                className="w-full"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                Historical NIFTY 50 long-term return is ~12-14% p.a.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.planner?.periodYears || "Investment Period"}: {periodYears} Years
              </label>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={periodYears}
                onChange={(e) => setPeriodYears(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </Card>

          <Card className="lg:col-span-2 space-y-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Calculation Summary & Wealth Creation
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard
                label={t.planner?.totalInvested || "Total Invested"}
                value={`₹${formatPriceINR(Math.round(investedAmount))}`}
              />
              <MetricCard
                label={t.planner?.estimatedReturns || "Estimated Gain"}
                value={`₹${formatPriceINR(Math.round(wealthGain))}`}
                tone="positive"
              />
              <MetricCard
                label={t.planner?.finalCorpus || "Expected Future Corpus"}
                value={`₹${formatPriceINR(Math.round(futureValue))}`}
              />
            </div>

            {/* Visual Bar representation */}
            <div className="space-y-2 pt-4">
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>Invested Capital ({Math.round((investedAmount / futureValue) * 100)}%)</span>
                <span>Wealth Gain ({Math.round((wealthGain / futureValue) * 100)}%)</span>
              </div>
              <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${(investedAmount / futureValue) * 100}%` }}
                  className="bg-blue-600 h-full"
                />
                <div
                  style={{ width: `${(wealthGain / futureValue) * 100}%` }}
                  className="bg-emerald-500 h-full"
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: MY LIFE GOALS */}
      {activeTab === "goals" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {t.planner?.addGoal || "Add New Goal"}
            </h3>

            <form onSubmit={handleAddGoal} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-700 dark:text-slate-300 mb-1">
                  {t.planner?.goalName || "Goal Name"}
                </label>
                <input
                  type="text"
                  required
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="e.g. New Car, House Downpayment..."
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#090d16]"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-700 dark:text-slate-300 mb-1">
                  {t.planner?.targetAmount || "Target Amount (₹)"}
                </label>
                <input
                  type="number"
                  required
                  min="10000"
                  step="10000"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#090d16]"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-700 dark:text-slate-300 mb-1">
                  {t.planner?.timeline || "Target Timeline (Years)"}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="30"
                  value={goalYears}
                  onChange={(e) => setGoalYears(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#090d16]"
                />
              </div>

              <Button type="submit" variant="primary" className="w-full text-xs">
                Calculate & Save Goal
              </Button>
            </form>
          </Card>

          <Card className="lg:col-span-2 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {t.planner?.goalsTitle || "Track Your Financial Goals"}
            </h3>

            {profile.goals.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                {t.planner?.noGoals || "No goals added yet. Create your first goal on the left!"}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profile.goals.map((g) => (
                  <div
                    key={g.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#131d31] space-y-2 relative"
                  >
                    <button
                      onClick={() => removeGoal(g.id)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 text-xs"
                      title="Remove goal"
                    >
                      ✕
                    </button>

                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{g.name}</h4>
                    <div className="text-xs text-slate-500 flex justify-between">
                      <span>Target: ₹{formatPriceINR(g.targetAmount)}</span>
                      <span>{g.timelineYears} Years</span>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800/60 flex justify-between items-center">
                      <span className="text-xs text-slate-500">{t.planner?.calcSip || "Required Monthly SIP"}:</span>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        ₹{formatPriceINR(g.monthlySIP)}/mo
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

export default GoalPlanner;
