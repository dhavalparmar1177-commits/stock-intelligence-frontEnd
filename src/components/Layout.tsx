import { useEffect, useState, ReactNode } from "react";
import { useLang } from "../i18n/LanguageContext";
import Header from "./Header";
import BottomNav from "./BottomNav";

/**
 * Global App Shell — "Midnight Aurora" Edition.
 * Features ambient violet & cyan background glows, subtle grid texture,
 * floating detached navbar, and max-width 1440px bento container.
 */
export default function Layout({ children }: { children: ReactNode }) {
  const { t } = useLang();

  // Dark-first default (falls back to dark unless explicitly saved as "light")
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("theme") !== "light";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {
      /* private mode */
    }
  }, [dark]);

  return (
    <div className="min-h-screen bg-[#F6F5F2] dark:bg-[#070B14] text-[#14171F] dark:text-[#F4F6FB] flex flex-col antialiased relative selection:bg-indigo-500/25 selection:text-indigo-300">
      {/* Ambient Aurora Glows */}
      <div className="ambient-aurora-glow" aria-hidden="true">
        <div className="ambient-glow-violet" />
        <div className="ambient-glow-cyan" />
        <div className="ambient-subtle-grid" />
      </div>

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-[#7C5CFF] focus:text-white focus:px-4 focus:py-2 focus:rounded-xl focus:text-sm focus:shadow-lg focus:outline-none"
      >
        {t.hdr.skipLink}
      </a>

      {/* Floating Navbar */}
      <Header dark={dark} onToggleDark={() => setDark((v) => !v)} />

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 relative z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-4 relative z-10">
        <div className="border-t border-black/[0.06] dark:border-white/[0.06] pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8E98A8] dark:text-[#6B7792]">
          <p className="max-w-2xl text-center sm:text-left leading-relaxed">
            Educational & informational purposes only. Not SEBI registered investment advisor. Market data delayed by 15 min or end-of-day. Forecasts and signals are algorithmic estimates, never guaranteed.
          </p>
          <div className="flex items-center gap-2 shrink-0 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-amber-600 dark:text-[#FFB84D]">Delayed 15 min · Informational Feed</span>
          </div>
        </div>
      </footer>

      {/* Mobile Floating Bottom Bar */}
      <BottomNav />
      <div aria-hidden="true" className="h-20 md:hidden" />
    </div>
  );
}
