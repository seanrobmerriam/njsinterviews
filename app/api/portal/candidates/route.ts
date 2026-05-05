import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { InviteStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

async function requireAdminOrOwner(userId: string, orgId: string) {
  const member = await prisma.orgMember.findUnique({
    where: { userId_orgId: { userId, orgId } },
  });
  if (!member || !["ADMIN", "OWNER"].includes(member.role)) return null;
  return member;
}

export async function GET(req: NextRequest) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await requireAdminOrOwner(userId, orgId);
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const assessmentId = url.searchParams.get("assessmentId") ?? undefined;
  const statusParam = url.searchParams.get("status") ?? undefined;

  const invites = await prisma.assessmentInvite.findMany({
    where: {
      assessment: { orgId },
      ...(assessmentId && { assessmentId }),
      ...(statusParam && { status: statusParam as InviteStatus }),
    },
    include: { assessment: { select: { id: true, title: true } } },
    orderBy: { expiresAt: "desc" },
  });

  return NextResponse.json(invites);
}

export async function POST(req: NextRequest) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await requireAdminOrOwner(userId, orgId);
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { emails, assessmentId } = body as { emails: string[]; assessmentId: string };

  if (!Array.isArray(emails) || emails.length === 0) {
    return NextResponse.json({ error: "emails array is required" }, { status: 400 });
  }
  if (emails.length > 100) {
    return NextResponse.json({ error: "Max 100 emails per request" }, { status: 400 });
  }
  if (!assessmentId) {
    return NextResponse.json({ error: "assessmentId is required" }, { status: 400 });
  }

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: { orgId: true, title: true },
  });
  if (!assessment || assessment.orgId !== orgId) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  let sent = 0;
  const failed: string[] = [];

  for (const email of emails) {
    try {
      const invite = await prisma.assessmentInvite.create({
        data: { assessmentId, candidateEmail: email.trim(), expiresAt },
      });

      const link = `${appUrl}/assess/${invite.token}`;
      const expiryDate = expiresAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      await resend.emails.send({
        from: FROM_EMAIL,
        to: email.trim(),
        subject: "You're invited to complete a coding assessment",
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
            <h2 style="color:#1a1a1a;">Coding Assessment Invitation</h2>
            <p>You've been invited to complete: <strong>${assessment.title}</strong></p>
            <a href="${link}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0;">
              Start Assessment
            </a>
            <p style="color:#666;font-size:14px;">Expires: <strong>${expiryDate}</strong></p>
          </div>
        `,
      });

      sent++;
    } catch {
      failed.push(email.trim());
    }
  }

  return NextResponse.json({ sent, failed });
}
