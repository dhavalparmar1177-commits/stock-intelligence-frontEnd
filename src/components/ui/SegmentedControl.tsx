import { ReactNode } from "react";

export interface SegmentOption<T extends string> {
  id: T;
  label: ReactNode;
  disabled?: boolean;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
}

/**
 * Modern FinTech Segmented Control pill switcher.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  className = "",
  ariaLabel = "Segmented control",
}: SegmentedControlProps<T>) {
  const padClass = size === "sm" ? "p-0.5 text-xs" : "p-1 text-xs sm:text-sm";
  const itemPadClass = size === "sm" ? "px-2 py-0.5" : "px-3 py-1";

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`inline-flex items-center bg-slate-100/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-lg ${padClass} ${className}`}
    >
      {options.map((opt) => {
        const isActive = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            disabled={opt.disabled}
            aria-pressed={isActive}
            onClick={() => onChange(opt.id)}
            className={`font-semibold rounded-md transition-all duration-150 whitespace-nowrap ${itemPadClass} ${
              isActive
                ? "bg-white dark:bg-[#17203a] text-indigo-600 dark:text-indigo-300 shadow-sm border border-slate-200/50 dark:border-white/10"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-800/40"
            } ${opt.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
