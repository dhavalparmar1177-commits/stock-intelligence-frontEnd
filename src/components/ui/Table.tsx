import { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: "left" | "center" | "right";
  numeric?: boolean;
}

/**
 * Institutional data table: horizontal scroll, zebra hover, sticky headers,
 * screen-reader friendly markup, tabular numerals.
 */
export function Table<T extends { id?: unknown }>({
  columns,
  rows,
  caption,
  minWidth = 560,
  empty,
}: {
  columns: Column<T>[];
  rows: T[];
  caption: string;
  minWidth?: number;
  empty?: ReactNode;
}) {
  if (!rows.length) {
    return <>{empty || <p className="p-6 text-center text-sm text-slate-400 dark:text-slate-500">Data unavailable</p>}</>;
  }
  const align = (c: Column<T>) =>
    c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left";
  return (
    <div className="overflow-x-auto -mx-3.5 sm:-mx-5 px-3.5 sm:px-5">
      <table className="w-full text-sm border-collapse" style={{ minWidth }}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
            {columns.map((c) => (
              <th key={c.key} scope="col" className={`py-2.5 px-3 font-semibold ${align(c)}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {rows.map((r, i) => (
            <tr
              key={String(r.id ?? i)}
              className="hover:bg-slate-50/80 dark:hover:bg-slate-850/60 dark:hover:bg-slate-800/40 transition-colors group"
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`py-3 px-3 text-slate-700 dark:text-slate-200 ${align(c)} ${
                    c.numeric ? "si-numeric font-medium" : ""
                  }`}
                >
                  {c.cell(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;

