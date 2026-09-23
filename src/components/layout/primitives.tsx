import { ReactNode } from "react";

/**
 * Responsive layout primitives for consistent rhythm and alignment across all breakpoints.
 */

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap mb-5 pb-1">
      <div className="min-w-0 flex-1">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-display">
          {title}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>}
    </div>
  );
}

export function Section({
  title,
  subtitle,
  badge,
  action,
  children,
  className = "",
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`space-y-3 ${className}`}>
      {(title || action || badge) && (
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            {title && (
              <h2 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100 tracking-tight">
                {title}
              </h2>
            )}
            {badge}
          </div>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
          {action && <div className="ml-auto">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/** 1 col mobile → 2 col tablet → 4 col desktop card grid. */
export function Grid2to4({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`grid gap-3.5 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 ${className}`}>{children}</div>;
}

/** 1 col mobile → 3 col desktop. */
export function Grid1to3({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`grid gap-3.5 sm:gap-4 grid-cols-1 lg:grid-cols-3 ${className}`}>{children}</div>;
}

/** 1 col mobile → 2 col tablet+. */
export function Grid1to2({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`grid gap-3.5 sm:gap-4 grid-cols-1 md:grid-cols-2 ${className}`}>{children}</div>;
}

export function Stack({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`space-y-4 sm:space-y-6 ${className}`}>{children}</div>;
}

