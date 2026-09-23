import { InputHTMLAttributes, forwardRef, ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leadingIcon?: ReactNode;
}

let inputSeq = 0;

/**
 * Accessible labeled input with institutional styling and focus ring.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, leadingIcon, id, className = "", ...rest }, ref) => {
    const autoId = `si-input-${++inputSeq}`;
    const fieldId = id || autoId;
    const descId = hint || error ? `${fieldId}-desc` : undefined;
    return (
      <div className="min-w-0">
        {label && (
          <label htmlFor={fieldId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {leadingIcon && (
            <span aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              {leadingIcon}
            </span>
          )}
          <input
            ref={ref}
            id={fieldId}
            aria-invalid={error ? true : undefined}
            aria-describedby={descId}
            className={`w-full border rounded-xl px-3.5 py-2 text-sm bg-white dark:bg-[#0e1626] border-slate-200/90 dark:border-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-150 ${
              leadingIcon ? "pl-9" : ""
            } ${error ? "!border-rose-500 !ring-rose-500/20" : ""} ${className}`}
            {...rest}
          />
        </div>
        {(hint || error) && (
          <p id={descId} className={`mt-1.5 text-xs ${error ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400"}`}>
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export default Input;

