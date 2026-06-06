import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const HoldingBody = z.object({
  symbol: z.string().min(1).max(20),
  shares: z.number().positive(),
  costBasis: z.number().nonnegative(),
  purchasedAt: z.string().min(1),
  notes: z.string().max(500).optional(),
});

async function getDefaultPortfolio(userId: string) {
  let p = await prisma.portfolio.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  if (!p) p = await prisma.portfolio.create({ data: { userId, name: "My Portfolio" } });
  return p;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = HoldingBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const p = await getDefaultPortfolio(session.user.id);
  const purchasedAt = new Date(parsed.data.purchasedAt);
  if (isNaN(purchasedAt.getTime()))
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });

  await prisma.holding.create({
    data: {
      portfolioId: p.id,
      symbol: parsed.data.symbol.toUpperCase(),
      shares: parsed.data.shares,
      costBasis: parsed.data.costBasis,
      purchasedAt,
      notes: parsed.data.notes,
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const p = await getDefaultPortfolio(session.user.id);
  await prisma.holding.deleteMany({ where: { id, portfolioId: p.id } });
  return NextResponse.json({ ok: true });
}
