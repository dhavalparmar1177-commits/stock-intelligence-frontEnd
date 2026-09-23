import { NavLink } from "react-router-dom";
import { useLang } from "../i18n/LanguageContext";

/**
 * Institutional mobile bottom navigation bar with active indicators and glassmorphism.
 */
export function BottomNav() {
  const { t } = useLang();
  const item = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center gap-1 flex-1 py-2 text-[10px] sm:text-[11px] font-medium transition-all ${
      isActive
        ? "text-blue-600 dark:text-blue-400 font-bold"
        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
    }`;

  return (
    <nav
      aria-label={`${t.hdr.mobileNav} primary`}
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-200/90 dark:border-slate-800/80 bg-white/90 dark:bg-[#090d16]/95 backdrop-blur-md shadow-lg"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch px-1">
        <NavLink to="/" end className={item} aria-label={t.nav.home}>
          {({ isActive }) => (
            <>
              <span aria-hidden="true" className={`text-base leading-none transition-transform ${isActive ? "scale-110" : ""}`}>🏠</span>
              <span>{t.nav.home}</span>
            </>
          )}
        </NavLink>
        <NavLink to="/live" className={item} aria-label={t.nav.discover}>
          {({ isActive }) => (
            <>
              <span aria-hidden="true" className={`text-base leading-none transition-transform ${isActive ? "scale-110" : ""}`}>📈</span>
              <span>{t.nav.discover}</span>
            </>
          )}
        </NavLink>
        <NavLink to="/ipos" className={item} aria-label="IPOs">
          {({ isActive }) => (
            <>
              <span aria-hidden="true" className={`text-base leading-none transition-transform ${isActive ? "scale-110" : ""}`}>🚀</span>
              <span>IPOs</span>
            </>
          )}
        </NavLink>
        <NavLink to="/watchlist" className={item} aria-label={t.nav.watchlist}>
          {({ isActive }) => (
            <>
              <span aria-hidden="true" className={`text-base leading-none transition-transform ${isActive ? "scale-110" : ""}`}>⭐</span>
              <span>{t.nav.watchlist}</span>
            </>
          )}
        </NavLink>
        <NavLink to="/opportunities" className={item} aria-label={t.nav.aiInsights}>
          {({ isActive }) => (
            <>
              <span aria-hidden="true" className={`text-base leading-none transition-transform ${isActive ? "scale-110" : ""}`}>🤖</span>
              <span>{t.nav.ai}</span>
            </>
          )}
        </NavLink>
      </div>
    </nav>
  );
}

export default BottomNav;

