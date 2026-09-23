import { ReactNode, useState } from "react";

/**
 * Accessible tooltip: hover AND keyboard-focus reveal, described via
 * aria-describedby. Used for metric definitions (P/E, RSI, …).
 */
export function Tooltip({
  tip,
  children,
  className = "",
}: {
  tip: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);
  const [id] = useState(() => `si-tip-${Math.random().toString(36).slice(2, 8)}`);
  if (!tip) return <>{children}</>;
  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <span tabIndex={0} aria-describedby={id} className="underline decoration-dotted decoration-slate-400 underline-offset-2 cursor-help">
        {children}
      </span>
      {visible && (
        <span
          id={id}
          role="tooltip"
          className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-52 p-2 text-xs font-normal text-white bg-slate-900 dark:bg-slate-700 rounded-lg shadow-pop pointer-events-none"
        >
          {tip}
        </span>
      )}
    </span>
  );
}

export default Tooltip;
