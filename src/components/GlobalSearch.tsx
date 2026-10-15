import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useLang } from "../i18n/LanguageContext";
import CommandPalette from "./CommandPalette";

export function GlobalSearch({ placeholder }: { autoFocus?: boolean; placeholder?: string }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);

  // Global hotkey Ctrl+K / Cmd+K to open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open command palette search"
        className="w-full flex items-center justify-between border border-slate-200/90 dark:border-white/[0.08] rounded-xl px-3 py-1.5 text-xs bg-slate-100/70 dark:bg-[#17203a] hover:bg-white dark:hover:bg-[#1e2947] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-all shadow-sm group"
      >
        <span className="flex items-center gap-2 truncate">
          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
          <span className="truncate">{placeholder || t.hdr.searchPh || "Search company, symbol..."}</span>
        </span>
        <kbd className="hidden sm:inline-block text-[10px] font-mono text-slate-400 dark:text-slate-400 bg-white dark:bg-[#12192d] border border-slate-200 dark:border-white/10 rounded px-1.5 py-0.5 shrink-0 shadow-sm">
          ⌘K
        </kbd>
      </button>

      <CommandPalette open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export default GlobalSearch;
