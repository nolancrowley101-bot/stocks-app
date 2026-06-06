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
        textColor: "#a1a1aa",
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(63,63,70,0.4)" },
        horzLines: { color: "rgba(63,63,70,0.4)" },
      },
      rightPriceScale: { borderColor: "rgba(63,63,70,0.4)" },
      timeScale: { borderColor: "rgba(63,63,70,0.4)", timeVisible: true, secondsVisible: false },
      crosshair: { mode: 1 },
      width: wrapRef.current.clientWidth,
      height: 360,
      autoSize: true,
    });
    const series = chart.addSeries(AreaSeries, {
      topColor: "rgba(16,185,129,0.4)",
      bottomColor: "rgba(16,185,129,0.0)",
      lineColor: "rgb(16,185,129)",
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
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`px-2.5 py-1 text-xs rounded-md ${
                range === r.id
                  ? "bg-emerald-500 text-zinc-950 font-medium"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        {loading && <span className="text-xs text-zinc-500">Loading…</span>}
      </div>
      <div ref={wrapRef} className="w-full" />
    </div>
  );
}
