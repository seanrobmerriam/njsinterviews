import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function requireAdminOrOwner(userId: string, orgId: string) {
  const member = await prisma.orgMember.findUnique({
    where: { userId_orgId: { userId, orgId } },
  });
  if (!member || !["ADMIN", "OWNER"].includes(member.role)) return null;
  return member;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await requireAdminOrOwner(userId, orgId);
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: questionSetId } = await params;
  const set = await prisma.questionSet.findUnique({
    where: { id: questionSetId },
    select: { orgId: true },
  });
  if (!set || set.orgId !== orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const { problemId, timeLimitMins } = body as { problemId: string; timeLimitMins?: number };

  if (!problemId) return NextResponse.json({ error: "problemId is required" }, { status: 400 });

  const problem = await prisma.problem.findUnique({ where: { id: problemId }, select: { id: true } });
  if (!problem) return NextResponse.json({ error: "Problem not found" }, { status: 404 });

  const maxPositionResult = await prisma.questionSetItem.aggregate({
    where: { questionSetId },
    _max: { position: true },
  });
  const nextPosition = (maxPositionResult._max.position ?? 0) + 1;

  const item = await prisma.questionSetItem.upsert({
    where: { questionSetId_problemId: { questionSetId, problemId } },
    update: { ...(timeLimitMins !== undefined && { timeLimitMins }) },
    create: { questionSetId, problemId, position: nextPosition, timeLimitMins: timeLimitMins ?? null },
  });

  return NextResponse.json(item, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await requireAdminOrOwner(userId, orgId);
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: questionSetId } = await params;
  const set = await prisma.questionSet.findUnique({
    where: { id: questionSetId },
    select: { orgId: true },
  });
  if (!set || set.orgId !== orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const { problemId } = body as { problemId: string };

  await prisma.questionSetItem.deleteMany({ where: { questionSetId, problemId } });
  return NextResponse.json({ deleted: true });
}
