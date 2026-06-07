import { NextResponse } from "next/server";
import { getMovers } from "@/lib/yahoo";

export const revalidate = 60;

const ALLOWED = new Set(["day_gainers", "day_losers", "most_actives"] as const);
type ScrId = "day_gainers" | "day_losers" | "most_actives";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? "day_gainers";
  const count = Math.min(Math.max(parseInt(url.searchParams.get("count") ?? "10", 10) || 10, 1), 25);
  if (!ALLOWED.has(type as ScrId)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
  const items = await getMovers(type as ScrId, count);
  return NextResponse.json({ items });
}
