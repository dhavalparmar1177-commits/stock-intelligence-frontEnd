import { useEffect, useState, ReactNode } from "react";
import { useLang } from "../i18n/LanguageContext";
import Header from "./Header";
import BottomNav from "./BottomNav";
import { Container, Stack } from "./layout/primitives";

/**
 * Global app shell with sticky Header, responsive Container, skip link, and footer.
 */
export default function Layout({ children }: { children: ReactNode }) {
  const { t } = useLang();
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("theme") === "dark";
    } catch {
      return false;
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col antialiased">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-xl focus:text-sm focus:shadow-lg focus:outline-none"
      >
        {t.hdr.skipLink}
      </a>
      <Header dark={dark} onToggleDark={() => setDark((v) => !v)} />
      <main id="main-content" className="flex-1 w-full py-4 sm:py-6 lg:py-8">
        <Container>
          <Stack>{children}</Stack>
        </Container>
      </main>
      <footer className="w-full pb-8 pt-4">
        <Container>
          <div className="border-t border-slate-200/90 dark:border-slate-800/80 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <p className="max-w-xl text-center sm:text-left leading-relaxed">
              {t.footer.disclaimer}
            </p>
            <div className="flex items-center gap-3 shrink-0 text-slate-400 dark:text-slate-500">
              <span>STOCKINTEL · NSE / BSE Intelligence</span>
            </div>
          </div>
        </Container>
      </footer>
      <BottomNav />
      {/* Spacer so the fixed mobile bar never covers footer content */}
      <div aria-hidden="true" className="h-16 md:hidden" />
    </div>
  );
}

