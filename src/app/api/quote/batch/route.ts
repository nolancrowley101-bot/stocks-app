import { NextResponse } from "next/server";
import { getQuotes } from "@/lib/yahoo";

export const revalidate = 60;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = url.searchParams.get("symbols") ?? "";
  const symbols = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50);
  if (symbols.length === 0) return NextResponse.json({ quotes: [] });
  const quotes = await getQuotes(symbols);
  return NextResponse.json({ quotes });
}
