/**
 * Skeleton loaders — shimmer placeholders shown while real API data
 * loads. Never render fake values; render shapes instead.
 */
export function Skeleton({ className = "", label = "Loading…" }: { className?: string; label?: string }) {
  return <div role="status" aria-label={label} className={`si-skeleton ${className}`} />;
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div role="status" aria-label="Loading content" className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="si-skeleton h-3.5" style={{ width: `${92 - i * 13}%` }} />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div role="status" aria-label="Loading card" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
      <div className="si-skeleton h-4 w-1/3" />
      <div className="si-skeleton h-7 w-2/3" />
      <div className="si-skeleton h-3.5 w-1/2" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div role="status" aria-label="Loading row" className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800">
      <div className="si-skeleton h-4 w-32" />
      <div className="si-skeleton h-4 w-24" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading table">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

export default Skeleton;
