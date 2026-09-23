import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useLang } from "../i18n/LanguageContext";
import { LANGS } from "../i18n/lang";
import GlobalSearch from "./GlobalSearch";
import { useAlerts, describeAlert } from "../hooks/useAlerts";
import { Dropdown, DropdownItem } from "./ui/Dropdown";
import { EmptyState } from "./ui/EmptyState";

interface NavEntry {
  label: string;
  to: string;
  accent?: string;
  badge?: string;
}

/**
 * Institutional Global Header with glassmorphism, live status indicators, and keyboard shortcuts.
 */
export function Header({ dark, onToggleDark }: { dark: boolean; onToggleDark: () => void }) {
  const { t, lang, setLang } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const { alerts, triggered } = useAlerts();
  const triggeredList = alerts
    .filter((a) => triggered[a.id])
    .map((alert) => ({ alert, at: triggered[alert.id].at, snapshot: triggered[alert.id].snapshot }));
  const triggeredCount = triggeredList.length;

  const primaryNav: NavEntry[] = [
    { label: t.nav.dashboard, to: "/" },
    { label: t.nav.discover, to: "/live" },
    { label: t.nav.screener, to: "/screener" },
    { label: t.nav.watchlist, to: "/watchlist" },
    { label: t.nav.compare, to: "/compare" },
    { label: "IPOs", to: "/ipos" },
    { label: t.nav.aiInsights, to: "/opportunities", accent: "text-violet-600 dark:text-violet-400 font-semibold" },
  ];

  const moreLinks = [
    { label: t.paper?.title || "Paper Trade", to: "/paper-trade", icon: "📊" },
    { label: t.assistant?.title || "AI Assistant", to: "/ai-assistant", icon: "🧠" },
    { label: t.planner?.title || "Goal Planner", to: "/goal-planner", icon: "🎯" },
    { label: t.daily?.title || "Daily Brief", to: "/daily", icon: "📰" },
    { label: t.cal?.title || "Market Calendar", to: "/calendar", icon: "📅" },
    { label: t.opp?.evalLink || "AI Accuracy", to: "/evaluation", icon: "🎯" },
    { label: t.academy?.title || "Learn Academy", to: "/learn", icon: "🎓" },
  ];

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `px-2.5 xl:px-3 py-1.5 rounded-lg text-xs xl:text-sm font-medium whitespace-nowrap transition-all duration-150 ${
      isActive
        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold shadow-sm"
        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70"
    }`;

  const desktopCls = (accent?: string) => ({ isActive }: { isActive: boolean }) =>
    `${linkCls({ isActive })}${isActive ? "" : ` ${accent || ""}`}`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/90 dark:border-slate-800/80 bg-white/85 dark:bg-[#090d16]/90 backdrop-blur-md shadow-[0_1px_8px_-2px_rgb(15_23_42/0.05)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3.5 h-14">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group" aria-label={t.hdr.homeAria}>
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
              SI
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base sm:text-[1.0625rem] tracking-tight text-slate-900 dark:text-slate-100 font-display">
                StockIntel
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 px-1.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                NSE · BSE
              </span>
            </div>
          </Link>

          {/* Desktop primary nav */}
          <nav aria-label="Primary" className="hidden lg:flex items-center gap-0.5 xl:gap-1.5 shrink-0">
            {primaryNav.map((n) => (
              <NavLink key={n.to} to={n.to} className={desktopCls(n.accent)}>
                {n.label}
              </NavLink>
            ))}

            {/* More menu dropdown for secondary hubs */}
            <Dropdown
              label="More hubs"
              button={
                <span className="text-xs xl:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1">
                  More ▾
                </span>
              }
            >
              <div className="py-1">
                {moreLinks.map((m) => (
                  <DropdownItem key={m.to} href={m.to}>
                    <span className="mr-2 text-sm">{m.icon}</span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{m.label}</span>
                  </DropdownItem>
                ))}
              </div>
            </Dropdown>
          </nav>

          {/* Right side controls */}
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="hidden md:block w-36 lg:w-44 xl:w-56">
              <GlobalSearch />
            </div>

            {/* Notifications Dropdown */}
            <Dropdown
              label="Notifications"
              button={
                <>
                  <span aria-hidden="true" className="text-sm">🔔</span>
                  <span className="hidden sm:inline text-xs font-medium">{t.nav.alerts}</span>
                  {triggeredCount > 0 && (
                    <span className="text-[10px] font-bold bg-rose-600 text-white rounded-full px-1.5 py-0.2 animate-pulse">
                      {triggeredCount}
                    </span>
                  )}
                </>
              }
            >
              {triggeredList.length ? (
                <ul className="space-y-1 max-h-72 overflow-auto p-1">
                  {triggeredList.map(({ alert, at, snapshot }) => (
                    <li key={alert.id} className="text-xs px-3 py-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-800/60">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{describeAlert(alert)}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{snapshot} · {new Date(at).toLocaleTimeString()}</p>
                    </li>
                  ))}
                  <DropdownItem href="/watchlist">
                    <span className="text-blue-600 dark:text-blue-400 font-medium text-xs">Open Watchlist →</span>
                  </DropdownItem>
                </ul>
              ) : (
                <EmptyState icon="🔔" title={t.hdr.notifEmpty} description={t.hdr.notifHint} />
              )}
            </Dropdown>

            {/* Language Switcher */}
            <div className="hidden md:flex items-center gap-1.5">
              <Dropdown
                label={t.hdr.langLabel}
                button={<><span aria-hidden="true" className="text-xs">🌐</span><span className="text-xs font-bold">{lang.toUpperCase()}</span></>}
              >
                {LANGS.map((l) => (
                  <DropdownItem key={l.code} onSelect={() => setLang(l.code)}>
                    <span className="flex-1 text-xs">{l.label}</span>
                    {lang === l.code && <span className="text-blue-600 font-bold text-xs" aria-hidden="true">✓</span>}
                  </DropdownItem>
                ))}
              </Dropdown>

              {/* Theme Toggle */}
              <button
                onClick={onToggleDark}
                aria-label={dark ? t.hdr.lightMode : t.hdr.darkMode}
                title={dark ? t.hdr.lightMode : t.hdr.darkMode}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0e1626] hover:bg-slate-50 dark:hover:bg-slate-800/80 text-sm shadow-card transition-colors"
              >
                <span aria-hidden="true">{dark ? "☀️" : "🌙"}</span>
              </button>
            </div>

            {/* Mobile menu toggle */}
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? t.hdr.closeMenu : t.hdr.openMenu}
              onClick={() => setMenuOpen((v) => !v)}
              className="lg:hidden p-2 rounded-lg border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0e1626] text-sm"
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile / tablet drawer panel */}
        {menuOpen && (
          <div className="lg:hidden pb-4 pt-2 space-y-3 border-t border-slate-200/80 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="md:hidden">
              <GlobalSearch />
            </div>
            <nav aria-label={t.hdr.mobileNav} className="grid grid-cols-2 gap-1.5">
              {[...primaryNav, ...moreLinks].map((n) => (
                <NavLink key={n.to} to={n.to} onClick={() => setMenuOpen(false)} className={linkCls}>
                  {n.label}
                </NavLink>
              ))}
            </nav>
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800" role="group" aria-label={t.hdr.langLabel}>
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  aria-pressed={lang === l.code}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                    lang === l.code
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {l.label}
                </button>
              ))}
              <button
                onClick={onToggleDark}
                aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              >
                {dark ? "☀️ Light" : "🌙 Dark"}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;

