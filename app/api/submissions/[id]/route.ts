import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

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
    },
  });

  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (submission.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
