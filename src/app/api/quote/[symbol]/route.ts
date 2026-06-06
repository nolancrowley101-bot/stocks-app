import { NextResponse } from "next/server";
import { getQuote } from "@/lib/yahoo";

export async function GET(_req: Request, ctx: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await ctx.params;
  const quote = await getQuote(symbol);
  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ quote });
}
