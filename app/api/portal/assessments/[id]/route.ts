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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await requireAdminOrOwner(userId, orgId);
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      invitations: {
        select: {
          id: true,
          candidateEmail: true,
          status: true,
          startedAt: true,
          completedAt: true,
          expiresAt: true,
          token: true,
        },
        orderBy: { expiresAt: "desc" },
      },
      questionSet: { select: { id: true, title: true } },
    },
  });

  if (!assessment || assessment.orgId !== orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(assessment);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await requireAdminOrOwner(userId, orgId);
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.assessment.findUnique({ where: { id }, select: { orgId: true } });
  if (!existing || existing.orgId !== orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const { title, description, isActive, expiresAt, allowedLanguages } = body as {
    title?: string;
    description?: string;
    isActive?: boolean;
    expiresAt?: string | null;
    allowedLanguages?: Language[];
  };

  const assessment = await prisma.assessment.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description.trim() }),
      ...(isActive !== undefined && { isActive }),
      ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
      ...(allowedLanguages !== undefined && { allowedLanguages }),
    },
  });

  return NextResponse.json(assessment);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await requireAdminOrOwner(userId, orgId);
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.assessment.findUnique({ where: { id }, select: { orgId: true } });
  if (!existing || existing.orgId !== orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const assessment = await prisma.assessment.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json(assessment);
}
