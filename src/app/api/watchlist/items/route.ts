import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUserIdForApi } from "@/lib/api-auth";

const SymbolBody = z.object({ symbol: z.string().min(1).max(20) });

async function getDefaultWatchlist(userId: string) {
  let wl = await prisma.watchlist.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  if (!wl) {
    wl = await prisma.watchlist.create({ data: { userId, name: "My Watchlist" } });
  }
  return wl;
}

export async function GET(req: Request) {
  const userId = await getUserIdForApi(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const wl = await getDefaultWatchlist(userId);
  const items = await prisma.watchlistItem.findMany({
    where: { watchlistId: wl.id },
    orderBy: { addedAt: "asc" },
    select: { symbol: true, addedAt: true },
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const userId = await getUserIdForApi(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = SymbolBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const symbol = parsed.data.symbol.toUpperCase();

  const wl = await getDefaultWatchlist(userId);
  try {
    await prisma.watchlistItem.create({ data: { watchlistId: wl.id, symbol } });
  } catch {
    // unique violation = already there. ignore.
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const userId = await getUserIdForApi(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const symbol = (url.searchParams.get("symbol") ?? "").toUpperCase();
  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });

  const wl = await getDefaultWatchlist(userId);
  await prisma.watchlistItem.deleteMany({ where: { watchlistId: wl.id, symbol } });
  return NextResponse.json({ ok: true });
}
