import { HTMLAttributes, ReactNode } from "react";

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  padded?: boolean;
  accent?: "none" | "live" | "ai" | "warning";
  hover?: boolean;
}

const ACCENTS: Record<NonNullable<CardProps["accent"]>, string> = {
  none: "border-slate-200/90 dark:border-slate-800/80",
  live: "border-emerald-500/40 dark:border-emerald-500/30 ring-1 ring-emerald-500/10",
  ai: "border-violet-500/40 dark:border-violet-500/30 ring-1 ring-violet-500/10",
  warning: "border-amber-500/40 dark:border-amber-500/30 ring-1 ring-amber-500/10",
};

/**
 * Institutional FinTech card container with refined borders and soft elevation.
 */
export function Card({
  title,
  subtitle,
  action,
  padded = true,
  accent = "none",
  hover = false,
  className = "",
  children,
  ...rest
}: CardProps) {
  return (
    <section
      className={`bg-white dark:bg-[#0e1626] border ${ACCENTS[accent]} rounded-xl shadow-card transition-all duration-200 ${
        hover ? "hover:shadow-card-hover hover:border-slate-300 dark:hover:border-slate-700" : ""
      } ${padded ? "p-3.5 sm:p-5" : ""} ${className}`}
      {...rest}
    >
      {(title || action) && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <div className="min-w-0">
            {title && (
              <h3 className="font-semibold text-sm sm:text-[0.9375rem] text-slate-900 dark:text-slate-100 tracking-tight leading-snug truncate">
                {title}
              </h3>
            )}
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="ml-auto flex items-center gap-2">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function CardGrid({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`grid gap-3.5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 ${className}`}>{children}</div>;
}

export default Card;

