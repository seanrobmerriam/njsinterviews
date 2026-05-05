import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getUserTier } from "@/lib/tier";

const DAILY_HINT_LIMIT = 10;

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userTier = await getUserTier(user.id);
  if (userTier === "FREE") {
    return NextResponse.json(
      { error: "Upgrade to Pro to unlock AI hints." },
      { status: 403 },
    );
  }

  const { problemId, hintIndex } = (await req.json()) as {
    problemId: string;
    hintIndex: number;
  };

  if (!problemId || hintIndex == null) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Check daily hint limit
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todayUsage = await prisma.hintUsage.count({
    where: {
      userId: user.id,
      usedAt: { gte: startOfDay },
    },
  });

  if (todayUsage >= DAILY_HINT_LIMIT) {
    return NextResponse.json(
      { error: `Daily hint limit (${DAILY_HINT_LIMIT}) reached. Try again tomorrow.` },
      { status: 429 },
    );
  }

  // Verify problem exists and hint index is valid
  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    select: { hints: true },
  });

  if (!problem) return NextResponse.json({ error: "Problem not found" }, { status: 404 });
  if (hintIndex < 0 || hintIndex >= problem.hints.length) {
    return NextResponse.json({ error: "Invalid hint index" }, { status: 400 });
  }

  // Record usage
  await prisma.hintUsage.create({
    data: { userId: user.id, problemId, hintIndex },
  });

  return NextResponse.json({ hint: problem.hints[hintIndex] });
}
