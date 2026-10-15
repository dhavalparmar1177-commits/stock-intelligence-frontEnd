import { ButtonHTMLAttributes, forwardRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "ai" | "live" | "icon";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-[#7C5CFF] via-[#4F8CFF] to-[#22D3EE] text-white shadow-[0_4px_20px_rgba(124,92,255,0.25)] hover:shadow-[0_4px_24px_rgba(124,92,255,0.4)] hover:brightness-105 active:scale-[0.98] border-0",
  secondary:
    "bg-white/80 dark:bg-[#131C30]/80 backdrop-blur-md text-slate-800 dark:text-[#F4F6FB] border border-slate-200/90 dark:border-white/[0.08] hover:bg-slate-100/90 dark:hover:bg-[#1A2540] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-slate-300 dark:hover:border-white/15 shadow-sm",
  ghost:
    "bg-transparent text-slate-600 dark:text-[#A3AEC7] hover:bg-slate-100/80 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-[#F4F6FB] border border-transparent",
  danger:
    "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-[#FF5C6C] border border-rose-200/80 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-950/60",
  ai: "bg-gradient-to-r from-[#7C5CFF] to-[#4F8CFF] text-white hover:brightness-105 active:brightness-95 shadow-[0_4px_20px_rgba(124,92,255,0.25)] border-0",
  live: "bg-[#2BD67B] text-slate-950 hover:brightness-105 active:brightness-95 shadow-[0_4px_20px_rgba(43,214,123,0.25)] font-semibold border-0",
  icon: "bg-white/80 dark:bg-[#131C30]/80 backdrop-blur-md border border-slate-200/90 dark:border-white/[0.08] text-slate-700 dark:text-[#F4F6FB] hover:bg-slate-100/90 dark:hover:bg-[#1A2540] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] shadow-sm",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "text-xs px-3 py-1.5 rounded-[10px] h-8 gap-1.5",
  md: "text-xs sm:text-sm px-4 py-2 rounded-[12px] h-9 gap-2",
  lg: "text-sm sm:text-base px-5 py-2.5 rounded-[12px] h-11 font-semibold gap-2.5",
  icon: "w-10 h-10 p-0 rounded-full shrink-0 flex items-center justify-center",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

/**
 * Modern FinTech Button with 10px rounded geometry, micro-lift, and accessible states.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "secondary", size = "md", loading, disabled, className = "", children, ...rest }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 whitespace-nowrap ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {loading ? (
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span className="opacity-90">Loading...</span>
        </span>
      ) : (
        children
      )}
    </button>
  )
);
Button.displayName = "Button";

export default Button;
