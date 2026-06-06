import { Num } from "./Num";

/**
 * Horizontal bar showing low/high with a marker for the current value.
 * Used for day-range and 52-week range.
 */
export function RangeBar({
  low,
  high,
  current,
  format,
  labelLow,
  labelHigh,
}: {
  low?: number | null;
  high?: number | null;
  current?: number | null;
  format: (n: number | null | undefined) => string;
  labelLow?: string;
  labelHigh?: string;
}) {
  const valid =
    low != null &&
    high != null &&
    current != null &&
    Number.isFinite(low) &&
    Number.isFinite(high) &&
    high > low;
  const pct = valid ? Math.max(0, Math.min(100, ((current - low) / (high - low)) * 100)) : null;

  return (
    <div>
      <div className="relative h-1 bg-[var(--surface-2)] rounded-sm">
        <div className="absolute inset-y-0 left-0 right-0 rounded-sm" style={{
          background: "linear-gradient(to right, color-mix(in srgb, var(--loss) 40%, transparent), color-mix(in srgb, var(--flat) 30%, transparent), color-mix(in srgb, var(--gain) 40%, transparent))",
        }} />
        {pct != null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-[3px] h-3 bg-[var(--fg)] rounded-[1px] shadow"
            style={{ left: `calc(${pct}% - 1.5px)` }}
            title={`${pct.toFixed(1)}%`}
          />
        )}
      </div>
      <div className="mt-1 flex justify-between text-[10px] uppercase tracking-wider text-[var(--fg-3)]">
        <span>
          {labelLow ?? "Low"} <Num className="text-[var(--fg-2)] normal-case tracking-normal ml-1">{format(low)}</Num>
        </span>
        <span>
          {labelHigh ?? "High"} <Num className="text-[var(--fg-2)] normal-case tracking-normal ml-1">{format(high)}</Num>
        </span>
      </div>
    </div>
  );
}
