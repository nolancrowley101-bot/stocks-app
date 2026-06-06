import { cn } from "@/lib/cn";

export type Stat = {
  label: string;
  value: React.ReactNode;
};

/**
 * Label/value pairs in a tight grid. cols=1 stacks rows (label left, value right).
 * cols=2 or 4 lays them out as a label-over-value compact grid.
 */
export function DataGrid({
  items,
  cols = 1,
  className,
}: {
  items: Stat[];
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}) {
  if (cols === 1) {
    return (
      <dl className={cn("divide-y divide-[var(--border)]", className)}>
        {items.map((s, i) => (
          <div key={i} className="flex justify-between items-baseline gap-3 py-1.5">
            <dt className="text-[var(--fg-2)] text-[12px]">{s.label}</dt>
            <dd className="text-[13px]">{s.value}</dd>
          </div>
        ))}
      </dl>
    );
  }
  const colsCls =
    cols === 2 ? "grid-cols-2" : cols === 3 ? "grid-cols-3" : "grid-cols-4";
  return (
    <dl className={cn("grid gap-x-3 gap-y-2", colsCls, className)}>
      {items.map((s, i) => (
        <div key={i} className="min-w-0">
          <dt className="label">{s.label}</dt>
          <dd className="text-[13px] truncate mt-0.5">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}
