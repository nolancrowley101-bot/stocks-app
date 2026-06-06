import { cn } from "@/lib/cn";

export function deltaClass(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "text-[var(--flat)]";
  if (n > 0) return "text-[var(--gain)]";
  if (n < 0) return "text-[var(--loss)]";
  return "text-[var(--flat)]";
}

export function Num({
  className,
  delta,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  /** When provided, the value is colored by sign. */
  delta?: number | null;
}) {
  return (
    <span
      className={cn("num", delta !== undefined ? deltaClass(delta) : undefined, className)}
      {...props}
    >
      {children}
    </span>
  );
}

export function Delta({
  value,
  pct,
  className,
}: {
  value?: number | null;
  pct?: number | null;
  className?: string;
}) {
  const sign = value ?? pct ?? 0;
  const v = value != null && Number.isFinite(value)
    ? `${value >= 0 ? "+" : ""}${value.toFixed(2)}`
    : null;
  const p = pct != null && Number.isFinite(pct)
    ? `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`
    : null;
  return (
    <span className={cn("num inline-flex items-baseline gap-1.5", deltaClass(sign), className)}>
      {v && <span>{v}</span>}
      {p && <span className="opacity-80">({p})</span>}
      {!v && !p && <span>—</span>}
    </span>
  );
}
