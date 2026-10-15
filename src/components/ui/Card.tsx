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
  none: "border-slate-200/80 dark:border-white/[0.06]",
  live: "border-emerald-500/30 dark:border-[#2BD67B]/30 ring-1 ring-[#2BD67B]/20",
  ai: "border-violet-500/30 dark:border-[#7C5CFF]/30 ring-1 ring-[#7C5CFF]/20 shadow-[0_0_30px_rgba(124,92,255,0.12)]",
  warning: "border-amber-500/30 dark:border-[#FFB84D]/30 ring-1 ring-[#FFB84D]/20",
};

/**
 * Modern FinTech bento glass card container with 24px padding,
 * layered soft shadows, hairline border, and subtle inset top highlight.
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
      className={`bg-white/80 dark:bg-[#131C30]/70 backdrop-blur-[20px] border ${ACCENTS[accent]} rounded-[20px] shadow-[0_12px_32px_-8px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-200 ${
        hover
          ? "hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_24px_70px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)]"
          : ""
      } ${padded ? "p-5 sm:p-6" : ""} ${className}`}
      {...rest}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="min-w-0 flex-1">
            {title && (
              <h3 className="font-semibold text-base sm:text-lg text-slate-900 dark:text-[#F4F6FB] tracking-tight leading-snug truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A3AEC7] mt-0.5 leading-relaxed truncate">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function CardGrid({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 ${className}`}>
      {children}
    </div>
  );
}

export default Card;
