import { NavLink } from "react-router-dom";
import { Home, TrendingUp, Layers, Star, Sparkles } from "lucide-react";
import { useLang } from "../i18n/LanguageContext";

/**
 * Institutional mobile bottom navigation bar with active indicators and glassmorphism.
 */
export function BottomNav() {
  const { t } = useLang();

  const item = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center gap-1 flex-1 py-2 text-[10px] sm:text-[11px] font-medium transition-all ${
      isActive
        ? "text-violet-600 dark:text-[#7C5CFF] font-bold"
        : "text-slate-500 dark:text-[#A3AEC7] hover:text-slate-800 dark:hover:text-white"
    }`;

  return (
    <nav
      aria-label={`${t.hdr.mobileNav} primary`}
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-200/90 dark:border-white/[0.06] bg-white/90 dark:bg-[#070B14]/90 backdrop-blur-xl shadow-lg"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch px-1">
        <NavLink to="/" end className={item} aria-label={t.nav.home}>
          {({ isActive }) => (
            <>
              <Home className={`w-4 h-4 transition-transform ${isActive ? "scale-110 text-indigo-600 dark:text-indigo-400" : ""}`} />
              <span>{t.nav.home}</span>
            </>
          )}
        </NavLink>
        <NavLink to="/live" className={item} aria-label={t.nav.discover}>
          {({ isActive }) => (
            <>
              <TrendingUp className={`w-4 h-4 transition-transform ${isActive ? "scale-110 text-indigo-600 dark:text-indigo-400" : ""}`} />
              <span>{t.nav.discover}</span>
            </>
          )}
        </NavLink>
        <NavLink to="/ipos" className={item} aria-label="IPOs">
          {({ isActive }) => (
            <>
              <Layers className={`w-4 h-4 transition-transform ${isActive ? "scale-110 text-indigo-600 dark:text-indigo-400" : ""}`} />
              <span>IPOs</span>
            </>
          )}
        </NavLink>
        <NavLink to="/watchlist" className={item} aria-label={t.nav.watchlist}>
          {({ isActive }) => (
            <>
              <Star className={`w-4 h-4 transition-transform ${isActive ? "scale-110 text-indigo-600 dark:text-indigo-400" : ""}`} />
              <span>{t.nav.watchlist}</span>
            </>
          )}
        </NavLink>
        <NavLink to="/opportunities" className={item} aria-label={t.nav.aiInsights}>
          {({ isActive }) => (
            <>
              <Sparkles className={`w-4 h-4 transition-transform ${isActive ? "scale-110 text-indigo-600 dark:text-indigo-400" : ""}`} />
              <span>{t.nav.ai}</span>
            </>
          )}
        </NavLink>
      </div>
    </nav>
  );
}

export default BottomNav;
