import { Button } from "./Button";
import { useLang } from "../../i18n/LanguageContext";

/**
 * Error state — shown when a real API request fails
 * (e.g. "Unable to load market data."). Retry re-issues the same
 * request; no fallback numbers are ever displayed.
 */
export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  const { t } = useLang();
  const resolvedTitle = title ?? t.gen.unableToLoad;
  const resolvedRetryLabel = retryLabel ?? t.common.retry;
  return (
    <div role="alert" className="flex flex-col items-center justify-center text-center py-10 px-4">
      <div aria-hidden="true" className="text-3xl mb-2">⚠️</div>
      <p className="font-semibold text-sm text-red-700 dark:text-red-400">{resolvedTitle}</p>
      {description && <p className="text-sm text-slate-500 mt-1 max-w-sm">{description}</p>}
      {onRetry && (
        <Button variant="secondary" size="md" onClick={onRetry} className="mt-3">
          {resolvedRetryLabel}
        </Button>
      )}
    </div>
  );
}

export default ErrorState;
