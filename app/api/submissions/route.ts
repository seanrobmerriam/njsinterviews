import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { LANGUAGE_IDS } from "@/lib/judge0";
import { getUserTier } from "@/lib/tier";
import { redis } from "@/lib/redis";
import { getQStashClient } from "@/lib/qstash";
import type { Language } from "@prisma/client";
import type { SubmissionRequest } from "@/types/submissions";

const DAILY_LIMIT = 10;

export const LANGUAGE_KEY: Record<Language, string> = {
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
  if (count === 1) await redis.expire(key, 86400);
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

  const langKey = LANGUAGE_KEY[language];
  const languageId = LANGUAGE_IDS[langKey];
  if (!languageId) {
    return NextResponse.json({ error: `Unsupported language: ${language}` }, { status: 400 });
  }

  // Fetch problem + ALL test cases (visible + hidden)
  const problem = await prisma.problem.findUnique({
    where: { id: problemId, isActive: true },
    select: {
      id: true,
      testCases: { select: { id: true, input: true, output: true }, orderBy: { id: "asc" } },
    },
  });
  if (!problem) return NextResponse.json({ error: "Problem not found" }, { status: 404 });

  // Create PENDING submission
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

  // Mark progress as ATTEMPTED immediately
  await prisma.userProblemProgress.upsert({
    where: { userId_problemId: { userId: user.id, problemId } },
    update: { attempts: { increment: 1 } },
    create: { userId: user.id, problemId, status: "ATTEMPTED", attempts: 1 },
  });

  // Enqueue async Judge0 job via QStash
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    await getQStashClient().publishJSON({
      url: `${baseUrl}/api/jobs/judge-submission`,
      body: { submissionId: submission.id, languageId },
      retries: 2,
    });
  } catch {
    // QStash unavailable (local dev) — fall through, client will poll GET
  }

  return NextResponse.json({ submissionId: submission.id });
}
