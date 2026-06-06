import { NextResponse } from "next/server";
import { getChart, type ChartRange } from "@/lib/yahoo";

const VALID: ChartRange[] = ["1d", "5d", "1mo", "6mo", "1y", "5y", "max"];

export async function GET(req: Request, ctx: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await ctx.params;
  const url = new URL(req.url);
  const range = (url.searchParams.get("range") || "1mo") as ChartRange;
  const r: ChartRange = VALID.includes(range) ? range : "1mo";
  const points = await getChart(symbol, r);
  return NextResponse.json({ points });
}
