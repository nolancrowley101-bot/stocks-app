import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdForApi } from "@/lib/api-auth";

export async function GET(req: Request) {
  const userId = await getUserIdForApi(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ user });
}
