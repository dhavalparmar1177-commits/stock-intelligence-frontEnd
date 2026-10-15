import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Sun,
  Moon,
  Globe,
  ChevronDown,
  Check,
  Menu,
  X,
  Sparkles,
  Newspaper,
  Calendar,
  Target,
  GraduationCap,
  Building2,
  Brain,
  Search,
  User,
  Layers,
} from "lucide-react";
import { useLang } from "../i18n/LanguageContext";
import { LANGS } from "../i18n/lang";
import CommandPalette from "./CommandPalette";
import { useAlerts, describeAlert } from "../hooks/useAlerts";
import { Dropdown, DropdownItem } from "./ui/Dropdown";
import { EmptyState } from "./ui/EmptyState";

interface NavEntry {
  label: string;
  to: string;
  accent?: boolean;
}

/**
 * Single-Row Detached Glass Navbar — "Midnight Aurora" Edition.
 * - Single-row flex layout with min-w-0, zero horizontal overflow from 320px to 2560px.
 * - Max 5 primary links (Dashboard, Discover, Screener, Watchlist, Compare).
 * - IPOs, AI Insights and tools consolidated inside "More" popover.
 * - Collapsible search button (expands on >=1280px, icon button <1280px).
 * - Hamburger drawer below 1024px.
 * - Single border/shadow per icon button (no nested wrappers).
 */
