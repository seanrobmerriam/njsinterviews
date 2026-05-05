import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Language } from "@prisma/client";

export const dynamic = "force-dynamic";

async function requireAdminOrOwner(userId: string, orgId: string) {
  const member = await prisma.orgMember.findUnique({
    where: { userId_orgId: { userId, orgId } },
  });
  if (!member || !["ADMIN", "OWNER"].includes(member.role)) return null;
  return member;
}

export async function GET() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await requireAdminOrOwner(userId, orgId);
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const assessments = await prisma.assessment.findMany({
    where: { orgId },
    include: {
      _count: { select: { invitations: true } },
      questionSet: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(assessments);
}

export async function POST(req: NextRequest) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await requireAdminOrOwner(userId, orgId);
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const {
    title,
    description,
    questionSetId,
    durationMins = 90,
    expiresAt,
    allowedLanguages = [],
  } = body as {
    title: string;
    description?: string;
    questionSetId: string;
    durationMins?: number;
    expiresAt?: string;
    allowedLanguages?: Language[];
  };

  if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  if (!questionSetId) return NextResponse.json({ error: "questionSetId is required" }, { status: 400 });

  const questionSet = await prisma.questionSet.findUnique({
    where: { id: questionSetId },
    select: { orgId: true },
  });
  if (!questionSet || questionSet.orgId !== orgId) {
    return NextResponse.json({ error: "Question set not found" }, { status: 404 });
  }

  const assessment = await prisma.assessment.create({
    data: {
      orgId,
      title: title.trim(),
      description: description?.trim(),
      questionSetId,
      durationMins,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      allowedLanguages,
      createdBy: userId,
    },
  });

  return NextResponse.json(assessment, { status: 201 });
}
