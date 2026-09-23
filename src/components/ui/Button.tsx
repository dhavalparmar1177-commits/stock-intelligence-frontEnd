import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "ai" | "live";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 border border-blue-600/90 shadow-sm dark:bg-blue-600 dark:hover:bg-blue-500",
  secondary:
    "bg-white dark:bg-[#131d31] text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800/90 shadow-card",
  ghost:
    "bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 border border-transparent",
  danger:
    "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-950/60",
  ai: "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 active:from-violet-800 active:to-indigo-800 border border-violet-500/80 shadow-sm",
  live: "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 border border-emerald-600 shadow-sm",
};

const SIZES: Record<Size, string> = {
  sm: "text-xs px-2.5 py-1.5 rounded-lg",
  md: "text-sm px-3.5 py-2 rounded-lg",
  lg: "text-sm px-5 py-2.5 rounded-xl font-semibold",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

/**
 * Design-system button with institutional finishes and micro-interactions.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "secondary", size = "md", loading, disabled, className = "", children, ...rest }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-1.5 font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 whitespace-nowrap ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {loading ? (
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span className="opacity-80">Loading...</span>
        </span>
      ) : (
        children
      )}
    </button>
  )
);
Button.displayName = "Button";

export default Button;

