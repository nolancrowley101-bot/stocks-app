"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, type IChartApi, type ISeriesApi, AreaSeries } from "lightweight-charts";

type Range = "1d" | "5d" | "1mo" | "6mo" | "1y" | "5y" | "max";
const RANGES: { id: Range; label: string }[] = [
  { id: "1d", label: "1D" },
  { id: "5d", label: "5D" },
  { id: "1mo", label: "1M" },
  { id: "6mo", label: "6M" },
  { id: "1y", label: "1Y" },
  { id: "5y", label: "5Y" },
  { id: "max", label: "MAX" },
];

type ChartPoint = { t: number; o: number; h: number; l: number; c: number };

export default function PriceChart({ symbol }: { symbol: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const [range, setRange] = useState<Range>("6mo");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wrapRef.current) return;
    const chart = createChart(wrapRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#8a8a93",
        fontFamily: "var(--font-mono-stack), ui-monospace, monospace",
        fontSize: 10,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(31,31,36,0.6)" },
        horzLines: { color: "rgba(31,31,36,0.6)" },
      },
      rightPriceScale: { borderColor: "#1f1f24" },
      timeScale: { borderColor: "#1f1f24", timeVisible: true, secondsVisible: false },
      crosshair: { mode: 1 },
      width: wrapRef.current.clientWidth,
      height: 360,
      autoSize: true,
    });
    const series = chart.addSeries(AreaSeries, {
      topColor: "rgba(34,197,94,0.28)",
      bottomColor: "rgba(34,197,94,0.0)",
      lineColor: "rgb(34,197,94)",
      lineWidth: 2,
      priceLineVisible: false,
    });
    chartRef.current = chart;
    seriesRef.current = series;
    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/quote/${encodeURIComponent(symbol)}/chart?range=${range}`);
        if (!res.ok) return;
        const data = (await res.json()) as { points: ChartPoint[] };
        if (cancelled || !seriesRef.current) return;
        const mapped = data.points.map((p) => ({
          time: (p.t / 1000) as unknown as number,
          value: p.c,
        }));
        seriesRef.current.setData(mapped as never);
        chartRef.current?.timeScale().fitContent();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [symbol, range]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 h-9 border-b border-[var(--border)]">
        <div className="flex items-center">
          {RANGES.map((r, i) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`num text-[11px] px-2 h-6 border border-[var(--border)] ${
                i === 0 ? "rounded-l-sm" : "-ml-px"
              } ${i === RANGES.length - 1 ? "rounded-r-sm" : ""} ${
                range === r.id
                  ? "bg-[var(--surface-2)] text-[var(--fg)] border-[var(--border-strong)]"
                  : "text-[var(--fg-2)] hover:text-[var(--fg)] bg-[var(--surface)]"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        {loading && (
          <span className="label flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
            Loading
          </span>
        )}
      </div>
      <div ref={wrapRef} className="w-full p-2" />
    </div>
  );
}
