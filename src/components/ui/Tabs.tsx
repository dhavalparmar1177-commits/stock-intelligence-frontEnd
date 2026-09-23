import { KeyboardEvent, ReactNode, useState } from "react";

export interface TabItem {
  id: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

/**
 * Accessible tabs with institutional styling, roving tabindex, arrow-key navigation.
 */
export function Tabs({
  tabs,
  defaultId,
  label,
  variant = "line",
  className = "",
}: {
  tabs: TabItem[];
  defaultId?: string;
  label: string;
  variant?: "line" | "pills";
  className?: string;
}) {
  const [active, setActive] = useState(defaultId || tabs[0]?.id);

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    let next: number | null = null;
    if (e.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (e.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = tabs.length - 1;
    if (next === null) return;
    e.preventDefault();
    const target = tabs[next];
    if (!target.disabled) {
      setActive(target.id);
      document.getElementById(`si-tab-${target.id}`)?.focus();
    }
  };

  const current = tabs.find((t) => t.id === active) || tabs[0];

  return (
    <div className={className}>
      {variant === "pills" ? (
        <div
          role="tablist"
          aria-label={label}
          className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto border border-slate-200/80 dark:border-slate-700/60 w-fit max-w-full"
        >
          {tabs.map((t, i) => {
            const selected = t.id === active;
            return (
              <button
                key={t.id}
                id={`si-tab-${t.id}`}
                role="tab"
                aria-selected={selected}
                aria-controls={`si-panel-${t.id}`}
                tabIndex={selected ? 0 : -1}
                disabled={t.disabled}
                onClick={() => setActive(t.id)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap transition-all duration-150 disabled:opacity-40 ${
                  selected
                    ? "bg-white dark:bg-[#0e1626] text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/80 dark:border-slate-700"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      ) : (
        <div
          role="tablist"
          aria-label={label}
          className="flex gap-2 border-b border-slate-200/90 dark:border-slate-800 overflow-x-auto"
        >
          {tabs.map((t, i) => {
            const selected = t.id === active;
            return (
              <button
                key={t.id}
                id={`si-tab-${t.id}`}
                role="tab"
                aria-selected={selected}
                aria-controls={`si-panel-${t.id}`}
                tabIndex={selected ? 0 : -1}
                disabled={t.disabled}
                onClick={() => setActive(t.id)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className={`px-3.5 py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-all duration-150 disabled:opacity-40 ${
                  selected
                    ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-semibold"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      )}
      {current && (
        <div
          id={`si-panel-${current.id}`}
          role="tabpanel"
          aria-labelledby={`si-tab-${current.id}`}
          className="pt-4"
        >
          {current.content}
        </div>
      )}
    </div>
  );
}

export default Tabs;

