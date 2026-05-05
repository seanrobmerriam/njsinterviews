import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { submitCode, getSubmissionResult } from "@/lib/judge0";
import { getQStashReceiver } from "@/lib/qstash";
import type { SubmissionStatus } from "@prisma/client";

const POLL_INTERVAL_MS = 1500;
const MAX_POLLS = 30;

const TERMINAL_STATUSES = new Set([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);

const JUDGE0_TO_STATUS: Record<number, SubmissionStatus> = {
  3: "ACCEPTED",
  4: "WRONG_ANSWER",
  5: "TIME_LIMIT_EXCEEDED",
  6: "COMPILE_ERROR",
  7: "RUNTIME_ERROR",
  8: "RUNTIME_ERROR",
  9: "RUNTIME_ERROR",
  10: "RUNTIME_ERROR",
  11: "RUNTIME_ERROR",
  12: "MEMORY_LIMIT_EXCEEDED",
  13: "RUNTIME_ERROR",
  14: "RUNTIME_ERROR",
};

interface JobPayload {
  submissionId: string;
  languageId: number;
}

interface TestResult {
  passed: boolean;
  statusId: number;
  runtimeMs: number | null;
  memoryKb: number | null;
  stderr: string | null;
  compileOutput: string | null;
  stdout: string | null;
}

async function pollUntilDone(token: string): Promise<TestResult | null> {
  for (let i = 0; i < MAX_POLLS; i++) {
    const res = await getSubmissionResult(token).catch(() => null);
    if (!res) return null;
    if (TERMINAL_STATUSES.has(res.status.id)) {
      return {
        passed: res.status.id === 3,
        statusId: res.status.id,
        runtimeMs: res.time ? Math.round(parseFloat(res.time) * 1000) : null,
        memoryKb: res.memory ?? null,
        stderr: res.stderr ?? null,
        compileOutput: res.compile_output ?? null,
        stdout: res.stdout ?? null,
      };
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  return null;
}

export async function POST(req: NextRequest) {
  const sigHeader = req.headers.get("upstash-signature");
  if (sigHeader && process.env.QSTASH_CURRENT_SIGNING_KEY) {
    const body = await req.text();
    try {
      const receiver = getQStashReceiver();
      await receiver.verify({ signature: sigHeader, body, clockTolerance: 5 });
    } catch {
      return NextResponse.json({ error: "Invalid QStash signature" }, { status: 401 });
    }
    return processJob(JSON.parse(body) as JobPayload);
  }
  const payload = (await req.json()) as JobPayload;
  return processJob(payload);
}

async function processJob({ submissionId, languageId }: JobPayload): Promise<NextResponse> {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { problem: { include: { testCases: { orderBy: { id: "asc" } } } } },
  });

  if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  if (submission.status !== "PENDING") return NextResponse.json({ ok: true, skipped: true });

  const testCases = submission.problem.testCases;

  if (testCases.length === 0) {
    await prisma.submission.update({ where: { id: submissionId }, data: { status: "ACCEPTED" } });
    return NextResponse.json({ ok: true });
  }

  // Submit all test cases to Judge0 in parallel
  const tokens = await Promise.all(
    testCases.map((tc) =>
      submitCode({
        source_code: submission.code,
        language_id: languageId,
        stdin: tc.input,
        expected_output: tc.output,
        cpu_time_limit: 5,
        memory_limit: 256_000,
      }).catch(() => null),
    ),
  );

  const results = await Promise.all(
    tokens.map((token) => (token ? pollUntilDone(token) : Promise.resolve(null))),
  );

  // Aggregate results
  let testsPassed = 0;
  let totalRuntimeMs = 0;
  let maxMemoryKb = 0;
  let firstFailure: TestResult | null = null;
  let compileError: string | null = null;

  for (const result of results) {
    if (!result) continue;
    if (result.passed) {
      testsPassed++;
    } else if (!firstFailure) {
      firstFailure = result;
    }
    if (result.runtimeMs) totalRuntimeMs += result.runtimeMs;
    if (result.memoryKb && result.memoryKb > maxMemoryKb) maxMemoryKb = result.memoryKb;
    if (result.compileOutput && !compileError) compileError = result.compileOutput;
  }

  const allPassed = testsPassed === testCases.length;
  let finalStatus: SubmissionStatus = allPassed ? "ACCEPTED" : "WRONG_ANSWER";
  if (!allPassed && firstFailure) finalStatus = JUDGE0_TO_STATUS[firstFailure.statusId] ?? "WRONG_ANSWER";
  if (compileError) finalStatus = "COMPILE_ERROR";

  const errorMessage =
    compileError ??
    firstFailure?.stderr ??
    (!allPassed && firstFailure
      ? `Wrong answer.\nGot: ${firstFailure.stdout ?? "(empty)"}`
      : null);

  const validResults = results.filter(Boolean);
  const avgRuntimeMs = validResults.length > 0 ? Math.round(totalRuntimeMs / validResults.length) : null;

  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      status: finalStatus,
      testsPassed,
      testsTotal: testCases.length,
      runtime: avgRuntimeMs,
      memory: maxMemoryKb || null,
      errorMessage,
    },
  });

  if (finalStatus === "ACCEPTED") {
    await prisma.userProblemProgress.upsert({
      where: { userId_problemId: { userId: submission.userId, problemId: submission.problemId } },
      update: { status: "SOLVED", solvedAt: new Date() },
      create: { userId: submission.userId, problemId: submission.problemId, status: "SOLVED", solvedAt: new Date() },
    });
    await updateStreak(submission.userId);
  }

  return NextResponse.json({ ok: true, status: finalStatus, testsPassed, testsTotal: testCases.length });
}

async function updateStreak(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { streakDays: true, lastActiveAt: true },
  });
  if (!user) return;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastActive = user.lastActiveAt
    ? new Date(user.lastActiveAt.getFullYear(), user.lastActiveAt.getMonth(), user.lastActiveAt.getDate())
    : null;
  const daysDiff = lastActive ? Math.round((today.getTime() - lastActive.getTime()) / 86_400_000) : null;

  let newStreak = user.streakDays;
  if (daysDiff === null || daysDiff > 1) newStreak = 1;
  else if (daysDiff === 1) newStreak = user.streakDays + 1;

  await prisma.user.update({ where: { id: userId }, data: { streakDays: newStreak, lastActiveAt: now } });
}
