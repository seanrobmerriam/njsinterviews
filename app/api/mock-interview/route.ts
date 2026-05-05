import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getUserTier } from "@/lib/tier";
import type { Difficulty } from "@prisma/client";

export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tier = await getUserTier(user.id);
  if (tier === "FREE") {
    return NextResponse.json({ error: "Upgrade to Pro to access Mock Interview mode." }, { status: 403 });
  }

  const count = Math.min(parseInt(req.nextUrl.searchParams.get("count") ?? "5"), 10);
  const difficulty = req.nextUrl.searchParams.get("difficulty") as Difficulty | null;

  const where = {
    isActive: true,
    ...(difficulty ? { difficulty } : {}),
  };

  const total = await prisma.problem.count({ where });
  const skip = Math.max(0, Math.floor(Math.random() * Math.max(1, total - count)));

  const problems = await prisma.problem.findMany({
    where,
    take: count,
    skip,
    select: { id: true, slug: true, title: true, difficulty: true, category: true },
    orderBy: { orderIndex: "asc" },
  });

  return NextResponse.json({ problems });
}
