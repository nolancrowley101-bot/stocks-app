import Link from "next/link";
import { Num } from "./Num";

export type HeatmapCell = {
  label: string;
  symbol?: string;
  value?: number | null; // % change, signed
  sub?: React.ReactNode;
};

/**
 * Grid of color-graded cells. Color intensity scales with |value| / scale.
 */
export function Heatmap({
  cells,
  cols = 4,
  scale = 2.0,
}: {
  cells: HeatmapCell[];
  cols?: number;
  /** % change at which cell reaches max intensity (clamped beyond this). */
  scale?: number;
}) {
  // Responsive: always start at 2 columns on phone, scale up to requested cols on larger screens.
  const colsCls =
    cols === 2 ? "grid-cols-2" :
    cols === 3 ? "grid-cols-2 sm:grid-cols-3" :
    cols === 4 ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4" :
    cols === 5 ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-5" :
    cols === 6 ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-6" : "grid-cols-2 sm:grid-cols-4";
  return (
    <div className={`grid ${colsCls} gap-px bg-[var(--border)]`}>
      {cells.map((c, i) => {
        const v = c.value ?? 0;
        const intensity = Math.min(1, Math.abs(v) / scale);
        const color =
          v > 0
            ? `color-mix(in srgb, var(--gain) ${intensity * 35}%, var(--surface))`
            : v < 0
              ? `color-mix(in srgb, var(--loss) ${intensity * 35}%, var(--surface))`
              : "var(--surface)";
        const content = (
          <div
            className="px-2.5 py-2 flex items-center justify-between gap-2"
            style={{ background: color }}
          >
            <span className="min-w-0">
              <span className="block text-[11px] font-medium truncate">{c.label}</span>
              {c.sub && <span className="block text-[10px] uppercase tracking-wider text-[var(--fg-3)] mt-0.5 truncate">{c.sub}</span>}
            </span>
            <Num delta={c.value} className="text-[12px] whitespace-nowrap">
              {c.value != null && Number.isFinite(c.value)
                ? `${c.value >= 0 ? "+" : ""}${c.value.toFixed(2)}%`
                : "—"}
            </Num>
          </div>
        );
        return c.symbol ? (
          <Link key={i} href={`/quote/${encodeURIComponent(c.symbol)}`} className="hover:outline hover:outline-1 hover:outline-[var(--border-strong)] hover:z-10 relative">
            {content}
          </Link>
        ) : (
          <div key={i}>{content}</div>
        );
      })}
    </div>
  );
}