export function Header({ dark, onToggleDark }: { dark: boolean; onToggleDark: () => void }) {
  const { t, lang, setLang } = useLang();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { alerts, triggered } = useAlerts();

  const triggeredList = alerts
    .filter((a) => triggered[a.id])
    .map((alert) => ({ alert, at: triggered[alert.id].at, snapshot: triggered[alert.id].snapshot }));
  const triggeredCount = triggeredList.length;

  // At most 5 primary links as required
  const primaryNav: NavEntry[] = [
    { label: t.nav.dashboard, to: "/" },
    { label: t.nav.discover, to: "/live" },
    { label: t.nav.screener, to: "/screener" },
    { label: t.nav.watchlist, to: "/watchlist" },
    { label: t.nav.compare, to: "/compare" },
  ];

  // Rest of hubs consolidated in "More" popover
  const moreLinks = [
    { label: "IPO Center", to: "/ipos", icon: Layers, badge: "Hub" },
    { label: t.nav.aiInsights || "AI Insights", to: "/opportunities", icon: Sparkles, badge: "AI" },
    { label: t.paper?.title || "Paper Trade", to: "/paper-trade", icon: Building2 },
    { label: t.assistant?.title || "AI Assistant", to: "/ai-assistant", icon: Brain },
    { label: t.planner?.title || "Goal Planner", to: "/goal-planner", icon: Target },
    { label: t.daily?.title || "Daily Brief", to: "/daily", icon: Newspaper },
    { label: t.cal?.title || "Market Calendar", to: "/calendar", icon: Calendar },
    { label: t.opp?.evalLink || "AI Accuracy", to: "/evaluation", icon: Target },
    { label: t.academy?.title || "Learn Academy", to: "/learn", icon: GraduationCap },
  ];

  const iconBtnClass =
    "relative flex items-center justify-center w-9 h-9 rounded-[12px] bg-black/[0.04] dark:bg-white/[0.05] hover:bg-black/[0.07] dark:hover:bg-white/[0.09] border border-black/[0.06] dark:border-white/[0.08] text-[#5A6478] dark:text-[#A3AEC7] hover:text-[#14171F] dark:hover:text-white transition-colors shadow-sm shrink-0";

  return (
    <>
      <header className="sticky top-3 z-50 w-full max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="glass-navbar rounded-[20px] px-3 sm:px-4 py-2 flex items-center justify-between gap-2 min-w-0 w-full transition-all">
          {/* LEFT: Logo & Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Link to="/" className="flex items-center gap-2 group" aria-label={t.hdr.homeAria}>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[12px] bg-gradient-to-tr from-[#7C5CFF] via-[#4F8CFF] to-[#22D3EE] text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-[0_0_15px_rgba(124,92,255,0.4)] group-hover:scale-105 transition-transform">
                SI
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm sm:text-base tracking-tight text-[#14171F] dark:text-[#F4F6FB] font-display">
                  StockIntel
                </span>
                <span className="hidden 2xl:inline-flex items-center gap-1 text-[9px] font-bold text-[#2BD67B] bg-[#2BD67B]/10 border border-[#2BD67B]/20 px-1.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2BD67B] animate-pulse" />
                  NSE · BSE
                </span>
              </div>
            </Link>
          </div>

          {/* CENTER: At most 5 Navigation Links + "More" Dropdown */}
          <nav aria-label="Primary" className="hidden lg:flex items-center gap-0.5 sm:gap-1 min-w-0 shrink relative">
            {primaryNav.map((n) => {
              const isActive = location.pathname === n.to;
              return (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={`relative px-2.5 xl:px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors duration-150 ${
                    isActive
                      ? "text-indigo-600 dark:text-white font-semibold"
                      : "text-[#5A6478] dark:text-[#A3AEC7] hover:text-[#14171F] dark:hover:text-white font-medium"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navbar-sliding-pill"
                      className="absolute inset-0 bg-indigo-500/[0.09] dark:bg-white/[0.09] rounded-full border border-indigo-500/20 dark:border-white/10 shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{n.label}</span>
                </NavLink>
              );
            })}

            {/* Popover "More" Dropdown */}
            {(() => {
              const isMoreActive = moreLinks.some((m) => location.pathname === m.to);
              return (
                <Dropdown
                  label="More hubs"
                  buttonClassName={`text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-full transition-colors border shadow-none ${
                    isMoreActive
                      ? "text-indigo-600 dark:text-white font-semibold bg-indigo-500/[0.09] dark:bg-white/[0.09] border-indigo-500/20 dark:border-white/10"
                      : "text-[#5A6478] dark:text-[#A3AEC7] hover:text-[#14171F] dark:hover:text-white font-medium border-transparent hover:bg-black/[0.04] dark:hover:bg-white/5 bg-transparent"
                  }`}
                  button={
                    <>
                      <span>More</span>
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    </>
                  }
                >
                  <div className="py-1 min-w-[220px] glass-card !rounded-2xl p-1.5 border border-slate-200/90 dark:border-white/10 shadow-pop">
                    {moreLinks.map((m) => {
                      const Icon = m.icon;
                      const isCur = location.pathname === m.to;
                      return (
                        <DropdownItem key={m.to} href={m.to}>
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center">
                              <Icon className="w-4 h-4 mr-2.5 text-[#7C5CFF] shrink-0" />
                              <span
                                className={`text-xs ${
                                  isCur
                                    ? "text-indigo-600 dark:text-white font-bold"
                                    : "text-slate-700 dark:text-[#A3AEC7] font-medium"
                                }`}
                              >
                                {m.label}
                              </span>
                            </div>
                            {m.badge && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-violet-500/10 text-[#7C5CFF] border border-violet-500/20">
                                {m.badge}
                              </span>
                            )}
                          </div>
                        </DropdownItem>
                      );
                    })}
                  </div>
                </Dropdown>
              );
            })()}
          </nav>

          {/* RIGHT: Search + Utility Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* ⌘K Command Palette Button: Expanded on >=1280px, Collapsed to icon on <1280px */}
            {/* Expanded (>=1280px) */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden xl:flex items-center gap-2 px-2.5 sm:px-3 h-9 rounded-[12px] bg-black/[0.04] dark:bg-white/[0.05] hover:bg-black/[0.07] dark:hover:bg-white/[0.09] border border-black/[0.06] dark:border-white/[0.08] text-[#5A6478] dark:text-[#A3AEC7] text-xs transition group shadow-sm"
              aria-label="Search market"
            >
              <Search className="w-3.5 h-3.5 text-[#8E98A8] dark:text-[#6B7792] group-hover:text-[#7C5CFF] transition-colors" />
              <span className="text-[#8E98A8] dark:text-[#6B7792] font-normal truncate max-w-[100px]">
                Search...
              </span>
              <kbd className="font-mono text-[10px] text-[#8E98A8] dark:text-[#6B7792] bg-black/[0.04] dark:bg-black/30 border border-black/[0.06] dark:border-white/10 rounded px-1.5 py-0.5">
                ⌘K
              </kbd>
            </button>

            {/* Collapsed (<1280px) */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className={`xl:hidden ${iconBtnClass}`}
              aria-label="Search market"
              title="Search (⌘K)"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Notifications Dropdown (Single border & shadow) */}
            <Dropdown
              label="Notifications"
              buttonClassName={iconBtnClass}
              button={
                <>
                  <Bell className="w-4 h-4" />
                  {triggeredCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF5C6C] shadow-[0_0_8px_#FF5C6C]" />
                  )}
                </>
              }
            >
              {triggeredList.length ? (
                <ul className="space-y-1.5 max-h-72 overflow-auto p-2 min-w-[280px] glass-card !rounded-2xl border border-white/10">
                  {triggeredList.map(({ alert, at, snapshot }) => (
                    <li
                      key={alert.id}
                      className="text-xs p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#FFB84D]"
                    >
                      <p className="font-semibold text-white">{describeAlert(alert)}</p>
                      <p className="text-[11px] opacity-70 mt-0.5">{snapshot} · {new Date(at).toLocaleTimeString()}</p>
                    </li>
                  ))}
                  <DropdownItem href="/watchlist">
                    <span className="text-[#4F8CFF] font-semibold text-xs">Open Watchlist →</span>
                  </DropdownItem>
                </ul>
              ) : (
                <div className="p-4 text-center glass-card !rounded-2xl border border-white/10 min-w-[240px]">
                  <EmptyState icon="🔔" title={t.hdr.notifEmpty} description={t.hdr.notifHint} />
                </div>
              )}
            </Dropdown>

            {/* Language Switcher (Single border & shadow) */}
            <Dropdown
              label={t.hdr.langLabel}
              className="hidden sm:block"
              buttonClassName="flex items-center gap-1.5 h-9 px-2.5 rounded-[12px] bg-black/[0.04] dark:bg-white/[0.05] hover:bg-black/[0.07] dark:hover:bg-white/[0.09] border border-black/[0.06] dark:border-white/[0.08] text-[#5A6478] dark:text-[#A3AEC7] hover:text-[#14171F] dark:hover:text-white text-xs font-bold transition-colors shadow-sm"
              button={
                <>
                  <Globe className="w-3.5 h-3.5 opacity-60" />
                  <span>{lang.toUpperCase()}</span>
                </>
              }
            >
              <div className="py-1 min-w-[140px] glass-card !rounded-2xl p-1.5 border border-white/10">
                {LANGS.map((l) => (
                  <DropdownItem key={l.code} onSelect={() => setLang(l.code)}>
                    <span className="flex-1 text-xs font-medium">{l.label}</span>
                    {lang === l.code && <Check className="w-3.5 h-3.5 text-[#2BD67B] ml-2" />}
                  </DropdownItem>
                ))}
              </div>
            </Dropdown>

            {/* Dark / Light Mode Toggle (Single border & shadow) */}
            <button
              onClick={onToggleDark}
              aria-label={dark ? t.hdr.lightMode : t.hdr.darkMode}
              title={dark ? t.hdr.lightMode : t.hdr.darkMode}
              className={iconBtnClass}
            >
              {dark ? <Sun className="w-4 h-4 text-[#FFB84D]" /> : <Moon className="w-4 h-4 text-[#4F8CFF]" />}
            </button>

            {/* User Avatar */}
            <div className="hidden sm:flex items-center justify-center w-9 h-9 rounded-[12px] bg-gradient-to-tr from-[#7C5CFF]/20 to-[#22D3EE]/20 border border-[#7C5CFF]/30 text-[#A3AEC7] shrink-0">
              <User className="w-4 h-4" />
            </div>

            {/* Mobile / Tablet Hamburger Button (<1024px) */}
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? t.hdr.closeMenu : t.hdr.openMenu}
              onClick={() => setMenuOpen((v) => !v)}
              className={`lg:hidden ${iconBtnClass}`}
            >
              {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Drawer Menu (<1024px) */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="lg:hidden mt-2 p-3.5 rounded-[20px] glass-navbar border border-slate-200/80 dark:border-white/10 space-y-3 shadow-pop"
            >
              <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] pb-2.5">
                <span className="text-xs font-semibold text-slate-500 dark:text-[#A3AEC7]">Navigation Menu</span>
                <div className="flex items-center gap-1 sm:hidden">
                  {LANGS.slice(0, 3).map((l) => (
                    <button
                      key={l.code}
                      onClick={() => setLang(l.code)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        lang === l.code
                          ? "bg-[#7C5CFF] text-white"
                          : "bg-white/5 text-[#A3AEC7]"
                      }`}
                    >
                      {l.code.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <nav aria-label={t.hdr.mobileNav} className="grid grid-cols-2 gap-1.5">
                {[...primaryNav, ...moreLinks].map((n) => {
                  const isActive = location.pathname === n.to;
                  return (
                    <NavLink
                      key={n.to}
                      to={n.to}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl transition ${
                        isActive
                          ? "bg-indigo-500/[0.12] dark:bg-white/[0.1] text-indigo-600 dark:text-white border border-indigo-500/20 dark:border-white/10 shadow-sm"
                          : "bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-[#A3AEC7] hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <span>{n.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ⌘K Command Palette Modal */}
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

export default Header;
