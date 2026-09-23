import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./i18n/LanguageContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Daily from "./pages/Daily";
import LiveDashboard from "./pages/LiveDashboard";
import StockDetail from "./pages/StockDetail";
import Screener from "./pages/Screener";
import Watchlist from "./pages/Watchlist";
import Compare from "./pages/Compare";
import Opportunities from "./pages/Opportunities";
import Evaluation from "./pages/Evaluation";
import Calendar from "./pages/Calendar";
import Ipos from "./pages/Ipos";
import IpoDetail from "./pages/IpoDetail";
import Academy from "./pages/Academy";
import Lesson from "./pages/Lesson";
import PaperTrading from "./pages/PaperTrading";
import AiAssistant from "./pages/AiAssistant";
import GoalPlanner from "./pages/GoalPlanner";

export default function App() {
  return (
    <LanguageProvider>
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/daily" element={<Daily />} />
          <Route path="/live" element={<LiveDashboard />} />
          <Route path="/stocks/:symbol" element={<StockDetail />} />
          <Route path="/screener" element={<Screener />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/evaluation" element={<Evaluation />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/ipos" element={<Ipos />} />
          <Route path="/ipos/:symbol" element={<IpoDetail />} />
          <Route path="/learn" element={<Academy />} />
          <Route path="/learn/:id" element={<Lesson />} />
          <Route path="/paper-trade" element={<PaperTrading />} />
          <Route path="/ai-assistant" element={<AiAssistant />} />
          <Route path="/goal-planner" element={<GoalPlanner />} />
        </Routes>
      </Layout>
    </BrowserRouter>
    </LanguageProvider>
  );
}
