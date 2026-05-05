import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getUserTier } from "@/lib/tier";
import { generateHint } from "@/lib/claude";

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

  const { problemId, hintLevel, code, language } = (await req.json()) as {
    problemId: string;
    hintLevel: number;
    code?: string;
    language?: string;
  };

  if (!problemId || hintLevel == null) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Check daily hint limit
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todayUsage = await prisma.hintUsage.count({
    where: { userId: user.id, usedAt: { gte: startOfDay } },
  });

  if (todayUsage >= DAILY_HINT_LIMIT) {
    return NextResponse.json(
      { error: `Daily hint limit (${DAILY_HINT_LIMIT}) reached. Try again tomorrow.` },
      { status: 429 },
    );
  }

  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    select: { title: true, description: true },
  });
  if (!problem) return NextResponse.json({ error: "Problem not found" }, { status: 404 });

  await prisma.hintUsage.create({
    data: { userId: user.id, problemId, hintIndex: hintLevel },
  });

  const hint = await generateHint({
    problemTitle: problem.title,
    problemDescription: problem.description,
    userCode: code ?? "",
    language: language ?? "unknown",
    hintLevel: Math.min(hintLevel, 2),
  });

  return NextResponse.json({ hint });
}
