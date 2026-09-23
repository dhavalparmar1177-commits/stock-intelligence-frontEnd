import { ReactNode } from "react";
import { Button } from "./Button";

/**
 * Empty state — shown when real data legitimately has zero rows
 * (e.g. "Your watchlist is empty."). Never substitutes fake data.
 */
export function EmptyState({
  icon = "📭",
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: { label: string; onClick?: () => void; href?: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4">
      <div aria-hidden="true" className="text-3xl mb-2">{icon}</div>
      <p className="font-semibold text-sm">{title}</p>
      {description && <p className="text-sm text-slate-500 mt-1 max-w-sm">{description}</p>}
      {action &&
        (action.href ? (
          <a href={action.href} className="mt-3 inline-flex items-center text-sm px-3.5 py-2 rounded-lg bg-blue-700 text-white hover:bg-blue-800">
            {action.label}
          </a>
        ) : (
          <Button variant="primary" size="md" onClick={action.onClick} className="mt-3">
            {action.label}
          </Button>
        ))}
    </div>
  );
}

export default EmptyState;
