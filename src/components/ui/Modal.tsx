import { ReactNode, useEffect, useRef } from "react";
import { Button } from "./Button";

/**
 * Accessible modal: Esc closes, overlay click closes, initial focus moves into dialog.
 */
export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  labelledBy,
}: {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  labelledBy?: string;
}) {
  const titleId = labelledBy || "si-modal-title";
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    // Move focus into the dialog on open.
    const t = setTimeout(() => dialogRef.current?.querySelector<HTMLElement>("button, input, [tabindex]")?.focus(), 0);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      clearTimeout(t);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-lg bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl shadow-pop p-5 sm:p-6"
      >
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <h2 id={titleId} className="font-semibold text-base sm:text-lg text-slate-900 dark:text-slate-100 tracking-tight flex-1">
            {title}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close dialog" className="!px-2 !py-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
            ✕
          </Button>
        </div>
        <div className="text-sm text-slate-700 dark:text-slate-300">{children}</div>
        {footer && <div className="flex justify-end gap-2.5 mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80">{footer}</div>}
      </div>
    </div>
  );
}

export default Modal;

