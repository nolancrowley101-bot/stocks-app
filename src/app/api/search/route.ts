import { NextResponse } from "next/server";
import { search } from "@/lib/yahoo";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const results = await search(q);
  return NextResponse.json({ results });
}
