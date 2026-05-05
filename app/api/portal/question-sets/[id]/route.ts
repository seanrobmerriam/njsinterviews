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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await requireAdminOrOwner(userId, orgId);
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const set = await prisma.questionSet.findUnique({
    where: { id },
    include: {
      items: {
        include: { problem: { select: { title: true, slug: true, difficulty: true } } },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!set || set.orgId !== orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(set);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await requireAdminOrOwner(userId, orgId);
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.questionSet.findUnique({ where: { id }, select: { orgId: true } });
  if (!existing || existing.orgId !== orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const { title, description, isArchived } = body as {
    title?: string;
    description?: string;
    isArchived?: boolean;
  };

  const set = await prisma.questionSet.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description.trim() }),
      ...(isArchived !== undefined && { isArchived }),
    },
  });

  return NextResponse.json(set);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await requireAdminOrOwner(userId, orgId);
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.questionSet.findUnique({ where: { id }, select: { orgId: true } });
  if (!existing || existing.orgId !== orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.questionSet.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
