import { cn } from "@/lib/cn";

/**
 * Thin styled wrapper. Caller renders <table>/<thead>/<tbody> using the
 * classnames below so headings line up with body cells.
 */
export function DataTable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto thin-scroll", className)}>
      <table className="w-full text-[12px]">{children}</table>
    </div>
  );
}

export const tableHead =
  "label text-left h-7 px-3 border-b border-[var(--border)] bg-[var(--surface)] font-normal";
export const tableHeadNum = `${tableHead} text-right`;
export const tableCell = "px-3 h-8 align-middle whitespace-nowrap";
export const tableCellNum = `${tableCell} text-right num`;
export const tableRow =
  "border-b border-[var(--border)] hover:bg-[var(--surface-2)]";
