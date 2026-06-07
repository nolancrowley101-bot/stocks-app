import { NextResponse } from "next/server";
import { getNews } from "@/lib/yahoo";

export const revalidate = 300;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "stock market";
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") ?? "20", 10) || 20, 1), 50);
  const items = await getNews(q, limit);
  return NextResponse.json({ items });
}
