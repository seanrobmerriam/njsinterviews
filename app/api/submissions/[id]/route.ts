import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getSubmissionResult } from "@/lib/judge0";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Judge0 status IDs that are considered terminal (non-pending)
const TERMINAL_JUDGE0_STATUSES = new Set([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
const JUDGE0_STATUS_MAP: Record<number, "ACCEPTED" | "WRONG_ANSWER" | "TIME_LIMIT_EXCEEDED" | "MEMORY_LIMIT_EXCEEDED" | "RUNTIME_ERROR" | "COMPILE_ERROR"> = {
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

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const submission = await prisma.submission.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      status: true,
      runtime: true,
      memory: true,
      errorMessage: true,
      testsPassed: true,
      testsTotal: true,
      judge0Token: true,
    },
  });

  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (submission.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // If still pending and we have a Judge0 token, poll for result
  if (submission.status === "PENDING" && submission.judge0Token) {
    const result = await getSubmissionResult(submission.judge0Token).catch(() => null);

    if (result && TERMINAL_JUDGE0_STATUSES.has(result.status.id)) {
      const statusId = result.status.id;
      const newStatus = JUDGE0_STATUS_MAP[statusId] ?? "RUNTIME_ERROR";
      const runtimeMs = result.time ? Math.round(parseFloat(result.time) * 1000) : null;
      const memoryKb = result.memory ?? null;
      const errorMsg =
        result.stderr ??
        result.compile_output ??
        (newStatus === "WRONG_ANSWER" ? `Expected different output.\nGot: ${result.stdout ?? "(empty)"}` : null);

      const testsPassed = newStatus === "ACCEPTED" ? submission.testsTotal : 0;

      const updated = await prisma.submission.update({
        where: { id },
        data: {
          status: newStatus,
          runtime: runtimeMs,
          memory: memoryKb,
          errorMessage: errorMsg,
          testsPassed,
        },
      });

      // Update user progress if accepted
      if (newStatus === "ACCEPTED") {
        const sub = await prisma.submission.findUnique({ where: { id }, select: { userId: true, problemId: true } });
        if (sub) {
          await prisma.userProblemProgress.upsert({
            where: { userId_problemId: { userId: sub.userId, problemId: sub.problemId } },
            update: { status: "SOLVED", solvedAt: new Date() },
            create: { userId: sub.userId, problemId: sub.problemId, status: "SOLVED", solvedAt: new Date() },
          });
        }
      }

      return NextResponse.json({
        id: updated.id,
        status: updated.status,
        runtime: updated.runtime,
        memory: updated.memory,
        errorMessage: updated.errorMessage,
        testsPassed: updated.testsPassed,
        testsTotal: updated.testsTotal,
      });
    }
  }

  return NextResponse.json({
    id: submission.id,
    status: submission.status,
    runtime: submission.runtime,
    memory: submission.memory,
    errorMessage: submission.errorMessage,
    testsPassed: submission.testsPassed,
    testsTotal: submission.testsTotal,
  });
}
