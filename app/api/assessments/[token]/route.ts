import { NextRequest, NextResponse } from "next/server";
import { InviteStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const invite = await prisma.assessmentInvite.findUnique({
    where: { token },
    include: {
      assessment: {
        include: {
          questionSet: {
            include: {
              items: {
                include: {
                  problem: {
                    select: {
                      id: true,
                      title: true,
                      slug: true,
                      description: true,
                      difficulty: true,
                      examples: true,
                      hints: true,
                      starterCode: true,
                      testCases: true,
                    },
                  },
                },
                orderBy: { position: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!invite) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (invite.expiresAt < new Date() && invite.status !== "COMPLETED") {
    await prisma.assessmentInvite.update({
      where: { token },
      data: { status: "EXPIRED" },
    });
    return NextResponse.json({ error: "Invitation has expired" }, { status: 410 });
  }

  return NextResponse.json(invite);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const invite = await prisma.assessmentInvite.findUnique({
    where: { token },
    select: { id: true, status: true, startedAt: true },
  });

  if (!invite) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { status } = body as { status: InviteStatus };

  const updated = await prisma.assessmentInvite.update({
    where: { token },
    data: {
      status,
      ...(status === "OPENED" && invite.startedAt === null && { startedAt: new Date() }),
      ...(status === "COMPLETED" && { completedAt: new Date() }),
    },
  });

  return NextResponse.json(updated);
}
