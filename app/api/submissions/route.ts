import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { submitCode, LANGUAGE_IDS } from "@/lib/judge0";
import { getUserTier } from "@/lib/tier";
import { redis } from "@/lib/redis";
import type { Language } from "@prisma/client";
import type { SubmissionRequest } from "@/types/submissions";

const DAILY_LIMIT = 10;

const LANGUAGE_KEY: Record<Language, string> = {
  JAVASCRIPT: "javascript",
  TYPESCRIPT: "typescript",
  PYTHON: "python",
  GO: "go",
  RUST: "rust",
  JAVA: "java",
  CPP: "cpp",
  SQL: "sql",
  HTML: "html",
};

async function checkDailyLimit(userId: string): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);
  const key = `sub:limit:${userId}:${today}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 86400); // TTL 24h
  }
  return count <= DAILY_LIMIT;
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as SubmissionRequest;
  const { problemId, language, code, assessmentId } = body;

  if (!problemId || !language || !code) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Rate-limit FREE users to 10 submissions/day
  const userTier = await getUserTier(user.id);
  if (userTier === "FREE") {
    const allowed = await checkDailyLimit(user.id);
    if (!allowed) {
      return NextResponse.json(
        { error: "Daily submission limit reached. Upgrade to Pro for unlimited submissions." },
        { status: 429 },
      );
    }
  }

  // Verify problem exists
  const problem = await prisma.problem.findUnique({
    where: { id: problemId, isActive: true },
    include: { testCases: { where: { isHidden: false }, take: 10 } },
  });
  if (!problem) return NextResponse.json({ error: "Problem not found" }, { status: 404 });

  const langKey = LANGUAGE_KEY[language];
  const languageId = LANGUAGE_IDS[langKey];
  if (!languageId) {
    return NextResponse.json({ error: `Unsupported language: ${language}` }, { status: 400 });
  }

  // Create submission record
  const submission = await prisma.submission.create({
    data: {
      userId: user.id,
      problemId,
      language,
      code,
      status: "PENDING",
      testsTotal: problem.testCases.length,
      assessmentId: assessmentId ?? null,
    },
  });

  // Submit first test case to Judge0 for token tracking
  const firstCase = problem.testCases[0];
  const judge0Token = firstCase
    ? await submitCode({
        source_code: code,
        language_id: languageId,
        stdin: firstCase.input,
        expected_output: firstCase.output,
      }).catch(() => null)
    : null;

  if (judge0Token) {
    await prisma.submission.update({
      where: { id: submission.id },
      data: { judge0Token },
    });
  }

  // Update user progress to ATTEMPTED
  await prisma.userProblemProgress.upsert({
    where: { userId_problemId: { userId: user.id, problemId } },
    update: { attempts: { increment: 1 }, status: "ATTEMPTED" },
    create: { userId: user.id, problemId, status: "ATTEMPTED", attempts: 1 },
  });

  return NextResponse.json({ submissionId: submission.id, token: judge0Token });
}
