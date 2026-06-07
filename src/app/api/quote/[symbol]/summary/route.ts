import { NextResponse } from "next/server";
import { getQuoteSummary } from "@/lib/yahoo";

export const revalidate = 600;

export async function GET(_req: Request, ctx: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await ctx.params;
  const summary = await getQuoteSummary(symbol);
  if (!summary) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ summary });
}
