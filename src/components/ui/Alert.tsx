import { ReactNode } from "react";

type Tone = "info" | "success" | "warning" | "danger" | "ai";

const TONES: Record<Tone, string> = {
  info: "bg-blue-50/80 dark:bg-blue-950/30 border-blue-200/90 dark:border-blue-900/60 text-slate-800 dark:text-slate-200",
  success: "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200/90 dark:border-emerald-900/60 text-slate-800 dark:text-slate-200",
  warning: "bg-amber-50/80 dark:bg-amber-950/30 border-amber-200/90 dark:border-amber-900/60 text-slate-800 dark:text-slate-200",
  danger: "bg-rose-50/80 dark:bg-rose-950/30 border-rose-200/90 dark:border-rose-900/60 text-slate-800 dark:text-slate-200",
  ai: "bg-violet-50/80 dark:bg-violet-950/30 border-violet-200/90 dark:border-violet-900/60 text-slate-800 dark:text-slate-200",
};

/**
 * Inline alert banner with institutional borders and semantic tone.
 */
export function Alert({
  tone = "info",
  title,
  children,
  className = "",
}: {
  tone?: Tone;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={`border rounded-xl p-3.5 text-xs sm:text-sm shadow-sm ${TONES[tone]} ${className}`}
    >
      {title && <p className="font-semibold mb-1 text-slate-900 dark:text-slate-100">{title}</p>}
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

export default Alert;

