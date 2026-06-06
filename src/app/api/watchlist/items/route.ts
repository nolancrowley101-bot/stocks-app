import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

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

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = SymbolBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const symbol = parsed.data.symbol.toUpperCase();

  const wl = await getDefaultWatchlist(session.user.id);
  try {
    await prisma.watchlistItem.create({ data: { watchlistId: wl.id, symbol } });
  } catch {
    // unique violation = already there. ignore.
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const symbol = (url.searchParams.get("symbol") ?? "").toUpperCase();
  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });

  const wl = await getDefaultWatchlist(session.user.id);
  await prisma.watchlistItem.deleteMany({ where: { watchlistId: wl.id, symbol } });
  return NextResponse.json({ ok: true });
}
