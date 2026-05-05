import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "10", 10), 50);

  const problems = await prisma.problem.findMany({
    where: {
      isActive: true,
      ...(q.trim() && {
        title: { contains: q.trim(), mode: "insensitive" },
      }),
    },
    select: { id: true, title: true, slug: true, difficulty: true },
    take: limit,
    orderBy: { title: "asc" },
  });

  return NextResponse.json(problems);
}
