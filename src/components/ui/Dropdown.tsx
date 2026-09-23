import { ReactNode, useEffect, useRef, useState } from "react";

/**
 * Accessible dropdown menu with institutional surfaces, shadow-pop, and keyboard navigation.
 */
export function Dropdown({
  label,
  button,
  children,
  align = "right",
}: {
  label: string;
  button: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0e1626] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors shadow-card"
      >
        {button}
      </button>
      {open && (
        <div
          role="menu"
          aria-label={label}
          className={`absolute z-40 mt-1.5 w-64 max-w-[85vw] bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl shadow-pop p-1.5 animate-in fade-in zoom-in-95 duration-100 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  children,
  onSelect,
  href,
}: {
  children: ReactNode;
  onSelect?: () => void;
  href?: string;
}) {
  const cls =
    "flex w-full items-center gap-2 text-left text-xs sm:text-sm px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors";
  if (href) {
    return (
      <a role="menuitem" href={href} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button role="menuitem" type="button" onClick={onSelect} className={cls}>
      {children}
    </button>
  );
}

export default Dropdown;

