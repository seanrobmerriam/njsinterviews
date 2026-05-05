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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> },
) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await requireAdminOrOwner(userId, orgId);
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { inviteId } = await params;
  const invite = await prisma.assessmentInvite.findUnique({
    where: { id: inviteId },
    include: {
      assessment: {
        select: {
          id: true,
          title: true,
          orgId: true,
          durationMins: true,
          questionSet: { select: { title: true } },
        },
      },
    },
  });

  if (!invite || invite.assessment.orgId !== orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const submissions = await prisma.submission.findMany({
    where: { assessmentId: invite.assessmentId },
    include: {
      problem: { select: { title: true, slug: true, difficulty: true } },
    },
    orderBy: { submittedAt: "desc" },
  });

  return NextResponse.json({ ...invite, submissions });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> },
) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await requireAdminOrOwner(userId, orgId);
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { inviteId } = await params;
  const invite = await prisma.assessmentInvite.findUnique({
    where: { id: inviteId },
    include: { assessment: { select: { orgId: true } } },
  });

  if (!invite || invite.assessment.orgId !== orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const { notes } = body as { notes: string };

  const updated = await prisma.assessmentInvite.update({
    where: { id: inviteId },
    data: { notes },
  });

  return NextResponse.json(updated);
}
